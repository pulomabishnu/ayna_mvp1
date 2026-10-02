import { pilotConfig, database, checked, signedIn, validTracking, notifyCustomerShipped } from './_pilot.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const db = database(); const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Sign in to ayna to see orders.' });
    const admin = pilotConfig().admins.includes(user.id);
    if (req.method === 'GET') {
      const adminView = req.query?.admin === '1';
      if (adminView && !admin) return res.status(403).json({ error: 'Admin access required.' });
      let query = db.from('pilot_orders').select('id,product_id,product_name,amount,currency,status,created_at,pilot_fulfillments(*)').order('created_at', { ascending: false }).limit(50);
      if (!adminView) query = query.eq('user_id', user.id);
      else query = query.eq('status', 'paid');
      return res.status(200).json({ orders: checked(await query), admin });
    }
    if (req.method === 'PATCH') {
      if (!admin) return res.status(403).json({ error: 'Admin access required.' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const tracking = validTracking(body);
      if (!tracking || !/^[0-9a-f-]{36}$/i.test(body.orderId || '')) return res.status(400).json({ error: 'Enter a carrier, tracking number and optional HTTPS tracking link.' });
      const before = checked(await db.from('pilot_fulfillments').select('status,customer_email,shipped_at,pilot_orders(product_name)').eq('order_id', body.orderId).maybeSingle());
      if (!before) return res.status(404).json({ error: 'Paid order not found.' });
      // Keep the original ship date when correcting tracking later.
      const update = { ...tracking, updated_by: user.id, ...(before.status === 'shipped' && before.shipped_at ? { shipped_at: before.shipped_at } : {}) };
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
