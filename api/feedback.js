import { verifyUser } from './_usageLimit.js';
import { rateLimit, getClientIp } from './_rateLimit.js';
import { loadGroundingCatalog } from './_catalogGrounding.js';
import { anonymousResponse, claimSurvey, feedbackStore, issueReceipt, readReceipt, saveFeedback } from './_feedbackStore.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const body = req.body;
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 5000) return res.status(400).json({ error: 'invalid_request' });
  try {
    const store = feedbackStore();
    if (body.action === 'claim-survey') {
      const { user, error } = await verifyUser(req);
      if (error || !user) return res.status(401).json({ error: 'auth_required' });
      // Build receipt before claiming so a configuration error never consumes a display.
      const receipt = issueReceipt('survey');
      const claimed = await claimSurvey(user.id, store);
      return res.status(200).json({ claimed, ...(claimed ? { receipt } : {}) });
    }
    if (!['begin-purchase', 'submit'].includes(body.action)) return res.status(400).json({ error: 'invalid_action' });
    const limit = await rateLimit(`feedback:${getClientIp(req)}`, { max: 80, windowSec: 3600, failClosed: true });
    if (!limit.ok) return res.status(429).json({ error: 'try_later' });
    if (body.action === 'begin-purchase') {
      const catalog = await loadGroundingCatalog();
      const product = catalog.find(p => p.id === body.productId);
      if (!product) return res.status(400).json({ error: 'unknown_product' });
      // Variant labels are validated against catalog options once present.
      const variant = body.variantId ? product.variants?.find(v => v.id === body.variantId) : null;
      if (body.variantId && !variant) return res.status(400).json({ error: 'unknown_variant' });
      await store.ping(); // Don't offer a prompt whose storage is unavailable.
      return res.status(200).json({ receipt: issueReceipt('purchase', { ...product, variant: variant?.label || '' }) });
    }
    const receipt = readReceipt(body.receipt);
    if (!receipt) return res.status(400).json({ error: 'invalid_receipt' });
    let row;
    try { row = anonymousResponse(receipt, body); } catch { return res.status(400).json({ error: 'invalid_response' }); }
    await saveFeedback(row, store);
    return res.status(200).json({ ok: true });
  } catch {
    // Never log tokens, response text, IPs or account identifiers here.
    return res.status(503).json({ error: 'feedback_unavailable' });
  }
}
