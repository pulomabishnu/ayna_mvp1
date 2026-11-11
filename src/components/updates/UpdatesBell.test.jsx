// @vitest-environment jsdom
// The bell signed in (founder, Nov 10: check it before the push): replies, the check-in reminder,
// the dot, marking read, and where each item goes.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const supabase = { tag: 'fake' };
const store = vi.hoisted(() => ({
  rows: [], unread: 0, status: { thisMonthCheckin: null, lastCheckin: null }, markRead: null,
}));
vi.mock('../../utils/supabaseClient.js', () => ({ getSupabaseClient: () => supabase }));
vi.mock('../../utils/community/communityStore.js', () => ({
  listNotifications: vi.fn(async () => store.rows),
  countUnreadNotifications: vi.fn(async () => store.unread),
  markNotificationsRead: vi.fn(async () => { store.markRead?.(); }),
}));
vi.mock('../../utils/monthlyCheckinStore.js', () => ({
  loadMonthlyCheckinStatus: vi.fn(async () => store.status),
  monthKey: () => '2026-11-01',
}));
vi.mock('../../hooks/useLatestAnnouncement.js', () => ({ useLatestAnnouncement: () => ({ title: 'New cramp relief picks', body: 'We checked new heat patches.' }) }));

const { default: UpdatesBell } = await import('./UpdatesBell.jsx');
const community = await import('../../utils/community/communityStore.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
beforeEach(() => {
  localStorage.clear();
  store.rows = []; store.unread = 0; store.status = { thisMonthCheckin: null, lastCheckin: null }; store.markRead = null;
  vi.clearAllMocks();
});
afterEach(() => { act(() => root?.unmount()); host?.remove(); document.querySelectorAll('.ay-updates').forEach((n) => n.remove()); });
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const render = async (props) => {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<UpdatesBell {...props} />));
  await flush();
};
const bell = () => host.querySelector('.ay-bell');
const panel = () => document.querySelector('.ay-updates__panel');

describe('updates bell, signed in', () => {
  it('shows replies and the check-in, lights the dot, marks read on open, and routes each tap', async () => {
    store.rows = [
      { id: 'n1', message: 'Maya replied to your post: same here', created_at: new Date().toISOString(), read_at: null },
      { id: 'n2', type: 'follow', created_at: new Date(Date.now() - 86400000).toISOString(), read_at: '2026-11-09T00:00:00Z' },
    ];
    store.unread = 1;
    store.status = { thisMonthCheckin: null, lastCheckin: { month: '2026-10-01' } };
    const onGo = vi.fn();
    await render({ userId: 'u1', onGo });
    expect(bell().classList.contains('has-new')).toBe(true);
    expect(bell().getAttribute('aria-label')).toBe('Updates, new');

    await act(async () => bell().click());
    const text = panel().textContent;
    expect(text).toContain('For you');
    expect(text).toContain('This month’s check-in'.replace('’', "'"));
    expect(text).toContain('Community');
    expect(text).toContain('Maya replied to your post: same here');
    expect(text).toContain('Someone followed you.');
    expect(text).toContain('From ayna');
    expect(text).toContain('New cramp relief picks');
    expect(text).not.toContain('Sign in');
    // Opening it marks the replies read and clears the dot.
    expect(community.markNotificationsRead).toHaveBeenCalledTimes(1);
    expect(bell().classList.contains('has-new')).toBe(false);
    // The unread reply is bold with its own dot.
    expect(document.querySelectorAll('.ay-updates__item.is-unread')).toHaveLength(1);

    const item = (t) => [...document.querySelectorAll('.ay-updates__item')].find((b) => b.textContent.includes(t));
    await act(async () => item("This month's check-in").click());
    expect(onGo).toHaveBeenLastCalledWith('checkin');
    await act(async () => bell().click());
    await act(async () => item('Maya replied').click());
    expect(onGo).toHaveBeenLastCalledWith('community');
    await act(async () => bell().click());
    await act(async () => item('New cramp relief picks').click());
    expect(onGo).toHaveBeenLastCalledWith('news');
  });

  it('a brand-new account gets no check-in nag (no check-in done yet), and the dot stays off once seen', async () => {
    await render({ userId: 'u2', onGo: () => {} });
    await act(async () => bell().click());
    expect(panel().textContent).not.toContain('check-in');
    await act(async () => document.querySelector('.ay-updates__x').click());
    expect(bell().classList.contains('has-new')).toBe(false);
  });

  it('signed out: news only, with a sign-in line', async () => {
    const onGo = vi.fn();
    await render({ userId: null, onGo });
    expect(community.listNotifications).not.toHaveBeenCalled();
    await act(async () => bell().click());
    expect(panel().textContent).toContain('Sign in to get replies');
    await act(async () => [...document.querySelectorAll('.ay-updates__foot button')][0].click());
    expect(onGo).toHaveBeenLastCalledWith('signin');
  });
});
