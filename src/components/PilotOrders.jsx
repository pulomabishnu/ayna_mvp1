import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { loadProductCatalog } from '../utils/productCatalog';
import { clearCart } from '../utils/pilotCart';
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
const STATUS_OPTIONS = [['needs_purchase', 'Needs purchase'], ['purchased', 'Purchased'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['issue', 'Issue'], ['refunded', 'Refunded']];
const STATUS_LABEL = { needs_purchase: 'Processing', purchased: 'Processing', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', issue: 'Being looked into', refunded: 'Refunded' };
const money = (cents, currency = 'usd') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);
const orderLabel = order => (order.order_number ? `AYNA-${order.order_number}` : `AYNA-${String(order.id).slice(0, 8).toUpperCase()}`);
const itemTitle = item => (item.variant_label ? `${item.product_name} — ${item.variant_label}` : item.product_name);
const isShipped = item => ['shipped', 'delivered'].includes(item.item_status);
const draftFrom = item => ({
  item_status: item.item_status, retailer_name: item.retailer_name || '', retailer_order_number: item.retailer_order_number || '',
  actual_cost: item.actual_cost_cents != null ? (item.actual_cost_cents / 100).toFixed(2) : '', carrier: item.carrier || '',
  tracking_number: item.tracking_number || '', tracking_url: item.tracking_url || '', estimated_delivery: item.estimated_delivery || '', internal_notes: item.internal_notes || '',
});
// One form per item: different items are bought, shipped and tracked separately.
function FulfillmentForm({ order, refresh }) {
  const fulfillment = order.fulfillment;
  const [drafts, setDrafts] = useState(() => Object.fromEntries(order.items.map(item => [item.id, draftFrom(item)])));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (id, field, value) => setDrafts(d => ({ ...d, [id]: { ...d[id], [field]: value } }));
  const payload = () => order.items.map(item => ({ id: item.id, ...drafts[item.id] }));
  async function submit(notify) {
    setMessage('');
    if (notify) {
      const lines = order.items.map(item => { const d = drafts[item.id]; const shipped = isShipped(d); return `• ${itemTitle(item)} × ${item.quantity}: ${STATUS_LABEL[d.item_status]}${shipped ? (d.tracking_number ? ` (${d.carrier || 'carrier'} ${d.tracking_number})` : ' — NO TRACKING NUMBER YET') : ''}`; });
      const unshipped = order.items.filter(item => !isShipped(drafts[item.id])).length;
      const ok = window.confirm(`Email ${fulfillment?.shipping?.name || 'the customer'} (${fulfillment?.customer_email || 'no email on file'}) about order ${orderLabel(order)}?\n\n${lines.join('\n')}\n\n${unshipped ? `${unshipped} item(s) will be described as still processing.\n` : ''}Internal notes and purchase costs are never shown to the customer.`);
      if (!ok) return;
    }
    setSaving(true);
    try {
      const r = await request('/api/pilot-orders', { method: 'PATCH', body: JSON.stringify({ orderId: order.id, items: payload(), notify }) });
      setMessage(!notify ? 'Saved. The customer was not emailed.' : r.duplicate ? 'Saved. The customer was already emailed a moment ago, so no second email was sent.' : r.emailed ? 'Saved and the customer was emailed.' : 'Saved, but the customer email could not be sent. Their order page is up to date.');
      await refresh();
    } catch (e) { setMessage(e.message); }
    finally { setSaving(false); }
  }
  async function resend(action) {
    setMessage('');
    try { const r = await request('/api/pilot-orders', { method: 'PATCH', body: JSON.stringify({ orderId: order.id, action }) }); setMessage(r.emailed ? 'Email sent.' : 'The email could not be sent. Try again.'); await refresh(); }
    catch (e) { setMessage(e.message); }
  }
  return <form onSubmit={event => { event.preventDefault(); submit(false); }}>
    <p>Customer email: {fulfillment?.customer_email || '—'}</p>
    <p className="pilot-order__emails">Team email: {fulfillment?.team_notified_at ? 'sent' : <><strong>not sent</strong> <button type="button" onClick={() => resend('resend_team')}>Resend</button></>} · Customer confirmation: {fulfillment?.customer_confirmed_at ? 'sent' : <><strong>not sent</strong> <button type="button" onClick={() => resend('resend_customer')}>Resend</button></>}</p>
    <p>Ship every item to:</p>
    <pre className="pilot-address">{formatAddress(fulfillment?.shipping) || 'No shipping address recorded'}</pre>
    <CopyButton text={formatAddress(fulfillment?.shipping)} />
    {order.items.map(item => {
      const d = drafts[item.id];
      return <fieldset key={item.id} className="pilot-item">
        <legend>{itemTitle(item)} × {item.quantity}</legend>
        <p>Buy: {item.retailer_url ? <a href={item.retailer_url} target="_blank" rel="noopener noreferrer">exact retailer listing</a> : <strong>no retailer link saved</strong>} · expected {money(item.retailer_unit_cents)} each ({money(item.retailer_unit_cents * item.quantity)}) · customer paid {money(item.customer_line_cents)}</p>
        <label>Status<select value={d.item_status} onChange={e => change(item.id, 'item_status', e.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Purchased from<input value={d.retailer_name} maxLength={100} onChange={e => change(item.id, 'retailer_name', e.target.value)} /></label>
        <label>Retailer order number<input value={d.retailer_order_number} maxLength={100} onChange={e => change(item.id, 'retailer_order_number', e.target.value)} /></label>
        <label>Actual price paid ($, internal)<input inputMode="decimal" value={d.actual_cost} onChange={e => change(item.id, 'actual_cost', e.target.value)} /></label>
        <label>Carrier<input value={d.carrier} maxLength={80} onChange={e => change(item.id, 'carrier', e.target.value)} /></label>
        <label>Tracking number<input value={d.tracking_number} maxLength={150} onChange={e => change(item.id, 'tracking_number', e.target.value)} /></label>
        <label>Tracking link (optional — filled in automatically for USPS, UPS, FedEx, DHL)<input type="url" value={d.tracking_url} onChange={e => change(item.id, 'tracking_url', e.target.value)} /></label>
        <label>Estimated delivery<input type="date" value={d.estimated_delivery} onChange={e => change(item.id, 'estimated_delivery', e.target.value)} /></label>
        <label>Internal notes (never shown to the customer)<input value={d.internal_notes} maxLength={2000} onChange={e => change(item.id, 'internal_notes', e.target.value)} /></label>
      </fieldset>;
    })}
    <button disabled={saving}>{saving ? 'Saving…' : 'Save progress'}</button>
    <button type="button" disabled={saving} onClick={() => submit(true)}>Complete / send customer update…</button>
    <p role="status">{message}</p>
  </form>;
}
function PriceForm() {
  const [products, setProducts] = useState([]);
  const [configured, setConfigured] = useState([]);
  const [filter, setFilter] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [productId, setProductId] = useState('p-always-infinity');
  const [variantId, setVariantId] = useState('target-94912100');
  const product = products.find(item => item.id === productId);
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    loadProductCatalog().then(({ products: catalog }) => {
      if (active) setProducts(catalog.filter(item => item.type === 'physical' && !item.requiresPrescription && item.category !== 'telehealth'));
    }).catch(e => { if (active) setMessage(e.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    request('/api/pilot-orders?prices=1').then(data => { if (active) setConfigured(data.prices || []); }).catch(e => { if (active) setMessage(e.message); });
    return () => { active = false; };
  }, []);
  const options = products.flatMap(item => item.variants?.length
    ? item.variants.map(variant => ({ productId: item.id, variantId: variant.id, name: `${item.name} — ${variant.label}` }))
    : [{ productId: item.id, variantId: '', name: item.name }]);
  const configuredKeys = new Set(configured.map(item => `${item.product_id}:${item.variant_id}`));
  if (configuredKeys.has('p-always-infinity:')) configuredKeys.add('p-always-infinity:target-94912100');
  const missingCount = options.filter(item => !configuredKeys.has(`${item.productId}:${item.variantId}`)).length;
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
      setMessage(`Saved. Customer total: $${(result.total / 100).toFixed(2)}.`);
      setPrice(await request(`/api/pilot-orders?price=1&productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}`));
      setConfigured((await request('/api/pilot-orders?prices=1')).prices || []);
    } catch (e) { setMessage(e.message); }
  }
  return <section>
    <h2>Checkout price</h2>
    <p>Set the retailer price for the exact pack. The customer total includes Ayna's {price?.serviceFeePercent ?? 10}% fee and payment processing{price?.taxIncluded ? ', with applicable Stripe tax included' : ''}.</p>
    <p>{options.length - missingCount} of {options.length} product and size choices have a price entered; {missingCount} still need an exact price and retailer link. Live checkout also requires approval of each row.</p>
    <label><input type="checkbox" checked={missingOnly} onChange={e => setMissingOnly(e.target.checked)} /> Show only choices needing a price</label>
    <label>Find product<input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search name or product ID" /></label>
    <label>Product<select value={productId} onChange={e => { const next = products.find(item => item.id === e.target.value); setProductId(e.target.value); setVariantId(next?.defaultVariantId || next?.variants?.[0]?.id || ''); }}>
      {products.filter(item => item.id === productId || (!missingOnly || options.some(option => option.productId === item.id && !configuredKeys.has(`${option.productId}:${option.variantId}`))) && `${item.name} ${item.id}`.toLowerCase().includes(filter.toLowerCase())).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>
    {product?.variants?.length > 0 && <label>Size / option<select value={variantId} onChange={e => setVariantId(e.target.value)}>
      {product.variants.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>}
    {price && <form onSubmit={save} key={`${productId}:${variantId}:${price.price?.updated_at || 'new'}`}>
      <label>Retailer price ($)<input name="price" inputMode="decimal" required defaultValue={price.price ? (price.price.amount / 100).toFixed(2) : ''} /></label>
      <label>Retailer product link<input name="retailerUrl" type="url" required defaultValue={price.price?.retailer_url || ''} /></label>
      <label><input name="approveLive" type="checkbox" defaultChecked={price.price?.live_approved === true} /> I verified this exact item, size, retailer link and price for live checkout</label>
      <button>Save price</button>
      {price.total != null && <p>Current customer total: ${(price.total / 100).toFixed(2)}</p>}
    </form>}
    <p role="status">{message}</p>
  </section>;
}
export default function PilotOrders() {
  const adminView = window.location.pathname === '/pilot/admin';
  const focusId = new URLSearchParams(window.location.search).get('order');
  const returnedPaid = new URLSearchParams(window.location.search).get('paid') === '1';
  const returnedCart = new URLSearchParams(window.location.search).get('source') === 'cart';
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [paymentMode, setPaymentMode] = useState('test');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      const [data, pending] = await Promise.all([
        request(`/api/pilot-orders${adminView ? '?admin=1' : ''}`),
        request('/api/pilot-orders?requests=1'),
      ]);
      if (returnedPaid && returnedCart && data.orders.some(order => order.id === focusId && order.status === 'paid')) clearCart();
      setOrders(data.orders); setRequests(pending.requests || []); setAdmin(data.admin); setPaymentMode(data.paymentMode || 'test'); setError('');
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
    {paymentMode === 'test' && <p className="pilot-orders__sub">Stripe test mode. No real payment.</p>}
    {adminView && admin && <PriceForm />}
    {admin && <a href={adminView ? '/pilot/orders' : '/pilot/admin'}>{adminView ? 'My orders' : 'Open fulfillment inbox'}</a>}
    <button onClick={refresh}>Refresh</button>
    {error && <p role="alert">{error}</p>}
    {loading && <p>Loading orders…</p>}
    {requests.length > 0 && <section>
      <h2>{adminView ? 'Price requests' : 'Your price requests'}</h2>
      {requests.map(item => <article key={item.id} className="pilot-order">
        <h3>{item.product_name}</h3>
        <p>{item.status === 'quoted' ? 'Checkout price is ready.' : 'Price confirmation pending. No payment taken.'}</p>
        {adminView ? <>
          <p>Customer: {item.customer_email || 'See Ayna account'}</p>
          <button type="button" onClick={async () => {
            try {
              const result = await request('/api/pilot-orders?requests=1', { method: 'PATCH', body: JSON.stringify({ requestId: item.id }) });
              await refresh();
              if (!result.emailed) setError('Price is ready, but the email was not sent. Ask the customer to open their Ayna orders page.');
            }
            catch (e) { setError(e.message); }
          }}>{item.status === 'quoted' ? 'Resend checkout link' : 'Send checkout link'}</button>
        </> : item.status === 'quoted' && <a href={`/product/${encodeURIComponent(item.product_id)}${item.variant_id ? `?variantId=${encodeURIComponent(item.variant_id)}` : ''}`}>Review price and buy now</a>}
      </article>)}
    </section>}
    {!loading && !error && !orders.length && !requests.length && <p>No {adminView ? 'paid ' : ''}{paymentMode === 'test' ? 'test ' : ''}orders yet.</p>}
    {orders.map(order => {
      const paid = order.status === 'paid';
      const items = order.items || [];
      const shippedCount = items.filter(isShipped).length;
      const allShipped = items.length > 0 && shippedCount === items.length;
      const allDelivered = items.length > 0 && items.every(item => item.item_status === 'delivered');
      const highlighted = focusId === order.id;
      return <article key={order.id} className={highlighted ? 'pilot-order pilot-order--focus' : 'pilot-order'}>
        <div className="pilot-order__head">
          <h2>Order {orderLabel(order)}</h2>
          <span className="pilot-order__price">{money(order.amount, order.currency)}</span>
        </div>
        <ol className="pilot-progress" aria-label="Order progress">
          <li className={paid ? 'done' : ''}>Ordered</li>
          <li className={allShipped ? 'done' : ''}>Shipped{shippedCount > 0 && !allShipped ? ` (${shippedCount} of ${items.length})` : ''}</li>
          <li className={allDelivered ? 'done' : ''}>Delivered</li>
        </ol>
        {!paid && <p className="pilot-order__note">Payment not yet confirmed — an abandoned checkout also stays pending.</p>}
        {paid && shippedCount === 0 && <p className="pilot-order__note">Order received — we&rsquo;re getting it ready to ship.</p>}
        {paid && shippedCount > 0 && !allShipped && <p className="pilot-order__note">Part of your order has shipped. The rest is still being prepared — each item is listed below.</p>}
        <ul className="pilot-order__items">
          {items.map(item => <li key={item.id}>
            <div className="pilot-order__itemhead"><strong>{item.product_name}</strong><span>{money(item.customer_line_cents, order.currency)}</span></div>
            <p className="pilot-order__itemmeta">{[item.variant_label, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}</p>
            <p className="pilot-order__itemstatus">{STATUS_LABEL[item.item_status] || 'Processing'}{item.estimated_delivery && !['delivered', 'refunded'].includes(item.item_status) ? ` · estimated ${item.estimated_delivery}` : ''}</p>
            {isShipped(item) && <div className="pilot-order__tracking">
              {item.carrier && <p><span>Carrier</span><strong>{item.carrier}</strong></p>}
              {item.tracking_number ? <p><span>Tracking #</span><strong>{item.tracking_number}</strong></p> : <p><span>Tracking</span><strong>Coming soon</strong></p>}
              {item.tracking_url && <a className="pilot-track-btn" href={item.tracking_url} target="_blank" rel="noopener noreferrer">Track shipment</a>}
            </div>}
          </li>)}
        </ul>
        {order.subtotal_cents != null && <dl className="pilot-order__breakdown">
          <div><dt>Items</dt><dd>{money(order.subtotal_cents, order.currency)}</dd></div>
          <div><dt>ayna service fee</dt><dd>{money(order.service_fee_cents, order.currency)}</dd></div>
          <div><dt>Payment processing</dt><dd>{money(order.processing_cents, order.currency)}</dd></div>
          <div><dt><strong>Total paid</strong></dt><dd><strong>{money(order.amount, order.currency)}</strong></dd></div>
        </dl>}
        {order.fulfillment?.shipping?.address && !adminView && <p className="pilot-order__ship">Shipping to: {[order.fulfillment.shipping.name, order.fulfillment.shipping.address.line1, order.fulfillment.shipping.address.city, order.fulfillment.shipping.address.state].filter(Boolean).join(', ')}</p>}
        <p className="pilot-order__id">Order {order.id}</p>
        {adminView && <FulfillmentForm order={order} refresh={refresh} />}
      </article>;
    })}
  </main>;
}
