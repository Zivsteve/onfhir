import axios, { Method, AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { fetchMetadata, getSecurityExtensions } from './core';
import type * as R5 from 'fhir/r5';
import { Bundle, FhirKeys, FhirResourceType, FhirVersion, fhirVersions } from './types';

class Client {
  private baseUrl: string;
  private clientId?: string;
  private clientSecret: string;
  private scope?: string;
  private patientId?: string;

  refreshToken: string;
  accessToken: string;
  expiresAt: number;

  constructor(data: {
    baseUrl: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    scope?: string;
    patientId?: string;
  }) {
    this.baseUrl = data.baseUrl;
    this.clientId = data.clientId;
    this.clientSecret = data.clientSecret;
    this.refreshToken = data.refreshToken;
    this.scope = data.scope || 'offline_access';
    this.patientId = data.patientId;
  }

  search = this.reqSearch('GET');
  read = this.req('GET');
  create = this.req('POST');
  update = this.req('PUT');
  delete = this.req('DELETE');

  /** A namespace for the patient-related functionality of the client. */
  get patient() {
    return {
      id: this.patientId,
      search: this.reqSearch('GET', { patient: this.patientId }),
      read: this.req('GET', { patient: this.patientId }),
      create: this.req('POST', { patient: this.patientId }),
      update: this.req('PUT', { patient: this.patientId }),
      delete: this.req('DELETE', { patient: this.patientId }),
    };
  }

  /** Use the refresh token to obtain a new access token. */
  async refresh() {
    const extensions = await getSecurityExtensions(this.baseUrl);
    const encodedAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const qs = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      scope: this.scope || 'offline_access',
    });
    const tokenResponse = await axios.post(extensions.tokenUri, qs.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${encodedAuth}`,
      },
    });
    this.accessToken = tokenResponse.data.access_token;
    this.expiresAt = Date.now() + tokenResponse.data.expires_in * 1000;
    this.patientId = tokenResponse.data.patient || this.patientId;
  }

  /** Get the FHIR version defined in the metadata. */
  async getFhirVersion() {
    const metadata = await fetchMetadata(this.baseUrl);
    const version = metadata?.fhirVersion;
    return version as FhirVersion;
  }

  /**
   * Get the numeric FHIR version
   * - 2 for DSTU2
   * - 3 for STU3
   * - 4 for R4
   * - 5 for R5
   * - 0 if the version is not known
   */
  async getFhirRelease() {
    const version = await this.getFhirVersion();
    return fhirVersions[version] ?? 0;
  }

  private async request<T = R5.Bundle | R5.FhirResource[]>(
    path: string,
    method: Method = 'GET',
    options: AxiosRequestConfig = {},
  ) {
    try {
      if (Date.now() > this.expiresAt - 1000) {
        await this.refresh();
      }

      const res = await axios.request({
        method,
        url: path.startsWith('http') ? path : `${this.baseUrl.replace(/\/$/, '')}/${path}`,
        ...options,
        headers: {
          Accept: 'application/fhir+json',
          Authorization: `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });
      let data = res.data as R5.Bundle;

      // Remove unnecessary unicodes from the response.
      data = JSON.parse(JSON.stringify(res.data).replaceAll('\\u0000', ''));

      return data as unknown as T;
    } catch (e) {
      console.error(e.response?.data || e.response || e);
      return {} as T;
    }
  }

  private req(method: Method, params = {}, headers?: AxiosRequestHeaders) {
    return <K extends FhirKeys>(
      path: `${K}` | `${K}/${string}`,
      options: AxiosRequestConfig = {},
    ): Promise<FhirResourceType[K]> =>
      this.request(path, method, {
        ...options,
        params: { ...params, ...options.params },
        headers: { ...headers, ...options.headers },
      });
  }

  private reqSearch(method: Method, params = {}, headers?: AxiosRequestHeaders) {
    return <K extends FhirKeys>(
      path: `${K}` | `${K}/${string}`,
      options: AxiosRequestConfig = {},
    ): Promise<Bundle<FhirResourceType[K]>> =>
      this.request(path, method, {
        ...options,
        params: { ...params, ...options.params },
        headers: { ...headers, ...options.headers },
      });
  }
}

export default Client;
