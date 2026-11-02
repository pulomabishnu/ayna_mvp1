/* global process */
import { verifyUser } from './_usageLimit.js';
import { availableProduct, checkoutAdmin, checkoutConfig, checkoutStripe, createCheckout } from './_checkoutCore.js';

const fail = (res, status, code) => res.status(status).json({ error: code });
const isAdmin = user => String(process.env.ADMIN_EMAILS || '').split(',')
  .map(x => x.trim().toLowerCase()).includes(String(user.email || '').toLowerCase());

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'POST'].includes(req.method)) return fail(res, 405, 'method_not_allowed');
  let db;
  try { checkoutConfig(); db = checkoutAdmin(); }
  catch { return fail(res, 503, 'checkout_not_configured'); }
  if (req.method === 'GET' && req.query?.action === 'product') {
    const id = String(req.query.id || '');
    if (!id || id.length > 160) return fail(res, 400, 'invalid_product');
    try {
      const found = await availableProduct(db, id);
      return res.status(200).json(found ? { enabled: true, product: {
        id: found.product.id, name: found.product.name,
        price_cents: found.product.checkout_price_cents, supplier: found.supplier.name,
      } } : { enabled: false });
    } catch { return fail(res, 503, 'product_unavailable'); }
  }
  const { user } = await verifyUser(req);
  if (!user) return fail(res, 401, 'sign_in_required');
  if (req.method === 'GET' && req.query?.action === 'orders') {
    const result = await db.from('checkout_orders')
      .select('id,stripe_session_id,status,created_at,total_cents,currency,tracking_number,tracking_url,checkout_order_items(product_name,quantity,unit_price_cents)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    return result.error ? fail(res, 503, 'orders_unavailable') : res.status(200).json({ orders: result.data });
  }
  if (req.method === 'POST' && req.body?.action === 'create') {
    try {
      const url = await createCheckout(db, checkoutStripe(), user, req.body.cart, req.body.return_path);
      return res.status(200).json({ url });
    } catch (error) {
      return fail(res, ['invalid_cart', 'product_unavailable'].includes(error.message) ? 400 : 503,
        ['invalid_cart', 'product_unavailable'].includes(error.message) ? error.message : 'checkout_unavailable');
    }
  }
  if (req.method === 'POST' && req.body?.action === 'tracking') {
    if (!isAdmin(user)) return fail(res, 403, 'forbidden');
    const { order_id, tracking_number, tracking_url } = req.body;
    if (typeof order_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(order_id) ||
        typeof tracking_number !== 'string' || !/^[\w .-]{3,100}$/.test(tracking_number) ||
        tracking_url && (typeof tracking_url !== 'string' || !/^https:\/\/[^\s]{1,500}$/.test(tracking_url))) {
      return fail(res, 400, 'invalid_tracking');
    }
    const result = await db.from('checkout_orders').update({
      status: 'shipped', tracking_number, tracking_url: tracking_url || null,
    }).eq('id', order_id).select('id,status').maybeSingle();
    return result.error ? fail(res, 503, 'tracking_save_failed')
      : result.data ? res.status(200).json({ order: result.data }) : fail(res, 404, 'order_not_found');
  }
  return fail(res, 400, 'invalid_action');
}
