/** Stable 0–3 from a string, so each person/playlist keeps the same ayna gradient. */
export function hueIndex(seed) {
  let h = 0;
  for (const ch of String(seed || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}
