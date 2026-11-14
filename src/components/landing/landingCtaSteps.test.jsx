// @vitest-environment jsdom
// Each landing button sends its own anonymous step (journeyStep.js) and still does its job.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import WebLanding from './WebLanding.jsx';
import { CONSENT_STORAGE_KEY } from '../../utils/analyticsConsent.js';

vi.mock('../search/SmartSearchInput.jsx', () => ({ default: (props) => <input aria-label="Search" value={props.value} onChange={props.onChange} /> }));
vi.mock('../../pro/paywall.js', async (orig) => ({ ...(await orig()), openProPaywall: () => true }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host; let fetchMock;
beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn(() => Promise.resolve());
  vi.stubGlobal('fetch', fetchMock);
  Object.defineProperty(window, 'scrollY', { value: 10, configurable: true }); // render the whole page at once
});
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; vi.unstubAllGlobals(); });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const steps = () => fetchMock.mock.calls.map(([, o]) => JSON.parse(o.body).s);
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })); });
const byText = (sel, text) => [...host.querySelectorAll(sel)].filter((n) => n.textContent.trim().startsWith(text));

describe('landing buttons, one step each', { timeout: 30000 }, () => {
  it('each main button (Take the free 1-minute quiz) is counted by its place, plus sign_up_free_clicked', () => {
    const onStartQuiz = vi.fn();
    mount(<WebLanding onStartQuiz={onStartQuiz} />);
    const buttons = byText('button.ls-btn', 'Take the free 1-minute quiz');
    expect(buttons).toHaveLength(2); // problem section, testimonials
    buttons.forEach(click);
    click(host.querySelector('button.hd-start'));
    expect(steps()).toEqual(['cta_signup_problem', 'sign_up_free_clicked', 'cta_signup_testimonials', 'sign_up_free_clicked', 'cta_signup_demo', 'sign_up_free_clicked']);
    expect(onStartQuiz).toHaveBeenCalledTimes(3);
  });

  it('the other links send their own step and still open their page', () => {
    const go = { onViewAbout: vi.fn(), onViewArticles: vi.fn(), onViewCommunity: vi.fn(), onViewWaitlist: vi.fn(), onViewHowItWorks: vi.fn() };
    mount(<WebLanding onStartQuiz={() => {}} {...go} />);
    click(byText('a', 'Meet us')[0]);
    click(byText('a', 'Read our sources')[0]);
    click(byText('a', 'Open the Library')[0]);
    click(byText('a', 'Read reviews and questions')[0]);
    click(host.querySelector('a.lk-bar__tab'));
    click(byText('a', 'How we match')[0]);
    click(byText('button', 'Get ayna Pro')[0]);
    click(host.querySelector('button.lb-price.is-light'));
    expect(steps()).toEqual(['cta_meet_us', 'cta_sources', 'cta_library', 'cta_community', 'cta_brands', 'cta_how_we_match', 'cta_get_pro', 'cta_pro_monthly']);
    for (const fn of Object.values(go)) expect(fn).toHaveBeenCalled();
  });

  it('a started quiz counts as cta_finish_quiz, signed in as cta_go_home, never as sign-up', () => {
    mount(<WebLanding onStartQuiz={() => {}} quizDraft={{ index: 3, total: 9 }} onResumeQuiz={() => {}} onStartQuizOver={() => {}} />);
    click(byText('button.ls-btn', 'Finish your free quiz')[0]);
    click(byText('button', 'Start over')[0]);
    act(() => root.unmount()); host.remove();
    mount(<WebLanding signedIn hasProfile onGoHome={() => {}} onStartQuiz={() => {}} />);
    click(host.querySelector('button.hd-start'));
    expect(steps()).toEqual(['cta_finish_quiz', 'cta_start_over', 'cta_go_home']);
  });

  it('nothing is sent after Keep off', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'denied', timestamp: new Date().toISOString() }));
    mount(<WebLanding onStartQuiz={() => {}} onViewAbout={() => {}} />);
    click(byText('a', 'Meet us')[0]);
    click(host.querySelector('button.hd-start'));
    expect(steps()).toEqual([]);
  });
});
