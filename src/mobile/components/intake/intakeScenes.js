// Each part of the intake has one colour, so people always know which
// part they're in; the background motif still changes per question so it
// keeps feeling like moving through levels. Safety questions get a colour
// too, with the quietest motifs so nothing competes with the answers.
export const SECTION_TONES = {
  core: 'peri',
  support: 'pink',
  safety: 'mint',
  history: 'butter',
  preferences: 'peri',
  trust: 'pink',
};

export const SECTION_LABELS = {
  core: 'The basics',
  support: 'Your body',
  safety: 'Safety check',
  history: 'What you’ve tried',
  preferences: 'Your preferences',
  trust: 'Last bit',
};

export const INTAKE_SCENES = {
  age: { art: 'scallop' },
  lifeStage: { art: 'sparkle' },
  zip: { art: 'arch' },
  support: { art: 'bloom' },
  periodFlow: { art: 'drops' },
  periodPain: { art: 'zigzag' },
  utiFrequency: { art: 'arch' },
  postpartumTiming: { art: 'arch' },
  pregnancyTrimester: { art: 'arch' },
  conditions: { art: 'arch' },
  allergies: { art: 'scallop' },
  medications: { art: 'arch' },
  safety: { art: 'scallop' },
  products: { art: 'sparkle' },
  avoidRepeat: { art: 'scallop' },
  formats: { art: 'bloom' },
  recommendationCount: { art: 'sparkle' },
  priceRange: { art: 'coins' },
  brandOpenness: { art: 'rings' },
  trustedBrands: { art: 'rings' },
  avoidIngredients: { art: 'scallop' },
  fsaHsa: { art: 'arch' },
  trust: { art: 'sparkle' },
  anythingElse: { art: 'bloom' },
};
