import * as core from './communityStoreCore.js';

export * from './communityStoreCore.js';

/** Preserve ayna Pro upgrade copy emitted by the database instead of turning it
 * into the Community's generic save error. All other errors keep the existing
 * centralized mapping unchanged. */
export function friendlyError(error) {
  const message = String(error?.message || error || '');
  if (message.includes('Free ayna includes one playlist.')) return message;
  return core.friendlyError(error);
}
