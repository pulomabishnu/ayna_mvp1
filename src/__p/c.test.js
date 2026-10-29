import { test } from 'vitest'; import fs from 'fs';
import { getEcosystemSeedFromQuiz, ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile } from '../matching/productProfile.js';
test('c', () => { const out = [];
  for (const needs of [['Cramps or period pain'], ['Cramps or period pain', 'Trouble sleeping', 'Acne'], ['Vaginal dryness', 'Hot flashes'], ["Heavy periods"]]) {
    const { shelves } = getEcosystemSeedFromQuiz({ fullHealthIntake: { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: needs }, personalizationCompleted: true });
    for (const s of shelves) out.push(`${s.needId}: ${s.picks.map((p) => `${p.productId}[${buildProductProfile(ALL_PRODUCTS.find((x) => x.id === p.productId)).category}](${p.score})`).join(', ')}`);
  }
  fs.writeFileSync('/tmp/c.txt', out.join('\n')); }, 120000);
