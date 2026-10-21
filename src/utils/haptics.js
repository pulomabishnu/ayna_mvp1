import { Capacitor, registerPlugin } from '@capacitor/core';

// Haptics for the iOS/Android app (anti-vibe guide, sections 4 and 6b).
// Only on meaningful events:
//   haptic('light')     save (heart)
//   haptic('selection') a quiz chip or filter chip picked
//   haptic('success')   added to the Ecosystem, monthly check-in done
//   haptic('warning')   a destructive confirm or a form error
// The native side comes from @capacitor/haptics (package.json; `npx cap sync`
// copies it into the iOS and Android projects). The plugin is reached through
// registerPlugin so the web bundle carries no plugin code: on the website,
// in /mobile-preview, and when the person turned haptics off, it does nothing.
const OFF_KEY = 'ayna_haptics_off_v1';
let plugin = null;
function native() {
  try {
    if (!Capacitor.isNativePlatform()) return null;
    if (!plugin) plugin = registerPlugin('Haptics');
    return plugin;
  } catch { return null; }
}

export function hapticsEnabled() {
  try { return localStorage.getItem(OFF_KEY) !== '1'; } catch { return true; }
}
export function setHapticsEnabled(on) {
  try { if (on) localStorage.removeItem(OFF_KEY); else localStorage.setItem(OFF_KEY, '1'); } catch { /* storage blocked */ }
}

export function haptic(kind = 'light') {
  const h = native();
  if (!h || !hapticsEnabled()) return;
  let call;
  try {
    if (kind === 'selection') call = h.selectionStart?.().then(() => h.selectionChanged?.()).then(() => h.selectionEnd?.());
    else if (kind === 'success') call = h.notification?.({ type: 'SUCCESS' });
    else if (kind === 'warning') call = h.notification?.({ type: 'WARNING' });
    else call = h.impact?.({ style: kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
  } catch { return; }
  call?.catch?.(() => {});
}
