import React, { useCallback, useEffect, useState } from 'react';
import '../styles/free-product.css';
import { adminAction, getAdminOverview } from './freeProduct/campaignClient';
import { FEEDBACK_QUESTIONS, FULFILLMENT_LABELS, REFERRAL_STATUS_LABELS } from '../utils/freeProductCampaign';

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

export default function CampaignAdminPage({ onBack }) {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState({ productId: '', inventoryTotal: 5 });
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
    } catch (e) {
      setMsg(e.body?.message || `Could not save (${e.code}).`);
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
          {!c.starts_at && <button type="button" className="fp-btn is-ink" onClick={() => { if (window.confirm('Launch now? Friends who join from this moment count.')) act({ action: 'campaign', state: 'launch' }); }}>Launch</button>}
          {c.starts_at && live && <button type="button" className="fp-btn" onClick={() => act({ action: 'campaign', state: 'pause' })}>Pause</button>}
          {c.starts_at && !c.is_active && <button type="button" className="fp-btn" onClick={() => act({ action: 'campaign', state: 'resume' })}>Resume</button>}
          {c.starts_at && !c.ends_at && <button type="button" className="fp-btn is-ghost" onClick={() => { if (window.confirm('End the campaign? No more spins or claims.')) act({ action: 'campaign', state: 'end' }); }}>End</button>}
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

      <section className="fp-section">
        <div className="fp-section__head"><h2>Reward pool</h2><p>Only these products can be won. A product with 0 left is never offered.</p></div>
        <div className="fp-panel" style={{ overflowX: 'auto' }}>
          <table className="fp-table">
            <thead><tr><th>Product</th><th>Total</th><th>Claimed</th><th>Left</th><th>Shown</th><th>Active</th><th /></tr></thead>
            <tbody>
              {data.inventory.map((r) => (
                <tr key={r.rewardProductId}>
                  <td><b>{r.name}</b><br /><small>{r.brand} · {r.productId}</small></td>
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
          <form style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); act({ action: 'add_product', ...adding, inventoryTotal: Number(adding.inventoryTotal) }, 'Added to the pool.'); }}>
            <label className="fp-field" style={{ flex: '1 1 240px' }}><span>Catalog product id</span><input value={adding.productId} placeholder="p-uqora-control" onChange={(e) => setAdding((a) => ({ ...a, productId: e.target.value }))} /></label>
            <label className="fp-field" style={{ width: 120 }}><span>Units</span><input type="number" min={1} value={adding.inventoryTotal} onChange={(e) => setAdding((a) => ({ ...a, inventoryTotal: e.target.value }))} /></label>
            <button type="submit" className="fp-btn is-ink">Add to pool</button>
          </form>
        </div>
      </section>

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
