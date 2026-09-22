import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function replaceOnce(text, before, after, label) {
  if (text.includes(after)) return text;
  if (!text.includes(before)) throw new Error(`Missing mobile sync anchor: ${label}`);
  return text.replace(before, after);
}

// Merge the latest mobile-app's persistent "For You" state and Ask Ayna chip
// navigation reset into the privacy-hardened MobileApp without replacing the
// privacy catalog/auth/consent changes in this file. Each check is deliberately
// feature-based rather than adjacency-based so later hooks (for example push
// notifications) can sit between these imports/state declarations safely.
{
  const path = 'src/mobile/MobileApp.jsx';
  let text = read(path);
  if (!text.includes("import { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';")) {
    text = replaceOnce(
      text,
      "import { useThemeMode } from './hooks/useThemeMode.js';",
      "import { useThemeMode } from './hooks/useThemeMode.js';\nimport { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';",
      'MobileApp personalized hook import'
    );
  }
  if (!text.includes('const [personalized, setPersonalized] = usePersonalizedFeed();')) {
    text = replaceOnce(
      text,
      "  const { theme, resolvedTheme, setThemeMode } = useThemeMode();",
      "  const { theme, resolvedTheme, setThemeMode } = useThemeMode();\n  const [personalized, setPersonalized] = usePersonalizedFeed();",
      'MobileApp personalized hook state'
    );
  }
  text = replaceOnce(
    text,
    "        theme={theme}\n        onToggleTheme={setThemeMode}\n        products={browseProducts}",
    "        theme={theme}\n        onToggleTheme={setThemeMode}\n        personalized={personalized}\n        onPersonalizedChange={setPersonalized}\n        products={browseProducts}",
    'MobileApp personalized props'
  );
  text = replaceOnce(
    text,
    "      {!askAynaOpen && <AskAynaChip onClick={() => setAskAynaOpen(true)} />}",
    "      {!askAynaOpen && (\n        <AskAynaChip\n          onClick={() => setAskAynaOpen(true)}\n          viewKey={overlay ? `${overlay.type}:${overlay.item?.id || ''}` : screen}\n        />\n      )}",
    'MobileApp Ask Ayna view key'
  );
  write(path, text);
}

// Preserve the latest mobile behavior that clears a dragged Ask Ayna chip
// position on logout, while keeping Apple sign-in, revocation, and analytics
// identity reset from the privacy branch.
{
  const path = 'src/mobile/hooks/useSupabaseAuth.js';
  let text = read(path);
  text = replaceOnce(
    text,
    "import { AGE_REQUIREMENT_VERSION, CONSENT_VERSION, clearPendingConsent, stashPendingConsent, flushPendingConsent } from '../../utils/pendingConsent.js';",
    "import { AGE_REQUIREMENT_VERSION, CONSENT_VERSION, clearPendingConsent, stashPendingConsent, flushPendingConsent } from '../../utils/pendingConsent.js';\nimport { resetChipPosition } from '../utils/askAynaChipPosition.js';",
    'useSupabaseAuth chip reset import'
  );
  text = replaceOnce(
    text,
    "    if (supabase) await supabase.auth.signOut();\n    try { posthog.reset(); } catch { /* analytics may be unavailable/opted out */ }",
    "    if (supabase) await supabase.auth.signOut();\n    try { posthog.reset(); } catch { /* analytics may be unavailable/opted out */ }\n    resetChipPosition();",
    'useSupabaseAuth chip reset on signout'
  );
  write(path, text);
}

// Keep the latest internal ProfileFlow push/pop animation while preserving the
// privacy branch's AI/analytics controls and direct deletion/export behavior.
{
  const path = 'src/mobile/screens/profile/ProfileFlow.jsx';
  let text = read(path);
  const before = `  return (\n    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--ayna-bg)', display: 'flex', animation: 'ay-page .25s ease-out' }}>\n      {body}\n    </div>\n  );`;
  const after = `  return (\n    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--ayna-bg)', display: 'flex' }}>\n      {/* Keyed on \`screen\` so each push/pop within this overlay remounts the\n          inner wrapper and replays the same page entrance animation used by\n          top-level mobile screens. */}\n      <div key={screen} style={{ flex: 1, minWidth: 0, display: 'flex', animation: 'ay-page .22s ease-out' }}>\n        {body}\n      </div>\n    </div>\n  );`;
  text = replaceOnce(text, before, after, 'ProfileFlow internal navigation animation');
  write(path, text);
}
