/**
 * Turn the engine's care notes into as few calm sentences as possible.
 * Notes that share the "worth raising with a clinician" shape are merged:
 *   "Severe period pain and very heavy periods are worth raising with a clinician."
 * Everything else is kept as written.
 */
const RAISE = {
  severe_pain: 'severe period pain',
  very_heavy_flow: 'very heavy periods',
  uti_first_time: 'first-time UTI-like symptoms',
  symptom_check: 'some symptoms you chose',
};

function joinList(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// sayWhy (website): name what she told us, so the note reads as hers.
const MENTION = {
  severe_pain: 'severe period pain',
  very_heavy_flow: 'very heavy periods',
  uti_first_time: 'first-time UTI-like symptoms',
  symptom_check: 'symptoms that are best checked in person',
};

export function summarizeCareNotes(careFlags, { sayWhy = false } = {}) {
  const notes = (careFlags?.notes || []).filter((n) => n && n.text);
  const raise = notes.filter((n) => RAISE[n.code]);
  const rest = notes.filter((n) => !RAISE[n.code]);
  const out = [];
  if (sayWhy && raise.length) {
    const what = joinList(raise.map((n) => MENTION[n.code]));
    out.push(`You mentioned ${what}. ${raise.length === 1 ? 'That is' : raise.length === 2 ? 'Both are' : 'These are'} worth raising with a clinician.`);
  } else if (raise.length === 1) out.push(raise[0].text);
  else if (raise.length > 1) {
    out.push(`${cap(joinList(raise.map((n) => RAISE[n.code])))} are worth raising with a clinician.`);
  }
  rest.forEach((n) => { if (!out.includes(n.text)) out.push(n.text); });
  return out;
}

/** First usable care link from an engine care bundle, or null. */
export function firstCareLink(care) {
  const links = [...(care?.clinicLinks || []), ...(care?.telehealthLinks || [])];
  return links.find((l) => l && l.href) || null;
}
