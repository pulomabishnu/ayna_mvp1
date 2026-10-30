import React, { useCallback, useEffect, useState } from 'react';
import './gift-box.css';
import { adminAction, getAdmin, giftLink, money } from './giftBoxClient';
import { localToday } from '../../utils/localDate.js';

/**
 * /admin/gift: the team lists gift box products, makes one-time winner links,
 * and sees orders. Not linked from any nav; api/giftbox-admin is the real gate.
 */

const TABS = [['orders', 'Orders'], ['links', 'Winner links'], ['products', 'Products']];
const ORDER_STATUS = { new: 'New', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered', canceled: 'Canceled' };
const LINK_STATUS = { open: 'Not used yet', redeemed: 'Ordered', revoked: 'Turned off' };
const EMPTY_PRODUCT = { category: '', brand: '', name: '', price: '', notes: '', imageUrl: '', productUrl: '', maxPerOrder: '1', sortOrder: '0', isActive: true };

const dollarsToCents = (v) => {
  const n = Number(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(orders) {
  const head = ['placed', 'kind', 'placed_by', 'status', 'items', 'total', 'limit', 'ship_name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'note'];
  const rows = orders.map((o) => [
    o.created_at, o.kind, o.placed_by, o.status,
    (o.items || []).map((it) => `${[it.brand, it.name].filter(Boolean).join(' ')}${it.qty > 1 ? ` x${it.qty}` : ''}`).join('; '),
    money(o.total_cents), o.budget_cents ? money(o.budget_cents) : '',
    o.ship_name, o.ship_email, o.ship_phone, [o.address_line1, o.address_line2].filter(Boolean).join(', '), o.city, o.state, o.postal_code, o.note,
  ]);
  const blob = new Blob([[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gift-box-orders-${localToday()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function CopyButton({ text, label = 'Copy link' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="ay-btn ay-btn--secondary gb-small" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copy this link', text); }
    }}>{copied ? 'Copied' : label}</button>
  );
}

function Orders({ orders, act }) {
  if (!orders.length) return <p className="ay-meta">No orders yet.</p>;
  return (
    <>
      <div className="gb-admin__tools"><button type="button" className="ay-btn ay-btn--secondary gb-small" onClick={() => downloadCsv(orders)}>Download CSV</button></div>
      <ul className="gb-admin__list">
        {orders.map((o) => (
          <li key={o.id} className="ay-group is-padded gb-order">
            <div className="gb-order__top">
              <div>
                <b>{o.ship_name}</b>
                <span className="ay-meta"> · {o.kind === 'admin' ? `admin (${o.placed_by})` : `winner: ${o.placed_by}`} · {new Date(o.created_at).toLocaleDateString()}</span>
              </div>
              <select className="ay-field ay-field--select gb-status" aria-label="Order status" value={o.status}
                onChange={(e) => act({ action: 'order_status', id: o.id, status: e.target.value })}>
                {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <ul className="gb-lines">
              {(o.items || []).map((it) => (
                <li key={it.id}><span>{[it.brand, it.name].filter(Boolean).join(' · ')}{it.qty > 1 ? ` × ${it.qty}` : ''}</span><b className="ay-num">{money(it.priceCents * it.qty)}</b></li>
              ))}
              <li className="gb-lines__total"><span>Total</span><b className="ay-num">{money(o.total_cents)}{o.budget_cents ? ` of ${money(o.budget_cents)}` : ''}</b></li>
            </ul>
            <p className="gb-order__ship">
              {[o.address_line1, o.address_line2].filter(Boolean).join(', ')}, {o.city}, {o.state} {o.postal_code}
              <br />{o.ship_email}{o.ship_phone ? ` · ${o.ship_phone}` : ''}
            </p>
            {o.note ? <p className="gb-order__note">“{o.note}”</p> : null}
          </li>
        ))}
      </ul>
    </>
  );
}

function Links({ links, act }) {
  const [form, setForm] = useState({ winnerName: '', winnerEmail: '', label: '', budget: '250', expiresInDays: '' });
  const [made, setMade] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const create = async (e) => {
    e.preventDefault();
    setErr('');
    const budgetCents = dollarsToCents(form.budget);
    if (!form.winnerName.trim() || !budgetCents) { setErr('Add the winner’s name and a limit.'); return; }
    const r = await act({ action: 'create_link', winnerName: form.winnerName, winnerEmail: form.winnerEmail, label: form.label, budgetCents, expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined });
    if (r?.link) { setMade(r.link); setForm((f) => ({ ...f, winnerName: '', winnerEmail: '' })); }
  };
  return (
    <>
      <form className="ay-group is-padded gb-admin__form" onSubmit={create}>
        <h2 className="gb-subhead">New winner link</h2>
        <div className="gb-row">
          <div><label className="ay-field-label" htmlFor="gl-name">Winner’s name</label><input id="gl-name" className="ay-field" value={form.winnerName} onChange={set('winnerName')} /></div>
          <div><label className="ay-field-label" htmlFor="gl-email">Email <span>(optional)</span></label><input id="gl-email" type="email" className="ay-field" value={form.winnerEmail} onChange={set('winnerEmail')} /></div>
        </div>
        <div className="gb-row">
          <div><label className="ay-field-label" htmlFor="gl-label">Month <span>(optional)</span></label><input id="gl-label" className="ay-field" placeholder="October 2026" value={form.label} onChange={set('label')} /></div>
          <div><label className="ay-field-label" htmlFor="gl-budget">Limit ($)</label><input id="gl-budget" className="ay-field" inputMode="decimal" value={form.budget} onChange={set('budget')} /></div>
          <div><label className="ay-field-label" htmlFor="gl-exp">Expires in days <span>(optional)</span></label><input id="gl-exp" className="ay-field" inputMode="numeric" value={form.expiresInDays} onChange={set('expiresInDays')} /></div>
        </div>
        {err ? <p className="gb-fielderr" role="alert">{err}</p> : null}
        <div className="ay-sheet__actions"><button type="submit" className="ay-btn ay-btn--primary">Make link</button></div>
        {made ? (
          <div className="gb-made" role="status">
            <p><b>Link for {made.winner_name}</b> ({money(made.budget_cents)} limit). Works for one order.</p>
            <code>{giftLink(made.token)}</code>
            <CopyButton text={giftLink(made.token)} />
          </div>
        ) : null}
      </form>

      {links.length ? (
        <ul className="gb-admin__list">
          {links.map((l) => (
            <li key={l.id} className="gb-linkrow">
              <div>
                <b>{l.winner_name}</b>{l.label ? <span className="ay-meta"> · {l.label}</span> : null}
                <div className="ay-meta">
                  {money(l.budget_cents)} · {LINK_STATUS[l.status]}
                  {l.status === 'open' && l.expires_at ? ` · expires ${new Date(l.expires_at).toLocaleDateString()}` : ''}
                  {l.winner_email ? ` · ${l.winner_email}` : ''}
                </div>
              </div>
              {l.status === 'open' ? (
                <div className="gb-linkrow__actions">
                  <CopyButton text={giftLink(l.token)} />
                  <button type="button" className="ay-btn ay-btn--text" onClick={() => { if (window.confirm(`Turn off ${l.winner_name}'s link?`)) act({ action: 'revoke_link', id: l.id }); }}>Turn off</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function ProductForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    const priceCents = dollarsToCents(f.price);
    if (!f.name.trim() || priceCents === null || f.price === '') { setErr('Add a name and a price.'); return; }
    setErr('');
    const ok = await onSave({
      action: 'save_product', id: f.id, category: f.category, brand: f.brand, name: f.name, notes: f.notes, priceCents,
      imageUrl: f.imageUrl, productUrl: f.productUrl, maxPerOrder: Number(f.maxPerOrder) || 1, sortOrder: Number(f.sortOrder) || 0, isActive: f.isActive,
    });
    if (ok && !f.id) setF(EMPTY_PRODUCT);
  };
  return (
    <form className="ay-group is-padded gb-admin__form" onSubmit={save}>
      <h2 className="gb-subhead">{f.id ? `Edit ${initial.name}` : 'Add a product'}</h2>
      <div className="gb-row">
        <div><label className="ay-field-label" htmlFor="gp-cat">Category</label><input id="gp-cat" className="ay-field" placeholder="Skin" value={f.category} onChange={set('category')} /></div>
        <div><label className="ay-field-label" htmlFor="gp-brand">Brand</label><input id="gp-brand" className="ay-field" value={f.brand} onChange={set('brand')} /></div>
        <div><label className="ay-field-label" htmlFor="gp-name">Name</label><input id="gp-name" className="ay-field" value={f.name} onChange={set('name')} /></div>
        <div><label className="ay-field-label" htmlFor="gp-price">Value ($)</label><input id="gp-price" className="ay-field" inputMode="decimal" value={f.price} onChange={set('price')} /></div>
      </div>
      <label className="ay-field-label" htmlFor="gp-notes">Notes <span>(shown on the card)</span></label>
      <textarea id="gp-notes" className="ay-field ay-field--area" value={f.notes} onChange={set('notes')} />
      <div className="gb-row">
        <div><label className="ay-field-label" htmlFor="gp-img">Image link</label><input id="gp-img" className="ay-field" placeholder="https://… or /giftbox/name.jpg" value={f.imageUrl} onChange={set('imageUrl')} /></div>
        <div><label className="ay-field-label" htmlFor="gp-url">Product page <span>(optional)</span></label><input id="gp-url" className="ay-field" value={f.productUrl} onChange={set('productUrl')} /></div>
      </div>
      <div className="gb-row">
        <div><label className="ay-field-label" htmlFor="gp-max">Max per order</label><input id="gp-max" className="ay-field" inputMode="numeric" value={f.maxPerOrder} onChange={set('maxPerOrder')} /></div>
        <div><label className="ay-field-label" htmlFor="gp-sort">Order on page</label><input id="gp-sort" className="ay-field" inputMode="numeric" value={f.sortOrder} onChange={set('sortOrder')} /></div>
        <div className="gb-check"><label><input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Shown to winners</label></div>
      </div>
      {err ? <p className="gb-fielderr" role="alert">{err}</p> : null}
      <div className="ay-sheet__actions">
        <button type="submit" className="ay-btn ay-btn--primary">{f.id ? 'Save' : 'Add product'}</button>
        {onCancel ? <button type="button" className="ay-btn ay-btn--secondary" onClick={onCancel}>Cancel</button> : null}
      </div>
    </form>
  );
}

const SYNC_ERRORS = {
  sheet_not_public: 'The site can’t open the sheet. In Google Sheets: Share → General access → Anyone with the link → Viewer.',
  no_header: 'Couldn’t find the header row (it needs id and name columns).',
  sheet_empty: 'The sheet has no products.',
};

function SheetSync({ sheetUrl, act }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const sync = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await adminAction({ action: 'sync_sheet' });
      const skipped = (r.skipped || []).map((s) => `row ${s.row} (${s.reason})`).join(', ');
      setMsg(`Synced ${r.synced} products, ${r.shown} shown.${skipped ? ` Skipped: ${skipped}.` : ''}`);
      await act(null);
    } catch (e) {
      setMsg(SYNC_ERRORS[e.body?.error] || 'Sync didn’t work. Try again in a minute.');
    } finally { setBusy(false); }
  };
  return (
    <div className="ay-group is-padded gb-sync">
      <p>Products come from the Google Sheet and update on their own every few minutes. Products added below (not in the sheet) stay as they are.</p>
      <div className="gb-linkrow__actions">
        <button type="button" className="ay-btn ay-btn--primary gb-small" disabled={busy} onClick={sync}>{busy ? 'Syncing…' : 'Sync now'}</button>
        {sheetUrl ? <a className="ay-btn ay-btn--text" href={sheetUrl} target="_blank" rel="noopener noreferrer">Open the sheet</a> : null}
      </div>
      {msg ? <p className="ay-meta" role="status">{msg}</p> : null}
    </div>
  );
}

function Products({ products, sheetUrl, act }) {
  const [editing, setEditing] = useState(null);
  const save = async (body) => { const r = await act(body); if (r?.ok) setEditing(null); return Boolean(r?.ok); };
  return (
    <>
      <SheetSync sheetUrl={sheetUrl} act={act} />
      {editing ? null : <ProductForm initial={EMPTY_PRODUCT} onSave={save} />}
      <ul className="gb-admin__list">
        {products.map((p) => (editing === p.id ? (
          <li key={p.id}>
            <ProductForm
              initial={{ id: p.id, category: p.category || '', brand: p.brand, name: p.name, price: String(p.price_cents / 100), notes: p.notes, imageUrl: p.image_url || '', productUrl: p.product_url || '', maxPerOrder: String(p.max_per_order), sortOrder: String(p.sort_order), isActive: p.is_active }}
              onSave={save} onCancel={() => setEditing(null)} />
          </li>
        ) : (
          <li key={p.id} className={`gb-prow${p.is_active ? '' : ' is-off'}`}>
            <div className="gb-prow__img">{p.image_url ? <img src={p.image_url} alt="" /> : null}</div>
            <div className="gb-prow__body">
              <b>{p.name}</b>
              <span className="ay-meta">{[p.category, p.sheet_id ? 'from sheet' : '', p.brand, money(p.price_cents), p.max_per_order > 1 ? `up to ${p.max_per_order}` : '', p.is_active ? '' : 'hidden'].filter(Boolean).join(' · ')}</span>
            </div>
            <button type="button" className="ay-btn ay-btn--text" onClick={() => setEditing(p.id)}>Edit</button>
          </li>
        )))}
      </ul>
    </>
  );
}

export default function GiftBoxAdminPage({ user, authLoading, onSignIn }) {
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(() => getAdmin().then((d) => { setData(d); setError(''); }, (e) => setError(e.code || 'error')), []);
  useEffect(() => { if (!authLoading && user) refresh(); }, [authLoading, user, refresh]);

  const act = useCallback(async (body) => {
    if (!body) { await refresh(); return null; }
    try {
      const r = await adminAction(body);
      await refresh();
      return r;
    } catch (e) {
      window.alert(e.code === 'bad_request' ? `Check the ${e.body?.field || 'form'} field.` : 'That didn’t save. Try again.');
      return null;
    }
  }, [refresh]);

  if (!authLoading && !user) {
    return (
      <main className="gb ay-container gb-pad">
        <h1 className="ay-h2">Sign in to manage the gift box</h1>
        <button type="button" className="ay-btn ay-btn--primary" onClick={onSignIn}>Sign in</button>
      </main>
    );
  }
  if (error === 'forbidden') return <main className="gb ay-container gb-pad"><h1 className="ay-h2">This page is for the ayna team</h1></main>;
  if (error) return <main className="gb ay-container gb-pad"><h1 className="ay-h2">Couldn’t load the gift box</h1><button type="button" className="ay-btn ay-btn--secondary" onClick={refresh}>Try again</button></main>;
  if (!data) return <main className="gb ay-container"><p className="ay-meta gb-pad">Loading…</p></main>;

  const counts = { orders: data.orders.length, links: data.links.filter((l) => l.status === 'open').length, products: data.products.filter((p) => p.is_active).length };

  return (
    <main className="gb gb-admin">
      <header className="ay-pagehead ay-band ay-band--pink gb-head">
        <div className="ay-container gb-admin__head">
          <h1 className="ay-h1">Gift box</h1>
          <a className="ay-btn ay-btn--primary" href="/gift">Shop as admin</a>
        </div>
      </header>
      <div className="ay-container">
        <div className="ay-tabs">
          <div className="ay-tabs__list" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" className="ay-tabs__tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {label} <span className="ay-tabs__count">{counts[k]}</span>
              </button>
            ))}
          </div>
          <div className="ay-tabs__panel gb-admin__panel" role="tabpanel">
            {tab === 'orders' ? <Orders orders={data.orders} act={act} /> : null}
            {tab === 'links' ? <Links links={data.links} act={act} /> : null}
            {tab === 'products' ? <Products products={data.products} sheetUrl={data.sheetUrl} act={act} /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
