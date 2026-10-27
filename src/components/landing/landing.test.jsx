// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import SlideToStart from '../ui/SlideToStart.jsx';
import LandingShowcase from './LandingShowcase.jsx';

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

describe('the landing (web / and the app signed-out Home)', () => {
  it('signed out: the main action is Get my matches; signed in with a profile: Go to your Home', () => {
    const out = renderToStaticMarkup(<LandingShowcase onStartQuiz={() => {}} />);
    expect(out).toContain('aria-label="Get my matches. Slide or tap to start."');
    expect(out).toContain('Find what fits');
    const home = renderToStaticMarkup(<LandingShowcase signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    expect(home).toContain('aria-label="Go to your Home. Slide or tap to start."');
  });

  it('labels every demo widget Sample, keeps the trust line and the medical note, and has no em dashes', () => {
    const html = renderToStaticMarkup(<LandingShowcase onStartQuiz={() => {}} />);
    expect((html.match(/>Sample</g) || []).length).toBeGreaterThan(8);
    expect(html).toContain('Brands can’t pay to change your match');
    expect(html).toContain('not <a');
    expect(html).toContain('In an emergency, call 911.');
    expect(html).not.toContain('—');
    // The raining collage is decoration only.
    expect(html).toMatch(/class="lsx-rain lsx-rain--strip" aria-hidden="true"/);
  });
});
