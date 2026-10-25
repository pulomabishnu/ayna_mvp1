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
const HOME = '<div data-tour="home"><button data-tour="home-ask">Ask ayna</button><div data-tour="rundown-card">Rundown</div><nav data-tour="home-links">Links</nav></div>';
const wait = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const dialog = () => document.querySelector('.ay-tour [role="dialog"]');
const click = (text) => act(() => { [...document.querySelectorAll('.ay-tour button')].find((b) => b.textContent === text).click(); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 25, 7, 0)); // before 8: the Rundown won't open on its own
  localStorage.clear();
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
  it('offers the welcome on Home, then runs Home’s tips with the off note first', () => {
    mountApp({ html: HOME });
    wait(1000);
    expect(dialog()?.textContent).toContain('Want a quick tour?');
    click('Show me tips');
    expect(readTour().enabled).toBe(true);
    wait(1000);
    expect(dialog().textContent).toContain('Ask about your health');
    expect(dialog().textContent).toContain('Turn tips off any time in Settings.');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(document.querySelectorAll('.ay-tour__dots i')).toHaveLength(2);
    click('Next');
    expect(dialog().textContent).toContain('Daily Rundown');
    expect(dialog().textContent).not.toContain('Turn tips off any time');
    click('Got it');
    expect(dialog()).toBeNull();
    expect(readTour().seen.home).toBeTruthy();
    wait(2000);
    expect(dialog()).toBeNull(); // first visit only
  });

  it('No thanks turns tips off and nothing shows again', () => {
    mountApp({ html: HOME });
    wait(1000);
    click('No thanks');
    expect(readTour().enabled).toBe(false);
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('never during onboarding', () => {
    mountApp({ screen: 'quiz', html: HOME });
    wait(3000);
    expect(dialog()).toBeNull();
  });

  it('never over the Daily Rundown, and waits for its auto-launch check after 8', () => {
    vi.setSystemTime(new Date(2026, 9, 25, 9, 0));
    mountApp({ html: `${HOME}<div class="ay-rd" role="dialog" aria-modal="true"></div>` });
    wait(4000);
    expect(dialog()).toBeNull();
    app.querySelector('.ay-rd').remove();
    wait(600);
    expect(dialog()).toBeNull(); // still waiting out the Rundown's own check
    wait(2500);
    expect(dialog()?.textContent).toContain('Want a quick tour?');
  });

  it('skips a tip whose anchor is off screen or missing', () => {
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="home"><button data-tour="home-ask" data-offscreen="1">Ask</button><nav data-tour="home-links">Links</nav></div>' });
    wait(1000);
    expect(dialog().textContent).toContain('My dashboard');
    expect(document.querySelectorAll('.ay-tour__dots i')).toHaveLength(0);
  });

  it('Escape closes and counts the screen as seen; Turn off tips turns them off', () => {
    setTipsEnabled(true);
    mountApp({ html: '<div data-tour="explore"><div class="ax-top"><input aria-label="Search" /></div><nav data-tour="explore-sections">x</nav></div>' });
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
    expect(readTour()).toMatchObject({ enabled: true, seen: {} });
    expect(host.textContent).toContain('Tips are back');
  });
});
