/* global process */
import { database, checked, signedIn, pilotConfig, purchasableProduct, selectedPilotVariant, teamRecipients, pilotVariantPrice } from './_pilot.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const config = pilotConfig();
    if (!config.enabled) return res.status(403).json({ error: 'Checkout is not enabled.' });
    const db = database();
    const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Sign in to ayna first.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const productId = String(body.productId || '');
    const variantId = String(body.variantId || '');
    if (!/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(productId) || variantId.length > 100) return res.status(400).json({ error: 'Choose a valid product and option.' });
    const limit = await rateLimit(`pilot-request:${user.id}`, { max: 5, windowSec: 60 });
    if (!limit.ok) return res.status(429).json({ error: 'Please wait before requesting another item.' });
    const product = checked(await db.from('product_catalog').select('id,name,category,product_type,requires_prescription,is_active,source,review_status,discovery_meta,extra').eq('id', productId).maybeSingle());
    const variant = selectedPilotVariant(product, variantId);
    if (!purchasableProduct(product) || !variant) return res.status(400).json({ error: 'This item is not available for Ayna checkout.' });
    const price = await pilotVariantPrice(db, productId, variantId, 'amount');
    if (price) return res.status(409).json({ error: 'A checkout price is now available. Please try Buy now again.', checkoutAvailable: true });
    const productName = variant.label ? `${product.name} — ${variant.label}` : product.name;
    const existing = checked(await db.from('pilot_requests').select('id,status').eq('user_id', user.id).eq('product_id', productId).eq('variant_id', variantId).maybeSingle());
    if (existing) return res.status(200).json({ requested: true, id: existing.id, status: existing.status });
    const inserted = await db.from('pilot_requests').insert({ user_id: user.id, product_id: productId, product_name: productName, variant_id: variantId, variant_label: variant.label, customer_email: user.email || null }).select('id,status').single();
    if (inserted.error?.code === '23505') return res.status(200).json({ requested: true });
    const record = checked(inserted);
    if (process.env.RESEND_API_KEY && teamRecipients().length) {
      try {
        const sent = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
            to: teamRecipients(),
            subject: `${config.paymentMode === 'test' ? '[TEST] ' : ''}Ayna price request: ${productName}`,
            text: `A customer requested ${productName}. No payment was collected. Confirm the exact retailer price and link in ${config.origin}/pilot/admin, then send the checkout link from the request inbox.`,
          }),
        });
        if (!sent.ok) console.error('[pilot] request email failed', sent.status);
      } catch (error) { console.error('[pilot] request email failed', error?.message); }
    }
    return res.status(200).json({ requested: true, id: record.id, status: record.status });
  } catch (error) {
    console.error('[pilot-request] failed', error?.message);
    return res.status(503).json({ error: 'Order request is unavailable. Please try again.' });
  }
}
