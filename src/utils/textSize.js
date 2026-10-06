/**
 * Site-wide text size (Settings > Text size), ported from the mobile app's
 * useTextSize hook. Four steps; the index (0-3) is what the account stores
 * as notification_preferences.text_size_index (see
 * api/notification-preferences.js), and localStorage keeps it for guests and
 * between page loads.
 *
 * Applied as a CSS custom property on <html>: --ayna-text-scale, plus a
 * data-ayna-text-size attribute that the rule in PreferencesPage.css keys
 * off (`html[data-ayna-text-size] { font-size: calc(100% * var(...)) }`),
 * so the default step leaves the root font-size completely untouched.
 */

export const TEXT_SIZE_STEPS = [
  { key: 'small', label: 'Small', scale: 0.9 },
  { key: 'default', label: 'Default', scale: 1 },
  { key: 'large', label: 'Large', scale: 1.15 },
  { key: 'xlarge', label: 'Extra large', scale: 1.3 },
];
export const DEFAULT_TEXT_SIZE_INDEX = 1;
export const TEXT_SIZE_STORAGE_KEY = 'ayna_text_size_v1';

/** Any input (number, numeric string, junk) -> a valid step index. */
export function normalizeTextSizeIndex(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(n) && n >= 0 && n < TEXT_SIZE_STEPS.length ? n : DEFAULT_TEXT_SIZE_INDEX;
}

export function textScaleFor(index) {
  return TEXT_SIZE_STEPS[normalizeTextSizeIndex(index)].scale;
}

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readStoredTextSizeIndex(storage = getStorage()) {
  try {
    const raw = storage?.getItem(TEXT_SIZE_STORAGE_KEY);
    return raw == null ? DEFAULT_TEXT_SIZE_INDEX : normalizeTextSizeIndex(raw);
  } catch {
    return DEFAULT_TEXT_SIZE_INDEX;
  }
}

export function storeTextSizeIndex(index, storage = getStorage()) {
  try {
    storage?.setItem(TEXT_SIZE_STORAGE_KEY, String(normalizeTextSizeIndex(index)));
  } catch {
    /* private mode / storage blocked: the visual change still applies */
  }
}

export function applyTextSizeIndex(index, root = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!root) return;
  const i = normalizeTextSizeIndex(index);
  if (i === DEFAULT_TEXT_SIZE_INDEX) {
    root.style.removeProperty('--ayna-text-scale');
    root.removeAttribute('data-ayna-text-size');
    return;
  }
  root.style.setProperty('--ayna-text-scale', String(TEXT_SIZE_STEPS[i].scale));
  root.setAttribute('data-ayna-text-size', TEXT_SIZE_STEPS[i].key);
}

/** Apply + persist locally in one call. */
export function setTextSizeIndex(index) {
  const i = normalizeTextSizeIndex(index);
  applyTextSizeIndex(i);
  storeTextSizeIndex(i);
  return i;
}

/** Call once at app start so a saved size applies before Settings is opened. */
export function initTextSize() {
  const i = readStoredTextSizeIndex();
  applyTextSizeIndex(i);
  return i;
}
