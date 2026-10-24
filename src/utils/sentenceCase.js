// Labels shown in the UI are sentence case (anti-vibe guide, voice rule 1):
// "Intimate Care" -> "Intimate care". Names, acronyms and brand words keep
// their capitals. Used for labels that come from shared data (category and
// area names), so the data itself stays as the team wrote it.
const KEEP = new Set(['UTI', 'UTIs', 'PCOS', 'PMOS', 'PMS', 'PMDD', 'BV', 'IUD', 'FSA', 'HSA', 'FDA', 'ACOG', 'CDC', 'NIH', 'HPV', 'STI', 'STIs', 'SPF', 'IVF', 'TTC', 'HRT', 'Apple', 'Oura', 'WHOOP', 'Fitbit', 'Garmin', 'Google']);
export function sentenceCase(label) {
  return String(label || '')
    .replace(/\bApple Health\b/g, 'Apple§Health')
    .split(' ')
    .map((w, i) => {
      if (!w || KEEP.has(w) || /[A-Z].*[A-Z]/.test(w) || w.includes('§')) return w;
      return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase();
    })
    .join(' ')
    .replace(/§/g, ' ');
}
