// @vitest-environment jsdom
// Customize Home (founder, Oct 24 23:21 to 23:35): the widget registry and
// categories, fixed items, the space cap, smart defaults, per-user storage,
// reset, empty states, and a sheet that stays put while she edits.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();
vi.mock('posthog-js', () => ({ default: { capture: (...a) => capture(...a) } }));
const L = await import('./homeLayout.js');
const { WIDGETS, CATEGORIES, REGISTRY, categoriesFor, widgetsFor } = await import('./widgets/registry.js');
const { Widget } = await import('./widgets/index.jsx');
const { customSummary, logStreak, rankCommunityPosts, weekVsWeek, sinceYesterday, logSeries } = await import('./widgets/widgetData.js');
const { liveAnnouncements, ANNOUNCEMENTS } = await import('../data/announcements.js');
const { default: HomeWidgets } = await import('./HomeWidgets.jsx');
const { addDays, saveLogEntry, todayKey, setLogOwner } = await import('../health/dailyLog.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
beforeEach(() => {
  localStorage.clear(); capture.mockClear(); setLogOwner(null);
  window.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
});
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; document.querySelectorAll('.ayna-mobile').forEach((n) => n.remove()); });
const mount = (el) => { host = document.createElement('div'); host.className = 'ayna-mobile'; document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const btn = (label, scope = document) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label);
const store = () => { const v = {}; return { getItem: (k) => v[k] ?? null, setItem: (k, x) => { v[k] = String(x); }, removeItem: (k) => { delete v[k]; } }; };
const today = todayKey();
const baseCtx = (extra = {}) => ({ surface: 'app', today, healthRows: [], log: {}, tries: [], saved: [], myProducts: [], remote: {}, news: [], topics: [], newPosts: [], askHistory: [], on: {}, ...extra });

describe('registry and categories', () => {
  it('every widget has a known category, a unique id, sizes, and a component', () => {
    const ids = WIDGETS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const w of WIDGETS) {
      expect(cats.has(w.category), w.id).toBe(true);
      expect(w.sizes.length).toBeGreaterThan(0);
      expect(w.sizes.every((s) => s === 'small' || s === 'large')).toBe(true);
    }
    expect(CATEGORIES.map((c) => c.title)).toEqual(['Charts', 'Summaries', 'My health', 'My routine', 'Shopping', 'Community', 'ayna']);
  });
  it('only offers what exists on each surface, and data-gated widgets only with data', () => {
    expect(widgetsFor('health', 'app').map((w) => w.id)).not.toContain('doctor_prep');
    expect(widgetsFor('health', 'web').map((w) => w.id)).toContain('doctor_prep');
    expect(widgetsFor('ayna', 'web').map((w) => w.id)).not.toContain('continue_reading');
    // Heart only with heart data; trending products only with the real aggregate; news only when the team wrote some.
    expect(widgetsFor('charts', 'app', {}).map((w) => w.id)).not.toContain('heart_chart');
    expect(widgetsFor('charts', 'app', { heartChart: {} }).map((w) => w.id)).toContain('heart_chart');
    expect(widgetsFor('shopping', 'app', { remote: { trendingProducts: null } }).map((w) => w.id)).not.toContain('trending_products');
    expect(widgetsFor('shopping', 'app', { remote: { trendingProducts: [{ product_id: 'x', saves: 7 }] } }).map((w) => w.id)).toContain('trending_products');
    expect(widgetsFor('ayna', 'app', { news: [] }).map((w) => w.id)).not.toContain('news');
    expect(categoriesFor('app', {}).length).toBe(7);
  });
  it('the fixed parts of Home are never widgets', () => {
    for (const f of L.FIXED_ITEMS) expect(REGISTRY[f.id]).toBeUndefined();
    expect(L.FIXED_ITEMS.map((f) => f.title)).toEqual(['Ask ayna', 'Safety and care', 'Your Daily Rundown', '1 to 3 things for today']);
  });
  it('ayna news ships empty and shows only live, team-written entries', () => {
    expect(ANNOUNCEMENTS).toEqual([]);
    const list = [{ id: 'a', title: 'Old', date: '2026-09-01', expires: '2026-09-30' }, { id: 'b', title: 'Now', date: '2026-10-20', expires: '2026-11-01' }, { id: 'c', title: 'Later', date: '2026-12-01', expires: '2026-12-31' }];
    expect(liveAnnouncements(list, '2026-10-25').map((a) => a.id)).toEqual(['b']);
  });
});

describe('the space cap', () => {
  it('small takes 1 space, large 2; the app holds 4, web Today 8', () => {
    expect(L.CAPS).toEqual({ app: 4, web: 8 });
    const w = [{ id: 'sleep_chart', size: 'large' }, { id: 'log_streak', size: 'small' }];
    expect(L.usedSpace(w)).toBe(3);
    expect(L.fits(w, { id: 'pain_chart', size: 'small' }, 'app')).toBe(true);
    expect(L.fits(w, { id: 'pain_chart', size: 'large' }, 'app')).toBe(false);
    expect(L.fits(w, { id: 'pain_chart', size: 'large' }, 'web')).toBe(true);
    expect(L.capLine(w, 'app')).toBe('Today fits 4 spaces: a small widget takes 1, a large one takes 2. 3 of 4 used.');
    expect(L.capLine([...w, { id: 'pain_chart', size: 'small' }], 'app')).toBe('Today is full. Turn one off to add another.');
  });
  it('a stored layout over the cap, with unknown or repeated ids, is cleaned', () => {
    const raw = [{ id: 'sleep_chart', size: 'large' }, { id: 'nope', size: 'small' }, { id: 'sleep_chart', size: 'small' }, { id: 'pain_chart', size: 'large' }, { id: 'mood_chart', size: 'large' }, { id: 'doctor_prep', size: 'small' }];
    expect(L.sanitizeLayout(raw, 'app', REGISTRY)).toEqual([{ id: 'sleep_chart', size: 'large' }, { id: 'pain_chart', size: 'large' }]);
  });
});

describe('defaults, per-user storage and reset', () => {
  it('with no customization: the app keeps the health data / log row, web Today adds nothing', () => {
    expect(L.effectiveLayout('app', REGISTRY, store())).toEqual({ widgets: [{ id: 'health', size: 'large' }], custom: false });
    expect(L.effectiveLayout('web', REGISTRY, store())).toEqual({ widgets: [], custom: false });
  });
  it('is kept per person: signed out on the device, folded into her account, never shown to someone else', () => {
    const s = store();
    L.setHomeLayoutOwner(null, s);
    L.writeHomeLayout('app', [{ id: 'log_streak', size: 'small' }], s);
    L.setHomeLayoutOwner('u1', s);
    expect(L.readHomeLayout('app', s)).toEqual([{ id: 'log_streak', size: 'small' }]);
    L.writeHomeLayout('app', [{ id: 'pain_chart', size: 'large' }], s);
    L.setHomeLayoutOwner('u2', s);
    expect(L.readHomeLayout('app', s)).toBeNull();
    L.setHomeLayoutOwner(null, s);
    expect(L.readHomeLayout('app', s)).toBeNull();
    L.setHomeLayoutOwner('u1', s);
    expect(L.readHomeLayout('app', s)).toEqual([{ id: 'pain_chart', size: 'large' }]);
    expect(L.HOME_LAYOUT_KEY).toBe('ayna_home_layout_v1');
  });
  it('Reset to default forgets her layout for that surface only', () => {
    const s = store();
    L.writeHomeLayout('app', [{ id: 'log_streak', size: 'small' }], s);
    L.writeHomeLayout('web', [{ id: 'log_streak', size: 'small' }], s);
    L.resetHomeLayout('app', s);
    expect(L.effectiveLayout('app', REGISTRY, s).custom).toBe(false);
    expect(L.readHomeLayout('web', s)).toEqual([{ id: 'log_streak', size: 'small' }]);
  });
  it('moves by one (buttons) and to a place (drag)', () => {
    const w = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(L.moveWidget(w, 'b', -1).map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(L.moveWidget(w, 'a', -1)).toBe(w);
    expect(L.moveWidgetTo(w, 'a', 2).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('widgets: real data or an honest empty state', () => {
  it('every widget renders with no data without throwing; gated ones render nothing', () => {
    for (const w of WIDGETS) {
      mount(<Widget widget={{ id: w.id, size: w.sizes[0] }} ctx={baseCtx()} />);
      if (['news', 'trending_products'].includes(w.id)) expect(host.textContent, w.id).toBe('');
      else expect(host.querySelector('.ay-w'), w.id).toBeTruthy();
      act(() => root.unmount()); host.remove(); root = null; host = null;
    }
  });
  it('no fake points: empty charts say so', () => {
    mount(<Widget widget={{ id: 'sleep_chart', size: 'small' }} ctx={baseCtx()} />);
    expect(host.textContent).toContain('No sleep data yet');
    expect(host.querySelector('svg[role="img"]')).toBeNull();
  });
  it('a log chart draws only the days she logged', () => {
    const log = { [today]: { day: today, pain: 2 }, [addDays(today, -2)]: { day: addDays(today, -2), pain: 0 } };
    expect(logSeries(log, 'pain', today, 7).filter((p) => p.value != null)).toHaveLength(2);
    mount(<Widget widget={{ id: 'pain_chart', size: 'small' }} ctx={baseCtx({ log })} />);
    expect(host.querySelectorAll('.ay-w-chart__dot')).toHaveLength(2);
    expect(host.querySelector('svg').getAttribute('aria-label')).toContain('2 of 7 days logged');
  });
  it('summaries come from her log: streak, own summary, week vs week, since yesterday', () => {
    const log = {};
    for (let i = 0; i < 14; i += 1) { const d = addDays(today, -i); log[d] = { day: d, pain: i < 7 ? 1 : 3, mood: 2 }; }
    expect(logStreak(log, today)).toEqual({ days: 14, today: true });
    expect(customSummary({ topic: 'pain', range: 'week' }, { log, today }).lines).toEqual(['You logged pain on 7 of the last 7 days.', 'Most often: mild (7 days).', 'Highest: mild.']);
    expect(weekVsWeek({ log, today }).map((l) => l.text)).toEqual(['Pain: lower than last week.', 'Mood: about the same as last week.']);
    expect(sinceYesterday({ log, today }).lines).toEqual(['Pain: mild, the same as yesterday.', 'Mood: okay, the same as yesterday.']);
    expect(sinceYesterday({ log: {}, today }).empty).toBe("There's nothing to compare yet: you haven't logged yesterday.");
  });
  it('trending posts rank by real engagement this week; otherwise "Popular in Community", never "Trending"', () => {
    const now = Date.parse('2026-10-25T12:00:00Z');
    const recent = [
      { id: 'a', body: 'A long enough post about cramps and heat', created_at: '2026-10-24T10:00:00Z', helpful_count: 1, comment_count: 0 },
      { id: 'b', body: 'Another long enough post about sleep before a period', created_at: '2026-10-23T10:00:00Z', helpful_count: 4, comment_count: 2 },
      { id: 'c', body: 'An old post with lots of helpful votes on it', created_at: '2026-09-01T10:00:00Z', helpful_count: 40 },
    ];
    expect(rankCommunityPosts(recent, [], now)).toMatchObject({ label: 'Trending in Community', trending: true });
    expect(rankCommunityPosts(recent, [], now).posts.map((p) => p.id)).toEqual(['b', 'a']);
    const quiet = rankCommunityPosts([{ ...recent[0], helpful_count: 0 }], [recent[2]], now);
    expect(quiet).toMatchObject({ label: 'Popular in Community', trending: false });
    expect(quiet.posts.map((p) => p.id)).toEqual(['c']);
  });
});

describe('Home with widgets and the Customize Home sheet', () => {
  it('default Home: only the health data / log row, and a small Edit', () => {
    mount(<HomeWidgets surface="app" data={{}} on={{ openLog: () => {} }} />);
    expect([...host.querySelectorAll('.ay-homewidgets__cell')]).toHaveLength(1);
    expect(host.querySelector('.ay-homehealth').textContent).toContain('Your log');
    expect(btn('Edit Today')).toBeTruthy();
  });

  it('the sheet stays open, scrolled and on its category while she adds, resizes, reorders and removes; Home updates live', () => {
    mount(<HomeWidgets surface="app" data={{}} on={{}} />);
    act(() => btn('Edit Today').click());
    const dlg = () => document.querySelector('.ay-chs[role="dialog"]');
    expect(dlg().getAttribute('aria-modal')).toBe('true');
    // Fixed items, not toggleable.
    expect(dlg().querySelector('.ay-chs-fixed').textContent).toContain('Ask ayna');
    expect(btn('Turn off Ask ayna')).toBeUndefined();
    const scroller = dlg().querySelector('.ay-chs__scroll');
    scroller.scrollTop = 240;
    act(() => [...document.querySelectorAll('.ay-chs-cat')].find((b) => b.firstChild.textContent === 'Charts').click());
    const cat = dlg().querySelector('.ay-chs-cat[aria-expanded="true"]');
    expect(cat.textContent).toContain('Charts');
    // Live previews in the category.
    expect(dlg().querySelectorAll('.ay-chs-add__preview .ay-w').length).toBeGreaterThan(2);
    act(() => btn('Add Sleep').click());
    act(() => btn('Add Pain').click());
    expect(host.querySelectorAll('.ay-homewidgets__cell')).toHaveLength(3);
    // 2 + 1 + 1 = 4: full.
    expect(dlg().querySelector('.ay-chs-cap').textContent).toBe('Today is full. Turn one off to add another.');
    expect(btn('Add Mood').disabled).toBe(true);
    expect(dlg().textContent).toContain('Today is full. Turn one off to add another.');
    // Reorder with buttons, then turn one off.
    act(() => btn('Move Pain up').click());
    expect([...host.querySelectorAll('.ay-homewidgets__cell .ay-w')].map((n) => n.className.match(/ay-w--(\w+)$/)?.[1] || n.className)).toHaveLength(3);
    expect(host.querySelectorAll('.ay-homewidgets__cell')[1].querySelector('.ay-w--pain_chart')).toBeTruthy();
    act(() => btn('Turn off Health data and log').click());
    expect(host.querySelectorAll('.ay-homewidgets__cell')).toHaveLength(2);
    // Now there's room: large is allowed again.
    const sizeGroup = dlg().querySelector('.ay-chs-row[data-id="pain_chart"] .ay-chs-size');
    act(() => [...sizeGroup.querySelectorAll('button')].find((b) => b.textContent === 'Large').click());
    expect(host.querySelector('.ay-homewidgets__cell.is-large .ay-w--pain_chart')).toBeTruthy();
    // Still open, same scroll, same category.
    expect(dlg()).toBeTruthy();
    expect(dlg().querySelector('.ay-chs__scroll')).toBe(scroller);
    expect(scroller.scrollTop).toBe(240);
    expect(dlg().querySelector('.ay-chs-cat[aria-expanded="true"]')).toBe(cat);
    // Saved for her.
    expect(L.readHomeLayout('app')).toEqual([{ id: 'pain_chart', size: 'large' }, { id: 'sleep_chart', size: 'small' }]);
    // Done closes it; the event carries widget ids and sizes only.
    act(() => btn('Done').click());
    expect(dlg()).toBeNull();
    expect(capture).toHaveBeenCalledWith('home_customized', { source: 'app', widgets: 'pain_chart,sleep_chart', sizes: 'large,small', count: 2, reset: false });
  });

  it('Reset to default brings back today\'s Home', () => {
    L.writeHomeLayout('app', [{ id: 'log_streak', size: 'small' }]);
    mount(<HomeWidgets surface="app" data={{}} on={{}} />);
    expect(host.querySelector('.ay-w--log_streak')).toBeTruthy();
    act(() => btn('Edit Today').click());
    act(() => btn('Reset to default').click());
    expect(host.querySelector('.ay-homehealth')).toBeTruthy();
    expect(host.querySelector('.ay-w--log_streak')).toBeNull();
    expect(L.readHomeLayout('app')).toBeNull();
  });

  it('web Today: nothing extra by default, room for 8 spaces', () => {
    mount(<HomeWidgets surface="web" data={{}} on={{}} />);
    expect(host.querySelector('.ay-homewidgets__cell')).toBeNull();
    act(() => btn('Add widgets to Today').click());
    expect(document.querySelector('.ay-chs-cap').textContent).toBe('Today fits 8 spaces: a small widget takes 1, a large one takes 2. 0 of 8 used.');
  });

  it('a logged day shows in Today\'s log widget', () => {
    saveLogEntry(today, { pain: 1 });
    L.writeHomeLayout('app', [{ id: 'quick_log', size: 'large' }]);
    mount(<HomeWidgets surface="app" data={{}} on={{}} />);
    expect(host.querySelector('.ay-w--quick_log').textContent).toContain('Pain: mild');
  });
});
