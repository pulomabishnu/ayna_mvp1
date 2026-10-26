// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import InfoHero from './InfoHero.jsx';
import About from '../About.jsx';

let root; let host;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('InfoHero (info-pages audit issue 1)', () => {
  it('breadcrumb, one H1, lede, optional plate photo', async () => {
    await act(async () => root.render(<InfoHero title="How ayna picks your matches." crumb="How it works" lede="One sentence." photo={{ src: '/landing/x.webp', alt: '' }} />));
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('nav[aria-label="Breadcrumb"]').textContent).toContain('How it works');
    expect(host.querySelector('.ayk-plate')).toBeTruthy();
  });
  it('About renders with the shared hero and no colour band', async () => {
    await act(async () => root.render(<About onBack={() => {}} backLabel="Home" />));
    expect(host.querySelector('.ay-ih')).toBeTruthy();
    expect(host.querySelector('.ay-band')).toBeNull();
    expect(host.textContent).toContain('Got questions?');
  });
});
