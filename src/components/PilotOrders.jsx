import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
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
function TrackingForm({ order, refresh }) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const fulfillment = order.pilot_fulfillments?.[0] || order.pilot_fulfillments;
  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await request('/api/pilot-orders', { method: 'PATCH', body: JSON.stringify({ ...fields, orderId: order.id }) });
      setMessage('Tracking saved.'); await refresh();
    } catch (e) { setMessage(e.message); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save}>
    <p>Vendor: {fulfillment?.vendor_name}</p>
    <p>{fulfillment?.customer_email}</p>
    <pre>{JSON.stringify(fulfillment?.shipping, null, 2)}</pre>
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
    <h1>{adminView ? 'Test fulfillment inbox' : 'Your test orders'}</h1>
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
        {fulfillment?.status === 'shipped' ? <p>Shipped with {fulfillment.carrier} · {fulfillment.tracking_number} {fulfillment.tracking_url && <a href={fulfillment.tracking_url} target="_blank" rel="noopener noreferrer">Track shipment</a>}</p> : order.status === 'paid' && <p>Awaiting test fulfillment.</p>}
        {adminView && <TrackingForm order={order} refresh={refresh} />}
      </article>;
    })}
  </main>;
}
