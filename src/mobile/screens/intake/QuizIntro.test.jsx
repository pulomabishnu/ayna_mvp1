// @vitest-environment jsdom
// QA (Oct 25): the profile form's "Quick tip" respects the tips switch.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import QuizIntro from './QuizIntro.jsx';
import { setTipsEnabled } from '../../tutorial/tourStore.js';

let root; let host;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); localStorage.clear(); });

describe('Quick tip', () => {
  it('shows with tips on', async () => {
    await act(async () => root.render(<QuizIntro variant="app" />));
    expect(host.textContent).toContain('Quick tip');
  });
  it('stays away with tips off', async () => {
    setTipsEnabled(false);
    await act(async () => root.render(<QuizIntro variant="app" />));
    expect(host.textContent).not.toContain('Quick tip');
    expect(host.textContent).not.toContain('Hold any answer');
  });
});
