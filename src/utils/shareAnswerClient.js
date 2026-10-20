/**
 * Client side of shared Ask ayna answers (api/share-answer.js). Used by the
 * app's Ask ayna, the website's Ask ayna and the public /a/<slug> page.
 * Analytics events never carry the question, the answer or any health detail.
 */
import posthog from 'posthog-js';
import { apiUrl } from './apiUrl.js';
import { isValidSlug, plainShareText, sharedAnswerUrl } from './sharedAnswer.js';
import { shareAynaLink } from '../mobile/utils/shareLink.js';

const PENDING_REF_KEY = 'ayna_pending_ref_v1'; // same key as badges.js / freeProductCampaign.js
const PENDING_FRIEND_KEY = 'ayna_share_friend_v1';
const DAY = 864e5;

const safeGet = (k) => { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch { return null; } };
const safeSet = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const safeDel = (k) => { try { window.localStorage.removeItem(k); } catch { /* private mode */ } };
const track = (event, props) => { try { posthog.capture(event, props); } catch { /* analytics never blocks */ } };

export const isRealAccount = (session) => Boolean(session?.access_token && session?.user && !session.user.is_anonymous);

async function call(method, path, { token, body } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/** Creates the link. Returns { slug, url } or throws with .code. */
export async function createShareLink({ token, question, answer, sources = [] }) {
  const { res, data } = await call('POST', '/api/share-answer', { token, body: { question, answer, sources } });
  if (!res.ok || !isValidSlug(data?.slug)) throw Object.assign(new Error(data?.error || 'share_failed'), { code: data?.error || `http_${res.status}` });
  return { slug: data.slug, url: data.url || sharedAnswerUrl(data.slug) };
}

export async function revokeShareLink({ token, slug }) {
  const { res, data } = await call('DELETE', `/api/share-answer?slug=${encodeURIComponent(slug)}`, { token });
  if (!res.ok) throw Object.assign(new Error(data?.error || 'unshare_failed'), { code: data?.error });
  track('answer_unshared');
  return true;
}

/** { status: 'ok', answer } | { status: 'gone' } | { status: 'error' } */
export async function fetchSharedAnswer(slug, token) {
  if (!isValidSlug(slug)) return { status: 'gone' };
  try {
    const { res, data } = await call('GET', `/api/share-answer?slug=${encodeURIComponent(slug)}`, { token });
    if (res.status === 404 || res.status === 400) return { status: 'gone' };
    if (!res.ok || !data?.answer) return { status: 'error' };
    return { status: 'ok', answer: data };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Opens the share sheet for a link (navigator.share, which is the native sheet
 * in the app's web view), else copies it. 'shared' | 'copied' | 'cancelled' | 'failed'.
 */
export async function shareLinkOrCopy({ url, title = 'Ask ayna', text = '' }) {
  return shareAynaLink({ url, title, text });
}

/** Signed out or guest: share the words only, as before links existed. */
export async function sharePlainText(question, answer) {
  const text = plainShareText(question, answer);
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try { await navigator.share({ title: 'Ask ayna', text }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

export function trackAnswerShared(props) { track('answer_shared', props); }

/* ------------------- Visitor side: referral + add friend ------------------- */

/**
 * A visitor opened /a/<slug>: remember the sharer as her referrer (first touch
 * wins, same store as ?ref= links) so a sign-up from here is credited to the
 * sharer and to this link.
 */
export function rememberShareReferral({ slug, referrerCode }) {
  if (!isValidSlug(slug) || !/^[a-z0-9]{6,20}$/.test(String(referrerCode || ''))) return;
  const existing = safeGet(PENDING_REF_KEY);
  if (existing?.code && Date.now() - existing.at < 30 * DAY) return;
  safeSet(PENDING_REF_KEY, { code: referrerCode, slug, at: Date.now() });
}

export function trackSharedAnswerOpened(props) { track('shared_answer_opened', props); }

/** She tapped Add friend signed out: remember it so it happens after sign-in. */
export function rememberPendingFriend({ slug, ownerId }) {
  if (!isValidSlug(slug) || !ownerId) return;
  safeSet(PENDING_FRIEND_KEY, { slug, ownerId, at: Date.now() });
}

export function readPendingFriend() {
  const p = safeGet(PENDING_FRIEND_KEY);
  if (!p?.slug || !isValidSlug(p.slug) || !p.ownerId || !(Date.now() - p.at < 7 * DAY)) return null;
  return p;
}

export function clearPendingFriend() { safeDel(PENDING_FRIEND_KEY); }

export function trackFriendAddedFromShare(props) { track('friend_added_from_share', props); }
