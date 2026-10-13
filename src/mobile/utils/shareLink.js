// Shares a LINK to the website (not an image) from ayna Wrapped. The text is
// a short teaser only: never any of the person's answers or health details.
export const SITE_URL = 'https://www.aynahealth.co/';
export const SHARE_TEXT = 'I just built my ayna ecosystem. Build yours:';

// The website shares its own origin (so previews and staging link to
// themselves); the native app, whose origin is capacitor:// or a local file,
// always shares the public site.
export function shareUrl() {
  try {
    const { protocol, origin, pathname } = window.location;
    if (/^https?:$/.test(protocol) && !pathname.startsWith('/mobile-preview')) return `${origin}/`;
  } catch { /* no window */ }
  return SITE_URL;
}

// Returns 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareAynaLink({ url = shareUrl(), title = 'ayna', text = SHARE_TEXT } = {}) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error && error.name === 'AbortError') return 'cancelled';
      // Fall through to copying the link.
    }
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return 'copied';
    }
  } catch { /* clipboard blocked */ }
  try {
    const field = document.createElement('textarea');
    field.value = `${text} ${url}`;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
}
