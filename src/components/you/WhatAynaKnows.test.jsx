// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WhatAynaKnows from './WhatAynaKnows.jsx';
import { EMPTY, buildSnapshot } from '../../mobile/data/intakeModel.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); localStorage.clear(); });
const render = (props) => { host = document.createElement('div'); host.className = 'app-container'; document.body.append(host); root = createRoot(host); act(() => root.render(<WhatAynaKnows variant="web" {...props} />)); };
const btn = (label) => [...host.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label || b.textContent === label);

describe('What ayna knows about you', () => {
  const quiz = mapIntakeToLegacyQuizProfile(buildSnapshot({ ...EMPTY, age: '33', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping', 'Acne'] }));
  it('shows each answer with its source, and Edit opens that one question', () => {
    const onEditStep = vi.fn();
    render({ quizAnswers: quiz, onEditStep, onUpdateIntake: vi.fn() });
    expect(host.textContent).toContain('What ayna knows about you');
    expect(host.textContent).toContain('You told us');
    act(() => btn('Edit: Age').click());
    expect(onEditStep).toHaveBeenCalledWith('age');
  });
  it('Remove re-saves without that answer', async () => {
    const onUpdateIntake = vi.fn(async () => true);
    render({ quizAnswers: quiz, onUpdateIntake });
    const remove = [...host.querySelectorAll('button')].find((b) => /Remove: .*acne/i.test(b.getAttribute('aria-label') || ''));
    await act(async () => { remove.click(); });
    expect(onUpdateIntake.mock.calls[0][0].supportSelections).toEqual(['Trouble sleeping']);
    expect(host.textContent).toContain('Removed');
  });
  it('no answers yet: an empty state that explains the page', () => {
    render({ quizAnswers: null, onEditStep: () => {} });
    expect(host.textContent).toContain('Nothing yet.');
  });
});
