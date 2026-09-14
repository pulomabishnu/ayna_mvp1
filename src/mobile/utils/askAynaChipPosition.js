// Shared with useSupabaseAuth.js (to reset on sign-out) — split out of
// AskAynaChip.jsx itself since a component file can only export the
// component under react-refresh's fast-refresh rule.
export const ASK_AYNA_CHIP_POSITION_KEY = 'ayna_ask_chip_pos_v1';

// Called on sign-out so the next login on this device — which is what a
// user means by "logging in as a new user," even if the same browser has an
// old dragged position left over from a previous account/session — starts
// from the real default (bottom-right) instead of wherever the chip was
// last dragged to.
export function resetChipPosition() {
  try { localStorage.removeItem(ASK_AYNA_CHIP_POSITION_KEY); } catch { /* private mode */ }
}
