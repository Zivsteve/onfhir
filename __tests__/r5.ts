import R5 from 'fhir/r5';
import Client from '../src/client';
import { Patient } from '../src/types';

const TEST_BASE_URL = 'http://hapi.fhir.org/baseR5';

describe('FHIR', () => {
  let client: Client;

  beforeAll(() => {
    client = new Client({
      baseUrl: TEST_BASE_URL,
    });
  });

  test('getFhirVersion', async () => {
    const version = await client.getFhirVersion();
    expect(version).toBe('5.0.0');
  });

  test('getFhirRelease', async () => {
    const release = await client.getFhirRelease();
    expect(release).toBe(5);
  });

  test('read Bundle', async () => {
    const bundle = await client.read('Bundle');
    expect(bundle).toBeDefined();
    expect(bundle.resourceType).toBe('Bundle');
  });

  test('search Patient', async () => {
    const patients = await client.search('Patient', {
      params: { family: 'Smith' },
    });

    expect(patients).toBeDefined();
    expect(patients.entry?.length).toBeGreaterThan(0);

    patients.entry?.forEach((entry) => {
      expect(entry.resource?.resourceType).toBe('Patient');
    });
  });

  test('read Patient', async () => {
    const patient = await client.read<'Patient'>('Patient/2175');
    expect(patient.resourceType).toBe('Patient');
  });

  test('create Patient', async () => {
    const newPatient: Patient = {
      resourceType: 'Patient',
      name: [
        {
          family: 'Doe',
          given: ['John'],
        },
      ],
    };

    const createdPatient = await client.create('Patient', { data: newPatient });
    expect(createdPatient.id).toBeDefined();
    expect(createdPatient.name?.[0].family).toBe('Doe');
  });
});
