/** One date format everywhere: "2026-10-13" becomes "Oct 13, 2026". */
export function fmtDate(t) {
  return String(t || '').replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => new Date(`${y}-${m}-${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
}
