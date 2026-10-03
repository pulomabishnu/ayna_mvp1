/* global process */
import { pilotConfig, database, checked, signedIn, validTracking, notifyCustomerShipped, parsePriceInput, cleanRetailerUrl, serviceFeeCents, purchasableProduct, selectedPilotVariant } from './_pilot.js';
import { productHref } from '../src/utils/productRoute.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const db = database(); const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Sign in to ayna to see orders.' });
    const config = pilotConfig();
    const admin = config.admins.includes(user.id);
    if (req.query?.requests === '1') {
      if (req.method === 'GET') {
        let query = db.from('pilot_requests').select('id,user_id,product_id,product_name,variant_id,variant_label,customer_email,status,created_at,quoted_at').order('created_at', { ascending: false }).limit(200);
        if (!admin) query = query.eq('user_id', user.id);
        return res.status(200).json({ requests: checked(await query) });
      }
      if (req.method !== 'PATCH' || !admin) return res.status(admin ? 405 : 403).json({ error: admin ? 'Method not allowed.' : 'Admin access required.' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!/^[0-9a-f-]{36}$/i.test(body.requestId || '')) return res.status(400).json({ error: 'Invalid request.' });
      const item = checked(await db.from('pilot_requests').select('id,product_id,product_name,variant_id,customer_email,status').eq('id', body.requestId).maybeSingle());
      if (!item) return res.status(404).json({ error: 'Request not found.' });
      const price = checked(await db.from('pilot_product_prices').select('amount').eq('product_id', item.product_id).eq('variant_id', item.variant_id).maybeSingle());
      if (!price) return res.status(409).json({ error: 'Set the exact product and size price first.' });
      const changed = item.status !== 'quoted' && checked(await db.from('pilot_requests').update({ status: 'quoted', quoted_at: new Date().toISOString() }).eq('id', item.id).eq('status', 'requested').select('id').maybeSingle());
      let emailed = false;
      if ((changed || item.status === 'quoted') && process.env.RESEND_API_KEY && item.customer_email) {
        const link = `${config.origin}${productHref(item.product_id)}${item.variant_id ? `?variantId=${encodeURIComponent(item.variant_id)}` : ''}`;
        try {
          const sent = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: process.env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
              to: [item.customer_email],
              subject: `[TEST] Your Ayna checkout is ready: ${item.product_name}`,
              text: `The test checkout price is ready for ${item.product_name}. Review the total and pay only if you want to continue: ${link}\n\nNo payment has been collected for your request. This is a test checkout only.`,
            }),
          });
          emailed = sent.ok;
        } catch (error) { console.error('[pilot] quote email failed', error?.message); }
      }
      return res.status(200).json({ quoted: true, emailed });
    }
    if (req.query?.prices === '1') {
      if (!admin) return res.status(403).json({ error: 'Admin access required.' });
      if (req.method !== 'GET') return res.status(405).end();
      const prices = checked(await db.from('pilot_product_prices').select('product_id,variant_id,amount,retailer_url,updated_at').order('product_id', { ascending: true }).limit(1000));
      return res.status(200).json({ prices });
    }
    if (req.query?.price === '1') {
      if (!admin) return res.status(403).json({ error: 'Admin access required.' });
      const body = req.method === 'PUT' ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) : req.query || {};
      const productId = String(body.productId || config.productId);
      const variantId = String(body.variantId || '');
      if (!/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(productId) || variantId.length > 100) return res.status(400).json({ error: 'Invalid product or option.' });
      const product = checked(await db.from('product_catalog').select('id,category,product_type,requires_prescription,is_active,source,review_status,discovery_meta,extra').eq('id', productId).maybeSingle());
      if (!product) return res.status(404).json({ error: 'This product is not in the checkout catalog yet.' });
      const variant = selectedPilotVariant(product, variantId);
      if (!purchasableProduct(product) || !variant) return res.status(400).json({ error: 'This item is not available for manual fulfillment.' });
      if (req.method === 'GET') {
        const price = checked(await db.from('pilot_product_prices').select('amount,currency,retailer_url,updated_at').eq('product_id', productId).eq('variant_id', variantId).maybeSingle());
        return res.status(200).json({ price, serviceFeePercent: config.serviceFeePercent, total: price ? price.amount + serviceFeeCents(price.amount) : null });
      }
      if (req.method !== 'PUT') return res.status(405).end();
      const amount = parsePriceInput(body.price);
      const retailerUrl = cleanRetailerUrl(body.retailerUrl);
      if (!amount || !retailerUrl) return res.status(400).json({ error: 'Enter a price from $0.50 to $500 and an HTTPS retailer link.' });
      serviceFeeCents(amount);
      checked(await db.from('pilot_product_prices').upsert({ product_id: productId, variant_id: variantId, variant_label: variant.label, amount, currency: 'usd', retailer_url: retailerUrl, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: 'product_id,variant_id' }));
      return res.status(200).json({ saved: true, total: amount + serviceFeeCents(amount) });
    }
    if (req.method === 'GET') {
      const adminView = req.query?.admin === '1';
      if (adminView && !admin) return res.status(403).json({ error: 'Admin access required.' });
      let query = db.from('pilot_orders').select('id,product_id,product_name,retailer_url,amount,currency,status,created_at,pilot_fulfillments(*)').order('created_at', { ascending: false }).limit(50);
      if (!adminView) query = query.eq('user_id', user.id);
      else query = query.eq('status', 'paid');
      return res.status(200).json({ orders: checked(await query), admin });
    }
    if (req.method === 'PATCH') {
      if (!admin) return res.status(403).json({ error: 'Admin access required.' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const tracking = validTracking(body);
      if (!tracking || !/^[0-9a-f-]{36}$/i.test(body.orderId || '')) return res.status(400).json({ error: 'Enter a carrier, tracking number and optional HTTPS tracking link.' });
      const retailerOrderNumber = String(body.retailer_order_number || '').trim();
      if (retailerOrderNumber.length > 100) return res.status(400).json({ error: 'Retailer order number is too long.' });
      const before = checked(await db.from('pilot_fulfillments').select('status,customer_email,shipped_at,pilot_orders(product_name)').eq('order_id', body.orderId).maybeSingle());
      if (!before) return res.status(404).json({ error: 'Paid order not found.' });
      // Keep the original ship date when correcting tracking later.
      const update = { ...tracking, retailer_order_number: retailerOrderNumber || null, updated_by: user.id, ...(before.status === 'shipped' && before.shipped_at ? { shipped_at: before.shipped_at } : {}) };
      const record = checked(await db.from('pilot_fulfillments').update(update).eq('order_id', body.orderId).select('order_id').maybeSingle());
      if (!record) return res.status(404).json({ error: 'Paid order not found.' });
      let emailed = false;
      if (before.status !== 'shipped') {
        const order = Array.isArray(before.pilot_orders) ? before.pilot_orders[0] : before.pilot_orders;
        emailed = await notifyCustomerShipped({ id: body.orderId, product_name: order?.product_name || 'ayna order' }, tracking, before.customer_email);
      }
      return res.status(200).json({ saved: true, emailed, firstShipment: before.status !== 'shipped' });
    }
    return res.status(405).end();
  } catch { return res.status(503).json({ error: 'Orders unavailable. Please try again.' }); }
}
