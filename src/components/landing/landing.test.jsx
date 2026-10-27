// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import SlideToStart from '../ui/SlideToStart.jsx';
import AppLanding from './AppLanding.jsx';
import WebLanding from './WebLanding.jsx';
import { RAIN_COLS } from './rainData.js';

vi.mock('../search/SmartSearchInput.jsx', () => ({ default: (props) => <input aria-label="Search" value={props.value} onChange={props.onChange} /> }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };

describe('Slide to start (founder, Oct 27 01:10)', () => {
  it('is one real button with a clear name and a visible tap hint', () => {
    const html = renderToStaticMarkup(<SlideToStart onComplete={() => {}} />);
    expect(html).toMatch(/<button type="button" class="ay-sts__track[^"]*" aria-label="Get my matches. Slide or tap to start."/);
    expect(html).toContain('or tap to start');
  });

  it('starts on a tap or click (and so on Enter and Space, which click a button)', () => {
    vi.useFakeTimers();
    const go = vi.fn();
    mount(<SlideToStart onComplete={go} />);
    act(() => { host.querySelector('.ay-sts__track').click(); });
    act(() => { vi.runAllTimers(); });
    expect(go).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

const text =(html) => html.replace(/<[^>]+>/g, ' ');

describe('the app landing: one screen (founder, Oct 27 10:40)', () => {
  it('signed out: the main action is Get my matches; signed in with a profile: Go to your Home', () => {
    const out = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} />);
    expect(out).toContain('aria-label="Get my matches. Slide or tap to start."');
    expect(out).toContain('Find what fits');
    const home = renderToStaticMarkup(<AppLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(home).toContain('aria-label="Go to your Home. Slide or tap to start."');
  });

  it('is only the hero: rain, headline, search, Slide to start (the welcome tip anchor) and the medical note', () => {
    const html = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} onSignIn={() => {}} onBrowse={() => {}} />);
    expect(html).toContain('data-tour="landing-start"');
    expect(html).toContain('class="lsx-search');
    expect(html).toMatch(/class="lk-rain alx__rain" aria-hidden="true"/);
    expect(text(html)).toContain('In an emergency, call 911.');
    expect(text(html)).toContain('Explore first');
    // Nothing below the first screen: no feature sections, no Pro, no founders.
    expect(html).not.toMatch(/<h2/);
    expect(html).not.toContain('ayna Pro');
    expect(html).not.toContain('—');
  });
});

describe('the raining cut-outs', () => {
  it('every widget that looks like health data says Sample; products are bare cut-outs (no card, no plate)', () => {
    const html = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} />);
    expect((html.match(/>Sample</g) || []).length).toBeGreaterThan(8);
    expect(html).toMatch(/<span class="lk-d lk-prod is-[lms]"><span class="lk-prod__in"><img src="\/products\/catalog\/p-[a-z0-9-]+\.webp" alt=""/);
    expect(html).not.toMatch(/ayk-plate|lsx-t /);
  });

  it('uses only packshots that are in the repo', async () => {
    const { existsSync } = await import('node:fs');
    const ids = RAIN_COLS.flat().filter((t) => t.k === 'p').map((t) => t.id);
    expect(ids.length).toBeGreaterThan(10);
    ids.forEach((id) => expect(existsSync(`public/products/catalog/${id}.webp`), id).toBe(true));
  });
});

describe('the website landing: the v2 home, optimized for desktop', () => {
  it('hero: the Shout, search, Slide to start (welcome tip anchor) and the rain beside it', () => {
    const html = renderToStaticMarkup(<WebLanding onStartQuiz={() => {}} onViewHowItWorks={() => {}} />);
    expect(html).toContain('aria-label="Get my matches. Slide or tap to start."');
    expect(html).toContain('data-tour="landing-start"');
    expect(html).toContain('class="lsx-search wl-search"');
    expect(html).toMatch(/class="lk-rain wl-rain" aria-hidden="true"/);
    expect(text(html)).toContain('How we match');
    const home = renderToStaticMarkup(<WebLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(home).toContain('aria-label="Go to your Home. Slide or tap to start."');
  });

  it('keeps the website sections, the Pro teaser with Learn more to /pro, the founders and the medical note last', () => {
    vi.useFakeTimers();
    mount(<WebLanding onStartQuiz={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
    const page = host.textContent;
    expect(page).toContain('Brands we work with');
    expect(page).toContain('Does this sound familiar?');
    expect(page).toContain('How ayna fits it to you');
    expect(page).toContain('Quick reads about your body, with sources');
    expect(page).toContain('More of ayna, when you want it.');
    expect(host.querySelector('a[href="/pro"]').textContent).toContain('Learn more');
    expect(page).toContain('Built by three women who wanted better answers.');
    const last = host.querySelector('#ay-landing').lastElementChild;
    expect(last.textContent).toContain('In an emergency, call 911.');
    expect(host.innerHTML).not.toContain('—');
  });
});
