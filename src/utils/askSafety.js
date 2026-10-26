/**
 * Ask ayna's Safety group (Ask audit issue 5): which safety flags her
 * profile has, and the answers to the Safety questions ayna can give on
 * this device, from the same engine as the cards (care flags, safety holds,
 * the bleeding-after-menopause message). Nothing is invented: every line
 * of an answer is text the engine already shows elsewhere.
 */
import { SAFETY_Q } from './askGroups.js';

const norm = (t) => String(t || '').trim().toLowerCase().replace(/[?.!]+$/, '');

/**
 * @param {object|null} profile  her quiz answers
 * @param {{ products?: object[], healthProfile?: object|null, matchOpts?: object }} o
 *   products: her saved / ecosystem products, checked for safety holds.
 * @returns {Promise<{ flags: string[], holds: {name:string, reason:string, fix:string}[], careNotes: string[], bleedingText: string }>}
 */
export async function askSafetyFlags(profile, { products = [], healthProfile = null, matchOpts } = {}) {
  const empty = { flags: [], holds: [], careNotes: [], bleedingText: '' };
  if (!profile) return empty;
  try {
    const [{ getMatchCareFlags, getProductMatchDetailsForProduct }, { hasIud, pregnancyFirstFrom }] = await Promise.all([
      import('../data/products.js'), import('../components/pdp/pdpParts.js'),
    ]);
    const flags = new Set();
    const care = getMatchCareFlags(profile, healthProfile, matchOpts) || {};
    const bleeding = (care.contradictions || []).find((c) => c.code === 'period_need_vs_stage');
    if (bleeding) flags.add('bleeding');
    const careNotes = (care.notes || []).filter((n) => n.code !== 'stage_needs_clarification').map((n) => n.text).filter(Boolean);
    if (care.careFirst || care.careProminent) flags.add('care');
    if (care.pregnant || pregnancyFirstFrom(profile)) flags.add('pregnancy');
    if (hasIud(profile)) flags.add('iud');
    const holds = [];
    for (const p of (Array.isArray(products) ? products : Object.values(products || {})).slice(0, 40)) {
      if (!p?.id) continue;
      const d = getProductMatchDetailsForProduct(p, profile, healthProfile, matchOpts);
      if (d?.matchStatus === 'safety-hold' && d.safetyHold) holds.push({ name: String(p.name || 'A product'), reason: d.safetyHold.reason || '', fix: d.safetyHold.fix?.label || '' });
    }
    if (holds.length) flags.add('hold');
    return { flags: [...flags], holds, careNotes, bleedingText: bleeding?.text || '' };
  } catch {
    return empty;
  }
}

/**
 * The Safety questions ayna answers on this device. null for anything else.
 * @returns {{ answer: string, followUps: [], basedOn: string[] } | null}
 */
export function localSafetyAnswer(text, safety) {
  const t = norm(text);
  if (!safety) return null;
  if (t === norm(SAFETY_Q.hold)) {
    if (!safety.holds?.length) return { answer: 'None of your saved products is on safety hold right now.', followUps: [], basedOn: ['your health profile', 'your saved products'] };
    const lines = safety.holds.slice(0, 4).map((h) => `- **${h.name}**: ${h.reason}${h.fix ? ` ${h.fix.replace(/^Answer: /, 'To resolve it, answer: ')}` : ''}`);
    return { answer: `${safety.holds.length === 1 ? 'One product is' : `${safety.holds.length} products are`} on safety hold, so they show no match until this is answered.\n\n${lines.join('\n')}`, followUps: [], basedOn: ['your health profile', 'your saved products'] };
  }
  if (t === norm(SAFETY_Q.bleeding)) {
    if (!safety.bleedingText) return null;
    return { answer: safety.bleedingText, followUps: [], basedOn: ['your life stage answer', 'the needs you chose'] };
  }
  if (t === norm(SAFETY_Q.care)) {
    const notes = safety.careNotes || [];
    if (!notes.length) return { answer: 'Nothing in your answers needs a clinician first. If something changes or feels urgent, contact a clinician.', followUps: [], basedOn: ['your health profile'] };
    return { answer: `From your answers:\n${notes.slice(0, 5).map((n) => `- ${n}`).join('\n')}`, followUps: [], basedOn: ['your health profile'] };
  }
  return null;
}
