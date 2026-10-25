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
});
