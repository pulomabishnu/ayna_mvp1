import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import './PilotOrders.css';

async function request(path, options = {}) {
  const client = getSupabaseClient();
  const session = client && (await client.auth.getSession()).data?.session;
  if (!session) throw new Error('Sign in to ayna, then return here to see your orders.');
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
function formatAddress(shipping) {
  const a = shipping?.address || {};
  return [shipping?.name, a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(' '), a.country].filter(Boolean).join('\n');
}
function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked; address is selectable */ } }}>{done ? 'Copied' : 'Copy address'}</button>;
}
function TrackingForm({ order, refresh }) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const fulfillment = order.pilot_fulfillments?.[0] || order.pilot_fulfillments;
  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const r = await request('/api/pilot-orders', { method: 'PATCH', body: JSON.stringify({ ...fields, orderId: order.id }) });
      setMessage(!r.firstShipment ? 'Tracking updated (customer was already emailed, no new email sent).' : r.emailed ? 'Tracking saved and the customer was emailed.' : 'Tracking saved. The shipping email could not be sent — the customer can still see it on their orders page.');
      await refresh();
    } catch (e) { setMessage(e.message); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save}>
    {fulfillment?.status !== 'shipped' && <ol className="pilot-steps">
      <li>Buy it: {PRODUCT_BUY_URLS[order.product_id] && <><a href={PRODUCT_BUY_URLS[order.product_id]} target="_blank" rel="noopener noreferrer">retailer page</a> · </>}<a href={`https://www.amazon.com/s?k=${encodeURIComponent(order.product_name)}`} target="_blank" rel="noopener noreferrer">search Amazon</a></li>
      <li>Ship it to the address below (use it as the delivery address at checkout).</li>
      <li>Paste the carrier + tracking number here and save — the customer sees it right away.</li>
    </ol>}
    <p>Fulfilled by: {fulfillment?.vendor_name} · Customer email: {fulfillment?.customer_email || '—'}</p>
    <pre className="pilot-address">{formatAddress(fulfillment?.shipping) || 'No shipping address recorded'}</pre>
    <CopyButton text={formatAddress(fulfillment?.shipping)} />
    <label>Carrier<input name="carrier" required maxLength={80} defaultValue={fulfillment?.carrier || ''} /></label>
    <label>Tracking number<input name="tracking_number" required maxLength={150} defaultValue={fulfillment?.tracking_number || ''} /></label>
    <label>Tracking link (optional HTTPS URL)<input name="tracking_url" type="url" defaultValue={fulfillment?.tracking_url || ''} /></label>
    <button disabled={saving}>{saving ? 'Saving…' : 'Save tracking'}</button>
    <p role="status">{message}</p>
  </form>;
}
export default function PilotOrders() {
  const adminView = window.location.pathname === '/pilot/admin';
  const [orders, setOrders] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      const data = await request(`/api/pilot-orders${adminView ? '?admin=1' : ''}`);
      setOrders(data.orders); setAdmin(data.admin); setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    async function load() { if (active) await refresh(); }
    load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
    // This page's mode is fixed by its URL; full page navigation switches modes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <main className="pilot-orders">
    <a href="/">← Back to ayna / sign in</a>
    <h1>{adminView ? 'Orders to fulfill' : 'Your test orders'}</h1>
    <p>Stripe test mode. No real payment or shipment.</p>
    {admin && <a href={adminView ? '/pilot/orders' : '/pilot/admin'}>{adminView ? 'My orders' : 'Open fulfillment inbox'}</a>}
    <button onClick={refresh}>Refresh</button>
    {error && <p role="alert">{error}</p>}
    {loading && <p>Loading orders…</p>}
    {!loading && !error && !orders.length && <p>No {adminView ? 'paid ' : ''}test orders yet.</p>}
    {orders.map(order => {
      const fulfillment = order.pilot_fulfillments?.[0] || order.pilot_fulfillments;
      return <article key={order.id}>
        <h2>{order.product_name}</h2>
        <p>Order {order.id}</p>
        <p>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.amount / 100)}</p>
        <p>{order.status === 'paid' ? 'Payment confirmed' : 'Payment not yet confirmed — an abandoned checkout also stays pending.'}</p>
        {fulfillment?.status === 'shipped' ? <p>Shipped with {fulfillment.carrier} · {fulfillment.tracking_number} {fulfillment.tracking_url && <a href={fulfillment.tracking_url} target="_blank" rel="noopener noreferrer">Track shipment</a>}</p> : order.status === 'paid' && <p>Order received — we're getting it ready to ship.</p>}
        {adminView && <TrackingForm order={order} refresh={refresh} />}
      </article>;
    })}
  </main>;
}
