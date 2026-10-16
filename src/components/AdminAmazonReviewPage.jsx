import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

/**
 * Internal Amazon review queue, reached by typing /admin/amazon-review.
 * Server-side gate: api/commerce-amazon-review checks ADMIN_EMAILS.
 *
 * For each Amazon offer (product listing or one Ayna size): open the link,
 * compare it with Ayna's record, save what you saw. Amazon prices are not
 * recorded here: Amazon only allows showing prices that come from its
 * Creators API, so a hand-checked price could never go on the site.
 */
const yesNo = [{ v: '', l: 'Not checked' }, { v: 'true', l: 'Yes' }, { v: 'false', l: 'No' }];
const toBool = (v) => (v === 'true' ? true : v === 'false' ? false : null);
const fromBool = (b) => (b === true ? 'true' : b === false ? 'false' : '');

async function authHeader() {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function ReviewRow({ row, onSaved }) {
  const r = row.review || {};
  const [form, setForm] = useState({
    exactProduct: fromBool(r.exact_product),
    exactVariant: fromBool(r.exact_variant),
    verifiedSizeCount: r.verified_size_count || '',
    availabilitySeen: r.availability_seen || '',
    imageMatches: fromBool(r.image_matches),
    notes: r.notes || '',
  });
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const asin = row.asin_for_this_row;

  const save = async () => {
    setState('saving');
    try {
      const headers = await authHeader();
      const res = await fetch('/api/commerce-amazon-review', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: row.ayna_product_id, variantId: row.ayna_variant_id || '', asin,
          exactProduct: toBool(form.exactProduct), exactVariant: toBool(form.exactVariant),
          verifiedSizeCount: form.verifiedSizeCount || null, availabilitySeen: form.availabilitySeen || null,
          imageMatches: toBool(form.imageMatches), notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      const body = await res.json();
      setState('saved');
      onSaved(body.review);
    } catch {
      setState('error');
    }
  };

  const field = { display: 'block', width: '100%', padding: '0.45rem', marginTop: '0.2rem', border: '1px solid var(--color-border, #d6d0c7)', borderRadius: '6px', background: '#fff' };
  return (
    <div className="card" style={{ padding: '0.9rem 1rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
        {row.ayna_image_url && <img src={row.ayna_image_url} alt="" width="64" height="64" style={{ objectFit: 'contain', flex: '0 0 64px' }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{row.ayna_display_name}{row.ayna_option_label ? `, ${row.ayna_option_label}` : ''}</p>
          <p style={{ margin: '0.2rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {row.ayna_product_id} · ASIN {asin || 'none'} · Ayna price text: {row.ayna_price_text || 'none'}
          </p>
          <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>Expected: {row.expected_exact_variant}</p>
          <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {row.amazon_variant_status} · {row.review_reason}
          </p>
        </div>
        {row.amazon_link_to_open && (
          <a className="btn btn-outline" href={row.amazon_link_to_open} target="_blank" rel="noopener noreferrer">Open Amazon</a>
        )}
      </div>
      {asin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
          <label>Exact product?<select style={field} value={form.exactProduct} onChange={set('exactProduct')}>{yesNo.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
          <label>Exact size/variant?<select style={field} value={form.exactVariant} onChange={set('exactVariant')}>{yesNo.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
          <label>Size / count on Amazon<input style={field} value={form.verifiedSizeCount} onChange={set('verifiedSizeCount')} placeholder="e.g. 60 capsules" /></label>
          <label>Availability seen<select style={field} value={form.availabilitySeen} onChange={set('availabilitySeen')}>
            <option value="">Not checked</option><option value="AVAILABLE">In stock</option><option value="OUT_OF_STOCK">Out of stock</option><option value="UNAVAILABLE">Unavailable</option>
          </select></label>
          <label>Ayna image matches?<select style={field} value={form.imageMatches} onChange={set('imageMatches')}>{yesNo.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
          <label style={{ gridColumn: '1 / -1' }}>Notes<input style={field} value={form.notes} onChange={set('notes')} /></label>
        </div>
      )}
      {asin && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.6rem' }}>
          <button type="button" className="btn btn-primary" onClick={save} disabled={state === 'saving'}>Save verification</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {state === 'saved' ? 'Saved' : state === 'error' ? 'Could not save' : r.reviewed_at ? `Last reviewed ${new Date(r.reviewed_at).toLocaleString()} by ${r.reviewed_by_email || 'admin'}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AdminAmazonReviewPage({ onBack }) {
  const [status, setStatus] = useState('loading');
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('todo');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const headers = await authHeader().catch(() => null);
      if (!headers) { if (!cancelled) setStatus('unauthenticated'); return; }
      try {
        const res = await fetch('/api/commerce-amazon-review', { headers });
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (res.status === 403) return setStatus('forbidden');
        if (!res.ok) return setStatus('error');
        const body = await res.json();
        setRows(body.rows || []);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(() => rows.filter((r) => (filter === 'all' ? true : filter === 'done' ? r.review : !r.review)), [rows, filter]);
  const done = rows.filter((r) => r.review).length;
  const onSaved = (key) => (review) => setRows((list) => list.map((r) => (`${r.ayna_product_id}|${r.ayna_variant_id}` === key ? { ...r, review } : r)));

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Amazon review</h2>
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
      </div>
      {status === 'loading' && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
      {status === 'unauthenticated' && <p style={{ color: 'var(--color-text-muted)' }}>Sign in with an admin account to see this.</p>}
      {status === 'forbidden' && <p style={{ color: 'var(--color-text-muted)' }}>This account isn't an admin.</p>}
      {status === 'error' && <p style={{ color: 'var(--color-text-muted)' }}>Couldn't load the review queue.</p>}
      {status === 'ok' && (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 0 }}>
            {done} of {rows.length} reviewed. Prices aren't recorded: Amazon only allows showing prices from its API.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['todo', 'done', 'all'].map((f) => (
              <button key={f} type="button" className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                {f === 'todo' ? 'To review' : f === 'done' ? 'Reviewed' : 'All'}
              </button>
            ))}
          </div>
          {shown.map((row) => {
            const key = `${row.ayna_product_id}|${row.ayna_variant_id}`;
            return <ReviewRow key={key} row={row} onSaved={onSaved(key)} />;
          })}
        </>
      )}
    </section>
  );
}
