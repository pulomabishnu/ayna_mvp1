import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import { ALL_PRODUCTS } from '../data/products';
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
      <li>Buy it: {order.retailer_url ? <><a href={order.retailer_url} target="_blank" rel="noopener noreferrer">configured retailer item</a> · </> : PRODUCT_BUY_URLS[order.product_id] && <><a href={PRODUCT_BUY_URLS[order.product_id]} target="_blank" rel="noopener noreferrer">retailer page</a> · </>}<a href={`https://www.amazon.com/s?k=${encodeURIComponent(order.product_name)}`} target="_blank" rel="noopener noreferrer">search Amazon</a></li>
      <li>Ship it to the address below (use it as the delivery address at checkout).</li>
      <li>Enter the retailer order number, carrier and tracking number here. Saving tracking emails the customer.</li>
    </ol>}
    <p>Fulfilled by: {fulfillment?.vendor_name} · Customer email: {fulfillment?.customer_email || '—'}</p>
    <pre className="pilot-address">{formatAddress(fulfillment?.shipping) || 'No shipping address recorded'}</pre>
    <CopyButton text={formatAddress(fulfillment?.shipping)} />
    <label>Retailer order number (optional)<input name="retailer_order_number" maxLength={100} defaultValue={fulfillment?.retailer_order_number || ''} /></label>
    <label>Carrier<input name="carrier" required maxLength={80} defaultValue={fulfillment?.carrier || ''} /></label>
    <label>Tracking number<input name="tracking_number" required maxLength={150} defaultValue={fulfillment?.tracking_number || ''} /></label>
    <label>Tracking link (optional — filled in automatically for USPS, UPS, FedEx, DHL)<input name="tracking_url" type="url" defaultValue={fulfillment?.tracking_url || ''} /></label>
    <button disabled={saving}>{saving ? 'Saving…' : 'Save tracking'}</button>
    <p role="status">{message}</p>
  </form>;
}
function PriceForm() {
  const products = ALL_PRODUCTS.filter(item => item.type === 'physical' && !item.requiresPrescription && item.category !== 'telehealth');
  const [productId, setProductId] = useState('p-always-infinity');
  const [variantId, setVariantId] = useState('');
  const product = products.find(item => item.id === productId);
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    request(`/api/pilot-orders?price=1&productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}`)
      .then(data => { if (active) { setPrice(data); setMessage(''); } })
      .catch(e => { if (active) { setPrice(null); setMessage(e.message); } });
    return () => { active = false; };
  }, [productId, variantId]);
  async function save(event) {
    event.preventDefault(); setMessage('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await request('/api/pilot-orders?price=1', { method: 'PUT', body: JSON.stringify({ ...fields, productId, variantId }) });
      setMessage(`Saved. Test customer total: $${(result.total / 100).toFixed(2)}.`);
      setPrice(await request(`/api/pilot-orders?price=1&productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}`));
    } catch (e) { setMessage(e.message); }
  }
  return <section>
    <h2>Test checkout price</h2>
    <p>Set the retailer price for the exact pack. A {price?.serviceFeePercent ?? 10}% ayna service fee is added at checkout.</p>
    <label>Product<select value={productId} onChange={e => { const next = products.find(item => item.id === e.target.value); setProductId(e.target.value); setVariantId(next?.defaultVariantId || next?.variants?.[0]?.id || ''); }}>
      {products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>
    {product?.variants?.length > 0 && <label>Size / option<select value={variantId} onChange={e => setVariantId(e.target.value)}>
      {product.variants.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>}
    {price && <form onSubmit={save} key={`${productId}:${variantId}:${price.price?.updated_at || 'new'}`}>
      <label>Retailer price ($)<input name="price" inputMode="decimal" required defaultValue={price.price ? (price.price.amount / 100).toFixed(2) : ''} /></label>
      <label>Retailer product link<input name="retailerUrl" type="url" required defaultValue={price.price?.retailer_url || ''} /></label>
      <button>Save test price</button>
      {price.total != null && <p>Current customer total: ${(price.total / 100).toFixed(2)}</p>}
    </form>}
    <p role="status">{message}</p>
  </section>;
}
export default function PilotOrders() {
  const adminView = window.location.pathname === '/pilot/admin';
  const focusId = new URLSearchParams(window.location.search).get('order');
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
    <h1>{adminView ? 'Orders to fulfill' : 'Your orders'}</h1>
    <p className="pilot-orders__sub">Stripe test mode. No real payment.</p>
    {adminView && admin && <PriceForm />}
    {admin && <a href={adminView ? '/pilot/orders' : '/pilot/admin'}>{adminView ? 'My orders' : 'Open fulfillment inbox'}</a>}
    <button onClick={refresh}>Refresh</button>
    {error && <p role="alert">{error}</p>}
    {loading && <p>Loading orders…</p>}
    {!loading && !error && !orders.length && <p>No {adminView ? 'paid ' : ''}test orders yet.</p>}
    {orders.map(order => {
      const fulfillment = order.pilot_fulfillments?.[0] || order.pilot_fulfillments;
      const shipped = fulfillment?.status === 'shipped';
      const paid = order.status === 'paid';
      const highlighted = focusId === order.id;
      return <article key={order.id} className={highlighted ? 'pilot-order pilot-order--focus' : 'pilot-order'}>
        <div className="pilot-order__head">
          <h2>{order.product_name}</h2>
          <span className="pilot-order__price">{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.amount / 100)}</span>
        </div>
        <ol className="pilot-progress" aria-label="Order progress">
          <li className={paid ? 'done' : ''}>Ordered</li>
          <li className={shipped ? 'done' : ''}>Shipped</li>
          <li>Delivered</li>
        </ol>
        {!paid && <p className="pilot-order__note">Payment not yet confirmed — an abandoned checkout also stays pending.</p>}
        {paid && !shipped && <p className="pilot-order__note">Order received — we&rsquo;re getting it ready to ship.</p>}
        {shipped && <div className="pilot-order__tracking">
          <p><span>Carrier</span><strong>{fulfillment.carrier}</strong></p>
          <p><span>Tracking #</span><strong>{fulfillment.tracking_number}</strong></p>
          {fulfillment.tracking_url && <a className="pilot-track-btn" href={fulfillment.tracking_url} target="_blank" rel="noopener noreferrer">Track shipment</a>}
        </div>}
        <p className="pilot-order__id">Order {order.id}</p>
        {adminView && <TrackingForm order={order} refresh={refresh} />}
      </article>;
    })}
  </main>;
}
