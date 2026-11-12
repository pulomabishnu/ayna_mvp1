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

describe('The start button (was Slide to start)', () => {
  it('is one plain button that says what it does (focus group, Nov 9: no slider)', () => {
    const html = renderToStaticMarkup(<SlideToStart onComplete={() => {}} />);
    expect(html).toMatch(/<button type="button" class="ay-sts__track">/);
    expect(text(html)).toContain('Take your quiz');
    expect(html).not.toContain('ay-sts__thumb');
    expect(html).not.toContain('Slide');
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
    expect(text(out)).toContain('Take the 1-minute quiz');
    expect(out).toContain('matched to you'); // Nov 4: same promise as the website
    // A quiz already started: the one button finishes it, with a small line (no second box).
    const draft = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} quizDraft={{ index: 3, total: 7 }} onResumeQuiz={() => {}} onStartQuizOver={() => {}} />);
    expect(text(draft)).toContain('Finish your free quiz');
    expect(text(draft)).toContain('Question 3 of 7, saved.');
    expect(draft).not.toContain('Continue my quiz');
    // Still on question 1: nothing to finish, the normal button.
    expect(text(renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} quizDraft={{ index: 1, total: 7 }} onResumeQuiz={() => {}} />))).toContain('Take the 1-minute quiz');
    const home = renderToStaticMarkup(<AppLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(text(home)).toContain('Go to your Home');
  });

  it('is only the hero: rain, headline, search, Slide to start (the welcome tip anchor) and the medical note', () => {
    const html = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} onSignIn={() => {}} onBrowse={() => {}} />);
    expect(html).toContain('data-tour="landing-start"');
    expect(html).not.toContain('lsx-search'); // no search on the app landing (founder, Nov 9)
    expect(html).toMatch(/class="lk-rainbox lk-rainbox--ink alx__rain" aria-hidden="true"/);
    // The brown and pink brand bar is on the website only (founder, Oct 27 12:08).
    expect(html).not.toMatch(/class="lk-bar[ "]/);
    // "your body." is pink text, nothing boxed behind it.
    expect(html).not.toContain('<mark');
    expect(text(html)).toContain('In an emergency, call 911.');
    expect(text(html)).toContain('Explore first');
    // Nothing below the first screen: no feature sections, no Pro, no founders.
    expect(html).not.toMatch(/<h2/);
    expect(html).not.toContain('ayna Pro');
    expect(html).not.toContain('—');
  });
});

describe('the raining cut-outs (a faded layer behind the hero)', () => {
  it('products and the app features taking turns, one-word labels, no numbers or labels that read as data; products are bare cut-outs', () => {
    const html = renderToStaticMarkup(<AppLanding onStartQuiz={() => {}} />);
    const rain = html.slice(html.indexOf('lk-rainbox'), html.indexOf('class="alx__head"'));
    expect(rain.length).toBeGreaterThan(100);
    const words = rain.replace(/<[^>]*>/g, ' ').replace(/^[^>]*>/, '').replace(/<[^>]*$/, '').split(/\s+/).filter(Boolean);
    // Words only (each feature's one-word label), never a number that could read as her data.
    expect(words.join(' ')).not.toMatch(/\d/);
    // Nov 6 (founder: bring back the graphs): a trend line and the "Why it fits" bars join them.
    expect(new Set(words)).toEqual(new Set(['Cycle', 'Ask', 'ayna', 'Sleep', 'Match', 'Trends', 'Why', 'it', 'fits']));
    expect((rain.match(/<img /g) || []).length).toBeLessThanOrEqual(3 * 3 * 6); // 3 columns, 3 products each, 6 copies
    expect(new Set(RAIN_COLS.flat().filter((t) => t.k !== 'p').map((t) => t.k))).toEqual(new Set(['ring', 'sleep', 'streak', 'match', 'ask', 'month', 'spark', 'fit']));
    // products and the app's features take turns down every column
    RAIN_COLS.forEach((col) => col.forEach((t, i) => i && expect((t.k === 'p') !== (col[i - 1].k === 'p')).toBe(true)));
    expect(html).toMatch(/<span class="lk-d lk-prod is-[lms]"><span class="lk-prod__in"><img src="\/products\/catalog\/p-[a-z0-9-]+\.webp" alt=""/);
    expect(html).not.toMatch(/ayk-plate|lsx-t /);
  });

  it('uses only packshots that are in the repo', async () => {
    const { existsSync } = await import('node:fs');
    const ids = RAIN_COLS.flat().filter((t) => t.k === 'p').map((t) => t.id);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    ids.forEach((id) => expect(existsSync(`public/products/catalog/${id}.webp`), id).toBe(true));
  });
});

describe('the website landing: the v2 home, optimized for desktop', () => {
  it('keeps the animated phone walkthrough under the hero for guests and signed-in members', () => {
    const guest = renderToStaticMarkup(<WebLanding onStartQuiz={() => {}} />);
    const member = renderToStaticMarkup(<WebLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    for (const html of [guest, member]) {
      expect(html).toContain('id="ay-demo"');
      // Server rendering uses reduced motion: the phone should still be present, just not animated.
      expect(html).toContain('class="hd-phone"');
      expect(html).toContain('How ayna works');
      expect(html).toContain('Take the quiz');
      expect(html).toContain('Get matched');
      expect(html).toContain('Shop what fits');
      expect(html.indexOf('id="ay-demo"')).toBeGreaterThan(html.indexOf('class="lk-bar"'));
      expect(html.indexOf('id="ay-demo"')).toBeLessThan(html.indexOf('class="lb"'));
    }
    expect(member).toContain('Go to your Home');
  });

  it('hero: a centred title, search, Slide to start (welcome tip anchor) and the rain beside it', () => {
    const html = renderToStaticMarkup(<WebLanding onStartQuiz={() => {}} onViewHowItWorks={() => {}} />);
    expect(text(html)).toContain('Sign up free');
    expect(html).toContain('data-tour="landing-start"');
    expect(html).toContain('class="lsx-search wl-search"');
    expect(html).toMatch(/class="lk-rainbox lk-rainbox--ink wl-rain" aria-hidden="true"/);
    // How we match is in the walkthrough, not under the hero search.
    expect(html).not.toContain('wl-how');
    expect(html).toContain('class="hd-more"');
    // The website keeps the brown and pink bar, with its pause button; no box behind "your body.".
    expect(html).toContain('class="lk-bar"');
    expect(html).toContain('aria-label="Pause motion"');
    expect(html).not.toContain('<mark');
    const home = renderToStaticMarkup(<WebLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(text(home)).toContain('Go to your Home');
  });

  it('keeps the website sections, the Pro teaser with Learn more to /pro, the founders and the medical note last', () => {
    vi.useFakeTimers();
    mount(<WebLanding onStartQuiz={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
    const page = host.textContent;
    expect(page).toContain('Brands we work with');
    // Nov 4 (founder: "it's just boxes"): the feature bento is gone; the walkthrough says it.
    expect(page).not.toContain('What you can do on ayna');
    expect(page).toContain('What’s behind every match');
    expect(page).toContain('Quick reads, with sources');
    expect(page).toContain('More of ayna, when you want it.');
    expect(host.querySelector('a[href="/pro"]').textContent).toContain('See what Pro includes');
    expect(page).toContain('Built by three women who wanted better answers.');
    const last = host.querySelector('#ay-landing').lastElementChild;
    expect(last.textContent).toContain('In an emergency, call 911.');
    expect(host.innerHTML).not.toContain('—');
  });

  it('below the hero (founder, Oct 29): one butter page of soft tiles, one espresso close with Pro and a last Slide to start', () => {
    vi.useFakeTimers();
    mount(<WebLanding onStartQuiz={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
    const page = host.querySelector('#ay-landing');
    // Nov 4: no feature bento any more (founder: "it's just boxes").
    expect(page.querySelectorAll('.lb-bento').length).toBe(0);
    expect(page.querySelector('.lb [role="group"]:not(.ls-dots)')).toBeNull();
    // pink is an accent only below the hero: no full pink band, and no checker strip before the close
    expect(page.querySelectorAll('.ayb-band.is-pink').length).toBe(0);
    expect(page.querySelector('.wl-turn')).toBeNull();
    // the last ask repeats Slide to start, without a second welcome-tip anchor, then the note ends the page
    const end = page.querySelector('.lb-close .wlx-end');
    expect(end.querySelector('.ay-sts__track').textContent).toBe('Sign up free');
    expect(page.querySelectorAll('[data-tour="landing-start"]').length).toBe(1);
    expect(page.querySelector('.lb-close').nextElementSibling).toBe(page.lastElementChild);
    // the founders photo stays
    expect(page.querySelector('.lb img[src*="founders"], .lb source[srcset*="founders"]')).not.toBeNull();
  });
});

describe('the website hero rain (Nov 9: "why is it the same products")', () => {
  it('a different mix each visit, no product twice, real packshots, products and widgets taking turns', async () => {
    const { existsSync } = await import('node:fs');
    const { wideRainCols, RAIN_POOL_WIDE } = await import('./rainData.js');
    const seq = (s) => () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const a = wideRainCols(seq(1));
    const b = wideRainCols(seq(7));
    const ids = (cols) => cols.flat().filter((t) => t.k === 'p').map((t) => t.id);
    expect(ids(a)).toHaveLength(20);
    expect(new Set(ids(a)).size).toBe(20);
    expect(ids(a)).not.toEqual(ids(b));
    a.forEach((col) => col.forEach((t, i) => i && expect((t.k === 'p') !== (col[i - 1].k === 'p')).toBe(true)));
    RAIN_POOL_WIDE.forEach((id) => expect(existsSync(`public/products/catalog/${id}.webp`), id).toBe(true));
  });
});
