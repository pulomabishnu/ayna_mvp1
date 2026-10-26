import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// QA3 M9: on the Saalt cup page at 1113x683 (bleeding note leading the match)
// the safety line under Buy was half below the fold (bottom 702px). Measured
// after this rule: bottom 672px. Touch screens keep the 44px "See why" row.
describe('product page fold at laptop height', () => {
  const css = readFileSync(new URL('./pdp.css', import.meta.url), 'utf8');
  const block = css.slice(css.indexOf('QA3 M9'));
  it('desktop pointer only, touch targets untouched', () => {
    expect(block).toMatch(/@media \(min-width: 900px\) and \(hover: hover\) and \(pointer: fine\)/);
    expect(block).toMatch(/\.ayv-match \.ayv-textbtn \{ min-height: 28px; \}/);
    expect(block).toMatch(/\.ay-story--buy > \.ayv-safeline \{ margin-top: 2px !important; \}/);
  });
});
