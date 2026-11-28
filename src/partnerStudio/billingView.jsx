/* Sales & billing: the plan, how commission would work, and what ayna can and
   can't measure yet. No invented sales: until attribution is connected, the
   page shows clicks to retailer as the leading signal and says so. */
import React from 'react';
import { Kpi } from './ui.jsx';
import { Panel, Method } from './charts.jsx';
import { ENG_RANGE } from './engine/engagement.js';
import { brandSnapshot } from './engine/market.js';

const STEPS = [
  { t: 'Affiliate or tracked links on every product', d: 'Each product links out through a tracked link (an affiliate network, Shopify collabs or a brand code) so a sale can be credited to ayna.', state: 'Partly in place' },
  { t: 'Order confirmations sent back', d: 'The network or the brand reports confirmed orders and refunds. Clicks alone are never billed.', state: 'Not connected' },
  { t: 'Monthly statement', d: 'Verified orders, refunds and the commission due, with a downloadable statement and invoice.', state: 'Not built' },
];

export function Billing({ data, b }) {
  const name = b.displayName || b.brand || b.name;
  const s = brandSnapshot(data.catalog, b.brand || b.name);
  return (
    <>
      <div className="ps-filters">
        <span className="ps-small ps-muted">Preview for the ayna team. Pricing and commission terms are proposed and not in effect. Nothing on this page charges anyone.</span>
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="tag" label="Plan" value="Basic" den="$39 a month or $390 a year, proposed" info="The plan the founders agreed to test first. Not live: there is no checkout for brands yet." /></div>
        <div className="b-4"><Kpi tone="pink" icon="share" label="Clicks to retailer" value={String(s.tot.buy)} den={`${ENG_RANGE}, the signal before a sale`} info="Different people who pressed a buy or retailer button on one of your products. A click is not a purchase and is never billed." /></div>
        <div className="b-4"><Kpi tone="butter" icon="doc" label="Verified sales" value="Not connected" den="needs order confirmations from a network or the brand" /></div>
        <Panel className="b-6" id="bl-terms" title="How commission would work" info="Proposed terms from the founder discussion. Not in effect until both sides sign.">
          <ul className="ps-why-list">
            <li><span>Commission rate<small>On verified sales attributed to ayna</small></span><b>10% proposed</b></li>
            <li><span>What counts<small>Confirmed orders only; refunds and cancellations are taken back out</small></span><b>Verified orders</b></li>
            <li><span>Existing affiliate deals<small>Honored as signed; a sale is never charged twice</small></span><b>No double charges</b></li>
            <li><span>Rankings<small>Paying for Partner Studio or commission never changes recommendations</small></span><b>Never affected</b></li>
          </ul>
        </Panel>
        <Panel className="b-6" id="bl-steps" title="What it takes to report sales" info="The pieces needed before this page can show real sales and commission.">
          <ol className="ps-why-moves">
            {STEPS.map((st, k) => <li key={st.t}><span className="ps-steps-n">{k + 1}</span><span><b>{st.t}</b><small>{st.d}</small><small><b>{st.state}</b></small></span></li>)}
          </ol>
        </Panel>
        <Panel className="b-12" id="bl-invoices" title="Statements and invoices">
          <p className="ps-small">No statements yet. When sales reporting is connected, {name}’s monthly statements and invoices appear here with verified orders, refunds and commission.</p>
        </Panel>
      </div>
      <Method updated={ENG_RANGE} scope="proposed terms" items={[
        'Clicks to retailer come from the ayna app and website. They show interest, not purchases, and are never billed.',
        'Verified sales need confirmation from an affiliate network or the brand. Until then ayna shows no sales figures.',
        'Pricing ($39 a month, $390 a year) and the 10% commission are the founders’ proposal for the pilot, not live terms.',
      ]} />
    </>
  );
}
