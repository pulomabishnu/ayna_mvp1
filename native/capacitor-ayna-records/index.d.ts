export type RecordType = 'allergy' | 'condition' | 'medication';
export interface ClinicalRecord {
  type: RecordType;
  /** FHIR resource type, e.g. "AllergyIntolerance", "MedicationRequest". */
  resourceType: string;
  /** "1.0.2" (DSTU2) or "4.0.1" (R4). */
  fhirVersion: string;
  /** The FHIR resource JSON as a string. */
  json: string;
  /** Display name of the health system the record came from (HKSource name). */
  sourceName: string;
}
export interface AynaRecordsPlugin {
  isAvailable(): Promise<{ available: boolean; reason?: string }>;
  requestAuthorization(options: { types: RecordType[] }): Promise<{ asked: boolean; granted: null }>;
  readRecords(options: { types: RecordType[] }): Promise<{ records: ClinicalRecord[] }>;
}
export declare const AynaRecords: AynaRecordsPlugin;
