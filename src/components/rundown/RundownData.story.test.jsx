// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
const { default: RundownStory } = await import('./RundownStory.jsx');
const { periodCard, stepsCard } = await import('./rundownData.js');
const { addDays } = await import('../../health/dailyLog.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = '2026-10-24';
let root; let host;
const setMotion = (reduce) => { window.matchMedia = (q) => ({ matches: reduce && /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} }); };
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const rerender = (el) => act(() => root.render(el));
const btn = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent === text);

const log = {};
for (const [ago, len] of [[86, 5], [58, 5], [30, 5], [1, 1]]) for (let i = 0; i < len; i += 1) { const d = addDays(TODAY, -ago + i); if (d <= TODAY) log[d] = { day: d, flow: 'medium' }; }
const steps = Array.from({ length: 22 }, (_, i) => ({ metric: 'steps', day: addDays(TODAY, i - 21), value: i === 21 ? 800 : 6000 }));
const opening = { key: 'opening', category: 'frame', kind: 'opening', kicker: 'k', title: 'Your Saturday rundown' };
const closing = { key: 'closing', category: 'frame', kind: 'closing', kicker: 'Done', title: 'That is your rundown.' };

describe('data cards in the story', () => {
  it('steps: the chart animates with motion on, and has a text equivalent of every bar', () => {
    setMotion(false);
    mount(<RundownStory cards={[stepsCard(steps, TODAY), closing]} onClose={() => {}} />);
    expect(document.querySelector('.ay-rd').classList.contains('is-still')).toBe(false);
    expect(document.querySelectorAll('.ay-rdd-bar.ay-rdd-anim')).toHaveLength(7);
    expect(document.querySelector('.ay-rdd-bar.is-today')).toBeTruthy();
    const sr = [...document.querySelectorAll('.ay-rdd-steps .sr-only li')].map((li) => li.textContent);
    expect(sr).toHaveLength(8);
    expect(sr.at(-2)).toBe('Today so far: 800 steps');
    expect(sr.at(-1)).toBe('Your usual: about 6,000 steps a day');
    expect(document.querySelector('.ay-rdd-steps svg').getAttribute('aria-hidden')).toBe('true');
  });
  it('reduced motion: the story is still (static charts, no auto-advance or pause button)', () => {
    setMotion(true);
    mount(<RundownStory cards={[stepsCard(steps, TODAY), closing]} onClose={() => {}} />);
    expect(document.querySelector('.ay-rd').classList.contains('is-still')).toBe(true);
    expect(btn('Pause')).toBeUndefined();
  });
  it('the period check-in: one tap sends the answer; the rebuilt card keeps her place', () => {
    setMotion(true);
    const onPeriodAnswer = vi.fn();
    const asking = periodCard({ log, today: TODAY });
    const cards = [opening, asking, closing];
    mount(<RundownStory cards={cards} onClose={() => {}} onPeriodAnswer={onPeriodAnswer} />);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
    expect(document.querySelector('.ay-rd-title').textContent).toBe('Are you still on your period?');
    act(() => btn('Yes').click());
    expect(onPeriodAnswer).toHaveBeenCalledWith('yes');
    // The parent rebuilds with her answer (and a new card before it): same card, answered.
    const answered = periodCard({ log, today: TODAY, answer: 'yes' });
    rerender(<RundownStory cards={[opening, { key: 'data:sleep', category: 'data', kind: 'text', kicker: 's', title: 'Sleep' }, answered, closing]} onClose={() => {}} onPeriodAnswer={onPeriodAnswer} />);
    expect(document.querySelector('.ay-rd-title').textContent).toBe('Day 2 of your period.');
    expect(btn('Medium')).toBeTruthy();
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 3 of 4');
  });
});
