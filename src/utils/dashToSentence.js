// Team copy sometimes joins two thoughts with an em dash. Turning the dash
// into ", " made comma splices on screen; this ends the sentence instead and
// capitalises the next word ("Gentle — no dyes" -> "Gentle. No dyes").
// For short labels (variants, ranges) pass { label: true } to get " to "-free
// commas only where a dash separates two items.
export function dashToSentence(text, { label = false } = {}) {
  const s = String(text || '');
  if (!s.includes('—')) return s;
  if (label) return s.replace(/\s*—\s*/g, ', ');
  return s.replace(/\s*—\s*(\S)/g, (_, c) => `. ${c.toUpperCase()}`).replace(/\.\s*\./g, '.');
}
