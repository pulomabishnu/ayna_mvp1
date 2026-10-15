/** One toast for the whole site: toast('Saved', { label: 'View saved', onClick }). */
export function toast(text, action = null) {
  try { window.dispatchEvent(new CustomEvent('ay-toast', { detail: { text, action } })); } catch { /* no window */ }
}
export default toast;
