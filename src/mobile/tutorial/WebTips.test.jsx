// @vitest-environment jsdom
// Tips on the website (surface="web"): same overlay, same store and key as the app.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorialLayer from './TutorialLayer.jsx';
import TipsSettings from './TipsSettings.jsx';
import { WEB_SCREENS, screenById, tipsToShow, tourDecision } from './tips.js';
import { placeBubble } from './tourDom.js';
import { readTour, setTipsEnabled, markScreenSeen, TOUR_KEY } from './tourStore.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let host;
let page;

// jsdom has no layout: every element gets a box, or the one in its data-rect.
function fakeLayout() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    const own = this.dataset?.rect ? JSON.parse(this.dataset.rect) : null;
    const r = own || { left: 40, top: 200, width: 500, height: 60 };
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top };
  });
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{}]);
}

const NAV = `<div class="app-nav-wrap" data-rect='{"left":0,"top":0,"width":1024,"height":68}'><nav class="ay-nav">nav</nav></div>`;
const TODAY = `<div data-tour="today"><div data-tour="rundown-card">Rundown</div><ul data-tour="today-things"><li>Check in</li><li>Answer</li></ul></div>`;
const EXPLORE = `<div data-tour="explore"><form data-tour="explore-search"><input aria-label="Search" /></form><div data-tour="explore-sections">x</div></div>`;

function mountWeb({ view = 'today', html, ready = true }) {
  page = document.createElement('div');
  page.className = 'app-container';
  page.dataset.view = view;
  page.dataset.theme = 'light';
  page.innerHTML = NAV + html;
  document.body.appendChild(page);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<TutorialLayer surface="web" userId={null} ready={ready} />));
}
function swap(view, html) {
  page.dataset.view = view;
  page.innerHTML = NAV + html;
}
const wait = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const dialog = () => document.querySelector('.ay-tour [role="dialog"]');
const click = (text) => act(() => { [...document.querySelectorAll('.ay-tour button')].find((b) => b.textContent === text).click(); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 25, 7, 0)); // before 8: no Rundown highlight check to wait for
  localStorage.clear();
  fakeLayout();
});
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  page?.remove();
  document.querySelectorAll('.ay-tour').forEach((n) => n.remove());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('website first visit', () => {
  it('welcome on Today after setup, then Today’s tips, then each screen once', () => {
    mountWeb({ html: TODAY });
    wait(1000);
    expect(dialog()?.textContent).toContain('Want a quick tour?');
    expect(document.querySelector('.ay-tour').classList.contains('is-web')).toBe(true);
    click('Show me tips');
    wait(1000);
    expect(dialog().textContent).toContain('Daily Rundown');
    expect(dialog().textContent).toContain('Turn tips off any time in Settings.');
    expect(dialog().textContent).toContain('Turn off tips');
    // No rings without health data: the Rundown is Home's one tip, then Home's next part.
    expect(document.querySelector('.ay-tour__count')).toBeNull();
    click('Got it');
    expect(readTour().seen.today).toBeTruthy();
    wait(1500);
    expect(dialog().textContent).toContain('A few things for today');
    expect(dialog().textContent).not.toContain('Turn tips off any time');
    expect(dialog().textContent).toContain('Turn off tips');
    click('Got it');
    expect(readTour().seen['today-more']).toBeTruthy();
    wait(1500);
    // The top bar part: the Saved heart (the fixture's nav has none, so nothing more).
    expect(dialog()).toBeNull();

    swap('explore', EXPLORE);
    wait(1000);
    expect(dialog().textContent).toContain('Search products');
    expect(dialog().textContent).not.toContain('Turn tips off any time'); // only on the very first tip
    expect(dialog().textContent).toContain('Turn off tips');
    click('Next');
    click('Got it');
    expect(readTour().seen.explore).toBeTruthy();
    swap('explore', EXPLORE);
    wait(2000);
    expect(dialog()).toBeNull();
  });

  it('nothing before setup is done, and never on setup screens', () => {
    mountWeb({ html: TODAY, ready: false });
    wait(3000);
    expect(dialog()).toBeNull();
    act(() => root.render(<TutorialLayer surface="web" userId={null} ready />));
    swap('quiz', TODAY);
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('no welcome outside Today, and never over the Daily Rundown story', () => {
    mountWeb({ view: 'explore', html: EXPLORE });
    wait(2000);
    expect(dialog()).toBeNull();
    swap('today', `${TODAY}<div class="ay-rd" role="dialog" aria-modal="true"></div>`);
    wait(2000);
    expect(dialog()).toBeNull();
    page.querySelector('.ay-rd').remove();
    wait(1000);
    expect(dialog()?.textContent).toContain('Want a quick tour?');
  });

  it('Escape closes, focus stays in the tip, and Tab wraps', () => {
    setTipsEnabled(true);
    mountWeb({ view: 'explore', html: EXPLORE });
    wait(1000);
    wait(40);
    const buttons = [...dialog().querySelectorAll('button')];
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })); });
    expect(document.activeElement).toBe(buttons[0]);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(dialog()).toBeNull();
    expect(readTour().seen.explore).toBeTruthy();
  });

  it('a tap outside closes the tip', () => {
    setTipsEnabled(true);
    mountWeb({ view: 'explore', html: EXPLORE });
    wait(1000);
    act(() => { page.querySelector('.ay-nav').dispatchEvent(new Event('pointerdown', { bubbles: true })); });
    expect(dialog()).toBeNull();
  });

  it('waits while the floating Ask panel is open', () => {
    setTipsEnabled(true);
    mountWeb({ view: 'explore', html: `${EXPLORE}<section class="ayna-ask-panel">chat</section>` });
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('a safety item first in today’s things is never a tip’s anchor', () => {
    setTipsEnabled(true);
    mountWeb({ html: '<div data-tour="today"><div data-tour="rundown-card">Rundown</div><ul data-tour="today-things"><li class="ay-today__item is-safety">Get checked</li></ul></div>' });
    wait(1000);
    expect(dialog().textContent).toContain('Daily Rundown');
    expect(document.querySelector('.ay-tour__count')).toBeNull();
  });

  it('an anchor under the top nav is skipped', () => {
    setTipsEnabled(true);
    mountWeb({ view: 'explore', html: `<div data-tour="explore"><form data-tour="explore-search" data-rect='{"left":40,"top":20,"width":500,"height":40}'><input /></form><div data-tour="explore-sections">x</div></div>` });
    wait(1000);
    expect(dialog().textContent).toContain('Tap a group to shop by need');
    expect(document.querySelector('.ay-tour__count')).toBeNull();
  });
});

describe('website opt-out', () => {
  it('No thanks: nothing shows on any screen', () => {
    mountWeb({ html: TODAY });
    wait(1000);
    click('No thanks');
    expect(readTour().enabled).toBe(false);
    wait(2000);
    expect(dialog()).toBeNull();
    swap('explore', EXPLORE);
    wait(2000);
    expect(dialog()).toBeNull();
  });

  it('Turn off tips on a tip turns them off everywhere', () => {
    setTipsEnabled(true);
    mountWeb({ view: 'explore', html: EXPLORE });
    wait(1000);
    click('Turn off tips');
    expect(readTour().enabled).toBe(false);
    swap('community', '<div data-tour="community"><div data-tour="community-tabs">tabs</div></div>');
    wait(2000);
    expect(dialog()).toBeNull();
  });

  it('seen state is shared with the app: same key, same screen ids', () => {
    setTipsEnabled(true);
    markScreenSeen('explore'); // seen in the app
    expect(localStorage.getItem(TOUR_KEY)).toBeTruthy();
    mountWeb({ view: 'explore', html: EXPLORE });
    wait(2000);
    expect(dialog()).toBeNull();
  });
});

describe('website Settings and replay', () => {
  it('Show tips switch and Replay the tour, then tips run again', () => {
    setTipsEnabled(false);
    markScreenSeen('explore');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(<TipsSettings variant="web" />));
    const sw = () => host.querySelector('[role="switch"]');
    expect(host.textContent).toContain('Show tips');
    expect(sw().getAttribute('aria-checked')).toBe('false');
    expect(sw().className).toBe('wy-switch');
    act(() => sw().click());
    expect(readTour().enabled).toBe(true);
    expect(sw().getAttribute('aria-checked')).toBe('true');
    act(() => sw().click());
    expect(readTour().enabled).toBe(false);
    act(() => host.querySelector('.ay-tips-set__replay').click());
    expect(readTour()).toMatchObject({ enabled: true, seen: {}, offNoteShown: false });
    expect(host.querySelector('[role="status"]').textContent).toContain('Tips are back');
    act(() => root.unmount());
    host.remove();

    mountWeb({ view: 'explore', html: EXPLORE });
    wait(1000);
    expect(dialog().textContent).toContain('Search products');
    expect(dialog().textContent).toContain('Turn tips off any time in Settings.');
  });
});

describe('website registry and placement', () => {
  it('Today offers the welcome; other screens never do', () => {
    const fresh = { enabled: null, seen: {}, welcomeDay: null, offNoteShown: false };
    expect(tourDecision({ screen: screenById('today', 'web'), prefs: fresh, today: '2026-10-25' }).kind).toBe('welcome');
    for (const s of WEB_SCREENS.filter((x) => x.id !== 'today')) expect(tourDecision({ screen: s, prefs: fresh, today: '2026-10-25' }).kind).toBe('none');
  });
  it('covers the six screens, at most 2 tips each, one short sentence', () => {
    // The page screens, plus parts (within) for long pages and the top bar.
    expect(WEB_SCREENS.filter((s) => !s.within).map((s) => s.id).sort()).toEqual(['ask', 'community', 'compare', 'explore', 'library', 'metric-sheet', 'product-page', 'services', 'today', 'you']);
    for (const s of WEB_SCREENS) {
      expect(tipsToShow(s, () => true).length).toBeLessThanOrEqual(2);
      for (const t of s.tips) {
        expect(t.text).not.toMatch(/[—–]/);
        expect(t.text).not.toMatch(/chatbot|agent|marketplace/i);
        expect(t.text.split(/\s+/).length).toBeLessThanOrEqual(12);
        expect(t.text.match(/[.!?]/g)).toHaveLength(1);
      }
    }
  });
  it('desktop: beside the anchor, never under the top nav', () => {
    const anchor = { left: 64, top: 166, width: 720, height: 52, right: 784, bottom: 218 };
    const p = placeBubble(anchor, { w: 320, h: 150 }, { vw: 1280, vh: 900, topInset: 69, beside: true });
    expect(p.side).toBe('right');
    expect(p.left).toBeGreaterThanOrEqual(anchor.right);
    expect(p.top).toBeGreaterThanOrEqual(69 + 8);
    // No room on the right: the left side, still clear of the nav.
    const wide = { left: 400, top: 80, width: 860, height: 40, right: 1260, bottom: 120 };
    const q = placeBubble(wide, { w: 320, h: 150 }, { vw: 1280, vh: 900, topInset: 69, beside: true });
    expect(q.side).toBe('left');
    expect(q.top).toBeGreaterThanOrEqual(77);
  });
  it('phone: below or above, like the app, and never over the Ask input', () => {
    const anchor = { left: 16, top: 300, width: 358, height: 60, right: 374, bottom: 360 };
    expect(placeBubble(anchor, { w: 320, h: 150 }, { vw: 390, vh: 844, topInset: 60 }).side).toBe('below');
    const input = { left: 0, top: 372, right: 390, bottom: 560 };
    const p = placeBubble(anchor, { w: 320, h: 150 }, { vw: 390, vh: 844, topInset: 60, avoid: [input] });
    expect(p.side).toBe('above');
    expect(p.top + 150).toBeLessThanOrEqual(input.top);
  });
});
