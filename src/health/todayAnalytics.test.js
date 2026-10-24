import { describe, expect, it } from 'vitest';
import { sanitizeTodayProps, trackToday, TODAY_EVENTS, historyBucket } from './todayAnalytics.js';

const HEALTH_WORDS = /pain|period|cramp|pms|sleep|pregnan|bleed|heat|nsaid|ibuprofen|acetaminophen|insight:|follow_up:|option:|care:|p-thermacare|period_pain|cycle_sleep/i;

describe('Today analytics whitelist (no health details)', () => {
  it('only these events and keys exist', () => {
    expect(Object.fromEntries(Object.entries(TODAY_EVENTS).map(([e, spec]) => [e, Object.keys(spec).sort()]))).toEqual({
      today_items_shown: ['count', 'history', 'output', 'tiers', 'types'],
      today_item_action: ['action', 'type'],
      followup_due: ['count'],
      followup_completed: ['completed'],
      rundown_opened: ['categories', 'count', 'kind'],
      rundown_card_action: ['action', 'category', 'kind'],
      rundown_closed: ['count', 'kind', 'seen'],
    });
  });

  it('drops item ids, needs, symptoms, products, outcomes and text', () => {
    const shown = sanitizeTodayProps('today_items_shown', {
      count: 2, types: ['insight', 'care', 'insight:sleep:premenstrual'], tiers: ['care', 'wellness', 'period_pain'], output: 'escalate', history: 'under_30',
      itemIds: ['care:pain_today'], need: 'period_pain', symptoms: { pain: 3 }, title: 'Get this pain checked today',
    });
    expect(shown).toEqual({ count: 2, types: ['insight', 'care'], tiers: ['care', 'wellness'], output: 'escalate', history: 'under_30' });
    expect(sanitizeTodayProps('today_item_action', { type: 'option', action: 'useful', classId: 'nsaid_pain_relief', drugClass: 'nsaid', id: 'option:heat:period_pain' })).toEqual({ type: 'option', action: 'useful' });
    expect(sanitizeTodayProps('followup_completed', { completed: true, outcome: 'helpful', ref: 'heat' })).toEqual({ completed: true });
    expect(sanitizeTodayProps('followup_due', { count: 1, tryId: 't1' })).toEqual({ count: 1 });
    expect(sanitizeTodayProps('today_item_action', { type: 'option', action: 'helpful' })).toEqual({ type: 'option' });
    expect(sanitizeTodayProps('unknown_event', { a: 1 })).toBeNull();
  });

  it('what reaches PostHog never contains a health word', () => {
    const sent = [];
    const capture = (e, p) => sent.push([e, p]);
    trackToday('today_items_shown', { count: 1, types: ['care'], tiers: ['care'], output: 'escalate', reason: 'You logged severe pain', need: 'period_pain' }, capture);
    trackToday('today_item_action', { type: 'care', action: 'open', body: 'Pain in pregnancy' }, capture);
    trackToday('followup_completed', { completed: true, outcome: 'side_effect' }, capture);
    expect(sent).toHaveLength(3);
    expect(JSON.stringify(sent)).not.toMatch(HEALTH_WORDS);
  });

  it('rundown events carry card categories, never card keys or text', () => {
    expect(sanitizeTodayProps('rundown_card_action', { kind: 'daily', category: 'pattern', action: 'not_useful', key: 'pattern:sleep.premenstrual.harder', reason: 'already_knew', title: 'Sleep is rougher' }))
      .toEqual({ kind: 'daily', category: 'pattern', action: 'not_useful' });
    expect(sanitizeTodayProps('rundown_opened', { kind: 'weekly', count: 5, categories: ['week', 'frame', 'sleep.premenstrual'] })).toEqual({ kind: 'weekly', count: 5, categories: ['week', 'frame'] });
  });

  it('history is coarse', () => {
    expect([0, 3, 12, 45, 200].map(historyBucket)).toEqual(['none', 'under_7', 'under_30', 'under_90', '90_plus']);
  });
});
