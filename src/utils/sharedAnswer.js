/**
 * Shared Ask ayna answers: one link (/a/<slug>) that shows a question and the
 * answer she chose to share. Pure helpers used by the API (api/share-answer.js),
 * the share buttons and the public page. Nothing here reads her health profile.
 */

export const SLUG_LENGTH = 10;
export const SLUG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const SLUG_RE = /^[A-Za-z0-9]{10}$/;
export const MAX_QUESTION = 500;
export const MAX_ANSWER = 8000;
export const MAX_SOURCES = 12;
export const PUBLIC_SITE = 'https://www.aynahealth.co';

export function isValidSlug(value) {
  return typeof value === 'string' && SLUG_RE.test(value);
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  const c = globalThis.crypto;
  if (!c?.getRandomValues) throw new Error('secure_random_unavailable');
  c.getRandomValues(out);
  return out;
}

/** 10 url-safe characters from a CSPRNG, without modulo bias (~59.5 bits). */
export function generateSlug(rand = randomBytes) {
  const max = 256 - (256 % SLUG_ALPHABET.length); // 248: reject 248..255
  let slug = '';
  while (slug.length < SLUG_LENGTH) {
    for (const b of rand(SLUG_LENGTH * 2)) {
      if (b < max) slug += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
      if (slug.length === SLUG_LENGTH) break;
    }
  }
  return slug;
}

/** Same invite code as badges.js referralCodeFor (and ayna_referral_code() in SQL). */
export function referralCodeFor(userId) {
  const code = String(userId || '').replace(/-/g, '').slice(0, 10).toLowerCase();
  return /^[a-z0-9]{6,20}$/.test(code) ? code : null;
}

/** /a/<slug> from a pathname, or null. */
export function slugFromPath(path) {
  const m = String(path || '').match(/^\/a\/([A-Za-z0-9]{10})\/?$/);
  return m ? m[1] : null;
}

export function sharedAnswerUrl(slug, origin) {
  let base = origin;
  if (!base) {
    try {
      const { protocol, origin: here, pathname } = window.location;
      base = /^https?:$/.test(protocol) && !pathname.startsWith('/mobile-preview') ? here : PUBLIC_SITE;
    } catch { base = PUBLIC_SITE; }
  }
  return `${String(base).replace(/\/+$/, '')}/a/${slug}`;
}

const clean = (v) => String(v ?? '').split(String.fromCharCode(0)).join('').trim();

function cleanSource(s) {
  if (!s || typeof s !== 'object') return null;
  const title = clean(s.title || s.name).slice(0, 200);
  const url = clean(s.url || s.href).slice(0, 500);
  if (url && !/^https:\/\/[^\s]+$/i.test(url)) return null;
  if (!title && !url) return null;
  return url ? { title: title || url, url } : { title };
}

/**
 * Validates what she is about to share. Returns { ok: true, value } or
 * { ok: false, error } with a short machine code.
 */
export function validateShareInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'invalid_body' };
  const question = clean(body.question);
  const answer = clean(body.answer);
  if (!question) return { ok: false, error: 'question_required' };
  if (!answer) return { ok: false, error: 'answer_required' };
  if (question.length > MAX_QUESTION) return { ok: false, error: 'question_too_long' };
  if (answer.length > MAX_ANSWER) return { ok: false, error: 'answer_too_long' };
  if (body.sources != null && !Array.isArray(body.sources)) return { ok: false, error: 'invalid_sources' };
  const sources = (body.sources || []).slice(0, MAX_SOURCES).map(cleanSource).filter(Boolean);
  return { ok: true, value: { question, answer, sources } };
}

/** First word of a display name, for "Ameera's answer from ayna". */
export function firstNameOf(name) {
  const first = clean(name).split(/\s+/)[0] || '';
  return first.slice(0, 40);
}

export function possessive(name) {
  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}

export function sharedAnswerTitle(name) {
  const first = firstNameOf(name);
  return first ? `${possessive(first)} answer from ayna` : 'An answer from ayna';
}

/** The question she asked is the turn before the answer in the chat. */
export function questionForAnswer(messages, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && messages[i].text) return messages[i].text;
  }
  return '';
}

/** Signed-out or guest fallback: plain text, no link. */
export function plainShareText(question, answer) {
  const q = clean(question);
  return `${q ? `${q}\n\n` : ''}${clean(answer)}\n\nFrom Ask ayna`;
}
