/**
 * Which Home the app shows (team sync, Oct 25): dashboard first by default;
 * the chat-first Home stays available for Monday's focus group with
 * `?home=chat` in the address. Only the address decides (QA round 2: it used
 * to be remembered, so one visit kept the chat Home forever), unless the dev
 * flag localStorage.ayna_dev_home_chat = '1' is set by hand.
 * Read once when the app starts, so in-app navigation keeps the variant.
 */
export const HOME_VARIANT_KEY = 'ayna_home_variant'; // old remembered choice, cleared on read
export const HOME_DEV_FLAG = 'ayna_dev_home_chat';

export function readHomeVariant({ search = typeof window !== 'undefined' ? window.location.search : '', storage = typeof localStorage !== 'undefined' ? localStorage : null } = {}) {
  try { storage?.removeItem(HOME_VARIANT_KEY); } catch { /* storage blocked */ }
  let fromUrl = null;
  try { fromUrl = new URLSearchParams(search).get('home'); } catch { fromUrl = null; }
  if (fromUrl === 'chat' || fromUrl === 'dashboard') return fromUrl;
  try { return storage?.getItem(HOME_DEV_FLAG) === '1' ? 'chat' : 'dashboard'; } catch { return 'dashboard'; }
}
