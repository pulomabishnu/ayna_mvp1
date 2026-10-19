import { describe, expect, it } from 'vitest';
import { buildDashboard, formatMetric } from './dashboard.js';
import { buildInsights } from './insights.js';
import { buildRoutine, buildShoppingList, howLine, slotFor } from './plan.js';
import { addNeedToAnswers } from '../matching/addNeed.js';
import { getSelectedNeeds } from '../data/products.js';

const DAY = 86400000;
const TODAY = '2026-10-17';
const day = (offset) => new Date(Date.parse(`${TODAY}T00:00:00Z`) + offset * DAY).toISOString().slice(0, 10);
const row = (metric, offset, value, source = 'apple_health') => ({ metric, day: day(offset), value, source, origin: source, method: 'observed' });
const run = (metric, from, to, value, source) => Array.from({ length: to - from + 1 }, (_, i) => row(metric, -(from + i), typeof value === 'function' ? value(from + i) : value, source));

describe('buildDashboard', () => {
  const rows = [
    ...run('sleep_minutes', 0, 6, 360), ...run('sleep_minutes', 7, 34, 450),
    ...run('resting_hr_bpm', 0, 34, 58),
    ...run('steps', 0, 34, (i) => 6000 + i * 10),
    ...run('hrv_sdnn_ms', 0, 3, 40), ...run('hrv_rmssd_ms', 0, 20, 35, 'oura'),
  ];
  const d = buildDashboard(rows, { today: TODAY, days: 30 });

  it('charts every metric with data, in its group, inside the range', () => {
    const sleep = d.groups.find((g) => g.id === 'sleep');
    expect(sleep.charts.map((c) => c.metric)).toEqual(['sleep_minutes']);
    expect(sleep.charts[0].points).toHaveLength(30);
    expect(sleep.charts[0].type).toBe('bar');
    expect(d.groups.find((g) => g.id === 'heart').charts[0].type).toBe('line');
  });
  it('compares the last 7 days with her own usual', () => {
    const c = d.groups.find((g) => g.id === 'sleep').charts[0];
    expect(c.week).toBe(360);
    expect(c.usual).toBe(450);
    expect(c.delta).toBe(-90);
  });
  it('shows one HRV method only, never both', () => {
    const heart = d.groups.find((g) => g.id === 'heart').charts.map((c) => c.metric);
    expect(heart).toContain('hrv_rmssd_ms');
    expect(heart).not.toContain('hrv_sdnn_ms');
  });
  it('has no usual when there is under 10 days of history', () => {
    const short = buildDashboard(run('steps', 0, 8, 5000), { today: TODAY, days: 7 });
    expect(short.groups[0].charts[0].usual).toBeNull();
  });
  it('builds cycle facts from period days', () => {
    const flow = [...run('menstrual_flow', 60, 64, 3), ...run('menstrual_flow', 32, 36, 3), ...run('menstrual_flow', 4, 8, 2)];
    const c = buildDashboard(flow, { today: TODAY, days: 90 }).cycle;
    expect(c.lengths.map((l) => l.days)).toEqual([28, 28]);
    expect(c.cycleDay).toBe(9);
  });
  it('is empty with no data', () => {
    expect(buildDashboard([], { today: TODAY }).empty).toBe(true);
  });
  it('formats values', () => {
    expect(formatMetric('sleep_minutes', 450)).toBe('7h 30m');
    expect(formatMetric('sleep_minutes', -90, { signed: true })).toBe('-1h 30m');
    expect(formatMetric('temp_deviation_c', 0.2)).toBe('+0.20 °C');
  });
});

const P = (id, category, extra = {}) => ({ id, name: id, category, type: 'physical', price: '$10', whereToBuy: ['Target', 'https://x.co/a'], ...extra });

describe('routine and shopping list', () => {
  const products = [
    P('pad', 'pad', { howToUse: { steps: ['Wash your hands before and after.', 'Change it every 4 to 8 hours.'], sourceLabel: 'Brand' } }),
    P('mag', 'supplement'), P('sleepy', 'sleep'), P('lube', 'intimate-care'),
    P('app', 'tracker', { type: 'digital' }), P('tele', 'telehealth', { type: 'digital' }),
  ];
  it('puts each product in one slot by its category', () => {
    expect(slotFor(products[0])).toBe('period');
    expect(slotFor(products[3])).toBe('asneeded');
    const r = buildRoutine(products, null);
    expect(r.slots.map((s) => s.id)).toEqual(['daily', 'night', 'period', 'asneeded', 'care']);
    expect(r.count).toBe(6);
  });
  it('uses the product’s own first real step, with its source', () => {
    expect(howLine(products[0])).toEqual({ text: 'Change it every 4 to 8 hours.', source: 'Brand', sourceUrl: null });
    expect(howLine(products[1])).toBeNull();
  });
  it('adds timing only from her own data', () => {
    const flow = [...run('menstrual_flow', 60, 64, 3), ...run('menstrual_flow', 32, 36, 3), ...run('menstrual_flow', 4, 8, 2)];
    const insights = buildInsights(flow, { today: TODAY });
    const r = buildRoutine(products, insights);
    expect(r.slots.find((s) => s.id === 'period').note).toMatch(/^Next period estimated around /);
    expect(buildRoutine(products, null).slots.find((s) => s.id === 'period').note).toBeNull();
    const list = buildShoppingList(products, insights);
    expect(list.groups[0].id).toBe('before-period');
    expect(list.groups[0].items.map((i) => i.product.id)).toEqual(['pad']);
  });
  it('shopping list is physical products only, with real store names', () => {
    const list = buildShoppingList(products, null, { getBuyUrl: (p) => (p.id === 'mag' ? 'https://shop.example/mag' : null) });
    expect(list.count).toBe(4);
    const mag = list.groups[0].items.find((i) => i.product.id === 'mag');
    expect(mag).toMatchObject({ price: '$10', where: ['Target'], buyUrl: 'https://shop.example/mag' });
  });
});

describe('addNeedToAnswers', () => {
  it('adds the goal as if she picked it, and matching reads it as selected', () => {
    const answers = { fullHealthIntake: { supportSelections: ['Nothing right now'] } };
    const next = addNeedToAnswers(answers, 'sleep.trouble');
    expect(next.fullHealthIntake.supportSelections).toEqual(['Trouble sleeping']);
    const needs = getSelectedNeeds(next);
    expect(needs.find((n) => n.id === 'sleep.trouble')?.source).toBe('selected');
  });
  it('does nothing for an unknown goal or one already there', () => {
    const a = { supportSelections: ['Trouble sleeping'] };
    expect(addNeedToAnswers(a, 'sleep.trouble')).toBe(a);
    expect(addNeedToAnswers(a, 'made.up')).toBe(a);
  });
});

import { estimatePhase } from './phase.js';
describe('estimatePhase', () => {
  const c = { avgLength: 28, periodLength: 5 };
  it('places each day of a 28-day cycle in a phase', () => {
    expect(estimatePhase({ ...c, cycleDay: 3 }).id).toBe('period');
    expect(estimatePhase({ ...c, cycleDay: 8 }).id).toBe('follicular');
    expect(estimatePhase({ ...c, cycleDay: 14 }).id).toBe('ovulation');
    expect(estimatePhase({ ...c, cycleDay: 22 }).id).toBe('luteal');
    expect(estimatePhase({ ...c, cycleDay: 14 }).ovulationDay).toBe(14);
  });
  it('moves ovulation with her cycle length', () => {
    expect(estimatePhase({ avgLength: 35, periodLength: 5, cycleDay: 14 }).id).toBe('follicular');
    expect(estimatePhase({ avgLength: 35, periodLength: 5, cycleDay: 21 }).id).toBe('ovulation');
  });
  it('makes no guess without her cycle length or far past it', () => {
    expect(estimatePhase({ cycleDay: 10, avgLength: null, periodLength: 5 })).toBeNull();
    expect(estimatePhase({ cycleDay: 2, avgLength: null, periodLength: 5 }).id).toBe('period');
    expect(estimatePhase({ ...c, cycleDay: 40 })).toBeNull();
    expect(estimatePhase({ ...c, cycleDay: null })).toBeNull();
  });
  it('always says it is an estimate and not birth control', () => {
    expect(estimatePhase({ ...c, cycleDay: 14 }).basis).toMatch(/estimate.*not a form of birth control/s);
  });
});

import { budgetMax, overBudget } from './plan.js';
describe('budget', () => {
  it('reads her top price and flags only clearly pricier one-off items', () => {
    const answers = { fullHealthIntake: { priceRange: ['Under $25'] } };
    expect(budgetMax(answers)).toBe(25);
    expect(overBudget({ price: '$2,245+' }, 25)).toBe(true);
    expect(overBudget({ price: '$12.99' }, 25)).toBe(false);
    expect(overBudget({ price: '$30/month' }, 25)).toBe(false);
    expect(overBudget({ price: 'Price at retailer' }, 25)).toBe(false);
    expect(budgetMax({ priceRange: ['Price is not a major factor for me'] })).toBeNull();
    expect(budgetMax({})).toBeNull();
  });
});
