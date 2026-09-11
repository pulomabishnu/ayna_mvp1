import { useEffect, useState } from 'react';

const KEY = 'ayna_mobile_text_size_v1';

// Four steps. An earlier version applied `zoom` app-wide on the root
// .ayna-mobile wrapper, but `zoom` doesn't compose safely with this app's
// own transform-scaled (EcosystemOrbit) and fixed-position (AskAynaChip)
// elements — it broke their centering/positioning in ways that are hard to
// fully audit across every screen. Scaled back to just the live preview in
// Preferences (PreferencesScreen) until a real app-wide mechanism (actually
// converting typography to rem, driven off a root font-size) is worth the
// much larger rewrite that requires.
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

  return { textSizeIndex, setTextSizeIndex };
}
