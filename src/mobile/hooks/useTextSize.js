import { useCallback, useEffect, useState } from 'react';

const KEY = 'ayna_mobile_text_size_v1';

// Four steps, applied app-wide via the --ayna-text-scale CSS custom property
// (set on .ayna-mobile in MobileApp.jsx) — every fontSize in src/mobile is
// `calc(Npx * var(--ayna-text-scale, 1))` rather than a raw px number. A CSS
// custom property only affects rendered glyph size through normal font-size
// inheritance, unlike the CSS `zoom` property this used to use: zoom
// re-scales the whole box-model coordinate space, which broke this app's
// transform-scaled (EcosystemOrbit) and fixed-position (AskAynaChip)
// elements. calc()-based font-size doesn't touch layout/position math at
// all, so it's safe everywhere without auditing every screen.
export const TEXT_SIZE_STEPS = [
  { label: 'Small', scale: 0.9 },
  { label: 'Default', scale: 1 },
  { label: 'Large', scale: 1.15 },
  { label: 'Extra large', scale: 1.3 },
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

  // Accepts a raw index (local tap) so the caller doesn't have to know the
  // steps array shape; MobileApp.jsx also calls this directly when a signed
  // -in user's saved text_size_index loads from the server, keeping local
  // and server state in the same single setter.
  const setTextSizeIndex = useCallback((index) => {
    if (index >= 0 && index < TEXT_SIZE_STEPS.length) setTextSizeIndexState(index);
  }, []);

  return { textSizeIndex, setTextSizeIndex, textScale: TEXT_SIZE_STEPS[textSizeIndex].scale };
}
