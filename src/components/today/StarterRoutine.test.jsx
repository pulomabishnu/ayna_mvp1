// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import '../../data/products.js';
import StarterRoutine from './StarterRoutine.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const anxious = { age: '28', supportSelections: ['Anxiety'], lifeStageSelections: ['I get periods regularly'], personalizationCompleted: true };
const mount = async (el) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => { root.render(el); }); return { host, root }; };

// Notion AYNA-334: a starter routine for anxiety she can swap, remove or opt out of.
describe('Starter routine for anxiety', () => {
  beforeEach(() => { localStorage.clear(); document.body.innerHTML = ''; });
  it('shows for Anxiety, not otherwise', async () => {
    const a = await mount(<StarterRoutine quizAnswers={anxious} />);
    expect(a.host.textContent).toContain('A starter routine for anxiety');
    expect(a.host.textContent).toContain('Not medical advice');
    const b = await mount(<StarterRoutine quizAnswers={{ ...anxious, supportSelections: ['Cramps or period pain'] }} />);
    expect(b.host.textContent).toBe('');
  });
  it('"Not for me" takes one item out; Hide removes the routine and stays hidden', async () => {
    const { host, root } = await mount(<StarterRoutine quizAnswers={anxious} />);
    const before = host.querySelectorAll('.ay-sr__item').length;
    await act(async () => { host.querySelector('.ay-sr__remove').click(); });
    expect(host.querySelectorAll('.ay-sr__item').length).toBe(before - 1);
    await act(async () => { host.querySelector('.ay-sr__hide').click(); });
    expect(host.textContent).toBe('');
    await act(async () => { root.unmount(); });
    const again = await mount(<StarterRoutine quizAnswers={anxious} />);
    expect(again.host.textContent).toBe('');
  });
});
