/**
 * Which Home the app shows (team sync, Oct 25): dashboard first by default;
 * the chat-first Home stays available for Monday's focus group with
 * `?home=chat` in the address, or the dev flag
 * localStorage.ayna_home_variant = 'chat'. `?home=dashboard` clears the flag.
 */
export const HOME_VARIANT_KEY = 'ayna_home_variant';

export function readHomeVariant({ search = typeof window !== 'undefined' ? window.location.search : '', storage = typeof localStorage !== 'undefined' ? localStorage : null } = {}) {
  let fromUrl = null;
  try { fromUrl = new URLSearchParams(search).get('home'); } catch { fromUrl = null; }
  if (fromUrl === 'chat' || fromUrl === 'dashboard') {
    try { if (fromUrl === 'chat') storage?.setItem(HOME_VARIANT_KEY, 'chat'); else storage?.removeItem(HOME_VARIANT_KEY); } catch { /* storage blocked */ }
    return fromUrl;
  }
  try { return storage?.getItem(HOME_VARIANT_KEY) === 'chat' ? 'chat' : 'dashboard'; } catch { return 'dashboard'; }
}
