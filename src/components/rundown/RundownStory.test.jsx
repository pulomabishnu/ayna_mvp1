// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
const posthog = (await import('posthog-js')).default;
const { default: RundownStory } = await import('./RundownStory.jsx');
const { default: TodayFeed } = await import('../today/TodayFeed.jsx');
const { saveLogEntry, todayKey, addDays } = await import('../../health/dailyLog.js');
const { saveTry } = await import('../../health/outcomes.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
beforeEach(() => { localStorage.clear(); posthog.capture.mockClear(); window.matchMedia = window.matchMedia || (() => ({ matches: true, addEventListener() {}, removeEventListener() {} })); });
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; document.querySelectorAll('.ay-rd').forEach((n) => n.remove()); });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const btn = (text, scope = document) => [...scope.querySelectorAll('button')].find((b) => b.textContent === text || b.getAttribute('aria-label') === text);

const CARDS = [
  { key: 'opening', category: 'frame', kind: 'opening', kicker: 'Your daily rundown', title: 'Your Saturday rundown', body: 'Here is your health in 60 seconds.' },
  { key: 'care:pain_today', category: 'safety', protected: true, kind: 'care', kicker: 'Worth acting on', title: 'Get this pain checked today', item: { level: 'prompt', title: 'Get this pain checked today' } },
  { key: 'checkin:pain', category: 'symptom', kind: 'checkin', kicker: 'Your check-in', title: 'How is your pain today?', field: 'pain', options: { values: [0, 1, 2, 3], labels: ['None', 'Mild', 'Moderate', 'Severe'] } },
  { key: 'pattern:x', category: 'pattern', kind: 'text', kicker: 'Your cycle', title: 'A pattern', body: 'Sleep was rougher.', ask: 'Why?' },
  { key: 'closing', category: 'frame', kind: 'closing', kicker: 'Done', title: 'That is your rundown.' },
];

describe('RundownStory', () => {
  it('is a labelled modal story; arrows move, the live region says where she is', () => {
    mount(<RundownStory cards={CARDS} onClose={() => {}} />);
    const dlg = document.querySelector('[role="dialog"]');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-roledescription')).toBe('story');
    expect(document.querySelector('[aria-live]').textContent).toBe('Card 1 of 5: Your Saturday rundown');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 2 of 5');
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })));
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 1 of 5');
  });

  it('care has no Not useful; a check-in writes to the log; Not useful hides a card', () => {
    const onCheckIn = vi.fn(); const onNotUseful = vi.fn();
    mount(<RundownStory cards={CARDS} onClose={() => {}} onCheckIn={onCheckIn} onNotUseful={onNotUseful} />);
    act(() => btn('Next card').click());
    expect(btn('Not useful')).toBeUndefined();
    act(() => btn('Next card').click());
    act(() => btn('Moderate').click());
    expect(onCheckIn).toHaveBeenCalledWith('pain', 2);
    act(() => btn('Next card').click());
    act(() => btn('Not useful').click());
    act(() => btn('I already knew this').click());
    expect(onNotUseful).toHaveBeenCalledWith(expect.objectContaining({ key: 'pattern:x' }), 'already_knew');
    expect(document.querySelector('[aria-live]').textContent).toContain('That is your rundown.');
  });

  it('Escape closes and reports how far she got', () => {
    const onClose = vi.fn();
    mount(<RundownStory cards={CARDS} onClose={onClose} />);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalledWith({ seen: 1, count: 5 });
  });
});

describe('Today shows the rundown hero only with real content', () => {
  it('a due follow-up gives a rundown; opening it logs categories only', () => {
    saveLogEntry(todayKey(), { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2 });
    saveTry({ id: 't1', kind: 'action', ref: 'heat', need: 'period_pain', startedDay: addDays(todayKey(), -30), horizonDays: 28 });
    mount(<TodayFeed variant="web" />);
    expect(host.textContent).toContain('Your Daily Rundown');
    expect(host.textContent).toContain('60 seconds. The things worth knowing about your health today.');
    act(() => btn('Start rundown', host).click());
    expect(document.querySelector('.ay-rd')).toBeTruthy();
    const opened = posthog.capture.mock.calls.find(([e]) => e === 'rundown_opened');
    expect(opened[1]).toEqual({ kind: 'daily', count: 3, categories: ['frame', 'goal'] });
  });
  it('nothing to say: no hero', () => {
    saveLogEntry(todayKey(), { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2 });
    mount(<TodayFeed variant="web" />);
    expect(host.textContent).not.toContain('Your Daily Rundown');
  });
});

describe('End of the rundown', () => {
  it('Ask follow-ups about the cards she saw open Ask with that question', () => {
    const onAskFollowUp = vi.fn();
    const cards = [CARDS[0], { ...CARDS[4], followUps: [{ question: 'Why was my sleep flagged?', cardKey: 'change:sleep' }] }];
    mount(<RundownStory cards={cards} onClose={() => {}} onAskFollowUp={onAskFollowUp} />);
    act(() => btn('Next card').click());
    act(() => [...document.querySelectorAll('.ay-rd-asks button')][0].click());
    expect(onAskFollowUp).toHaveBeenCalledWith({ question: 'Why was my sleep flagged?', cardKey: 'change:sleep' });
  });
});
