/* global process */
import { pilotConfig, database, checked, signedIn, validItemUpdate, parsePriceInput, cleanRetailerUrl, serviceFeeCents, checkoutTotalCents, purchasableProduct, selectedPilotVariant, pilotVariantPrice } from './_pilot.js';
import { notifyCustomerUpdate, sendOrderEmails } from './_pilotMail.js';
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
      const price = await pilotVariantPrice(db, item.product_id, item.variant_id, 'amount');
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
              subject: `${config.paymentMode === 'test' ? '[TEST] ' : ''}Your Ayna checkout is ready: ${item.product_name}`,
              text: `The checkout price is ready for ${item.product_name}. Review the total and pay only if you want to continue: ${link}\n\nNo payment has been collected for your request.${config.paymentMode === 'test' ? ' This is a test checkout only.' : ''}`,
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
        const price = await pilotVariantPrice(db, productId, variantId, 'amount,currency,retailer_url,updated_at');
        return res.status(200).json({ price, serviceFeePercent: config.serviceFeePercent, paymentMode: config.paymentMode, taxIncluded: config.taxIncluded, total: price ? checkoutTotalCents(price.amount) : null });
      }
      if (req.method !== 'PUT') return res.status(405).end();
      const amount = parsePriceInput(body.price);
      const retailerUrl = cleanRetailerUrl(body.retailerUrl);
      if (!amount || !retailerUrl) return res.status(400).json({ error: 'Enter a price from $0.50 to $500 and an HTTPS retailer link.' });
      serviceFeeCents(amount);
      checked(await db.from('pilot_product_prices').upsert({ product_id: productId, variant_id: variantId, variant_label: variant.label, amount, currency: 'usd', retailer_url: retailerUrl, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: 'product_id,variant_id' }));
      return res.status(200).json({ saved: true, total: checkoutTotalCents(amount) });
    }
    if (req.method === 'GET') {
      const adminView = req.query?.admin === '1';
      if (adminView && !admin) return res.status(403).json({ error: 'Admin access required.' });
      let query = db.from('pilot_orders').select('id,order_number,product_name,amount,currency,status,created_at,subtotal_cents,service_fee_cents,processing_cents,pilot_fulfillments(status,shipping,customer_email,team_notified_at,customer_confirmed_at,customer_notified_at),pilot_order_items(*)').order('created_at', { ascending: false }).limit(50);
      if (!adminView) query = query.eq('user_id', user.id);
      else query = query.eq('status', 'paid');
      const orders = checked(await query).map(order => orderView(order, adminView));
      return res.status(200).json({ orders, admin, paymentMode: config.paymentMode });
    }
    if (req.method === 'PATCH') {
      if (!admin) return res.status(403).json({ error: 'Admin access required.' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!/^[0-9a-f-]{36}$/i.test(body.orderId || '')) return res.status(400).json({ error: 'Invalid order.' });
      const order = checked(await db.from('pilot_orders').select('id,order_number,amount,currency,status,subtotal_cents,service_fee_cents,processing_cents,pilot_fulfillments(status,shipping,customer_email,shipped_at,customer_notified_at)').eq('id', body.orderId).eq('status', 'paid').maybeSingle());
      const fulfillment = order && (Array.isArray(order.pilot_fulfillments) ? order.pilot_fulfillments[0] : order.pilot_fulfillments);
      if (!order || !fulfillment) return res.status(404).json({ error: 'Paid order not found.' });
      // Retry an order email that failed. The order itself is already saved.
      if (body.action === 'resend_team' || body.action === 'resend_customer') {
        const sent = await sendOrderEmails(db, order.id, null, { only: body.action === 'resend_team' ? 'team' : 'customer' });
        return res.status(200).json({ saved: true, emailed: Object.values(sent).some(Boolean) });
      }
      const existing = checked(await db.from('pilot_order_items').select('*').eq('order_id', order.id).order('line_no', { ascending: true }));
      const byId = new Map(existing.map(item => [item.id, item]));
      const updates = [];
      for (const input of Array.isArray(body.items) ? body.items : []) {
        const current = byId.get(input?.id);
        const fields = current && validItemUpdate(input);
        if (!fields) return res.status(400).json({ error: `Check the details for ${current ? current.product_name : 'an item'}: use https tracking links, valid dates and amounts.` });
        const bought = ['purchased', 'processing', 'shipped', 'delivered'].includes(fields.item_status);
        updates.push({ id: current.id, fields: {
          ...fields, updated_by: user.id,
          // Keep the original dates when details are corrected later.
          purchased_at: current.purchased_at || (bought ? new Date().toISOString() : null),
          shipped_at: current.shipped_at || (['shipped', 'delivered'].includes(fields.item_status) ? new Date().toISOString() : null),
        } });
      }
      for (const { id, fields } of updates) checked(await db.from('pilot_order_items').update(fields).eq('id', id).eq('order_id', order.id).select('id').single());
      const fresh = checked(await db.from('pilot_order_items').select('*').eq('order_id', order.id).order('line_no', { ascending: true }));
      // Order-level status is derived: shipped only once every item has shipped.
      const allShipped = fresh.length > 0 && fresh.every(item => ['shipped', 'delivered'].includes(item.item_status));
      checked(await db.from('pilot_fulfillments').update({ status: allShipped ? 'shipped' : 'awaiting_fulfillment', updated_by: user.id, ...(allShipped ? { shipped_at: fulfillment.shipped_at || new Date().toISOString() } : {}) }).eq('order_id', order.id).select('order_id').single());
      let emailed = false; let duplicate = false;
      if (body.notify === true) {
        // Guard against a double click or repeated submit sending the same update twice.
        duplicate = Boolean(fulfillment.customer_notified_at) && Date.now() - Date.parse(fulfillment.customer_notified_at) < 60000;
        if (!duplicate) {
          emailed = await notifyCustomerUpdate(order, fresh, fulfillment.shipping, fulfillment.customer_email);
          if (emailed) checked(await db.from('pilot_fulfillments').update({ customer_notified_at: new Date().toISOString() }).eq('order_id', order.id).select('order_id').single());
        }
      }
      return res.status(200).json({ saved: true, emailed, duplicate, notified: body.notify === true });
    }
    return res.status(405).end();
  } catch { return res.status(503).json({ error: 'Orders unavailable. Please try again.' }); }
}

// Customers get only customer-safe fields. The retailer link, what the team paid,
// retailer order numbers and internal notes are returned to admins only.
function orderView(order, admin) {
  const fulfillment = Array.isArray(order.pilot_fulfillments) ? order.pilot_fulfillments[0] : order.pilot_fulfillments;
  const items = [...(order.pilot_order_items || [])].sort((a, b) => a.line_no - b.line_no).map(item => ({
    id: item.id, line_no: item.line_no, product_id: item.product_id, product_name: item.product_name, variant_label: item.variant_label,
    quantity: item.quantity, customer_unit_cents: item.customer_unit_cents, customer_line_cents: item.customer_line_cents,
    item_status: item.item_status, carrier: item.carrier, tracking_number: item.tracking_number, tracking_url: item.tracking_url,
    estimated_delivery: item.estimated_delivery, shipped_at: item.shipped_at,
    ...(admin ? { variant_id: item.variant_id, retailer_url: item.retailer_url, retailer_unit_cents: item.retailer_unit_cents, retailer_name: item.retailer_name, retailer_order_number: item.retailer_order_number, actual_cost_cents: item.actual_cost_cents, internal_notes: item.internal_notes } : {}),
  }));
  return {
    id: order.id, order_number: order.order_number, product_name: order.product_name, amount: order.amount, currency: order.currency,
    status: order.status, created_at: order.created_at, subtotal_cents: order.subtotal_cents, service_fee_cents: order.service_fee_cents, processing_cents: order.processing_cents,
    fulfillment: fulfillment ? { status: fulfillment.status, shipping: fulfillment.shipping, ...(admin ? { customer_email: fulfillment.customer_email, team_notified_at: fulfillment.team_notified_at, customer_confirmed_at: fulfillment.customer_confirmed_at, customer_notified_at: fulfillment.customer_notified_at } : {}) } : null,
    items,
  };
}
