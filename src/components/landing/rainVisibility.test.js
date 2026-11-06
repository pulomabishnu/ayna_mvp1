import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Regression: landing's falling cut-outs and miniature app widgets were still
// rendered in React but hidden behind the hero and by a November CSS override.
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const page = read('./WebLanding.jsx');
const kit = read('./kit.jsx');
const webCss = read('./web-landing.css');
const motionCss = read('./landing-kit.css');

describe('public landing falling product and health widgets', () => {
  it('keeps the original four columns of product cut-outs and miniature app widgets', () => {
    expect(page).toContain('<Rain cols={4} onInk className="wl-rain" />');
    expect(kit).toContain('export function Rain(');
    for (const widget of ['ring', 'sleep', 'streak', 'match', 'ask', 'month']) {
      expect(kit).toContain(`case '${widget}':`);
    }
  });

  it('shows the falling layer behind readable hero text instead of burying it', () => {
    expect(webCss).toContain('.wl-rain { z-index: 0;');
    expect(webCss).toContain('.wl-hero__in { z-index: 1;');
    expect(webCss).not.toContain('.wl-rain { z-index: -2;');
  });

  it('does not hide miniature health widgets in the hero', () => {
    expect(webCss).toContain('.wl-hero .lk-w { display: grid !important; }');
    expect(webCss).not.toContain('.wl-hero .lk-w { display: none !important; }');
  });

  it('retains the user's pause control and OS reduced-motion handling', () => {
    expect(motionCss).toContain('html.ay-motion-paused .lk-rain__run');
    expect(motionCss).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
