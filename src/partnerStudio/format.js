/* Formatting helpers shared by Partner Studio screens. */
export const SYNTHETIC = 'Synthetic benchmark: not real consumer demand or sales';

export function fmtPct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return 'N/A';
  const n = Math.round(v * 10 ** digits) / 10 ** digits;
  return `${n}%`;
}
export function ratePct(r) {
  if (!r || r.value == null) return 'N/A';
  return fmtPct(r.value * 100);
}
export function money(v) {
  if (v == null) return 'Unknown';
  return `$${v >= 100 ? Math.round(v) : Number(v).toFixed(2).replace(/\.00$/, '')}`;
}
export function inScope(b) { return (b?.skus || []).some((s) => s.inScope); }

/** Compare a value with a peer median: direction plus plain-language text. */
export function vsPeers(mine, median, unit = 'pts') {
  if (mine == null || median == null) return null;
  const d = Math.round((mine - median) * 10) / 10;
  if (d === 0) return { dir: 'flat', text: `Level with the median placed peer (${median}%)` };
  return { dir: d > 0 ? 'up' : 'down', text: `${Math.abs(d)} ${unit} ${d > 0 ? 'above' : 'below'} the median placed peer (${median}%)` };
}
