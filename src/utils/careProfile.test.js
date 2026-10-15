import { describe, it, expect } from 'vitest';
import { getCareProfile } from './careProfile';

describe('getCareProfile', () => {
  it('reads allergies and medications from the full intake', () => {
    const p = getCareProfile({
      frustrations: ['Painful cramps', 'Endometriosis'],
      preference: ['fragrance-free'],
      fullHealthIntake: { diagnosisSelections: ['Endometriosis'], allergyStatus: 'Yes', allergyItems: ['Latex'], takesCurrent: 'Yes', currentMedicationItems: ['Ibuprofen'] },
    });
    expect(p.allergies).toEqual(['Latex']);
    expect(p.medications).toEqual(['Ibuprofen']);
    expect(p.diagnoses).toEqual(['Endometriosis']);
    expect(p.symptoms).toEqual(['Painful cramps']);
    expect(p.mustBe).toEqual(['Fragrance-free']);
  });
  it('drops "None that I know of" and medication answers of No', () => {
    const p = getCareProfile({ fullHealthIntake: { diagnosisSelections: ['None that I know of'], takesCurrent: 'No', currentMedicationItems: ['x'] } });
    expect(p.diagnoses).toEqual([]);
    expect(p.medications).toEqual([]);
  });
});
