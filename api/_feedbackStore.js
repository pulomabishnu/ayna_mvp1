/* global process, Buffer */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';

export const SURVEY_CAMPAIGN = '2026-09-26';
const prefix = () => `ayna:feedback:v1:${process.env.VERCEL_ENV || 'development'}`;
let client;
export function feedbackStore() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('feedback_store_unavailable');
  client = new Redis({ url, token });
  return client;
}
function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('feedback_signing_unavailable');
  return key;
}
function digest(value) { return createHmac('sha256', secret()).update(`feedback:${value}`).digest('hex'); }

// Only a permanent, campaign-specific yes/no marker is linked to an account.
// It never holds a response ID, answer, receipt, product or submission timestamp.
export async function claimSurvey(userId, store = feedbackStore()) {
  return (await store.set(`${prefix()}:shown:${SURVEY_CAMPAIGN}:${digest(userId)}`, 1, { nx: true })) === 'OK';
}
export function issueReceipt(kind, product = null) {
  const payload = {
    kind, campaign: SURVEY_CAMPAIGN, nonce: randomUUID(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    ...(product ? { productId: product.id, productName: product.name, variant: product.variant || '' } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${digest(body)}`;
}
export function readReceipt(token) {
  if (typeof token !== 'string' || token.length > 2500) return null;
  const [body, signature, extra] = token.split('.');
  if (extra || !body || !/^[a-f0-9]{64}$/.test(signature || '')) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(digest(body)))) return null;
  try {
    const value = JSON.parse(Buffer.from(body, 'base64url').toString());
    return value.exp > Date.now() && value.campaign === SURVEY_CAMPAIGN && ['survey', 'purchase'].includes(value.kind) ? value : null;
  } catch { return null; }
}
export function anonymousResponse(receipt, input) {
  const base = { id: receipt.nonce, kind: receipt.kind, campaign: receipt.campaign, submittedAt: new Date().toISOString().slice(0, 10) };
  if (receipt.kind === 'purchase') {
    if (!['yes', 'no'].includes(input.answer)) throw new Error('invalid_answer');
    return { ...base, productId: receipt.productId, productName: receipt.productName, variant: receipt.variant || '', answer: input.answer };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error('invalid_rating');
  if (typeof input.feedback !== 'string' || input.feedback.length > 600 || typeof input.heardAboutUs !== 'string' || input.heardAboutUs.length > 120) throw new Error('invalid_feedback');
  return { ...base, rating: input.rating, feedback: input.feedback.trim(), heardAboutUs: input.heardAboutUs.trim() };
}
// One atomic write: a retry cannot duplicate an answer or leave an unindexed row.
// No expiration: these are records, not disposable cache entries.
export async function saveFeedback(row, store = feedbackStore()) {
  await store.eval(`
    if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 1 then return 0 end
    redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
    redis.call('ZADD', KEYS[2], ARGV[3], ARGV[1])
    return 1
  `, [`${prefix()}:responses`, `${prefix()}:index`], [row.id, JSON.stringify(row), Date.parse(row.submittedAt)]);
}
export async function listFeedback(offset = 0, store = feedbackStore()) {
  const ids = await store.zrange(`${prefix()}:index`, offset, offset + 99, { rev: true });
  if (!ids.length) return { results: [], nextCursor: null };
  const rows = await store.hmget(`${prefix()}:responses`, ...ids);
  return {
    results: ids.map(id => typeof rows[id] === 'string' ? JSON.parse(rows[id]) : rows[id]).filter(Boolean),
    nextCursor: ids.length === 100 ? offset + 100 : null,
  };
}
