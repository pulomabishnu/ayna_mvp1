// @vitest-environment jsdom
// QA M5: the website's /ask signed out, after the quiz: the guided chat with
// on-device starters; what ayna can answer here is answered, the rest names
// the question and offers Sign in.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => null }));
vi.mock('../utils/supabaseClient.js', () => ({ getSupabaseClient: () => null }));
const { default: ProfileChatbot } = await import('./ProfileChatbot.jsx');
const { setTodayAskContext } = await import('../utils/askToday.js');

let root; let host;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  setTodayAskContext({ today: '2026-10-25', signals: { hasRundown: true }, focus: [{ title: 'Log how you slept', reason: 'You have not checked in today.' }], rundown: [], log: { today: null, yesterday: null }, recent: [] });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); setTodayAskContext(null); });
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const btn = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));

describe('web Ask signed out with quiz answers', () => {
  it('shows on-device starters and answers them here', async () => {
    const onRequireAuth = vi.fn();
    await act(async () => root.render(<ProfileChatbot asPage profile={{ fullHealthIntake: { supportSelections: ['Hot flashes'] } }} user={null} onRequireAuth={onRequireAuth} />));
    await flush();
    expect(host.textContent).toContain('Quick answers need no account');
    await act(async () => { btn('What should I focus on today?').click(); });
    await flush();
    expect(host.textContent).toContain('Log how you slept');
    expect(onRequireAuth).not.toHaveBeenCalled();
  });
  it('a question for the AI is named, kept, and offers Sign in', async () => {
    const onRequireAuth = vi.fn();
    await act(async () => root.render(<ProfileChatbot asPage openSignal={1} prefill="How much sleep do adults need?" profile={{}} user={null} onRequireAuth={onRequireAuth} />));
    await flush();
    expect(host.textContent).toContain('“How much sleep do adults need?” uses ayna’s AI');
    await act(async () => { btn('Sign in').click(); });
    expect(onRequireAuth).toHaveBeenCalledWith('Ask ayna');
  });
});
