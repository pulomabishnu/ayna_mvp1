// QA round 2 (Oct 25): CSS contracts checked against the source.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const css = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('QA round 2 CSS', () => {
  it('no washi tape strip on app empty states', () => {
    expect(css('../mobile/app-direction.css')).not.toMatch(/\.ay-empty[^{]*::before\s*\{[^}]*rotate/);
  });
  it('web /ask invite paragraph uses the theme ink, so dark mode is readable', () => {
    expect(css('./ds-screens.css')).toMatch(/\.wx-askpage \.wx-invite p \{ color: var\(--ds-ink\) !important; \}/);
  });
  it('390 web Explore search keeps a right gutter', () => {
    expect(css('./ds-screens.css')).toMatch(/\.wx-top\.ay-pagehead \.wx-search \{ margin-right: 20px !important; \}/);
  });
  it('the seal word fits its ring (app and web phone sizes)', () => {
    const app = css('../mobile/ds-app.css').match(/\.ax-seal b \{[^}]*\}/)[0];
    const size = Number(app.match(/width: (\d+)px/)[1]); const font = Number(app.match(/800 ([\d.]+)px/)[1]);
    expect(font * 4 * 0.6).toBeLessThan(size); // "ayna": about 0.6em a letter
    const web = css('./ds-screens.css').match(/\.wx-top \.wx-seal b \{ width: (\d+)px; height: \d+px; font-size: ([\d.]+)px/);
    expect(Number(web[2]) * 4 * 0.6).toBeLessThan(Number(web[1]));
  });
});
