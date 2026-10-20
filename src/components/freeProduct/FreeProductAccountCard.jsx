import React, { useEffect, useState } from 'react';
import { getCampaignStatus } from './campaignClient';
import { FULFILLMENT_LABELS } from '../../utils/freeProductCampaign';
import '../../styles/free-product-card.css';

/**
 * "Claim a free product" banner near the top of the You page. While the
 * campaign is live it shows progress and a button to the campaign page; after
 * a claim it shows the product and its shipping status. Renders nothing when
 * there is no live campaign, so the page looks exactly as before.
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
    const needsAddress = status.claim.fulfillmentStatus === 'needs_shipping';
    return (
      <section className="fpc is-claimed" aria-labelledby="fpc-h">
        <div className="fpc__body">
          <span className="fpc__tag">{FULFILLMENT_LABELS[status.claim.fulfillmentStatus]}</span>
          <h2 id="fpc-h">Your free product</h2>
          <p><b>{status.claim.product?.name}</b>{status.claim.product?.brand ? ` · ${status.claim.product.brand}` : ''} · Claimed {date}</p>
        </div>
        <button type="button" className="fpc__cta" onClick={onOpen}>{needsAddress ? 'Add your address' : 'See details'}</button>
      </section>
    );
  }
  if (!c.live) return null;

  const answers = Math.min(status.feedbackComplete, c.feedbackRequired);
  const friends = Math.min(status.referralsVerified, c.referralsRequired);
  return (
    <section className="fpc" aria-labelledby="fpc-h">
      <div className="fpc__body">
        <span className="fpc__tag">{status.eligible ? 'Earned' : 'Free, on us'}</span>
        <h2 id="fpc-h">{status.eligible ? 'Your free product is ready' : 'Claim a free product'}</h2>
        <p>
          {status.eligible
            ? 'You did it. Spin and pick the one you want.'
            : `Answer ${c.feedbackRequired} quick questions and invite ${c.referralsRequired} friends. So far: ${answers}/${c.feedbackRequired} answers, ${friends}/${c.referralsRequired} friends.`}
        </p>
      </div>
      <button type="button" className="fpc__cta" onClick={onOpen}>{status.eligible ? 'Pick my free product' : 'Claim free product'}</button>
    </section>
  );
}
