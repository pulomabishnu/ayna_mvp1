/**
 * Session id sent as `conversationId` in the body of every AI request (a body
 * field, not a header, so cross-origin calls from the native apps don't need a
 * CORS preflight change) so the server's PRISM
 * traces (api/_prismTrace.js) group one visit — a chat turn and the product
 * search it opens — into one session. Random, carries no user data.
 */
export function newConversationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const STORAGE_KEY = 'ayna_trace_session';
let memoryId = null;

/** One id per browser tab: survives reloads (sessionStorage), resets in a new tab. */
export function getAppSessionId() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = newConversationId();
    window.sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    if (!memoryId) memoryId = newConversationId();
    return memoryId;
  }
}
