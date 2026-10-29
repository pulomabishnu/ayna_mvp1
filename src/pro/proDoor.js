import { requestPro } from '../utils/proApi.js';
import { openProPaywall, PRO_CHANGED_EVENT } from './paywall.js';

/*
 * The doorway check for Pro features (founder, Oct 28: "when you're connecting
 * your Oura and you don't have ayna Pro it still lets you go to the page where
 * you choose the app or wearable ... it's leading on the customer").
 *
 * A Connect / Dashboard button calls `proDoor(feature, go)`. A Pro member (or
 * anyone while the gates are switched off) goes straight through. A free
 * account gets the paywall sheet right where she tapped, with the feature
 * named, instead of a page that looks like setup and then locks.
 *
 * Fails open: if the status can't be read the page's own server-checked gate
 * still applies, so nobody is wrongly blocked here.
 */
let cache = { at: 0, value: null };
if (typeof window !== 'undefined') window.addEventListener(PRO_CHANGED_EVENT, () => { cache = { at: 0, value: null }; });

export async function proNow() {
  if (cache.value && Date.now() - cache.at < 60000) return cache.value;
  const s = await requestPro();
  cache = { at: Date.now(), value: { active: Boolean(s?.active), gates: s?.gates !== false } };
  return cache.value;
}

export async function proDoor(feature, go, { featureName } = {}) {
  let status = null;
  try { status = await proNow(); } catch { status = null; }
  if (!status || !status.gates || status.active) return go?.();
  if (!openProPaywall({ feature, featureName })) return go?.();
  return undefined;
}

/** For tests. */
export function resetProDoor() { cache = { at: 0, value: null }; }

/**
 * Playlists (Free: 1). Before the composer opens, a free account that already
 * has a playlist gets the Pro sheet, instead of filling in a title and a cover
 * photo that the database then refuses. The database trigger still decides.
 */
export async function playlistDoor(supabase, userId, go) {
  let status = null;
  try { status = await proNow(); } catch { status = null; }
  if (!status || !status.gates || status.active || !supabase || !userId) return go?.();
  try {
    const { count } = await supabase.from('community_playlists').select('id', { count: 'exact', head: true }).eq('owner_id', userId);
    if ((count || 0) < 1) return go?.();
  } catch { return go?.(); }
  if (!openProPaywall({ feature: 'playlists' })) return go?.();
  return undefined;
}
