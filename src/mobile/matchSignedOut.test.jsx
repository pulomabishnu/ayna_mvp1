import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { getRecommendationMatchesAndRest } from '../data/products.js';
import ProductCard from './components/ProductCard.jsx';

// One rule (review Oct 24, finding 3): a signed-out user with a saved profile
// sees her % match everywhere, the same as the website and as signed in.
// Matching runs on this device; an account is never required for it.
const answers = { fullHealthIntake: { personalizationCompleted: true, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], age: 29 }, personalizationCompleted: true };

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.jsx?$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

describe('signed-out match %', () => {
  it('no app surface gates her answers or the % on being signed in', () => {
    const offenders = files(join(__dirname)).filter((f) => {
      const src = readFileSync(f, 'utf8');
      return /authUser\s*\?\s*(effectiveQuizAnswers|quizAnswers|lastQuizAnswers)\s*:\s*null/.test(src)
        || /showMatch[=:]\s*\{?\s*Boolean\(authUser\)/.test(src)
        || /canSortByMatch\s*=\s*Boolean\(authUser\)/.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it('a product card shows the % from her answers with no account', () => {
    const top = getRecommendationMatchesAndRest(answers).matches[0];
    expect(top).toBeTruthy();
    const html = renderToStaticMarkup(<ProductCard product={top} quizAnswers={answers} />);
    expect(html).toMatch(/\d+(<small>)?%/);
  });
});
