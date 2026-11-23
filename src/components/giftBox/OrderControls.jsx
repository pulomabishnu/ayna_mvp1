import React, { useState } from 'react';
import './order-controls.css';

/**
 * One gift box order's header on /admin/gift: status select, carrier +
 * tracking number, and whether status changes email the customer
 * (api/giftbox-admin.js: order_status / order_tracking).
 */

const ORDER_STATUS = { new: 'New', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered', canceled: 'Canceled' };
const CARRIERS = { usps: 'USPS', ups: 'UPS', fedex: 'FedEx', dhl: 'DHL', other: 'Other' };
const EMAILED = ['preparing', 'shipped', 'delivered', 'canceled'];

function emailNote(r, o, what) {
  if (!r) return '';
  if (r.emailed) return `${what} Emailed ${o.ship_email} (cc Ameera, Puloma, Eliz).`;
  if (r.emailError) return `${what} The email to ${o.ship_email} didn’t go through.`;
  if (r.emailsOff) return `${what} Emails are switched off on the site, so no email went out.`;
  return what;
}

export default function OrderControls({ o, act }) {
  const [tracking, setTracking] = useState(o.tracking_number || '');
  const [carrier, setCarrier] = useState(o.carrier || 'usps');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const trackingDirty = tracking.trim() !== (o.tracking_number || '') || (tracking.trim() && carrier !== (o.carrier || 'usps'));

  const changeStatus = async (status) => {
    if (status === o.status) return;
    setBusy(true); setNote('');
    const body = { action: 'order_status', id: o.id, status, notify };
    // Typed a tracking number but didn't press Save? Send it with "Shipped" so the email has it.
    if (trackingDirty) Object.assign(body, { trackingNumber: tracking, carrier });
    const r = await act(body);
    setBusy(false);
    if (r) setNote(emailNote(notify && EMAILED.includes(status) ? r : null, o, `Marked ${ORDER_STATUS[status].toLowerCase()}.`) || `Marked ${ORDER_STATUS[status].toLowerCase()}.`);
  };

  const saveTracking = async (e) => {
    e.preventDefault();
    setBusy(true); setNote('');
    const r = await act({ action: 'order_tracking', id: o.id, trackingNumber: tracking, carrier, notify });
    setBusy(false);
    if (r) setNote(emailNote(r, o, 'Tracking saved.'));
  };

  return (
    <>
      <div className="gb-order__top">
        <div>
          <b>{o.ship_name}</b>
          <span className="ay-meta"> · {o.kind === 'admin' ? `admin (${o.placed_by})` : `winner: ${o.placed_by}`} · {new Date(o.created_at).toLocaleDateString()}</span>
        </div>
        <select className="ay-field ay-field--select gb-status" aria-label="Order status" value={o.status} disabled={busy}
          onChange={(e) => changeStatus(e.target.value)}>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <form className="gb-tracking" onSubmit={saveTracking}>
        <select className="ay-field ay-field--select gb-tracking__carrier" aria-label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} disabled={busy}>
          {Object.entries(CARRIERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="ay-field gb-tracking__number" aria-label="Tracking number" placeholder="Tracking number" value={tracking}
          onChange={(e) => setTracking(e.target.value)} disabled={busy} autoComplete="off" spellCheck={false} />
        <button type="submit" className="ay-btn ay-btn--secondary gb-small" disabled={busy || !trackingDirty}>Save tracking</button>
      </form>
      <label className="gb-tracking__notify ay-meta">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        {' '}Email the customer when I change the status (cc Ameera, Puloma, Eliz)
      </label>
      {o.last_emailed_status ? <p className="ay-meta gb-tracking__last">Last emailed: {ORDER_STATUS[o.last_emailed_status] || o.last_emailed_status}{o.last_emailed_at ? ` · ${new Date(o.last_emailed_at).toLocaleString()}` : ''}</p> : null}
      {note ? <p className="ay-meta gb-tracking__note" role="status">{note}</p> : null}
    </>
  );
}
