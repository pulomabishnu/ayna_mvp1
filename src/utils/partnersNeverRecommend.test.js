// Brand partners may only move up in the Shop/Browse grid with personalization
// off. They must never reach the recommendation engine, the AI picks or the chatbot.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { partnerBoostAllowed } from './partnerBrands.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('partner boost', () => {
  it('only on default browse with personalization off and no search', () => {
    expect(partnerBoostAllowed({})).toBe(true);
    expect(partnerBoostAllowed({ personalized: true })).toBe(false);
    expect(partnerBoostAllowed({ hasQuery: true })).toBe(false);
    expect(partnerBoostAllowed({ sort: 'price-asc' })).toBe(false);
  });

  it('both Browse pages use the shared rule', () => {
    expect(read('src/components/Discovery.jsx')).toMatch(/featuredLead = partnerBoostAllowed\(/);
    expect(read('src/mobile/screens/BrowseScreen.jsx')).toMatch(/if \(partnerBoostAllowed\(/);
  });

  // Recommendation, match and AI code. None of it may read partner status.
  const RECOMMENDERS = [
    'src/data/products.js',
    'src/data/matching',
    'src/matching',
    'src/utils/fetchLlmRecommendations.js',
    'src/utils/fetchSearchSuggestions.js',
    'api/llm-recommendations.js',
    'api/ask-ayna.js',
    'api/product-chat.js',
    'api/search-suggestions.js',
  ];
  const files = RECOMMENDERS.flatMap((p) => {
    const abs = path.join(ROOT, p);
    if (!fs.existsSync(abs)) return [];
    if (fs.statSync(abs).isFile()) return [p];
    return fs.readdirSync(abs).filter((f) => f.endsWith('.js') && !f.includes('.test.')).map((f) => `${p}/${f}`);
  });

  it.each(files)('%s never uses partner status', (f) => {
    expect(read(f)).not.toMatch(/partnerBrands|isPartnerBrandItem|getPartnerBrandRank|PARTNER_BRAND|partnerBoostAllowed/);
  });
});
