# OnFHIR

A lightweight TypeScript library for interacting with FHIR servers using OAuth 2.0 SMART on FHIR authentication flow.

NodeJS and Browser compatible.

## Features

- **OAuth 2.0 SMART on FHIR Authentication** 🔒 - Complete authorization flow with automatic token refresh
- **Type-Safe FHIR Operations** 📜 - Full TypeScript support with FHIR resource types
- **Multi-Version Support** 🌐 - Works with FHIR DSTU2, STU3, R4, and R5
- **Automatic Pagination** 📄 - Transparently handles FHIR bundle pagination
- **Patient-Scoped Operations** 🩺 - Built-in patient context management
- **Error Handling** ⚠️ - Descriptive errors for authentication and server issues
- **Lightweight** ⚙️ - Minimal dependencies for easy integration

## Installation

```bash
npm install onfhir
```

or

```bash
yarn add onfhir
```

## Quick Start

### Creating a Client

```typescript
import Client from 'onfhir';

// Create a client
const client = new Client({
  baseUrl: 'http://hapi.fhir.org/baseR5',
});

// Get FHIR version info
const version = await client.getFhirVersion(); // "5.0.0"
const release = await client.getFhirRelease(); // 5
```

### Client Options

| Parameter      | Type   | Required | Description                                                                                                                                                           |
| :------------- | :----- | :------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`      | string |    ✓     | FHIR server base URL (e.g., `https://hapi.fhir.org/baseR4`)                                                                                                           |
| `clientId`     | string |          | OAuth 2.0 client identifier                                                                                                                                           |
| `clientSecret` | string |          | OAuth 2.0 client secret                                                                                                                                               |
| `refreshToken` | string |          | Token for refreshing expired access tokens, for resuming previous session                                                                                             |
| `scope`        | string |          | Space-separated [OAuth scopes](https://build.fhir.org/ig/HL7/smart-app-launch/scopes-and-launch-context.html) (e.g., `launch/patient openid fhirUser offline_access`) |
| `patientId`    | string |          | FHIR patient ID for patient-scoped operations                                                                                                                         |

### Authentication

```typescript
// Redirect user to authorization URL
const url = await authorize({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'your-redirect-uri',
  scope: 'your-scope',
  iss: 'your-fhir-server-url',
});

// After redirect, complete authentication
const client = await completeAuth(window.location.href);
```

```typescript
// Alternatively, create client with existing refresh token
const client = await Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: 'your-refresh-token',
});
```

### Patient-Scoped Operations

```typescript
// Access patient context
const patientId = client.patient.id;

// Patient-scoped operations
const medications = await client.patient.read('Medication');
const observations = await client.patient.read('Observation');
```

### General Resource Operations

```typescript
// Read a resource
const patient = await client.read('Patient');
console.log(patient);

// Search resources
const patients = await client.read('Patient', { name: 'John' });
console.log(patients);
```

## API Reference

### Functions

#### `authorize(options)`

Initiates the OAuth 2.0 SMART on FHIR authorization flow.

```typescript
authorize({
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  iss: string; // FHIR server URL
}): Promise<string> // Authorization URL
```

#### `completeAuth(path, unsafeUrlEncode?)`

Completes the authorization flow by exchanging the auth code for tokens.

```typescript
completeAuth(
  path: string, // Request path with query params
  unsafeUrlEncode?: boolean
): Promise<Client>
```

#### `fetchMetadata(serverUrl)`

Fetches the FHIR server's CapabilityStatement.

```typescript
fetchMetadata(serverUrl: string): Promise<CapabilityStatement>
```

#### `getSecurityExtensions(serverUrl)`

Extracts OAuth 2.0 endpoints from the server's CapabilityStatement.

```typescript
getSecurityExtensions(serverUrl: string): Promise<{ [key: string]: string }>
```

### Client Class

#### Constructor

```typescript
new Client({
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scope?: string;
  patientId?: string;
})
```

#### Properties

- `accessToken: string` - Current access token
- `refreshToken: string` - Refresh token for obtaining new access tokens
- `expiresAt: number` - Timestamp when access token expires
- `patient` - Object with patient-scoped methods

#### Methods

- `read(path, options?)` - GET request (Auto-refreshes tokens if needed)
- `create(path, options?)` - POST request
- `update(path, options?)` - PUT request
- `delete(path, options?)` - DELETE request
- `refresh()` - Manually refresh the access token
- `getFhirVersion()` - Get server's FHIR version string
- `getFhirRelease()` - Get numeric FHIR release (2, 3, 4, 5)

_Note: `options` are [Axios request config overrides](https://axios-http.com/docs/req_config)._

## FHIR Version Mapping

| FHIR Version  |   Release |
| :------------ | --------: |
| 0.4.0 - 1.0.2 | 2 (DSTU2) |
| 1.1.0 - 3.0.1 |  3 (STU3) |
| 3.3.0 - 4.0.1 |    4 (R4) |
| 4.0.1+        |    5 (R5) |

## Automatic Token Refresh

The client automatically refreshes expired access tokens before making requests. You don't need to manually check token expiration.

```typescript
// This will automatically refresh if token is expired
const data = await client.read('Patient/123');

// Access the refreshed access token
console.log(client.accessToken);

// Manually refresh the token if needed
await client.refresh();
```

## Pagination

Bundle responses with multiple pages are automatically paginated. When `flat: true`, all entries across pages are flattened into a single array.

```typescript
// Automatically follows "next" links and returns all resources
const allPatients = await client.read('Patient', { _count: 100 });
```

## Error Handling

The library throws descriptive errors for authentication failures and server errors:

```typescript
try {
  const client = await Client({
    clientId: 'invalid-client-id',
    clientSecret: 'invalid-client-secret',
  });
} catch (error) {
  console.error(error.message); // "access_denied: User denied"
}
```

## License

MIT

## Contributing

Contributions are welcome! Please open issues and pull requests on GitHub.
