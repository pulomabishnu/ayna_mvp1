import posthog from 'posthog-js';
import * as core from './communityStoreCore.js';
import { analyticsId, ensureAnalyticsContext, eventSurface } from '../analyticsEvents.js';

export * from './communityStoreCore.js';

function capture(event, props = {}) {
  try {
    ensureAnalyticsContext();
    posthog.capture(event, { surface: eventSurface(), ...props });
  } catch { /* analytics never blocks Community */ }
}

/** Preserve ayna Pro upgrade copy emitted by the database instead of turning it
 * into the Community's generic save error. All other errors keep the existing
 * centralized mapping unchanged. */
export function friendlyError(error) {
  const message = String(error?.message || error || '');
  if (message.includes('Free ayna includes one playlist.')) return message;
  return core.friendlyError(error);
}

// Explicit wrappers below override the same names from `export *`. They let
// web + app share one privacy-safe Community analytics contract without ever
// sending post/review/playlist text.
export async function createPost(supabase, userId, input) {
  const out = await core.createPost(supabase, userId, input);
  capture('community_post_created', {
    kind: analyticsId(input?.kind || 'post'),
    product_id: input?.productId ? String(input.productId) : undefined,
    tagged_product_count: Array.isArray(input?.taggedProductIds) ? input.taggedProductIds.length : 0,
    media_count: Array.isArray(input?.media) ? input.media.length : (input?.photoUrl ? 1 : 0),
    anonymous: Boolean(input?.isAnonymous),
  });
  return out;
}

export async function setSaved(supabase, userId, postId, on) {
  const out = await core.setSaved(supabase, userId, postId, on);
  capture('community_post_saved_state_changed', { saved: Boolean(on) });
  return out;
}

export async function setHelpful(supabase, userId, target, on) {
  const out = await core.setHelpful(supabase, userId, target, on);
  capture('community_helpful_state_changed', {
    target_type: target?.postId ? 'post' : 'comment',
    helpful: Boolean(on),
  });
  return out;
}

export async function createPlaylist(supabase, userId, input) {
  const out = await core.createPlaylist(supabase, userId, input);
  capture('playlist_created', { visibility: analyticsId(input?.visibility || 'public') });
  return out;
}

export async function updatePlaylist(supabase, playlistId, patch) {
  const out = await core.updatePlaylist(supabase, playlistId, patch);
  capture('playlist_edited', {
    changed_title: Object.prototype.hasOwnProperty.call(patch || {}, 'title'),
    changed_description: Object.prototype.hasOwnProperty.call(patch || {}, 'description'),
    changed_visibility: Object.prototype.hasOwnProperty.call(patch || {}, 'visibility'),
    changed_cover: Object.prototype.hasOwnProperty.call(patch || {}, 'coverUrl'),
    visibility: patch?.visibility ? analyticsId(patch.visibility) : undefined,
  });
  return out;
}

export async function addToPlaylist(supabase, playlistId, productId, note = null) {
  const out = await core.addToPlaylist(supabase, playlistId, productId, note);
  capture('playlist_product_added', { product_id: String(productId) });
  return out;
}

export async function removeFromPlaylist(supabase, playlistId, productId) {
  const out = await core.removeFromPlaylist(supabase, playlistId, productId);
  capture('playlist_product_removed', { product_id: String(productId) });
  return out;
}

export async function setPlaylistSaved(supabase, userId, playlistId, on) {
  const out = await core.setPlaylistSaved(supabase, userId, playlistId, on);
  capture('playlist_saved_state_changed', { saved: Boolean(on) });
  return out;
}

export async function addPlaylistCollaborator(supabase, playlistId, userId) {
  const out = await core.addPlaylistCollaborator(supabase, playlistId, userId);
  capture('playlist_collaborator_added');
  return out;
}

export async function removePlaylistCollaborator(supabase, playlistId, userId) {
  const out = await core.removePlaylistCollaborator(supabase, playlistId, userId);
  capture('playlist_collaborator_removed');
  return out;
}

export async function joinPlaylistByCode(supabase, code) {
  const out = await core.joinPlaylistByCode(supabase, code);
  capture(out?.ok ? 'playlist_invite_joined' : 'playlist_invite_failed', { success: Boolean(out?.ok) });
  return out;
}
