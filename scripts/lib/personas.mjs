// Sensitive personas shared by the safety audit and the group report.
export const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
export const PERSONAS = {
  regular: { ...base, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping', 'Heavy periods'] },
  pregnant: { ...base, lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping', 'Nausea', 'Prenatal or pregnancy support'] },
  ttc: { ...base, lifeStageSelections: ['I am trying to conceive'], supportSelections: ['Fertility or trying to conceive', 'Trouble sleeping'] },
  breastfeeding: { ...base, lifeStageSelections: ['I am breastfeeding'], supportSelections: ['Trouble sleeping', 'Breastfeeding support'] },
  postmenopause: { ...base, lifeStageSelections: ['I am post-menopause'], supportSelections: ['Hot flashes', 'Vaginal dryness', 'Bone health'] },
  onMedicines: { ...base, takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill', 'Sertraline', 'Warfarin'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Low mood or anxiety', 'Trouble sleeping'] },
  allergic: { ...base, allergyStatus: 'Yes', allergyItems: ['Latex', 'Fragrance', 'Soy'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Vaginal dryness', 'Heavy periods'] },
  unanswered: { supportSelections: ['Trouble sleeping', 'Cramps or period pain', 'Hot flashes'] },
};
