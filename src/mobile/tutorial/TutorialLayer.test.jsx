// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorialLayer from './TutorialLayer.jsx';
import TipsSettings from './TipsSettings.jsx';
import { readTour, setTipsEnabled, markScreenSeen, TOUR_KEY } from './tourStore.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let host;
let app;

// jsdom has no layout: give every element a visible box unless it says otherwise.
function fakeLayout() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    if (this.dataset?.offscreen) return { left: 0, top: 2000, right: 100, bottom: 2040, width: 100, height: 40, x: 0, y: 2000 };
    return { left: 20, top: 100, right: 370, bottom: 150, width: 350, height: 50, x: 20, y: 100 };
  });
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{}]);
}

function mountApp({ screen = 'ayna', html }) {
  app = document.createElement('div');
  app.className = 'ayna-mobile';
  app.dataset.screen = screen;
  app.dataset.theme = 'light';
  app.innerHTML = html;
  document.body.appendChild(app);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<TutorialLayer userId={null} />));
}
const HOME = '<div data-tour="home"><section data-tour="score-rings">Rings</section><button data-tour="rundown-bubble">Rundown</button><div data-tour="rundown-card">Rundown</div><nav data-tour="home-links">Links</nav></div>';
const wait = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const dialog = () => document.querySelector('.ay-tour [role="dialog"]');
const click = (text) => act(() => { [...document.querySelectorAll('.ay-tour button')].find((b) => b.textContent === text).click(); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 25, 7, 0)); // before 8: the Rundown won't open on its own
  localStorage.clear();
  localStorage.setItem('ayna_tour_one_page_v1', '1'); // past the one-time move to the one-page tour
  localStorage.setItem('ayna_tour_sheet_once_nov11', '1'); // past the Nov 11 once-for-everyone tour
  fakeLayout();
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  app?.remove();
  document.querySelectorAll('.ay-tour').forEach((n) => n.remove());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('tips overlay', () => {
  it('app: the tour opens on her first Home by itself, Rundown card or not (founder, Nov 10)', () => {
    mountApp({ html: '<div data-tour="home"><section data-tour="score-rings">Rings</section><div class="ay-rd-hero__card" data-tour="rundown-card">Rundown</div><nav data-tour="home-links">Links</nav></div>' });
    wait(1000);
    expect(document.querySelector('.ay-tour__all')?.textContent).toContain('How ayna works');
  });

  it('Nov 11: an existing account with tips off still gets the tour once on Home after the update', () => {
    localStorage.removeItem('ayna_tour_sheet_once_nov11');
    setTipsEnabled(false);
    mountApp({ html: HOME });
    wait(1000);
    expect(document.querySelector('.ay-tour__all')).toBeTruthy();
    act(() => [...document.querySelector('.ay-tour__all').querySelectorAll('button')].find((x) => x.textContent === 'Got it').click());
    wait(3000);
    expect(document.querySelector('.ay-tour__all')).toBeNull();
  });

  it('on Home the whole tour opens once on one sheet; closing it ends it, no pop-ups after (Nov 10)', () => {
    mountApp({ html: HOME });
    wait(1000);
    expect(readTour().enabled).toBe(false);
    const sheet = document.querySelector('.ay-tour__all');
    expect(sheet.textContent).toContain('How ayna works');
    expect(sheet.textContent).toContain('Your quiz answers');
    act(() => [...sheet.querySelectorAll('button')].find((x) => x.textContent === 'Got it').click());
    expect(document.querySelector('.ay-tour__all')).toBeNull();
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('a tip that was off screen on the first visit shows once it scrolls into view', () => {
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="explore"><div class="ayna-shop-heading"><input aria-label="Search" /></div><nav data-tour="explore-sections" data-offscreen="1">x</nav></div>' });
    wait(1000);
    expect(dialog().textContent).toContain('Search products');
    click('Got it');
    expect(readTour().seen['tip:explore-search']).toBeTruthy();
    wait(2000);
    expect(dialog()).toBeNull();
    act(() => { delete app.querySelector('[data-tour="explore-sections"]').dataset.offscreen; });
    wait(1500);
    expect(dialog().textContent).toContain('Tap a group to shop by need');
    click('Got it');
    wait(2000);
    expect(dialog()).toBeNull();
  });

  it('a part waits until its root is on the page, then shows once', () => {
    setTipsEnabled(true);
    markScreenSeen('home');
    mountApp({ html: '<div data-tour="home"><section data-tour="score-rings">Rings</section></div>' });
    wait(2000);
    expect(dialog()).toBeNull();
    act(() => { app.querySelector('[data-tour="home"]').insertAdjacentHTML('beforeend', '<div class="ay-tv" data-tour="home-views"><div role="tablist">Your week</div></div>'); });
    wait(1500);
    expect(dialog().textContent).toContain('Switch between Your week');
    click('Got it');
    wait(2000);
    expect(dialog()).toBeNull();
  });

  it('first open, signed out on the landing: the tour sheet, starting with the quiz (founder, Nov 12); once only', () => {
    localStorage.removeItem('ayna_tour_sheet_once_nov11');
    mountApp({ screen: 'landing', html: '<div class="ay-sts" data-tour="landing-start"><button class="ay-sts__track">Take your quiz</button></div>' });
    wait(2000);
    const sheet = document.querySelector('.ay-tour__all');
    expect(sheet?.textContent).toContain('Start with the quiz');
    act(() => document.querySelector('.ay-tour__go').click());
    act(() => root.unmount()); root = null; app.remove();
    mountApp({ screen: 'landing', html: '<div class="ay-sts" data-tour="landing-start"><button class="ay-sts__track">Take your quiz</button></div>' });
    wait(3000);
    expect(document.querySelector('.ay-tour__all')).toBeNull();
  });

  it('closing the tour with the X turns tips off and nothing shows again', () => {
    mountApp({ html: HOME });
    wait(1000);
    act(() => document.querySelector('.ay-tour__x').click());
    expect(readTour().enabled).toBe(false);
    wait(3000);
    expect(document.querySelector('.ay-tour__all')).toBeNull();
    expect(dialog()).toBeNull();
  });

  it('never during onboarding', () => {
    mountApp({ screen: 'quiz', html: HOME });
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('never over the Daily Rundown; opens once the story is closed', () => {
    vi.setSystemTime(new Date(2026, 9, 25, 9, 0));
    mountApp({ html: `${HOME}<div class="ay-rd" role="dialog" aria-modal="true"></div>` });
    wait(4000);
    expect(dialog()).toBeNull();
    app.querySelector('.ay-rd').remove();
    wait(1500);
    expect(document.querySelector('.ay-tour__all')?.textContent).toContain('How ayna works');
  });

  it('skips a tip whose anchor is off screen or missing', () => {
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="home"><section data-tour="score-rings" data-offscreen="1">Rings</section><nav data-tour="home-links">Links</nav></div>' });
    wait(1000);
    expect(dialog()).toBeNull(); // Home's own tips get a moment to come on screen first
    wait(4000);
    expect(dialog().textContent).toContain('Your data and Your products');
    expect(document.querySelector('.ay-tour__count')).toBeNull();
  });

  it('Escape closes and counts the screen as seen; Turn off tips turns them off', () => {
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="explore"><div class="ayna-shop-heading"><input aria-label="Search" /></div><nav data-tour="explore-sections">x</nav></div>' });
    wait(1000);
    expect(dialog().textContent).toContain('Search products');
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(dialog()).toBeNull();
    expect(readTour().seen.explore).toBeTruthy();
    act(() => root.unmount()); root = null; app.remove();
    localStorage.removeItem(TOUR_KEY);
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="community"><div data-tour="community-tabs">tabs</div></div>' });
    wait(1000);
    click('Turn off tips');
    expect(readTour().enabled).toBe(false);
  });

  it('a tap outside closes the tip', () => {
    setTipsEnabled(true);
    mountApp({ html: HOME });
    wait(1000);
    act(() => { app.querySelector('[data-tour="home-links"]').dispatchEvent(new Event('pointerdown', { bubbles: true })); });
    expect(dialog()).toBeNull();
  });

  it('a tip never sits on a safety item', () => {
    setTipsEnabled(true);
    markScreenSeen('home');
    mountApp({ html: '<div data-tour="you"><button data-tour="you-beliefs" class="ay-today__item is-safety">x</button></div>' });
    wait(2000);
    expect(dialog()).toBeNull();
  });
});

describe('Settings', () => {
  it('Show tips switch and Replay the tour', () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    setTipsEnabled(false);
    markScreenSeen('home');
    act(() => root.render(<TipsSettings renderSwitch={({ on, onClick, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} />} />));
    const sw = host.querySelector('[role="switch"]');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    act(() => sw.click());
    expect(readTour().enabled).toBe(true);
    expect(host.querySelector('[role="switch"]').getAttribute('aria-checked')).toBe('true');
    act(() => host.querySelector('.ay-tips-set__replay').click());
    expect(document.querySelector('.ay-tour__all').textContent).toContain('How ayna works');
  });
});

describe('one-time move to the one-page tour (Nov 10)', () => {
  it('a phone with page tips on from the old tutorial gets them off once; later choices stick', () => {
    localStorage.removeItem('ayna_tour_one_page_v1');
    setTipsEnabled(true);
    mountApp({ html: HOME });
    expect(readTour().enabled).toBe(false);
    setTipsEnabled(true);
    act(() => root.unmount()); root = null; app.remove();
    mountApp({ html: HOME });
    expect(readTour().enabled).toBe(true);
  });
});
