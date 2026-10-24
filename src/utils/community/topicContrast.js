/**
 * Topic cover colours and the contrast rule for user-created topics.
 *
 * WCAG 2.x relative luminance and contrast ratio
 * (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance). A title colour and
 * cover colour pair must reach 4.5:1, AA for body text. The database runs the
 * same formula (community_contrast_ratio in
 * supabase/community_user_topics_2026-10-21.sql), so a pair that passes here
 * passes there.
 */

export const TOPIC_COLORS = [
  { key: 'butter', hex: '#ffedac', label: 'Butter' },
  { key: 'espresso', hex: '#3e2723', label: 'Espresso' },
  { key: 'sky', hex: '#769ebe', label: 'Sky' },
  { key: 'pink', hex: '#f7badd', label: 'Pink' },
];

export const MIN_CONTRAST = 4.5;
const HEXES = new Set(TOPIC_COLORS.map((c) => c.hex));

export function isTopicColor(hex) {
  return HEXES.has(String(hex || '').toLowerCase());
}

export function colorLabel(hex) {
  return TOPIC_COLORS.find((c) => c.hex === String(hex || '').toLowerCase())?.label || 'Colour';
}

export function relativeLuminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Can this text colour sit on this cover? With a photo the title sits on a
 * solid espresso or butter scrim, so only those two text colours apply.
 * Returns { ok, ratio, reason }.
 */
export function checkTopicContrast({ textColor, coverColor, hasPhoto = false }) {
  const text = String(textColor || '').toLowerCase();
  if (!isTopicColor(text)) return { ok: false, ratio: 0, reason: 'Pick a text colour.' };
  if (hasPhoto) {
    if (text === '#ffedac' || text === '#3e2723') return { ok: true, ratio: contrastRatio(text, scrimFor(text)), reason: '' };
    return { ok: false, ratio: 0, reason: 'On a photo, the title uses butter or espresso so it stays readable.' };
  }
  const bg = String(coverColor || '').toLowerCase();
  if (!isTopicColor(bg)) return { ok: false, ratio: 0, reason: 'Pick a cover colour.' };
  const ratio = contrastRatio(text, bg);
  if (ratio >= MIN_CONTRAST) return { ok: true, ratio, reason: '' };
  const why = text === bg ? 'Same colour as the cover.' : `Too hard to read on ${colorLabel(bg).toLowerCase()}.`;
  return { ok: false, ratio, reason: why };
}

/** The scrim colour behind a title on a photo cover. */
export function scrimFor(textColor) {
  return String(textColor || '').toLowerCase() === '#ffedac' ? '#3e2723' : '#ffedac';
}

/** A readable text colour for a cover (first passing brand colour, espresso first). */
export function defaultTextFor(coverColor, hasPhoto = false) {
  const order = ['#3e2723', '#ffedac', '#f7badd', '#769ebe'];
  return order.find((hex) => checkTopicContrast({ textColor: hex, coverColor, hasPhoto }).ok) || '#3e2723';
}
