# capacitor-ayna-records

Read-only Apple Health Records reader for the ayna iOS app.

- Types: `allergy` (AllergyIntolerance), `condition` (Condition), `medication`
  (MedicationStatement / MedicationRequest / MedicationOrder / MedicationDispense).
  Labs, vitals, procedures, immunizations, notes and coverage are not requested.
- Returns each record's FHIR JSON. Parsing and the review step are in
  `src/health/records.js` and `HealthRecordsScreen.jsx`.
- Requires the **Clinical Health Records** capability on the App ID and in
  Xcode, and `NSHealthClinicalHealthRecordsShareUsageDescription`.
- Apple doesn't tell apps whether read access was granted; an empty result can
  mean "denied" or "no records".
- Test in the iOS Simulator with Apple's sample health-records accounts
  (Health app → Browse → Health Records → Add Account).
- Not compiled in CI. First compile happens in Xcode.
