import { useEffect, useState } from 'react';
import { loadCampaignStatus } from '../../utils/campaignClient';
import { remainingLabel } from '../../utils/campaignRules';
import './free-product.css';

const STATUS_LABEL = {
  needs_address: 'Needs an address', ready_to_ship: 'Address received', shipped: 'Shipped', delivered: 'Delivered', canceled: 'Canceled',
};

/** Small card on /you: claimed reward, or progress toward it. Hidden when there's nothing to show. */
export default function FreeProductCard({ userId, onOpen }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    loadCampaignStatus().then((r) => { if (live && !r.error) setS(r); });
    return () => { live = false; };
  }, [userId]);

  if (!s) return null;
  if (s.claim) {
    const date = s.claim.claimedAt ? new Date(s.claim.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    return (
      <section className="wyou-card ayfp-you" aria-labelledby="ayfp-you-title">
        <div className="wyou-card-head"><h2 id="ayfp-you-title">Your free product</h2><span>{STATUS_LABEL[s.claim.status] || ''}</span></div>
        <div className="ayfp-you__row">
          <p><strong>{s.claim.product?.name}</strong>{s.claim.product?.brand ? ` by ${s.claim.product.brand}` : ''}<br /><span className="wyou-muted">Claimed {date}</span></p>
          <button type="button" className="wyou-btn is-ghost" onClick={onOpen}>{s.claim.status === 'needs_address' ? 'add your address' : 'see details'}</button>
        </div>
      </section>
    );
  }
  if (!s.campaign?.open) return null;
  const fb = s.feedbackDone?.length || 0;
  const req = s.friendsRequired || 3;
  const fr = Math.min(req, s.friendsVerified || 0);
  return (
    <section className="wyou-card ayfp-you" aria-labelledby="ayfp-you-title">
      <div className="wyou-card-head"><h2 id="ayfp-you-title">Free product</h2><span>{s.eligible ? 'Unlocked' : 'In progress'}</span></div>
      <div className="ayfp-you__bars">
        <div aria-label={`Feedback ${fb} of 3`}><span aria-hidden="true">Feedback {fb}/3</span><i aria-hidden="true"><em style={{ width: `${(fb / 3) * 100}%` }} /></i></div>
        <div aria-label={`Verified friends ${fr} of ${req}`}><span aria-hidden="true">Friends {fr}/{req}</span><i aria-hidden="true"><em style={{ width: `${(fr / req) * 100}%` }} /></i></div>
      </div>
      <div className="ayfp-you__row">
        <p>{remainingLabel(s)}</p>
        <button type="button" className="wyou-btn" onClick={onOpen}>{s.eligible ? 'unlock my free product' : 'see my progress'}</button>
      </div>
    </section>
  );
}
