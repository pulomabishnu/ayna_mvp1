// @vitest-environment jsdom
// QA M1 + M7: signed out, the chat answers what it can on this device, names
// the one question that needs ayna's AI (no sign-in wall), clears that note
// once a later question is answered, and the chat-first Home opens at the top.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/supabaseClient.js', () => ({ getSupabaseClient: () => null }));
const { default: AskAynaModal } = await import('./AskAynaModal.jsx');
const { setTodayAskContext } = await import('../../utils/askToday.js');

let root; let host; let scrolls;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  scrolls = [];
  Element.prototype.scrollTo = function scrollTo(opts) { scrolls.push(opts); };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  setTodayAskContext({
    today: '2026-10-25', signals: { hasRundown: true },
    focus: [{ title: 'Your sleep was lower than usual', reason: 'Two short nights in a row, from your check-ins.' }],
    rundown: [{ category: 'data', title: 'You slept less than usual.', explain: { kind: 'sleep', lastNight: 340, avg: 420, nights: 10 }, followUps: ['Why was my sleep shorter last night?'] }],
    log: { today: null, yesterday: null }, recent: [],
  });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); setTodayAskContext(null); });

const render = async (props) => { await act(async () => root.render(<AskAynaModal open asTab profile={null} {...props} />)); await act(async () => {}); };
const ask = async (seed, props) => { await render({ ...props, seed }); await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };

describe('Ask ayna signed out', () => {
  it('a Rundown follow-up and an "Ask why" answer here, with no sign-in wall', async () => {
    const onRequireAuth = vi.fn();
    await ask({ id: 1, question: 'Why was my sleep shorter last night?' }, { onRequireAuth });
    expect(host.textContent).toMatch(/5h 40m/);
    await ask({ id: 2, question: 'Why might this be? Your sleep was lower than usual.' }, { onRequireAuth });
    expect(host.textContent).toContain('Two short nights in a row');
    expect(onRequireAuth).not.toHaveBeenCalled();
    expect(host.textContent).not.toMatch(/uses ayna’s AI/);
  });
  it('a question that needs the AI names it; a later local answer clears the note', async () => {
    const onRequireAuth = vi.fn();
    await ask({ id: 3, question: 'How much sleep do adults need?' }, { onRequireAuth });
    expect(host.textContent).toContain('“How much sleep do adults need?” uses ayna’s AI');
    expect(onRequireAuth).not.toHaveBeenCalled();
    await ask({ id: 4, question: 'Explain my Daily Rundown' }, { onRequireAuth });
    expect(host.textContent).not.toMatch(/uses ayna’s AI/);
  });
  it('nothing asked yet: the chat opens at the top (M7)', async () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 500 });
    await render({ onBackHome: () => {} });
    expect(scrolls.length).toBeGreaterThan(0);
    expect(scrolls.every((s) => s.top === 0)).toBe(true);
  });
  it('the sign-in note sits in the list, after the cycle-data card is gone (round 2)', async () => {
    await ask({ id: 5, question: 'How much sleep do adults need?', usesHealth: true, buildContext: () => '' }, {});
    const note = host.querySelector('.ay-ask-account');
    expect(note).toBeTruthy();
    expect(note.parentElement.contains(host.querySelector('.ay-ask-health'))).toBe(false);
    expect(host.querySelector('.ay-ask-health')).toBeNull();
    expect(note.nextElementSibling).toBeTruthy(); // the list's bottom marker follows: it is inside the list
  });
});
