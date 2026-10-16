import React, { useEffect, useState } from 'react';
import { getCampaignStatus } from './campaignClient';
import { FULFILLMENT_LABELS } from '../../utils/freeProductCampaign';

/**
 * Small card on the You page: the claimed reward (product, date, status), or
 * progress while the campaign is running. Renders nothing otherwise, so the
 * page looks exactly as before when there is no campaign.
 */
export default function FreeProductAccountCard({ onOpen }) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let active = true;
    getCampaignStatus().then((s) => { if (active) setStatus(s); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!status?.campaign) return null;
  const c = status.campaign;

  if (status.claim) {
    const date = new Date(status.claim.claimedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <section className="wyou-card">
        <div className="wyou-card-head"><h2>Your free product</h2><span>{FULFILLMENT_LABELS[status.claim.fulfillmentStatus]}</span></div>
        <p style={{ margin: 0, font: '600 16px/24px var(--ay-font-ui)' }}>{status.claim.product?.name}</p>
        <p className="wyou-muted" style={{ marginTop: 4 }}>{status.claim.product?.brand ? `${status.claim.product.brand} · ` : ''}Claimed {date}</p>
        <button type="button" className="wyou-btn is-ghost" style={{ marginTop: 16 }} onClick={onOpen}>
          {status.claim.fulfillmentStatus === 'needs_shipping' ? 'Add your address' : 'See details'}
        </button>
      </section>
    );
  }
  if (!c.live) return null;
  return (
    <section className="wyou-card">
      <div className="wyou-card-head"><h2>Free product</h2><span>{status.eligible ? 'Unlocked' : 'In progress'}</span></div>
      <p className="wyou-muted" style={{ margin: 0 }}>
        {status.feedbackComplete}/{c.feedbackRequired} answers · {Math.min(status.referralsVerified, c.referralsRequired)}/{c.referralsRequired} verified friends
      </p>
      <button type="button" className="wyou-btn is-ghost" style={{ marginTop: 16 }} onClick={onOpen}>
        {status.eligible ? 'Pick my free product' : 'Keep going'}
      </button>
    </section>
  );
}
