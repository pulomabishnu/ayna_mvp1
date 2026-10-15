import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import './WebYou.css';
import './free-product/free-product.css';

/**
 * /admin/campaign: team view of the free product campaign. Not linked from any
 * nav. The real gate is server-side: /api/campaign-admin checks ADMIN_EMAILS.
 * Inventory (which products, how many) is edited in Supabase on
 * public.campaign_rewards.
 */
const STATUSES = ['needs_address', 'ready_to_ship', 'shipped', 'delivered', 'canceled'];

async function authed(path, init = {}) {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { status: 401 };
  const res = await fetch(path, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  let body = null;
  try { body = await res.json(); } catch { /* empty */ }
  return { status: res.status, body };
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

export default function AdminCampaignPage({ onBack }) {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  const apply = useCallback((r) => {
    if (r.status === 401) return setState('unauthenticated');
    if (r.status === 403) return setState('forbidden');
    if (r.status !== 200) return setState('error');
    setData(r.body);
    setState('ok');
  }, []);
  const load = useCallback(() => authed('/api/campaign-admin').then(apply), [apply]);
  useEffect(() => {
    let live = true;
    authed('/api/campaign-admin').then((r) => { if (live) apply(r); });
    return () => { live = false; };
  }, [apply]);

  const setStatus = async (claimId, status) => {
    const r = await authed('/api/campaign-admin', { method: 'POST', body: JSON.stringify({ claimId, status }) });
    if (r.status === 200) load();
  };

  if (state !== 'ok') {
    const text = { loading: 'Loading…', unauthenticated: 'Sign in first.', forbidden: "This page is for the ayna team.", error: "Couldn't load campaign data." }[state];
    return <section className="wyou ayfp"><div className="wyou-card ayfp-error"><h1>Free product campaign</h1><p className="wyou-muted">{text}</p>{onBack && <button type="button" className="wyou-btn is-ghost" onClick={onBack}>back</button>}</div></section>;
  }

  const t = data.totals || {};
  return (
    <section className="wyou ayfp ayfp-admin" style={{ maxWidth: 1180 }}>
      <header className="ayfp-stage__head">
        <h1>Free product campaign</h1>
        <p className="wyou-muted">{data.campaign?.is_active ? 'Live' : 'Off'} · started {fmt(data.campaign?.starts_at)}{data.campaign?.ends_at ? ` · ends ${fmt(data.campaign.ends_at)}` : ''}</p>
      </header>

      <ul className="ayfp-reqs" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {[
          ['People started', t.people], ['Own account verified', t.verified], ['All 3 answers', t.feedbackComplete],
          ['Verified referrals', t.verifiedReferrals], ['Eligible, not claimed', t.eligibleUnclaimed], ['Claimed', t.claims],
          ['Avg spins before claim', t.avgSpinsBeforeClaim ?? '–'],
        ].map(([k, v]) => <li key={k} className="ayfp-req tone-paper"><h2>{k}</h2><p className="ayfp-req__value">{v ?? 0}</p></li>)}
      </ul>

      <section className="wyou-card">
        <div className="wyou-card-head"><h2>Inventory</h2><span>edit in Supabase: campaign_rewards</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ayfp-table">
            <thead><tr><th>Product</th><th>Remaining</th><th>Claimed / total</th><th>Shown</th><th>Kept</th><th>Sold out at claim</th><th>Active</th></tr></thead>
            <tbody>{(data.inventory || []).map((r) => (
              <tr key={r.rewardId}><td>{r.brand ? `${r.brand} · ` : ''}{r.name || r.productId}</td><td><strong>{r.remaining}</strong></td><td>{r.claimed} / {r.total}</td><td>{r.shown}</td><td>{r.kept}</td><td>{r.sold_out}</td><td>{r.active ? 'yes' : 'no'}</td></tr>
            ))}</tbody>
          </table>
          {!data.inventory?.length && <p className="wyou-muted">No products in the reward pool yet. Nobody can spin until you add some.</p>}
        </div>
      </section>

      <section className="wyou-card">
        <div className="wyou-card-head"><h2>People</h2><span>{data.people.length}, most verified referrals first</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ayfp-table">
            <thead><tr><th>Email</th><th>Verified</th><th>Answers</th><th>Friends (verified / joined)</th><th>Eligible</th><th>Spins</th><th>Claimed</th><th>Fulfillment</th><th /></tr></thead>
            <tbody>{data.people.map((p) => {
              const answers = [p.feedback_like, p.feedback_friction, p.feedback_change].filter(Boolean).length;
              const isOpen = open === p.user_id;
              return [
                <tr key={p.user_id}>
                  <td>{p.email}</td><td>{p.account_verified ? 'yes' : 'no'}</td><td>{answers}/3</td>
                  <td>{p.referrals_verified} / {p.referrals_joined}</td><td>{p.eligible_now ? 'yes' : ''}</td><td>{p.spins}</td>
                  <td>{p.claimed_product_name ? `${p.claimed_product_name} · ${fmt(p.claimed_at)}` : ''}</td>
                  <td>{p.claim_id ? (
                    <select aria-label={`Fulfillment status for ${p.email}`} value={p.fulfillment_status} onChange={(e) => setStatus(p.claim_id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  ) : ''}</td>
                  <td><button type="button" className="ayfp-link" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.user_id)}>{isOpen ? 'hide' : 'details'}</button></td>
                </tr>,
                isOpen && (
                  <tr key={`${p.user_id}-d`} className="ayfp-table__detail"><td colSpan={9}>
                    <dl>
                      <dt>Likes</dt><dd>{p.feedback_like || '–'}</dd>
                      <dt>Confusing / annoying</dt><dd>{p.feedback_friction || '–'}</dd>
                      <dt>Would change</dt><dd>{p.feedback_change || '–'}</dd>
                      {p.shipping && <><dt>Ship to</dt><dd>{p.shipping.full_name}, {p.shipping.address_line1}{p.shipping.address_line2 ? `, ${p.shipping.address_line2}` : ''}, {p.shipping.city}, {p.shipping.state} {p.shipping.postal_code} · {p.shipping.email}</dd></>}
                    </dl>
                  </td></tr>
                ),
              ];
            })}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
