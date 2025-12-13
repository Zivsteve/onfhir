import R2 from 'fhir/r2';
import R3 from 'fhir/r3';
import R4 from 'fhir/r4';
import R4b from 'fhir/r4b';
import R5 from 'fhir/r5';

export const fhirVersions = {
  '0.4.0': 2,
  '0.5.0': 2,
  '1.0.0': 2,
  '1.0.1': 2,
  '1.0.2': 2,
  '1.1.0': 3,
  '1.4.0': 3,
  '1.6.0': 3,
  '1.8.0': 3,
  '3.0.0': 3,
  '3.0.1': 3,
  '3.0.2': 3,
  '3.3.0': 4,
  '3.5.0': 4,
  '4.0.0': 4,
  '4.0.1': 4,
  '4.3.0': 5,
  '5.0.0': 5,
  '5.0.1': 5,
  '5.1.0': 5,
  '5.2.0': 5,
  '5.3.0': 5,
  '5.4.0': 5,
};

export type FhirVersion = keyof typeof fhirVersions;

export type FhirResource = R2.FhirResource | R3.FhirResource | R4.FhirResource | R4b.FhirResource | R5.FhirResource;

export type Patient = R2.Patient | R3.Patient | R4.Patient | R4b.Patient | R5.Patient;
export type Bundle<T = FhirResource> = R2.Bundle<T> | R3.Bundle<T> | R4.Bundle<T> | R4b.Bundle<T> | R5.Bundle<T>;

export type FhirResourceType = {
  Patient: Patient;
  Observation: R2.Observation | R3.Observation | R4.Observation | R4b.Observation | R5.Observation;
  Encounter: R2.Encounter | R3.Encounter | R4.Encounter | R4b.Encounter | R5.Encounter;
  Practitioner: R2.Practitioner | R3.Practitioner | R4.Practitioner | R4b.Practitioner | R5.Practitioner;
  Bundle: Bundle;
};
export type FhirKeys = keyof FhirResourceType;
