// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
const posthog = (await import('posthog-js')).default;
const { default: TodayFeed } = await import('./TodayFeed.jsx');
const { saveLogEntry, todayKey, addDays } = await import('../../health/dailyLog.js');
const { saveTry } = await import('../../health/outcomes.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
beforeEach(() => { localStorage.clear(); posthog.capture.mockClear(); });
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });
const render = (props = {}) => {
  host = document.createElement('div');
  host.className = 'app-container';
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<TodayFeed variant="web" {...props} />));
};
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent === text);

describe('Today with ayna', () => {
  it('no data: one check-in item, Useful / Not relevant, and the log card', () => {
    render();
    expect(host.querySelectorAll('.ay-today__item')).toHaveLength(1);
    expect(host.textContent).toContain('Start with a quick check-in');
    expect(button('Useful')).toBeTruthy();
    expect(button('Not relevant')).toBeTruthy();
    expect(host.textContent).toContain('Your log');
  });

  it('today fully logged and nothing else: the empty line', () => {
    saveLogEntry(todayKey(), { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2 });
    render();
    expect(host.textContent).toContain('Nothing unusual stands out today');
  });

  it('care cannot be dismissed', () => {
    saveLogEntry(todayKey(), { pain: 3, flow: 'none', pms: 0, sleep: 2, mood: 2 });
    render({ intake: { age: '27', lifeStageSelections: ['I get periods regularly'], lifeStage: 'I get periods regularly' } });
    const care = host.querySelector('.ay-today__item.is-care');
    expect(care.textContent).toContain('Get this pain checked today');
    expect([...care.querySelectorAll('button')].some((b) => b.textContent === 'Not relevant')).toBe(false);
  });

  it('a due follow-up records the outcome and logs completion without the outcome', () => {
    saveLogEntry(todayKey(), { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2 });
    saveTry({ id: 't1', kind: 'action', ref: 'heat', need: 'period_pain', startedDay: addDays(todayKey(), -30), horizonDays: 28 });
    render();
    expect(host.textContent).toContain('Did heat help?');
    act(() => button('Helpful').click());
    expect(host.textContent).not.toContain('Did heat help?');
    const done = posthog.capture.mock.calls.find(([e]) => e === 'followup_completed');
    expect(done[1]).toEqual({ completed: true });
    const shown = posthog.capture.mock.calls.find(([e]) => e === 'today_items_shown');
    expect(Object.keys(shown[1]).sort()).toEqual(['count', 'history', 'output', 'tiers', 'types']);
    expect(JSON.stringify(posthog.capture.mock.calls)).not.toMatch(/heat|pain|period/);
  });

  it('dismissing a check-in leaves nothing', () => {
    render();
    act(() => button('Not relevant').click());
    expect(host.textContent).toContain('Nothing unusual stands out today');
    const act1 = posthog.capture.mock.calls.find(([e]) => e === 'today_item_action');
    expect(act1[1]).toEqual({ type: 'check_in', action: 'not_relevant' });
  });
});
