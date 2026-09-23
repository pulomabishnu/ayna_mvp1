/**
 * One id per chat conversation, sent with each /api chat request so the
 * server's PRISM traces (api/_prismTrace.js) group every turn of the same
 * conversation into one session. Random, carries no user data.
 */
export function newConversationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
