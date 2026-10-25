import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_MIN_CHARS,
  answerLength,
  feedbackAsText,
  feedbackByQuestion,
  joinLinkFor,
  referralCodeFor,
  remainingLabel,
  validateFeedbackAnswer,
  validateShipping,
} from './freeProductCampaign.js';
import { referralCodeFor as badgesReferralCode } from './badges.js';

const GOOD_1 = 'I like that every product shows why it matched me and what the evidence actually says, which makes it way easier to trust the picks.';
const GOOD_2 = 'The quiz felt long on my phone and I was not sure which questions were optional, so I almost stopped halfway through the health part.';

describe('feedback validation', () => {
  it('uses a 120 character minimum', () => {
    expect(FEEDBACK_MIN_CHARS).toBe(120);
  });

  it.each([
    ['', 'empty'],
    ['     \n\n\t   ', 'empty'],
    ['good', 'too_short'],
    ['love it', 'too_short'],
    ['idk', 'too_short'],
  ])('rejects %j as %s', (text, reason) => {
    expect(validateFeedbackAnswer(text).reason).toBe(reason);
  });

  it('counts collapsed whitespace, so padding with spaces does not help', () => {
    const padded = `good${' '.repeat(200)}ok`;
    expect(answerLength(padded)).toBe(7);
    expect(validateFeedbackAnswer(padded).ok).toBe(false);
  });

  it('is exactly at the boundary: 119 fails, 120 passes', () => {
    const base = 'I use the shop to compare period products and the match score helps me decide faster than reading reviews on five other sites';
    let at = base.slice(0, 116).trimEnd();
    at += 'sites'.slice(0, 120 - at.length);
    expect(answerLength(at)).toBe(120);
    expect(validateFeedbackAnswer(at).ok).toBe(true);
    const below = at.slice(0, 119);
    expect(answerLength(below)).toBe(119);
    const r = validateFeedbackAnswer(below);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('too_short');
    expect(r.message).toBe('1 more character to go.');
  });

  it('rejects repeated characters and keyboard filler', () => {
    expect(validateFeedbackAnswer('a'.repeat(150)).reason).toBe('repeated');
    expect(validateFeedbackAnswer(`${'lol'.repeat(60)}`).reason).toBe('repeated');
    expect(validateFeedbackAnswer(`it is fine ${'!'.repeat(130)}`).reason).toBe('repeated');
  });

  it('rejects one phrase repeated to reach the minimum', () => {
    expect(validateFeedbackAnswer('love it so much '.repeat(10)).reason).toBe('low_variety');
  });

  it('rejects an answer identical or nearly identical to another one', () => {
    expect(validateFeedbackAnswer(GOOD_1, [GOOD_1]).reason).toBe('duplicate');
    expect(validateFeedbackAnswer(`${GOOD_1} Really.`, [GOOD_1]).reason).toBe('duplicate');
    expect(validateFeedbackAnswer(GOOD_2, [GOOD_1]).ok).toBe(true);
  });

  it('accepts a real answer', () => {
    expect(validateFeedbackAnswer(GOOD_1)).toMatchObject({ ok: true, reason: null });
  });
});

describe('referral link', () => {
  const uid = '3f2a9c10-7b4e-4d1a-9c55-0e1f2a3b4c5d';
  it('matches the existing invite code (badges.js and SQL ayna_referral_code)', () => {
    expect(referralCodeFor(uid)).toBe(badgesReferralCode(uid));
    expect(referralCodeFor(uid)).toBe('3f2a9c107b');
  });
  it('builds /join?ref= and never the full id', () => {
    const link = joinLinkFor(uid, 'https://www.aynahealth.co');
    expect(link).toBe('https://www.aynahealth.co/join?ref=3f2a9c107b');
    expect(link).not.toContain(uid);
  });
});

describe('shipping validation', () => {
  const ok = { fullName: 'Test Person', addressLine1: '1 Main St', city: 'New York', state: 'ny', postalCode: '10001', email: 'T@Example.com' };
  it('accepts and normalises a US address', () => {
    const r = validateShipping(ok);
    expect(r.ok).toBe(true);
    expect(r.value.state).toBe('NY');
    expect(r.value.email).toBe('t@example.com');
  });
  it('flags each bad field', () => {
    const r = validateShipping({ ...ok, state: 'XX', postalCode: '1234', email: 'nope', fullName: ' ' });
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'fullName', 'postalCode', 'state']);
  });
});

describe('remaining label', () => {
  const campaign = { feedbackRequired: 3, referralsRequired: 3 };
  it('says exactly what is left', () => {
    expect(remainingLabel({ campaign, verified: false })).toBe('Verify your account to start');
    expect(remainingLabel({ campaign, verified: true, feedbackComplete: 3, referralsVerified: 1 })).toBe('2 more verified friends to go');
    expect(remainingLabel({ campaign, verified: true, feedbackComplete: 2, referralsVerified: 3 })).toBe('1 more answer to go');
    expect(remainingLabel({ campaign, verified: true, feedbackComplete: 0, referralsVerified: 0 })).toBe('3 answers and 3 friends to go');
    expect(remainingLabel({ campaign, verified: true, feedbackComplete: 3, referralsVerified: 3 })).toBeNull();
  });
});

describe('admin: all feedback', () => {
  const people = [
    { userId: 'a', email: 'a@x.co', feedback: { like: { response: ' Love the matches ', complete: true, updatedAt: '2026-10-21T10:00:00Z' }, friction: { response: '', complete: false } } },
    { userId: 'b', email: 'b@x.co', feedback: { like: { response: 'The quiz', complete: false, updatedAt: '2026-10-21T12:00:00Z' } } },
    { userId: 'c', email: 'c@x.co', feedback: {} },
  ];
  it('groups by question, newest first, skips empty answers', () => {
    const g = feedbackByQuestion(people);
    expect(g.map((x) => x.key)).toEqual(['like', 'friction', 'change']);
    expect(g[0].answers.map((a) => a.email)).toEqual(['b@x.co', 'a@x.co']);
    expect(g[0].answers[1].response).toBe('Love the matches');
    expect(g[1].answers).toHaveLength(0);
  });
  it('search matches the answer or the email', () => {
    expect(feedbackByQuestion(people, { search: 'quiz' })[0].answers.map((a) => a.email)).toEqual(['b@x.co']);
    expect(feedbackByQuestion(people, { search: 'a@x' })[0].answers.map((a) => a.email)).toEqual(['a@x.co']);
  });
  it('copy text names the question and flags drafts', () => {
    const t = feedbackAsText(feedbackByQuestion(people)[0]);
    expect(t.split('\n')[0]).toMatch(/actually like/);
    expect(t).toContain('b@x.co (in progress)');
    expect(t).not.toMatch(/—/);
  });
});

describe('vintedIdsFromText', () => {
  it('pulls listing ids out of pasted links, once each', async () => {
    const { vintedIdsFromText } = await import('./freeProductCampaign.js');
    expect(vintedIdsFromText('https://www.vinted.com/items/10464820310-new-sealed-saza-150ml\n10452332267, 10464820310')).toEqual(['10464820310', '10452332267']);
    expect(vintedIdsFromText('150ml 30')).toEqual([]);
  });
});

describe('return to /free-product after the quiz', () => {
  const mem = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; };
  it('comes back once, and only within 2 hours', async () => {
    const { markReturnToFreeProduct, takeReturnToFreeProduct } = await import('./freeProductCampaign.js');
    const s = mem();
    expect(takeReturnToFreeProduct(s)).toBe(false);
    markReturnToFreeProduct(s);
    expect(takeReturnToFreeProduct(s)).toBe(true);
    expect(takeReturnToFreeProduct(s)).toBe(false);
    markReturnToFreeProduct(s);
    expect(takeReturnToFreeProduct(s, Date.now() + 3 * 60 * 60 * 1000)).toBe(false);
  });
});
