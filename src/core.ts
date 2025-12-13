import axios from 'axios';
import { URL, URLSearchParams } from 'url';
import Client from './client';
import R4 from 'fhir/r4';
import { randomString } from './utils';

const states: Record<string, Record<string, string>> = {};

/** Get the metadata from the FHIR server. */
export async function fetchMetadata(serverUrl: string): Promise<R4.CapabilityStatement> {
  const res = await axios.get(`${serverUrl.replace(/\/$/, '')}/metadata`);
  return res.data;
}

/** Get the security extensions from the metadata. */
export async function getSecurityExtensions(serverUrl: string): Promise<Record<string, string>> {
  const metadata = await fetchMetadata(serverUrl);
  const extensions = metadata?.rest?.[0]?.security?.extension?.[0]?.extension || [];
  return Object.assign({}, ...extensions.map((extension) => ({ [`${extension.url}Uri`]: extension.valueUri })));
}

/** Start the authentication flow and get the EHR's FHIR login url. */
export async function authorize(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  iss: string;
}) {
  const extensions = await getSecurityExtensions(opts.iss);
  const url = new URL(extensions.authorizeUri);

  const state = randomString(16);
  const data = {
    response_type: 'code',
    client_id: opts.clientId,
    scope: opts.scope,
    redirect_uri: opts.redirectUri,
    aud: opts.iss,
    state,
  };
  states[state] = { ...data, client_secret: opts.clientSecret };

  url.search = new URLSearchParams(data).toString();
  return url.toString();
}

/** Complete the authentication flow when redirected to the `redirect_uri`. */
export async function completeAuth(path: string, unsafeUrlEncode = false) {
  const params = new URLSearchParams('?' + path.split('?')[1]);

  const key = params.get('state');
  const code = params.get('code');
  const authError = params.get('error');
  const authErrorDescription = params.get('error_description');

  if (authError) {
    throw new Error(`${authError}: ${authErrorDescription}`);
  }

  if (!code) {
    throw new Error('FHIR: No code');
  }

  if (!key) {
    throw new Error('FHIR: No state');
  }

  const state = states[key];
  const extensions = await getSecurityExtensions(state.aud);

  let encodedAuth = '';
  if (state.client_secret) {
    encodedAuth = Buffer.from(`${state.client_id}:${state.client_secret}`).toString('base64');
  }
  const qs = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: state.redirect_uri,
    ...(unsafeUrlEncode ? { client_secret: state.client_secret } : {}),
    ...(!encodedAuth || unsafeUrlEncode ? { client_id: state.client_id } : {}),
  });
  const tokenResponse = await axios.post(extensions.tokenUri, qs.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(encodedAuth ? { Authorization: `Basic ${encodedAuth}` } : {}),
    },
  });

  delete states[key];

  const client = new Client({
    baseUrl: state.aud,
    clientId: state.client_id,
    clientSecret: state.client_secret,
    refreshToken: tokenResponse.data.refresh_token,
    scope: tokenResponse.data.scope,
    patientId: tokenResponse.data.patient,
  });
  return client;
}
