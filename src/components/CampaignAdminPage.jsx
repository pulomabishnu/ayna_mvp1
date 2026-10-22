import React, { useCallback, useEffect, useState } from 'react';
import '../styles/free-product.css';
import { adminAction, getAdminOverview } from './freeProduct/campaignClient';
import { FEEDBACK_QUESTIONS, FULFILLMENT_LABELS, REFERRAL_STATUS_LABELS, feedbackAsText, feedbackByQuestion, vintedIdsFromText } from '../utils/freeProductCampaign';
import ConfirmButton from './ui/ConfirmButton.jsx';

/**
 * Internal view of the free product campaign: /admin/campaign. Not linked from
 * any nav. The real gate is server-side: api/campaign-admin checks the caller
 * against ADMIN_EMAILS (same as /admin/reviews) and 403s everyone else.
 */
const STATUS_OPTIONS = Object.keys(FULFILLMENT_LABELS);

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(people) {
  const head = ['email', 'verified', ...FEEDBACK_QUESTIONS.map((q) => `feedback_${q.key}`), 'verified_friends', 'eligible', 'spins', 'claimed_product', 'claimed_at', 'fulfillment', 'ship_name', 'ship_address', 'ship_city', 'ship_state', 'ship_zip', 'ship_email'];
  const rows = people.map((p) => {
    const s = p.claim?.shipping || {};
    return [p.email, p.verified, ...FEEDBACK_QUESTIONS.map((q) => p.feedback?.[q.key]?.response || ''), p.referralsVerified, p.eligible, p.spins,
      p.claim?.productName || '', p.claim?.claimedAt || '', p.claim?.fulfillmentStatus || '',
      s.full_name || '', [s.address_line1, s.address_line2].filter(Boolean).join(', '), s.city || '', s.state || '', s.postal_code || '', s.email || ''];
  });
  const blob = new Blob([[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `free-product-campaign-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Every answer, grouped by question, so the team can read them without opening people one by one. */
function AllFeedback({ people }) {
  const [tab, setTab] = useState(FEEDBACK_QUESTIONS[0].key);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const groups = feedbackByQuestion(people, { search });
  const totals = Object.fromEntries(feedbackByQuestion(people).map((g) => [g.key, g.answers.length]));
  const group = groups.find((g) => g.key === tab) || groups[0];
  const copy = async () => {
    try { await navigator.clipboard.writeText(feedbackAsText(group)); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  return (
    <section className="fp-section" aria-labelledby="fp-allfb-h">
      <div className="fp-section__head"><h2 id="fp-allfb-h">All feedback</h2><p>Every answer people wrote, newest first. Answers still being written are marked in progress.</p></div>
      <div className="fp-panel fp-allfb">
        <div className="fp-allfb__bar">
          <div className="fp-allfb__tabs" role="tablist" aria-label="Question">
            {FEEDBACK_QUESTIONS.map((q) => (
              <button key={q.key} type="button" role="tab" aria-selected={tab === q.key} className={tab === q.key ? 'is-on' : ''} onClick={() => setTab(q.key)}>
                {q.title} <span>{totals[q.key] || 0}</span>
              </button>
            ))}
          </div>
          <input type="search" className="fp-allfb__search" placeholder="Search answers or emails" aria-label="Search answers or emails" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="fp-allfb__q">{group.question}</p>
        {group.answers.length ? (
          <>
            <ul className="fp-allfb__list">
              {group.answers.map((a) => (
                <li key={a.userId}>
                  <p>{a.response}</p>
                  <small>{a.email}{a.updatedAt ? ` · ${new Date(a.updatedAt).toLocaleString()}` : ''}{a.complete ? '' : ' · in progress'}</small>
                </li>
              ))}
            </ul>
            <button type="button" className="fp-btn is-ghost" onClick={copy}>{copied ? 'Copied' : `Copy all ${group.answers.length}`}</button>
          </>
        ) : <p className="fp-allfb__empty">{search ? 'No answers match.' : 'No answers yet.'}</p>}
      </div>
    </section>
  );
}

/** Ameera's Vinted listings that are prizes. A sold listing can't be won. */
const VINTED_LABELS = { available: 'For sale', reserved: 'Reserved', sold: 'Sold' };

function VintedPrizes({ act }) {
  const [rows, setRows] = useState(null);
  const [paste, setPaste] = useState('');
  const refresh = useCallback(() => adminAction({ action: 'vinted_list' }).then((r) => setRows(r.listings || []), () => setRows([])), []);
  useEffect(() => { refresh(); }, [refresh]);
  if (!rows || !rows.length) return null;
  const mark = async (results, done) => { if (await act({ action: 'vinted', results }, done)) refresh(); };
  const known = new Set(rows.map((r) => String(r.listing_id)));
  const pasted = vintedIdsFromText(paste).filter((id) => known.has(id));
  const forSale = rows.filter((r) => r.status === 'available' && !r.claimed).length;
  return (
    <section className="fp-section" aria-labelledby="fp-vinted-h">
      <div className="fp-section__head">
        <h2 id="fp-vinted-h">Vinted prizes</h2>
        <p>{forSale} of {rows.length} listings can still be won. Checked daily; a listing marked sold leaves the pool (a unit already won stays won). Their units follow these listings, so change them here, not in the pool total.</p>
      </div>
      <div className="fp-panel" style={{ overflowX: 'auto' }}>
        <form className="fp-additem" onSubmit={(e) => { e.preventDefault(); if (pasted.length) mark(pasted.map((id) => ({ listingId: id, status: 'sold' })), `Marked ${pasted.length} sold.`).then(() => setPaste('')); }}>
          <label className="fp-field" style={{ gridColumn: '1 / -1' }}><span>Sold on Vinted? Paste the listing links or ids</span>
            <textarea rows={2} value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Sold Vinted listing links or ids" />
          </label>
          <button type="submit" className="fp-btn is-ink" disabled={!pasted.length}>Mark {pasted.length || ''} sold</button>
        </form>
        <table className="fp-table">
          <thead><tr><th>Product</th><th>Listing</th><th>On Vinted</th><th>Won</th><th>Last checked</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.listing_id} data-vinted-listing={r.listing_id} data-vinted-status={r.status}>
                <td><b>{r.product}</b></td>
                <td><a href={`https://www.vinted.com/items/${r.listing_id}`} target="_blank" rel="noreferrer">{r.listing_id}</a></td>
                <td>{VINTED_LABELS[r.status] || r.status}</td>
                <td>{r.claimed ? 'Yes' : ''}</td>
                <td>{r.last_checked_at ? new Date(r.last_checked_at).toLocaleDateString() : 'Not yet'}</td>
                <td>
                  {r.status !== 'sold' && <button type="button" className="fp-link" onClick={() => mark([{ listingId: String(r.listing_id), status: 'sold' }], 'Marked sold.')}>Mark sold</button>}
                  {r.status !== 'available' && <button type="button" className="fp-link" onClick={() => mark([{ listingId: String(r.listing_id), status: 'available' }], 'Back in the pool.')}>For sale again</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function CampaignAdminPage({ onBack }) {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const EMPTY_ITEM = { brand: '', name: '', size: '', imageUrl: '', productUrl: '', inventoryTotal: 1 };
  const [adding, setAdding] = useState(EMPTY_ITEM);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => getAdminOverview().then(
    (d) => { setData(d); setState('ok'); },
    (e) => setState(e.status === 403 ? 'forbidden' : e.status === 401 ? 'unauthenticated' : 'error'),
  ), []);
  useEffect(() => {
    let active = true;
    getAdminOverview().then(
      (d) => { if (active) { setData(d); setState('ok'); } },
      (e) => { if (active) setState(e.status === 403 ? 'forbidden' : e.status === 401 ? 'unauthenticated' : 'error'); },
    );
    return () => { active = false; };
  }, []);

  const act = async (body, done) => {
    setMsg('');
    try {
      const r = await adminAction(body);
      setMsg(done || (r.emailed ? 'Saved. Shipping email sent.' : 'Saved.'));
      await load();
      return true;
    } catch (e) {
      setMsg(e.body?.message || `Could not save (${e.code}).`);
      return false;
    }
  };

  if (state !== 'ok') {
    return (
      <section className="fp mockup-page">
        <header className="fp-head ay3-band ay3-band--paper"><h1 className="fp-h1">Free product campaign</h1></header>
        <p className="fp-sub">{{ loading: 'Loading…', forbidden: 'This page is for the ayna team.', unauthenticated: 'Sign in with an admin account to see this.', error: 'Could not load the campaign.' }[state]}</p>
        <button type="button" className="fp-btn" onClick={onBack}>Back</button>
      </section>
    );
  }

  const c = data.campaign;
  if (!c) return <section className="fp mockup-page"><h1 className="fp-h1">Campaign not found</h1><p className="fp-sub">Apply supabase/migrations/20261015120000_free_product_campaign.sql first.</p></section>;
  const live = c.is_active && c.starts_at && (!c.ends_at || new Date(c.ends_at) > new Date());
  const t = data.totals;

  return (
    <section className="fp fp-admin mockup-page">
      <header className="fp-head ay3-band ay3-band--paper">
        <p className="fp-kicker">Team only</p>
        <h1 className="fp-h1">Free product campaign</h1>
        <p className="fp-sub">
          {live ? 'Live' : c.starts_at ? (c.ends_at && new Date(c.ends_at) <= new Date() ? 'Ended' : 'Paused') : 'Not launched'}
          {c.starts_at ? `. Friends count if they joined after ${new Date(c.starts_at).toLocaleString()}.` : '. Nothing is visible to anyone until you launch.'}
        </p>
        <div className="fp-actions">
          {!c.starts_at && <ConfirmButton className="fp-btn is-ink ay-confirm" armedLabel="Tap again to launch now" onConfirm={() => act({ action: 'campaign', state: 'launch' })}>Launch</ConfirmButton>}
          {c.starts_at && live && <button type="button" className="fp-btn" onClick={() => act({ action: 'campaign', state: 'pause' })}>Pause</button>}
          {c.starts_at && !c.is_active && <button type="button" className="fp-btn" onClick={() => act({ action: 'campaign', state: 'resume' })}>Resume</button>}
          {c.starts_at && !c.ends_at && <ConfirmButton className="fp-btn is-ghost ay-confirm" armedLabel="Tap again to end. No more spins or claims." onConfirm={() => act({ action: 'campaign', state: 'end' })}>End</ConfirmButton>}
          <button type="button" className="fp-btn is-ghost" onClick={() => downloadCsv(data.people)}>Export CSV</button>
          <button type="button" className="fp-btn is-ghost" onClick={onBack}>Back</button>
        </div>
      </header>
      {msg && <div className="fp-notice tone-soft" role="status"><div>{msg}</div></div>}

      <ul className="fp-steps" aria-label="Totals">
        {[['Participants', t.participants], ['All 3 answers', t.feedbackDone], ['Requirements met', t.requirementsMet], ['Spins', t.spins], ['Claims', t.claims], ['Waiting for stock', t.waitingForStock]].map(([k, v]) => (
          <li key={k} className="fp-step" style={{ padding: 16 }}><h2>{k}</h2><p className="fp-step__big">{v}</p></li>
        ))}
      </ul>

      <AllFeedback people={data.people} />

      <section className="fp-section">
        <div className="fp-section__head"><h2>Reward pool</h2><p>Only these products can be won. A product with 0 left is never offered.</p></div>
        <div className="fp-panel" style={{ overflowX: 'auto' }}>
          <table className="fp-table">
            <thead><tr><th>Product</th><th>Total</th><th>Claimed</th><th>Left</th><th>Shown</th><th>Active</th><th /></tr></thead>
            <tbody>
              {data.inventory.map((r) => (
                <tr key={r.rewardProductId}>
                  <td><b>{r.name}</b><br /><small>{[r.brand, r.size].filter(Boolean).join(' · ')}{r.productId ? ` · ${r.productId}` : ''}</small></td>
                  <td>
                    <input type="number" min={r.inventoryClaimed} defaultValue={r.inventoryTotal} aria-label={`Total units of ${r.name}`} style={{ width: 80 }}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== r.inventoryTotal) act({ action: 'inventory', rewardProductId: r.rewardProductId, inventoryTotal: v }); }} />
                  </td>
                  <td>{r.inventoryClaimed}</td>
                  <td><b>{r.inventoryRemaining}</b></td>
                  <td>{r.timesShown}</td>
                  <td>{r.isActive ? 'Yes' : 'No'}</td>
                  <td><button type="button" className="fp-link" onClick={() => act({ action: 'inventory', rewardProductId: r.rewardProductId, isActive: !r.isActive })}>{r.isActive ? 'Turn off' : 'Turn on'}</button></td>
                </tr>
              ))}
              {!data.inventory.length && <tr><td colSpan={7}>No products yet. Add one below.</td></tr>}
            </tbody>
          </table>
          <form className="fp-additem" onSubmit={(e) => { e.preventDefault(); act({ action: 'add_product', ...adding, inventoryTotal: Number(adding.inventoryTotal) }, 'Added to the pool.').then((ok) => { if (ok) setAdding(EMPTY_ITEM); }); }}>
            <h3>Add a product</h3>
            <label className="fp-field"><span>Brand</span><input value={adding.brand} onChange={(e) => setAdding((a) => ({ ...a, brand: e.target.value }))} /></label>
            <label className="fp-field"><span>Product</span><input value={adding.name} onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))} /></label>
            <label className="fp-field"><span>Size (optional)</span><input value={adding.size} onChange={(e) => setAdding((a) => ({ ...a, size: e.target.value }))} /></label>
            <label className="fp-field"><span>Units</span><input type="number" min={1} value={adding.inventoryTotal} onChange={(e) => setAdding((a) => ({ ...a, inventoryTotal: e.target.value }))} /></label>
            <label className="fp-field" style={{ gridColumn: '1 / -1' }}><span>Photo URL (https)</span><input value={adding.imageUrl} onChange={(e) => setAdding((a) => ({ ...a, imageUrl: e.target.value }))} /></label>
            <label className="fp-field" style={{ gridColumn: '1 / -1' }}><span>Product page URL (optional)</span><input value={adding.productUrl} onChange={(e) => setAdding((a) => ({ ...a, productUrl: e.target.value }))} /></label>
            <button type="submit" className="fp-btn is-ink">Add to pool</button>
          </form>
        </div>
      </section>

      <VintedPrizes act={act} />

      <section className="fp-section">
        <div className="fp-section__head"><h2>People</h2><p>Sorted by verified friends. Shipping details are shown here only.</p></div>
        <div className="fp-panel" style={{ overflowX: 'auto' }}>
          <table className="fp-table">
            <thead><tr><th>User</th><th>Verified</th><th>Answers</th><th>Friends</th><th>Eligible</th><th>Spins</th><th>Claimed</th><th>Fulfillment</th></tr></thead>
            <tbody>
              {data.people.map((p) => (
                <React.Fragment key={p.userId}>
                  <tr>
                    <td><button type="button" className="fp-link" aria-expanded={open === p.userId} onClick={() => setOpen(open === p.userId ? null : p.userId)}>{p.email}</button></td>
                    <td>{p.verified ? 'Yes' : 'No'}</td>
                    <td>{FEEDBACK_QUESTIONS.filter((q) => p.feedback?.[q.key]?.complete).length}/3</td>
                    <td>{p.referralsVerified}</td>
                    <td>{p.claim ? 'Claimed' : p.eligible ? 'Yes' : p.requirementsMet ? 'Met (not live)' : 'No'}</td>
                    <td>{p.spins}</td>
                    <td>{p.claim ? <>{p.claim.productName}<br /><small>{new Date(p.claim.claimedAt).toLocaleString()} · after {p.claim.spinsBeforeClaim} spin{p.claim.spinsBeforeClaim === 1 ? '' : 's'}</small></> : '–'}</td>
                    <td>{p.claim ? (
                      <select aria-label={`Fulfillment for ${p.email}`} value={p.claim.fulfillmentStatus} onChange={(e) => act({ action: 'fulfillment', claimId: p.claim.id, status: e.target.value })}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{FULFILLMENT_LABELS[s]}</option>)}
                      </select>
                    ) : '–'}</td>
                  </tr>
                  {open === p.userId && (
                    <tr><td colSpan={8}>
                      <div style={{ display: 'grid', gap: 12, padding: '8px 0' }}>
                        {FEEDBACK_QUESTIONS.map((q) => (
                          <div key={q.key}><b>{q.question}</b><p style={{ margin: '4px 0 0' }}>{p.feedback?.[q.key]?.response || <i>No answer</i>}</p></div>
                        ))}
                        <div><b>Friends</b><ul style={{ margin: '4px 0 0' }}>{(p.referrals || []).map((r, i) => <li key={i}>{r.label || 'Friend'}: {REFERRAL_STATUS_LABELS[r.status]} (joined {new Date(r.joinedAt).toLocaleDateString()})</li>)}{!(p.referrals || []).length && <li>None yet</li>}</ul></div>
                        {p.claim?.shipping && <div><b>Ship to</b><p style={{ margin: '4px 0 0' }}>{p.claim.shipping.full_name}, {p.claim.shipping.address_line1}{p.claim.shipping.address_line2 ? `, ${p.claim.shipping.address_line2}` : ''}, {p.claim.shipping.city}, {p.claim.shipping.state} {p.claim.shipping.postal_code} · {p.claim.shipping.email}</p></div>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
              {!data.people.length && <tr><td colSpan={8}>Nobody has started yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
