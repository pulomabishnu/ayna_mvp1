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
// The landing asks /api/pro whether she is a member; tests set the answer.
const proStatus = { current: { active: false, offerOpen: true } };
vi.mock('../../utils/proApi.js', () => ({
  requestPro: vi.fn(async () => proStatus.current),
  loadProFeatureRules: vi.fn(async () => ({ enabled: true })),
}));

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
    expect(new Set(words)).toEqual(new Set(['Cycle', 'Ask', 'ayna', 'Sleep', 'Match']));
    expect((rain.match(/<img /g) || []).length).toBeLessThanOrEqual(3 * 3 * 6); // 3 columns, 3 products each, 6 copies
    expect(new Set(RAIN_COLS.flat().filter((t) => t.k !== 'p').map((t) => t.k))).toEqual(new Set(['ring', 'sleep', 'streak', 'match', 'ask', 'month']));
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
  it('hero: a centred title, search, Slide to start (welcome tip anchor) and the rain beside it', () => {
    const html = renderToStaticMarkup(<WebLanding onStartQuiz={() => {}} onViewHowItWorks={() => {}} />);
    expect(html).toContain('aria-label="Create your ecosystem. Slide or tap to start."');
    expect(html).toContain('data-tour="landing-start"');
    expect(html).toContain('class="lsx-search wl-search"');
    expect(html).toMatch(/class="lk-rainbox lk-rainbox--ink wl-rain" aria-hidden="true"/);
    expect(text(html)).toContain('How we match');
    // The website keeps the brown and pink bar, with its pause button; no box behind "your body.".
    expect(html).toContain('class="lk-bar"');
    expect(html).toContain('aria-label="Pause motion"');
    expect(html).not.toContain('<mark');
    const home = renderToStaticMarkup(<WebLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(home).toContain('aria-label="Go to your Home. Slide or tap to start."');
  });

  it('tells one product story under the hero and finishes with one free-start action', () => {
    vi.useFakeTimers();
    mount(<WebLanding onStartQuiz={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
    const page = host.textContent;
    expect(page).toContain('Women’s health, made for you.');
    expect(page).toContain('Brands we work with');
    // discover -> matched to you -> why -> health data in context (Pro) -> Ask -> Free vs Pro -> trust
    const order = ['What are you navigating?', 'Matched to you, once ayna knows you.', 'Every match comes with the why.', 'Your health data, in context.', 'Ask ayna anything.', 'Free helps you find what fits. Pro learns with you.', 'Quick reads about your body, with sources', 'Built by three women who wanted better answers.'];
    const at = order.map((t) => page.indexOf(t));
    at.forEach((i, n) => expect(i, order[n]).toBeGreaterThan(-1));
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(host.querySelector('a[href="/pro"].ls-offer__cta').textContent).toContain('Get ayna Pro');
    const last = host.querySelector('#ay-landing').lastElementChild;
    expect(last.textContent).toContain('Start free. No purchase needed.');
    expect(last.querySelectorAll('button')).toHaveLength(1);
    expect(host.innerHTML).not.toContain('—');
  });

  it('signed out: products are shown without a number, behind one clear unlock', () => {
    mount(<WebLanding onStartQuiz={() => {}} onLogIn={() => {}} />);
    const shelf = host.querySelector('.ls-shelf');
    expect(shelf.textContent).toContain('Sign in to unlock personalized results.');
    expect(shelf.textContent).toContain('Log in');
    expect(shelf.textContent).not.toMatch(/\d+% match/);
    expect(shelf.querySelectorAll('.ls-row > li').length).toBeLessThanOrEqual(4);
  });

  it('only claims what the product does: real limits, live sources, no partner influence, plain renewal terms', () => {
    mount(<WebLanding onStartQuiz={() => {}} />);
    const page = host.textContent;
    // limits (api/_proFeatures.js, pro_* SQL): monthly quiz retake, Ask 5 / 50 a month
    expect(page).toContain('Retake once a month');
    expect(page).toContain('5 chats a month');
    // the full Free vs Pro comparison and the integration details are one tap away
    expect([...host.querySelectorAll('.ls-more > summary')].map((x) => x.textContent)).toEqual(expect.arrayContaining(['What ayna weighs, in order', 'What you can connect', 'How ayna uses it', 'Your data, your call', 'Use something else? Suggest an app or wearable', 'Compare Free and Pro']));
    expect(page).toContain('Up to 50 a month');
    expect(page).not.toMatch(/unlimited (ask|chats)/i);
    expect(page).not.toMatch(/once a week|per week.*quiz|quiz.*per week/i);
    // integrations: Oura is insights only; no WHOOP, Flo or Strava
    expect(page).toContain('Insights only, for now');
    expect(page).not.toMatch(/WHOOP|Whoop|Strava|\bFlo\b/);
    expect(page).toContain('Suggest an app or wearable');
    // connected data never changes the percent; partnerships never change a match
    expect(page).toContain('never changes a match percent'); // inside How ayna uses it
    expect(page).toContain('0% of your match comes from brand partnerships.');
    // price, promo period, start of billing and renewal all visible
    const offer = host.querySelector('.ls-offer').textContent;
    ['$4.99', '$45', '$8.99/month', '$90/year', 'Jan 1, 2027', 'Dec 31, 2026', 'Cancel anytime'].forEach((t) => expect(offer).toContain(t));
  });

  it('a Pro member sees what she has, not an offer', async () => {
    proStatus.current = { active: true, offerOpen: true };
    mount(<WebLanding signedIn userId="u1" hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(host.textContent).toContain('You’re on ayna Pro.');
    expect(host.querySelector('.ls-offer')).toBeNull();
    expect(host.textContent).toContain('Open Health data');
    expect(host.textContent).toContain('Up to 50 chats a month with ayna Pro.');
    proStatus.current = { active: false, offerOpen: true };
  });

  it('a closed offer shows no price and no buy button', async () => {
    proStatus.current = { active: false, offerOpen: false };
    mount(<WebLanding signedIn userId="u2" onStartQuiz={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(host.querySelector('.ls-offer')).toBeNull();
    expect(host.textContent).toContain('The Early Access offer is closed right now.');
    proStatus.current = { active: false, offerOpen: true };
  });

  it('below the hero (founder, Oct 27 13:44-13:58): one idea a section, the brown and pink strip as two dividers, no pink fills, and a last Slide to start', () => {
    vi.useFakeTimers();
    mount(<WebLanding onStartQuiz={() => {}} />);
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
    const page = host.querySelector('#ay-landing');
    // the original website's sections sit under the falling pictures (founder, Oct 27 19:18)
    expect(page.querySelector('.wl-classic .hm-ev, .wl-classic .hm-sec')).not.toBeNull();
    // pink is an accent only below the hero: no full pink band
    expect(page.querySelectorAll('.ayb-band.is-pink').length).toBe(0);
    // the last ask before the note repeats Slide to start, without a second welcome-tip anchor
    const end = page.querySelector('.wlx-end');
    expect(end.querySelector('.ay-sts__track').getAttribute('aria-label')).toBe('Create your ecosystem. Slide or tap to start.');
    expect(page.querySelectorAll('[data-tour="landing-start"]').length).toBe(1);
    expect(end).toBe(page.lastElementChild);
    // the founders photo stays
    expect(page.querySelector('.wl-classic img[src*="founders"], .wl-classic source[srcset*="founders"]')).not.toBeNull();
  });
});
