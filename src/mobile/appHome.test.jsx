// @vitest-environment jsdom
// The app's ayna home (founder, Oct 24 20:12): routing, the product sheet over
// the Rundown and the chat (exact return position), the Rundown to chat
// hand-off, and starters that work on this phone.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
const { initialAppRoute, aynaRoute, navTabFor } = await import('./utils/navTab.js');
const { onDeviceStarters, startersFor } = await import('../utils/askStarters.js');
const { localTodayAnswer, setTodayAskContext } = await import('../utils/askToday.js');
const { localHistoryAnswer } = await import('../utils/askHistory.js');
const { localMatchAnswer } = await import('../utils/askMatch.js');
const { matchStateFromDetails, SAFETY_HOLD, holdLine } = await import('../utils/matchState.js');
const { pickRundownPosts } = await import('./hooks/useRundownCommunity.js');
const { buildRundown } = await import('../components/rundown/buildRundown.js');
const { default: RundownStory } = await import('../components/rundown/RundownStory.jsx');
const { default: Rundown } = await import('../components/rundown/Rundown.jsx');
const { default: ProductSheet } = await import('./components/ProductSheet.jsx');
const { SheetMatch } = await import('./components/ProductQuick.jsx');
const { default: AskAynaModal } = await import('./components/AskAynaModal.jsx');
const { default: HomeSwitch } = await import('./components/HomeSwitch.jsx');
const { ProductSheetContext } = await import('./productSheetContext.js');
const { ALL_PRODUCTS } = await import('../data/products.js');
const { addDays, todayKey } = await import('../health/dailyLog.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
const reduce = (on) => { window.matchMedia = (q) => ({ matches: on && /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); };
beforeEach(() => { localStorage.clear(); reduce(true); if (!Element.prototype.scrollTo) Element.prototype.scrollTo = function scrollTo() {}; });
afterEach(() => {
  act(() => root?.unmount());
  host?.remove(); root = null; host = null;
  document.querySelectorAll('.ayna-mobile, .ay-rd, .ay-psheet-layer').forEach((n) => n.remove());
  vi.useRealTimers();
});
// Mounted inside an .ayna-mobile shell, like the app (portals land in it).
const mount = (el) => { host = document.createElement('div'); host.className = 'ayna-mobile'; document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const btn = (text, scope = document) => [...scope.querySelectorAll('button, [role="tab"]')].find((b) => b.textContent.trim() === text || b.getAttribute('aria-label') === text);
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };

const product = ALL_PRODUCTS.find((p) => p.id && p.name && (p.image || p.imageUrl)) || ALL_PRODUCTS[0];

describe('app routing: ayna is home', () => {
  it('a profile or ecosystem on this phone opens the ayna chat; nothing opens the welcome', () => {
    expect(initialAppRoute({ hasProfile: true })).toEqual({ screen: 'ayna', view: null });
    expect(initialAppRoute({})).toEqual({ screen: 'landing', view: null });
    expect(initialAppRoute({ hasDraft: true })).toEqual({ screen: 'ecointro', view: null });
    expect(initialAppRoute({ pendingQuiz: true, quizStep: 'plan', hasProfile: true })).toEqual({ screen: 'plan', view: null });
  });
  it('old routes keep working: today is My dashboard, ask is the chat (push, links, dev ?screen=)', () => {
    expect(initialAppRoute({ devScreen: 'today', hasProfile: true })).toEqual({ screen: 'ayna', view: 'dashboard' });
    expect(aynaRoute('ask')).toEqual({ screen: 'ayna', view: 'chat' });
    expect(navTabFor('today')).toBe('ayna');
    expect(navTabFor('library')).toBe('library');
  });
  it('the switch is a tablist; arrows move between Chat, Products and My dashboard', () => {
    const onChange = vi.fn();
    mount(<HomeSwitch view="chat" onChange={onChange} />);
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.textContent)).toEqual(['Chat', 'Products', 'My dashboard']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    act(() => tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    expect(onChange).toHaveBeenCalledWith('dashboard');
  });
});

describe('starters that work on this phone (signed out)', () => {
  it('every signed-out starter is answered on the device, never by the AI', async () => {
    setTodayAskContext({ today: '2026-10-24', signals: { hasRundown: true }, focus: [], rundown: [{ category: 'change', title: 'Sleep may matter a little more today.' }], log: {}, recent: [] });
    const list = onDeviceStarters({ hasProfile: true, signals: { hasRundown: true } });
    expect(list.map((t) => t.question)).toEqual(['What should I focus on today?', 'Explain my Daily Rundown', 'What changed from yesterday?', 'Explain my top match', 'What helped last time?']);
    for (const t of list) {
      const local = (await localMatchAnswer(t.question, { quizAnswers: null })) || (await localHistoryAnswer(t.question, {})) || (await localTodayAnswer(t.question));
      expect(local?.answer, t.question).toBeTruthy();
    }
    expect(onDeviceStarters({}).some((t) => t.question === 'Explain my top match')).toBe(false);
  });
  it('the chat home (signed in) leads with today, gated by what ayna knows', () => {
    const plain = startersFor({ surface: 'home' }).map((t) => t.question);
    expect(plain[0]).toBe('What should I focus on today?');
    expect(plain).not.toContain('Why am I feeling so tired today?');
    expect(startersFor({ surface: 'home', signals: { lowSleepOrEnergy: true } }).map((t) => t.question)).toContain('Why am I feeling so tired today?');
  });
});

describe('safety hold: no % anywhere', () => {
  it('a restricted product shows "Safety hold · Match unavailable" and what is missing, never a percent', () => {
    const st = matchStateFromDetails(product, { matchStatus: 'scored', percent: 82, eligibility: 'restricted', missingSafetyText: ['what medicines or supplements you take'] });
    expect(st.kind).toBe('held');
    expect(st.label).toBe(SAFETY_HOLD);
    expect(holdLine(st)).toMatch(/what medicines or supplements you take/);
    mount(<SheetMatch state={st} />);
    expect(host.textContent).toContain('Safety hold · Match unavailable');
    expect(host.textContent).not.toMatch(/\d+%/);
  });
});

describe('product sheet: opens over what she was looking at, returns to the same place', () => {
  it('is a modal dialog; Escape closes it, focus and the chat scroll come back unchanged', async () => {
    const onClose = vi.fn();
    function Chat({ sheet }) {
      return <>
        <div className="chat-list" style={{ height: 200, overflowY: 'auto' }}>{Array.from({ length: 40 }, (_, i) => <p key={i}>Message {i}</p>)}<button type="button" id="chip">Open {product.name}</button></div>
        {sheet}
      </>;
    }
    mount(<Chat sheet={null} />);
    const list = host.querySelector('.chat-list');
    list.scrollTop = 640;
    const chip = host.querySelector('#chip');
    chip.focus();
    act(() => root.render(<Chat sheet={<ProductSheet product={product} onClose={onClose} matchState={{ kind: 'none' }} onToggleSaved={() => {}} onAddToRoutine={() => {}} />} />));
    await flush();
    const dlg = document.querySelector('.ay-psheet[role="dialog"]');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-labelledby')).toBe('ay-psheet-title');
    expect(document.getElementById('ay-psheet-title').textContent).toBeTruthy();
    expect(dlg.contains(document.activeElement)).toBe(true);
    // The four tabs from the product page, ayna summary first.
    const tabs = [...dlg.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
    if (tabs.length) {
      expect(tabs).toEqual(['Clinical opinion', 'Scientific literature', 'ayna summary', 'Reviews']);
      expect(dlg.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('ayna summary');
    }
    // Behind it is inert while it is open.
    expect(list.hasAttribute('inert')).toBe(true);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => root.render(<Chat sheet={null} />));
    expect(list.hasAttribute('inert')).toBe(false);
    expect(list.scrollTop).toBe(640);
    expect(document.activeElement).toBe(chip);
  });

  it('"Read more" fills the sheet with the full page; Back returns to the sheet', async () => {
    mount(<ProductSheet product={product} onClose={() => {}} matchState={{ kind: 'none' }} renderFull={(p, back) => <div><h1>Full page for {p.name}</h1><button type="button" onClick={back}>Back to sheet</button></div>} />);
    await flush();
    act(() => document.querySelector('.ay-psheet__more').click());
    expect(document.body.textContent).toContain(`Full page for ${product.name}`);
    act(() => btn('Back to sheet').click());
    expect(document.querySelector('.ay-psheet__more')).toBeTruthy();
  });
});

const MATCH_CARDS = [
  { key: 'opening', category: 'frame', kind: 'opening', kicker: 'Your daily rundown', title: 'Your Saturday rundown' },
  { key: `match:${product.id}`, category: 'match', kind: 'match', kicker: 'Matched to you', title: 'A match for your sleep goal', match: { product, percent: 84, why: 'For your trouble sleeping', evidence: 2 } },
  { key: 'community:p1', category: 'community', kind: 'community', kicker: 'New in Community', title: 'New in Sleep', body: 'Anyone else waking at 3am before their period?', communityItem: { id: 'p1' } },
  { key: 'closing', category: 'frame', kind: 'closing', kicker: 'Done', title: 'That is your rundown.', followUps: [{ question: 'Why was my sleep flagged?', cardKey: 'x' }] },
];

describe('Rundown product card and the sheet over the story', () => {
  it('one tap Buy, Save, Add to my routine; tapping the product opens the sheet and the story waits on that card', () => {
    vi.useFakeTimers();
    reduce(false);
    const ctx = { open: vi.fn(), isOpen: false, isSaved: () => false, toggleSaved: vi.fn(), inRoutine: () => false, addToRoutine: vi.fn(), matchStateFor: () => ({ kind: 'none' }) };
    const onClose = vi.fn();
    const ui = (value) => <ProductSheetContext.Provider value={value}><RundownStory cards={MATCH_CARDS} onClose={onClose} /></ProductSheetContext.Provider>;
    mount(ui(ctx));
    act(() => btn('Next card').click());
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 2 of 4');
    const story = document.querySelector('.ay-rd');
    expect(btn(`Save ${product.name}`, story)).toBeTruthy();
    expect(btn('Add to my routine', story)).toBeTruthy();
    act(() => btn('Add to my routine', story).click());
    expect(ctx.addToRoutine).toHaveBeenCalledWith(product);
    act(() => btn(`Save ${product.name}`, story).click());
    expect(ctx.toggleSaved).toHaveBeenCalledWith(product);
    act(() => story.querySelector('.ay-rd-product__open').click());
    expect(ctx.open).toHaveBeenCalledWith(product);
    // The sheet is up: no auto-advance, Escape and arrows are the sheet's.
    act(() => root.render(ui({ ...ctx, isOpen: true })));
    act(() => { vi.advanceTimersByTime(20000); });
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).not.toHaveBeenCalled();
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 2 of 4');
    // Closed: still the same card.
    act(() => root.render(ui({ ...ctx, isOpen: false })));
    expect(document.querySelector('[aria-live]').textContent).toContain('Card 2 of 4');
  });

  it('a held product never shows a % on its Rundown card', () => {
    const ctx = { open: vi.fn(), isOpen: false, isSaved: () => true, toggleSaved: vi.fn(), inRoutine: () => false, addToRoutine: vi.fn(), matchStateFor: () => ({ kind: 'held', label: SAFETY_HOLD, missing: ['whether you are pregnant (your life stage)'] }) };
    const cards = [MATCH_CARDS[0], { key: `saved:${product.id}`, category: 'saved', kind: 'saved', kicker: 'You saved this', title: 'Still thinking about this?', product }, MATCH_CARDS[3]];
    mount(<ProductSheetContext.Provider value={ctx}><RundownStory cards={cards} onClose={() => {}} /></ProductSheetContext.Provider>);
    act(() => btn('Next card').click());
    const card = document.querySelector('.ay-rd-card');
    expect(card.textContent).toContain('Safety hold · Match unavailable');
    expect(card.textContent).not.toMatch(/\d+% match/);
  });

  it('"New in Community" card opens the real post', () => {
    const onOpenPost = vi.fn();
    mount(<RundownStory cards={MATCH_CARDS} onClose={() => {}} onOpenPost={onOpenPost} />);
    act(() => btn('Next card').click());
    act(() => btn('Next card').click());
    act(() => btn('Read the post').click());
    expect(onOpenPost).toHaveBeenCalledWith('p1');
  });
});

describe('New in Community: real public posts only', () => {
  const now = Date.parse('2026-10-24T12:00:00Z');
  it('keeps recent public posts for her topics, followed people first; never her own, private groups or old posts', () => {
    const rows = [
      { id: 'a', body: 'Heat or ibuprofen first for cramps?', created_at: '2026-10-23T10:00:00Z', topics: ['cramps'], author_id: 'u1' },
      { id: 'b', body: 'My own post about sleep and PMS', created_at: '2026-10-23T11:00:00Z', is_mine: true },
      { id: 'c', body: 'In a private group about periods', created_at: '2026-10-23T11:00:00Z', topic_id: 'g1' },
      { id: 'd', body: 'A post from last month about cramps', created_at: '2026-09-20T11:00:00Z' },
      { id: 'e', body: 'Someone she follows on sleep after 40', created_at: '2026-10-22T11:00:00Z', author_id: 'f1', topics: ['sleep'] },
    ];
    const out = pickRundownPosts(rows, { followedAuthorIds: ['f1'], now });
    expect(out.map((p) => p.id)).toEqual(['e', 'a']);
    expect(out[1]).toMatchObject({ topic: 'Cramps', isNew: true });
    expect(pickRundownPosts([], { now })).toEqual([]);
  });
  it('the Rundown makes the card only from posts handed in, and never repeats one', () => {
    const TODAY = '2026-10-24';
    const base = { today: TODAY, decision: { items: [] }, log: {}, hasProfile: true };
    const withPost = buildRundown({ ...base, community: [{ id: 'a', title: 'Heat or ibuprofen first?', topic: 'Cramps', isNew: true }] });
    expect(withPost.cards.find((c) => c.kind === 'community')).toMatchObject({ kicker: 'New in Community', title: 'New in Cramps' });
    expect(buildRundown(base).cards.some((c) => c.kind === 'community')).toBe(false);
    const seen = buildRundown({ ...base, community: [{ id: 'a', title: 'Heat or ibuprofen first?', isNew: true }], memory: { shown: { 'community:a': [addDays(TODAY, -2)] } } });
    expect(seen.cards.some((c) => c.kind === 'community')).toBe(false);
  });
});

describe('Rundown to chat hand-off', () => {
  const today = todayKey();
  const sleepRows = [...Array.from({ length: 10 }, (_, i) => ({ metric: 'sleep_minutes', day: addDays(today, -(i + 1)), value: 420 })), { metric: 'sleep_minutes', day: today, value: 330 }];
  const t = { today, decision: { items: [] }, patterns: [], log: {}, tries: [], healthRows: sleepRows, saveLog: () => {}, recordOutcome: () => {} };

  it('closing the daily rundown lands in the chat with questions about the cards she saw', () => {
    const onFinish = vi.fn();
    mount(<Rundown t={t} onFinish={onFinish} onAsk={() => {}} />);
    act(() => btn('Start rundown').click());
    act(() => btn('Close rundown').click());
    expect(onFinish).toHaveBeenCalledTimes(1);
    const { starters, toChat } = onFinish.mock.calls[0][0];
    expect(toChat).toBe(true);
    expect(starters.map((s) => s.question)).toContain('Why was my sleep flagged?');
    expect(starters[0].usesHealth).toBe(true);
    expect(typeof starters[0].buildContext).toBe('function');
  });

  it('leaving for something else carries the starters over without switching to the chat', () => {
    const onFinish = vi.fn(); const onAsk = vi.fn();
    mount(<Rundown t={t} onFinish={onFinish} onAsk={onAsk} />);
    act(() => btn('Start rundown').click());
    act(() => btn('Next card').click());
    act(() => btn('Ask ayna about this').click());
    expect(onFinish.mock.calls[0][0].toChat).toBe(false);
    expect(onAsk).toHaveBeenCalled();
  });

  it('the chat home shows them as "From your Daily Rundown today"; a tap asks it', async () => {
    const onStarter = vi.fn();
    const starters = [{ question: 'Why was my sleep flagged?', context: '', usesHealth: true, buildContext: () => '' }];
    mount(<AskAynaModal open asTab renderHomeTop={(leading) => <HomeSwitch view="chat" leading={leading} />} starters={starters} onStarter={onStarter} />);
    await flush();
    expect(document.body.textContent).toContain('From your Daily Rundown today');
    act(() => btn('Why was my sleep flagged?').click());
    expect(onStarter).toHaveBeenCalledWith(starters[0]);
    // The switch sits in place of the title.
    expect([...document.querySelectorAll('[role="tab"]')].map((x) => x.textContent)).toEqual(['Chat', 'Products', 'My dashboard']);
  });
});
