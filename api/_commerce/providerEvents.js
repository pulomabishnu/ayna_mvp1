/**
 * Idempotent provider webhook handling. Every Stripe / Shoppable / Zinc event
 * is recorded once in public.commerce_provider_events (unique on provider +
 * event id) before it is acted on, so a redelivered webhook can never create
 * a second order, a second fulfilment task or a repeated status change.
 */

const PROVIDERS = new Set(['stripe', 'shoppable', 'zinc', 'amazon_associates', 'shopmy', 'shopify_collabs', 'impact']);

/**
 * @param {object} db a Supabase client using the service role
 * @param {{ provider: string, eventId: string, eventType: string, objectId?: string }} event
 * @returns {Promise<{ duplicate: boolean }>}
 */
export async function recordProviderEventOnce(db, { provider, eventId, eventType, objectId = null }) {
  if (!PROVIDERS.has(provider)) throw new Error(`unknown provider ${provider}`);
  if (!eventId || !eventType) throw new Error('eventId and eventType are required');
  const { error } = await db.from('commerce_provider_events').insert({ provider, event_id: String(eventId), event_type: String(eventType), object_id: objectId });
  if (!error) return { duplicate: false };
  if (error.code === '23505') return { duplicate: true }; // unique_violation: already processed
  throw new Error(error.message || 'could not record provider event');
}
