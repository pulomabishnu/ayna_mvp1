import { useEffect, useState } from 'react';

const KEY = 'ayna_mobile_text_size_v1';

// Four steps, applied app-wide via CSS `zoom` on the root .ayna-mobile
// wrapper (see MobileApp.jsx) — the whole app's typography is hard-coded px
// in inline styles rather than rem, so `zoom` is the one mechanism that
// actually scales every screen's text without a rem/em rewrite of the whole
// codebase. `zoom` is unprefixed-supported in Safari 15.4+/WKWebView and all
// Chromium/Firefox, which covers this app's real targets (iOS + web preview).
export const TEXT_SIZE_STEPS = [
  { label: 'Small', zoom: 0.9 },
  { label: 'Default', zoom: 1 },
  { label: 'Large', zoom: 1.15 },
  { label: 'Extra large', zoom: 1.3 },
];
const DEFAULT_INDEX = 1;

function loadIndex() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return DEFAULT_INDEX;
    const stored = Number(raw);
    return Number.isInteger(stored) && stored >= 0 && stored < TEXT_SIZE_STEPS.length ? stored : DEFAULT_INDEX;
  } catch {
    return DEFAULT_INDEX;
  }
}

export function useTextSize() {
  const [textSizeIndex, setTextSizeIndexState] = useState(loadIndex);

  useEffect(() => {
    try { localStorage.setItem(KEY, String(textSizeIndex)); } catch { /* private mode */ }
  }, [textSizeIndex]);

  const setTextSizeIndex = (index) => {
    if (index >= 0 && index < TEXT_SIZE_STEPS.length) setTextSizeIndexState(index);
  };

  return { textSizeIndex, setTextSizeIndex, textZoom: TEXT_SIZE_STEPS[textSizeIndex].zoom };
}
