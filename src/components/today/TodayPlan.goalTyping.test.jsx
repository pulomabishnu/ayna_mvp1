// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import TodayPlan from './TodayPlan.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Notion AYNA-352 (Puloma): typing her own goal, the keyboard kept going away. Each keystroke re-ran
// the sheet's focus effect and moved focus off the box. Focus must stay in the box while she types.
describe('Set a goal: typing your own', () => {
  it('keeps focus in the box on every keystroke', async () => {
    const host = document.createElement('div'); host.className = 'ayna-mobile'; document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(<TodayPlan entry={null} picks={[]} today="2026-11-14" />); });
    const own = [...document.querySelectorAll('button')].find((b) => /your own|^\+ Add$|Add a goal/i.test(b.textContent.trim()));
    expect(own).toBeTruthy();
    await act(async () => { own.click(); });
    const input = document.getElementById('ay-tp-goal-text');
    expect(input).toBeTruthy();
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    let text = '';
    for (const ch of 'Walk 20 minutes') {
      text += ch;
      await act(async () => { setter.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); });
      expect(document.activeElement).toBe(input);
    }
    expect(input.value).toBe('Walk 20 minutes');
    await act(async () => { root.unmount(); });
    host.remove();
  });
});
