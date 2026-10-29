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

// Red flags (review, Oct 29): answered on this device before anything else,
// signed in or not, so urgent symptoms never wait on the model or an account.
// Wording follows ayna's care rules: no diagnosis, go to care now.
const RED_FLAG = /\b(severe|unbearable|worst|excruciating)\s+(?:\w+\s+){0,2}(pain|cramps?|bleeding)\b|\bfever\b.*\b(pain|discharge|bleeding|cramps?)\b|\b(pain|discharge|bleeding|cramps?)\b.*\bfever\b|\bfaint(ed|ing)?\b|\bpassed out\b|\bsoak(ing|ed)?\s+(?:through\s+)?(?:a\s+)?(pad|tampon)s?\s+(every|each)\s+hour\b|\bbleeding\b.*\bpregnan|\bpregnan\w*\b.*\bbleeding\b|\bsuicid|\bhurt myself\b/i;
export function localRedFlagAnswer(text) {
  const t = String(text || '');
  if (!RED_FLAG.test(t)) return null;
  if (/\bsuicid|\bhurt myself\b/i.test(t)) {
    return { answer: 'I’m really glad you told me. If you might act on these thoughts, call or text **988** (Suicide & Crisis Lifeline, US) or **911** right now. You don’t have to go through this alone.', followUps: [], basedOn: ['what you wrote'] };
  }
  return {
    answer: '**This needs medical care now.** Severe or worsening pain, a fever with pain or unusual discharge, fainting, bleeding that soaks a pad or tampon every hour, or any bleeding in pregnancy should be checked promptly. Call your clinician or go to urgent care, and call **911** if it feels like an emergency. ayna can’t tell what’s causing it.',
    followUps: [], basedOn: ['what you wrote'],
  };
}
