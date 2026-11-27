/* Partner Studio screens. Each one follows a section of the Phase 1 plan (page numbers in comments). */
import React, { useMemo, useState } from 'react';
import { Kpi, HBar, SyntheticBadge, DraftBadge, Empty, CardHead, Heatmap, ReasonStack, Drawer, Ring } from './ui.jsx';
import { fmtPct, ratePct, money, SYNTHETIC } from './format.js';
import { explore } from './engine/explore.js';

/* Evidence statuses in the plan's own words (p.4). Every status is a draft until a reviewer signs it off. */
const STATUS_LABEL = {
  direct: 'Direct relevant documentation',
  indirect: 'Indirect relevant documentation',
  regulatory_only: 'Indirect: regulatory record only',
  brand_reported: 'Not located in reviewed sources',
  experience_only: 'Not located in reviewed sources',
  not_located: 'Not located in reviewed sources',
};
const STATUS_NOTE = {
  regulatory_only: 'A clearance or registration is not evidence for every marketing claim.',
  brand_reported: 'The brand cites a study ayna has not located yet.',
  experience_only: 'Only user experience or reviews were found.',
};
const STATUS_TONE = { direct: 'ps-chip--ink', indirect: 'ps-chip--blue', regulatory_only: 'ps-chip--blue', brand_reported: 'ps-chip--dash', experience_only: 'ps-chip--dash', not_located: 'ps-chip--dash' };
const TIER_LABEL = { safety: 'Safety or regulatory', evidence: 'Evidence', documentation: 'Documentation', differentiation: 'Differentiation' };
const STAGE_LABEL = { selected: 'Made the top 3', eligible_lost: 'Fit, but missed the top 3', insufficient_info: 'On hold for a missing fact', excluded: 'Not safe for that shopper', out_of_scope: 'Not relevant' };

function StatusChip({ status }) {
  if (!status) return <span className="ps-small ps-muted">Not stated</span>;
  return <span className={`ps-chip ${STATUS_TONE[status]}`} title={STATUS_NOTE[status] || ''}>{STATUS_LABEL[status]}</span>;
}

export function OutOfScope({ b, outOfScope }) {
  return (
    <Empty title={`${b.displayName || b.brand} isn't in a Phase 1 category yet`}>
      <p>Phase 1 benchmarks period care, intimate care, and bladder and pelvic floor. {outOfScope}</p>
      <ul>{(b.skus || []).map((s) => <li key={s.id}><strong>{s.name}</strong>: {s.scopeNote}</li>)}</ul>
    </Empty>
  );
}

export function CategoryTabs({ cats, cat, setCat }) {
  if (cats.length < 2) return null;
  return (
    <div className="ps-tabs" role="group" aria-label="Category">
      {cats.map((c) => <button key={c.id} type="button" className="ps-tab" aria-pressed={c.id === cat.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
    </div>
  );
}

function ProductPicker({ items, value, onChange, label = 'Your product' }) {
  if (items.length < 2) return null;
  return (
    <label className="ps-field-label">{label}
      <select className="ps-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {items.map((c, k) => <option key={c.sku} value={k}>{c.name}</option>)}
      </select>
    </label>
  );
}

function PartnerTag() {
  return <span className="ps-tag" title="This brand partners with ayna. Partner status never changes rankings.">ayna partner</span>;
}

function RankKey() {
  return <p className="ps-small ps-muted"><span className="ps-key is-pink" /> Your brand <span className="ps-tag">ayna partner</span> Brands that partner with ayna. Partnering never changes where a product ranks.</p>;
}

/** Brand ranking with real names: every brand in the benchmark universe, by slots won. */
function BrandRanking({ rows, brand, limit = 10, totalSlots }) {
  const [all, setAll] = useState(false);
  const youIdx = rows.findIndex((r) => r.brand === brand);
  let shown = all ? rows : rows.slice(0, limit);
  if (!all && youIdx >= limit) shown = [...rows.slice(0, limit - 1), rows[youIdx]];
  const top = Math.max(...rows.map((r) => r.slots), 1);
  return (
    <div className="ps-rank" role="table" aria-label="Brand ranking by recommendation slots">
      <div className="ps-rank-row ps-rank-head" role="row"><span role="columnheader">#</span><span role="columnheader">Brand</span><span role="columnheader">Times in top 3</span><span role="columnheader" className="ps-r">Share</span></div>
      {shown.map((r) => (
        <div key={r.brand} role="row" className={`ps-rank-row${r.brand === brand ? ' is-you' : ''}`}>
          <span role="cell" className="ps-rank-n">{r.rank}</span>
          <span role="cell" className="ps-rank-name"><span>{r.brand}{r.brand === brand ? <em> (you)</em> : null}{r.partner && r.brand !== brand ? <PartnerTag /> : null}</span><small>{r.products} product{r.products === 1 ? '' : 's'}</small></span>
          <span role="cell" className="ps-rank-bar"><span style={{ width: `${(r.slots / top) * 100}%` }} /><b>{r.slots}</b></span>
          <span role="cell" className="ps-r ps-rank-share">{r.share == null ? 'N/A' : `${r.share}%`}</span>
        </div>
      ))}
      <div className="ps-rank-foot">
        <span className="ps-small ps-muted">{rows.length} brands · {totalSlots} top-3 picks in total</span>
        {rows.length > limit ? <button type="button" className="ps-link" onClick={() => setAll((v) => !v)}>{all ? 'Show top 10' : `Show all ${rows.length}`}</button> : null}
      </div>
    </div>
  );
}

/** Product ranking (p.8 product-level drill-down): every catalog product in the universe. */
function ProductRanking({ rows, limit = 15 }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : [...rows.slice(0, limit), ...rows.slice(limit).filter((r) => r.you)];
  return (
    <>
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead><tr><th>#</th><th>Product</th><th>Brand</th><th className="ps-r">Times in top 3</th><th className="ps-r">Share</th></tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className={p.you ? 'is-you' : ''}>
                <td className="ps-rank-n">{p.rank}</td>
                <td><strong>{p.name}</strong>{p.partner && !p.you ? <PartnerTag /> : null}</td>
                <td>{p.brand}</td>
                <td className="ps-r">{p.slots}</td>
                <td className="ps-r">{p.share == null ? 'N/A' : `${p.share}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limit ? <button type="button" className="ps-link" onClick={() => setAll((v) => !v)}>{all ? 'Show top 15' : `Show all ${rows.length} products`}</button> : null}
    </>
  );
}

/* ---------------- Overview (p.12) ---------------- */
const pct1 = (n, d) => (d ? `${Math.round((n / d) * 1000) / 10}%` : 'N/A');

/** Who got the picks on the shoppers your product fit but lost. Real brand and product names. */
function TakenBy({ ex, name, limit = 6 }) {
  const rows = ex.takenBy.slice(0, limit);
  if (!ex.lost) return <p className="ps-small">Your products made the top 3 every time they fit. Nobody took your spot.</p>;
  return (
    <div className="ps-h2h">
      {rows.map((t) => (
        <div key={t.brand} className="ps-h2h-row">
          <div className="ps-h2h-name"><strong>{t.brand}</strong>{t.partner ? <PartnerTag /> : null}<small>{t.top.slice(0, 2).map((x) => x.name).join(' · ')}</small></div>
          <div className="ps-h2h-bar" role="img" aria-label={`${t.brand}: picked for ${t.shoppers} of the ${ex.lost} shoppers ${name} lost`}><span style={{ width: `${(t.shoppers / ex.lost) * 100}%` }} /></div>
          <div className="ps-h2h-val"><b>{t.shoppers}</b> of {ex.lost}</div>
        </div>
      ))}
    </div>
  );
}

/** One row per need: your picks next to the brand that leads that need. */
function ByNeed({ meta, brand, outcomes, name }) {
  const rows = useMemo(() => meta.needs.map((n) => {
    const e = explore(meta, brand, outcomes, { need: n });
    const leader = e.brands[0];
    return { need: n, me: e.brandSlots, share: e.slotShare.pct, rank: e.rank.rank, of: e.brands.length, leader, slots: e.slots };
  }), [meta, brand, outcomes]);
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead><tr><th>Shopper need</th><th className="ps-r">{name}</th><th className="ps-r">Your rank</th><th>Leader</th><th className="ps-r">Leader picks</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.need}>
              <td><strong>{r.need}</strong></td>
              {!r.slots ? <td colSpan={4} className="ps-muted">ayna didn’t recommend any product to these shoppers.</td> : <>
              <td className="ps-r">{r.me} <span className="ps-small ps-muted">({r.share == null ? 'N/A' : `${r.share}%`})</span></td>
              <td className="ps-r">{r.me ? `#${r.rank}` : 'Not picked'}</td>
              <td>{r.leader && r.leader.slots ? <>{r.leader.you ? <b>You</b> : r.leader.brand}{r.leader.partner && !r.leader.you ? <PartnerTag /> : null}</> : '–'}</td>
              <td className="ps-r">{r.leader && r.leader.slots ? `${r.leader.slots} (${r.leader.share}%)` : '–'}</td>
              </>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Overview({ data, b, go, actionState }) {
  const open = (b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done');
  const [catId, setCatId] = useState(b.categories[0]?.id);
  const c = b.categories.find((x) => x.id === catId) || b.categories[0];
  const meta = data.categories.find((x) => x.id === c?.id);
  const ex = useMemo(() => (meta?.rows ? explore(meta, b.brand, c.outcomes) : null), [meta, b.brand, c]);
  const name = b.displayName || b.brand;
  const RING_COLORS = ['#f7badd', '#769ebe', '#c9d9e6'];
  const ring = ex ? (() => {
    const me = ex.brands.find((x) => x.you);
    const others = ex.brands.filter((x) => !x.you && x.slots > 0).slice(0, 3);
    const rest = ex.slots - (me?.slots || 0) - others.reduce((a2, x) => a2 + x.slots, 0);
    return [
      { label: `${name} (you)`, value: me?.slots || 0, color: '#3e2723', you: true },
      ...others.map((x, k) => ({ label: x.brand, value: x.slots, color: RING_COLORS[k] })),
      { label: 'Everyone else', value: Math.max(rest, 0), color: '#e4cf86' },
    ];
  })() : [];
  if (!ex) return null;
  const me = ex.brands.find((x) => x.you) || { slots: 0 };
  const leader = ex.brands[0];
  const fit = ex.eligibleToPlaced.den;
  const topRival = ex.takenBy[0];
  const reasons = (c.funnel.reasons || []).filter((r) => r.n && r.id !== 'diversity_tie' && r.id !== 'unclassified');
  const sims = (b.simulations || []).filter((s) => s.category === c.id && s.after.inclusion.num > s.before.inclusion.num)
    .sort((x, y) => (y.after.inclusion.num - y.before.inclusion.num) - (x.after.inclusion.num - x.before.inclusion.num));
  const feed = [];
  for (const f of b.feed || []) {
    const hit = feed.find((x) => x.title === f.title);
    if (hit) hit.names.push(f.name); else feed.push({ title: f.title, names: [f.name] });
  }
  const catLabel = c.label.toLowerCase();
  return (
    <>
      <section className="ps-card ps-summary" aria-label="Summary">
        <CategoryTabs cats={b.categories} cat={c} setCat={setCatId} />
        <p className="ps-summary-lead">
          In {catLabel}, ayna picked <b>{name}</b> for <b>{ex.inclusion.num} of {ex.scenarios}</b> shoppers.
          {me.slots ? <> You rank <b>#{me.rank} of {ex.brands.length} brands</b>.</> : <> You weren’t picked yet.</>}
          {leader && !leader.you ? <> <b>{leader.brand}</b> leads with {leader.slots} picks.</> : null}
          {topRival ? <> When your product was a fit but lost, <b>{topRival.brand}</b> took the spot most often ({topRival.shoppers} of {ex.lost} shoppers).</> : null}
        </p>
      </section>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Your rank" value={me.slots ? `#${me.rank}` : '–'} den={`of ${ex.brands.length} brands in ${catLabel}`} />
        <Kpi tone="pink" label="Times picked" value={String(me.slots)} den={`of ${ex.slots} top-3 spots (${ex.slotShare.pct ?? 0}%)`} />
        <Kpi tone="deep" label="Fit but lost" value={String(ex.lost)} den={`of the ${fit} shoppers your products fit`} />
        <Kpi tone="plain" label="Category leader" value={leader?.brand || '–'} den={leader ? `${leader.slots} picks (${leader.share}%)` : ''} />
      </div>
      <div className="ps-overview-grid">
        <div className="ps-stack-col">
          <section className="ps-card" aria-labelledby="ov-ring">
            <CardHead id="ov-ring" title="Who gets the top-3 spots" desc={`All ${ex.slots} spots across ${ex.scenarios} shoppers.`} />
            <div className="ps-hero">
              <Ring segments={ring} center={ex.slotShare.pct == null ? 'N/A' : `${ex.slotShare.pct}%`} sub="your share" />
              <ul className="ps-list ps-ring-legend">
                {ring.map((x) => <li key={x.label} className={x.you ? 'is-you' : ''}><i style={{ background: x.color }} /><span>{x.label}</span><b>{pct1(x.value, ex.slots)}</b></li>)}
              </ul>
            </div>
          </section>
          <section className="ps-card" aria-labelledby="ov-mine">
            <CardHead id="ov-mine" title="Your products" desc={`Out of ${meta.universe} ${catLabel} products in ayna’s catalog.`} right={<button type="button" className="ps-btn ps-btn--sm" onClick={() => go('share')}>Full ranking</button>} />
            <ul className="ps-list">
              {ex.products.filter((p) => p.you).map((p) => (
                <li key={p.id} className="ps-item ps-item--row"><span><strong>{p.name}</strong><br /><span className="ps-small ps-muted">{p.slots ? `#${p.rank} of ${ex.products.length} products` : 'Not picked for any shopper yet'}</span></span><span className="ps-num" style={{ fontSize: 22, whiteSpace: 'nowrap' }}>{p.slots}<span className="ps-small"> picks</span></span></li>
              ))}
            </ul>
          </section>
        </div>
        <section className="ps-card" aria-labelledby="ov-rank">
          <CardHead id="ov-rank" title="Brand leaderboard" desc="Every brand in the category, partner or not, by times picked." />
          <BrandRanking rows={ex.brands} brand={b.brand} totalSlots={ex.slots} limit={9} />
          <RankKey />
        </section>
      </div>
      <section className="ps-card" aria-labelledby="ov-h2h">
        <CardHead id="ov-h2h" title="Who took your spot" desc={`The ${ex.lost} times your product fit a shopper but missed the top 3, these brands were picked instead. Same shoppers, head to head.`} right={<button type="button" className="ps-btn ps-btn--sm" onClick={() => go('losses')}>Why you lost</button>} />
        <TakenBy ex={ex} name={name} />
      </section>
      <section className="ps-card" aria-labelledby="ov-need">
        <CardHead id="ov-need" title="By shopper need" desc="Your picks for each need next to the brand that wins it." />
        <ByNeed meta={meta} brand={b.brand} outcomes={c.outcomes} name={name} />
      </section>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '1 1 420px' }} aria-labelledby="ov-levers">
          <CardHead id="ov-levers" title="What would move you up" right={<button type="button" className="ps-btn ps-btn--sm" onClick={() => go('actions')}>Action queue ({open.length})</button>} />
          <ul className="ps-list">
            {sims.slice(0, 2).map((s) => (
              <li key={s.sku} className="ps-item"><strong>Price: {s.name} at {s.changeLabel}</strong><span className="ps-small">Picked for {s.before.inclusion.num} → {s.after.inclusion.num} shoppers in a test run. Nothing else changes.</span></li>
            ))}
            {reasons.slice(0, 3).map((r) => (
              <li key={r.id} className="ps-item"><strong>{r.label}: {r.n} of {c.funnel.eligible_lost} losses</strong><span className="ps-small">{r.action}</span></li>
            ))}
            {!sims.length && !reasons.length ? <li className="ps-item">Nothing to change: you made the top 3 every time you fit.</li> : null}
          </ul>
        </section>
        <section className="ps-card" style={{ flex: '1 1 420px' }} aria-labelledby="ov-alerts">
          <CardHead id="ov-alerts" title="On your products" right={<button type="button" className="ps-btn ps-btn--sm" onClick={() => go('feed')}>Feed</button>} />
          <ul className="ps-list">
            {feed.slice(0, 4).map((f) => <li key={f.title} className="ps-item"><strong>{f.title}</strong><span className="ps-small">{f.names.join(', ')}</span></li>)}
            {!feed.length ? <li className="ps-item">Nothing flagged on your products.</li> : null}
          </ul>
        </section>
      </div>
      <p className="ps-small ps-muted">How this works: ayna runs {ex.scenarios} made-up shoppers through the same matching engine the app uses and counts which products land in each top 3. Every {catLabel} product in ayna’s catalog competes ({meta.universe} products, {meta.brands} brands). No real customers or sales data. Updated {new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. <button type="button" className="ps-link" onClick={() => go('reports')}>Methodology</button></p>
    </>
  );
}

/* ---------------- Action queue (p.11) ---------------- */
export function Actions({ b, actionState, setAction }) {
  const [filter, setFilter] = useState('open');
  const list = (b.actions || []).filter((a) => filter === 'all' || (actionState[a.id] || 'open') === filter);
  return (
    <section className="ps-card" aria-labelledby="act-h">
      <CardHead id="act-h" title="Action queue" desc="Safety and regulatory first, then evidence, documentation and differentiation. Status saves on this device." right={
        <div className="ps-tabs" role="group" aria-label="Filter">
          {['open', 'in_progress', 'done', 'all'].map((f) => <button key={f} type="button" className="ps-tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'in_progress' ? 'In progress' : f[0].toUpperCase() + f.slice(1)}</button>)}
        </div>
      } />
      <ol className="ps-list">
        {list.map((a) => (
          <li key={a.id} className="ps-item">
            <div className="ps-item-head"><strong>{a.rank}. {a.title}</strong><span className="ps-chip">{TIER_LABEL[a.tier]}</span></div>
            <p className="ps-small">{a.issue}</p>
            <div className="ps-item-meta">
              <span className="ps-chip ps-chip--dash">Trace: {a.trace}</span>
              <span className="ps-chip ps-chip--dash">Effort {a.effort}</span>
              <span className="ps-chip ps-chip--dash">{a.confidence}</span>
              {a.affected != null ? <span className="ps-chip ps-chip--dash">{a.affected} scenario{a.affected === 1 ? '' : 's'}</span> : null}
            </div>
            <p><strong>Suggested:</strong> {a.action}</p>
            <label className="ps-field-label">Status
              <select className="ps-select" value={actionState[a.id] || 'open'} onChange={(e) => setAction(a.id, e.target.value)}>
                <option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option>
              </select>
            </label>
          </li>
        ))}
        {!list.length ? <li className="ps-item">Nothing here.</li> : null}
      </ol>
    </section>
  );
}

/* ---------------- Evidence gaps (pp.4-5) ---------------- */
const nextAction = (mine, peer) => {
  if (mine === 'direct') return 'Maintain documentation.';
  if (peer === 'direct') return 'Peer has a direct product study. Assess a product-specific study for this claim.';
  if (!mine || mine === 'not_located' || mine === 'experience_only') return 'Clarify the exact claim, or send the source behind it.';
  if (mine === 'brand_reported') return 'Send the study you cite so a reviewer can check it.';
  if (mine === 'regulatory_only') return 'A clearance covers intended use, not every claim. Check the wording against it.';
  return 'Send product-specific evidence for review.';
};

export function Evidence({ b, openSource }) {
  const m = b.evidence.metrics;
  const comps = b.competitors || [];
  const [i, setI] = useState(0);
  const sku = comps[i];
  const rec = b.evidence.skus.find((r) => r.sku === sku?.sku);
  const peer = sku?.peers?.[0];
  const themeLabel = Object.fromEntries((b.claims.rows || []).map((r) => [r.theme, r.label]));
  const gapPp = m.draft.direct?.value != null && m.draft.peerMedianDirect != null ? Math.round((m.draft.direct.value - m.draft.peerMedianDirect) * 1000) / 10 : null;
  const docRows = rec && peer ? [
    ['Material disclosure', rec.dimensions.materials === 'complete' ? 'Complete' : 'Unknown', peer.materials === 'complete' ? 'Complete' : 'Unknown', rec.dimensions.materials === 'complete' ? 'Maintain documentation.' : 'Publish the full materials or ingredient list.'],
    ['Use instructions', rec.dimensions.instructions === 'present' ? 'Complete' : 'Incomplete', peer.instructions === 'present' ? 'Complete' : 'Incomplete', rec.dimensions.instructions === 'present' ? 'Maintain documentation.' : 'Publish verified instructions.'],
    ['Regulatory record', rec.dimensions.regulatory, peer.regulatory || 'Unknown', rec.dimensions.regulatory === 'On file' ? 'Maintain documentation.' : 'Link the FDA record if one exists, or confirm none applies.'],
  ] : [];
  return (
    <>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Claims checked by a person" value={ratePct(m.reviewCoverage)} den={`${m.reviewCoverage.num} of ${m.reviewCoverage.den} inventoried claims reviewed by a person. Pending stays in the denominator.`} />
        <Kpi tone="pink" label="Claims backed by a product study" value={ratePct(m.directCoverage)} den={m.directCoverage.den ? `${m.directCoverage.num} of ${m.directCoverage.den} reviewed claims` : 'N/A until claims are reviewed'} />
        <Kpi tone="deep" label="Evidence gap vs competitors" badge={<DraftBadge text="Draft" />} value={gapPp == null ? 'N/A' : `${gapPp > 0 ? '+' : ''}${gapPp} pp`} den={gapPp == null ? 'Needs claims on file for you and comparable products' : `Your share of claims with a direct product study vs the median of ${m.draft.peerBrands} comparable brands (draft statuses)`} />
        <Kpi tone="plain" label="Product info completeness" value={m.completeness.mine == null ? 'N/A' : `${m.completeness.mine}%`} den={`Median of ${m.completeness.peerN} comparable products: ${m.completeness.peerMedian ?? 'N/A'}%. Separate from evidence.`} />
      </div>
      <section className="ps-card" aria-labelledby="ev-matrix">
        <CardHead id="ev-matrix" title="Your evidence vs the closest competitor" desc={peer ? `${sku.name} vs the closest comparable product, ${peer.name} (${peer.brand}). Statuses are drafts from an AI-assisted research pass until a reviewer signs off.` : 'Your product vs the closest comparable product.'} right={<><ProductPicker items={comps} value={i} onChange={setI} /><DraftBadge text="Review pending" /></>} />
        {rec ? (
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead><tr><th>Claim or dimension</th><th>{sku.name}</th><th>{peer ? `${peer.name} (${peer.brand})` : 'Comparable product'}</th><th>Suggested action</th></tr></thead>
              <tbody>
                {rec.claims.map((cl, k) => {
                  const theme = cl.themes.find((t) => peer?.themeStatus?.[t]) || cl.themes[0];
                  const peerWith = theme ? sku.peers.find((p) => p.themeStatus?.[theme]) : null;
                  const ps = peerWith?.themeStatus?.[theme] || null;
                  return (
                    <tr key={k}>
                      <td><strong>“{cl.text}”</strong><br /><span className="ps-small ps-muted">{theme ? themeLabel[theme] || theme : 'Other'}</span></td>
                      <td><StatusChip status={cl.status} /></td>
                      <td>{peerWith ? <><StatusChip status={ps} /><br /><span className="ps-small ps-muted">{peerWith.name === peer?.name ? '' : `${peerWith.name} (${peerWith.brand})`}</span></> : <span className="ps-small ps-muted">No comparable claim in reviewed sources</span>}</td>
                      <td className="ps-small">{nextAction(cl.status, ps)}</td>
                    </tr>
                  );
                })}
                {docRows.map(([d, mine, theirs, act]) => <tr key={d}><td><strong>{d}</strong></td><td>{mine}</td><td>{theirs}</td><td className="ps-small">{act}</td></tr>)}
                {!rec.claims.length && !docRows.length ? <tr><td colSpan={4}>No claims logged for this product yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Not inventoried">No evidence record for this product yet.</Empty>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => openSource(rec)}>Sources for {sku.name} ({rec.sources.length})</button> : null}
          <a className="ps-btn ps-btn--sm" href={`mailto:team@aynahealth.co?subject=${encodeURIComponent(`Partner Studio: documentation for ${sku?.name || b.brand}`)}`}>Submit documentation</a>
        </div>
        <p className="ps-small ps-muted">Unknown is not false: it means ayna hasn’t located the record. A competitor may hold private evidence ayna hasn’t seen. Pending claims are never counted as unsupported.</p>
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="ev-all">
        <CardHead id="ev-all" title="All your products at a glance" desc="What ayna has on file for each product: claims, studies and documentation." />
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Product</th><th>Claims</th><th>Direct studies (draft)</th><th>Materials</th><th>Instructions</th><th>Regulatory record</th><th>Completeness</th><th>Last verified</th></tr></thead>
            <tbody>
              {b.evidence.skus.map((r) => (
                <tr key={r.sku}>
                  <td><strong>{r.name}</strong><br /><span className="ps-small ps-muted">{r.qa.label}</span></td>
                  <td>{r.claims.length || 'None logged'}</td>
                  <td>{r.claims.filter((x) => x.status === 'direct').length}</td>
                  <td>{r.dimensions.materials === 'complete' ? 'Complete' : 'Unknown'}</td>
                  <td>{r.dimensions.instructions === 'present' ? 'Complete' : 'Incomplete'}</td>
                  <td>{r.dimensions.regulatory}</td>
                  <td>{r.completeness == null ? 'N/A' : `${r.completeness}%`}</td>
                  <td>{r.freshness?.lastVerified || 'Never'}{r.freshness?.state === 'stale' ? <><br /><span className="ps-small ps-muted">{r.freshness.daysOverdue} days past review</span></> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------------- Health claims (pp.6-7) ---------------- */
export function Claims({ b }) {
  const rows = b.claims.rows || [];
  const ledger = b.evidence.skus.flatMap((r) => r.claims.map((c) => ({ ...c, product: r.name })));
  const flagged = ledger.filter((c) => c.flags.length);
  const comps = b.competitors || [];
  const [i, setI] = useState(0);
  const sku = comps[i];
  const cols = sku ? [sku, ...sku.peers.filter((p) => p.claims > 0).slice(0, 2)] : [];
  const themes = [...new Set(cols.flatMap((c) => c.themes))];
  const themeLabel = Object.fromEntries(rows.map((r) => [r.theme, r.label]));
  return (
    <>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Claims on file" value={String(ledger.length)} den={`Across ${b.evidence.skus.length} products`} />
        <Kpi tone="pink" label="Review-flag rate" value={ledger.length ? fmtPct((flagged.length / ledger.length) * 100) : 'N/A'} den={`${flagged.length} of ${ledger.length} claims flagged for a reviewer. Not a violation rate.`} />
        <Kpi tone="deep" label="Claim differentiation" value={b.claims.differentiation.pct == null ? 'N/A' : `${b.claims.differentiation.pct}%`} den={`Your themes absent from ${b.claims.peerSkusInventoried} comparable products with claims on file. Not proof of exclusivity.`} />
      </div>
      <section className="ps-card" aria-labelledby="cl-cmp">
        <CardHead id="cl-cmp" title="What you claim vs competitors" desc="Which benefits each product publicly promises, side by side. Themes are draft groupings until a reviewer confirms them." right={<><ProductPicker items={comps} value={i} onChange={setI} /><DraftBadge text="Draft themes" /></>} />
        {themes.length ? (
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead><tr><th>Theme</th>{cols.map((c, j) => <th key={c.sku} className={j === 0 ? 'is-you' : ''}>{c.name}<br /><span className="ps-small ps-muted">{c.brand || b.displayName || b.brand}</span></th>)}</tr></thead>
              <tbody>
                {themes.map((t) => (
                  <tr key={t}>
                    <td><strong>{themeLabel[t] || t}</strong></td>
                    {cols.map((c, j) => <td key={c.sku} className={j === 0 ? 'is-you' : ''}>{c.themeStatus[t] ? <><b>Present</b><br /><StatusChip status={c.themeStatus[t]} /></> : <span className="ps-muted">Not stated</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No claims logged">Neither this product nor its closest competitors have claim wording logged yet.</Empty>}
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="cl-land">
        <CardHead id="cl-land" title="How common each claim is" desc="Out of comparable products with claims on file, how many make each type of promise." />
        {rows.length ? rows.map((r) => (
          <HBar key={r.theme} label={r.label} sub={r.brand.length ? `You claim it on ${r.brand.length} product${r.brand.length > 1 ? 's' : ''}${r.unique ? ' · no comparable product claims it' : ''}` : 'You don’t claim this'} value={r.peerPrevalence.value == null ? null : r.peerPrevalence.value * 100} text={r.peerPrevalence.den ? `${r.peerPrevalence.num} of ${r.peerPrevalence.den}` : 'N/A'} tone={r.brand.length ? '' : 'sky'} />
        )) : <Empty title="No claim themes yet">No claim wording logged for comparable products in this snapshot.</Empty>}
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="cl-ledger">
        <CardHead id="cl-ledger" title="Review queue" desc="Every claim on file, with the flags a reviewer should look at. ayna never rewrites your marketing or declares a claim unlawful." />
        <ul className="ps-list">
          {ledger.map((c, k) => (
            <li key={k} className="ps-item">
              <div className="ps-item-head"><strong>“{c.text}”</strong><StatusChip status={c.status} /></div>
              <span className="ps-small">{c.product}{c.sourceUrl ? <> · <a href={c.sourceUrl} target="_blank" rel="noreferrer">source</a></> : null}</span>
              {c.flags.map((f) => <span key={f.id} className="ps-chip ps-chip--pink" style={{ alignSelf: 'flex-start' }}>{f.label}</span>)}
            </li>
          ))}
          {!ledger.length ? <li className="ps-item">No claim wording logged for your products yet.</li> : null}
        </ul>
      </section>
    </>
  );
}

/* ---------------- Recommendation share (pp.8-9) ---------------- */
function Methodology({ k, onClose }) {
  return (
    <Drawer title="How these numbers work" onClose={onClose}>
      <ul className="ps-list">
        <li className="ps-item"><strong>Share of top-3 picks (slot share)</strong><span className="ps-small">Your placements across final top-{k} lists ÷ all placements in those lists, counting every brand in the benchmark. Lists with fewer than {k} products count actual slots.</span></li>
        <li className="ps-item"><strong>Shoppers you reached (scenario inclusion)</strong><span className="ps-small">Scenarios with at least one of your products placed ÷ all scenarios, no-result scenarios included. Brands’ rates don’t add to 100%.</span></li>
        <li className="ps-item"><strong>Win rate when you qualified (eligible to placed)</strong><span className="ps-small">Scenarios where you were placed ÷ scenarios where at least one of your products qualified. N/A when none qualified.</span></li>
        <li className="ps-item"><strong>Shoppers with no match (no-result rate)</strong><span className="ps-small">Scenarios where no product qualified at all.</span></li>
        <li className="ps-item"><strong>Scenarios</strong><span className="ps-small">Fictional shoppers in a fixed design (need × life stage × budget × format × fragrance sensitivity), equal weights. Not a population estimate.</span></li>
        <li className="ps-item"><strong>Engine</strong><span className="ps-small">ayna’s production matching code, run read-only on a frozen catalog. Partner status and payments are never inputs.</span></li>
      </ul>
    </Drawer>
  );
}

export function Share({ data, b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  const meta = data.categories.find((x) => x.id === c?.id);
  const [need, setNeed] = useState('');
  const [budget, setBudget] = useState('');
  const [format, setFormat] = useState('');
  const [method, setMethod] = useState(false);
  const ex = useMemo(() => (meta?.rows && c ? explore(meta, b.brand, c.outcomes, { need, budget, format }) : null), [meta, b.brand, c, need, budget, format]);
  if (!c || !ex) return null;
  const filtered = need || budget || format;
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <CategoryTabs cats={b.categories} cat={c} setCat={(id) => { setCat(id); setNeed(''); }} />
        <label className="ps-field-label">Need
          <select className="ps-select" value={need} onChange={(e) => setNeed(e.target.value)}>
            <option value="">All needs</option>
            {meta.needs.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="ps-field-label">Format
          <select className="ps-select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Any</option><option value="any">No preference</option><option value="pref">Prefers {String(meta.format || 'this format').toLowerCase()}</option>
          </select>
        </label>
        <label className="ps-field-label">Budget
          <select className="ps-select" value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">All budgets</option><option value="under-25">Under $25</option><option value="25-75">$25 to $75</option><option value="any">Price not a factor</option>
          </select>
        </label>
        {filtered ? <button type="button" className="ps-link" onClick={() => { setNeed(''); setBudget(''); setFormat(''); }}>Clear filters</button> : null}
        <span style={{ marginLeft: 'auto' }}><button type="button" className="ps-btn ps-btn--sm" onClick={() => setMethod(true)}>How this is calculated</button></span>
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Share of top-3 picks" value={ex.slotShare.pct == null ? 'N/A' : `${ex.slotShare.pct}%`} cmp={ex.rank.rank ? { dir: 'flat', text: `#${ex.rank.rank} of ${ex.brands.length} brands` } : { dir: 'down', text: 'Not picked for these shoppers' }} den={`${ex.slotShare.num} of the ${ex.slotShare.den} top-3 picks`} />
        <Kpi tone="pink" label="Shoppers you reached" value={ex.inclusion.pct == null ? 'N/A' : `${ex.inclusion.pct}%`} den={`Recommended to ${ex.inclusion.num} of ${ex.inclusion.den} shoppers`} />
        <Kpi tone="deep" label="Win rate when you qualified" value={ex.eligibleToPlaced.pct == null ? 'N/A' : `${ex.eligibleToPlaced.pct}%`} den={ex.eligibleToPlaced.den ? `Top 3 for ${ex.eligibleToPlaced.num} of the ${ex.eligibleToPlaced.den} shoppers your products fit` : 'None of your products fit these shoppers'} />
        <Kpi tone="plain" label="Shoppers with no match" value={ex.noResult.pct == null ? 'N/A' : `${ex.noResult.pct}%`} den={`${ex.noResult.num} of ${ex.noResult.den} shoppers had no product that fit at all`} />
      </div>
      <p className="ps-small ps-muted">{ex.scenarios} made-up shoppers{filtered ? ' match these filters' : ''}, compared across all {meta.universe} {c.label.toLowerCase()} products from {meta.brands} brands in ayna’s catalog. {SYNTHETIC}.</p>
      <div className="ps-row">
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 440px' }} aria-labelledby="sh-brands">
          <CardHead id="sh-brands" title="Brand ranking" desc="Every brand in the category, by how often its products made a shopper’s top 3." />
          <BrandRanking rows={ex.brands} brand={b.brand} totalSlots={ex.slots} />
          <RankKey />
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 440px' }} aria-labelledby="sh-products">
          <CardHead id="sh-products" title="Product ranking" desc="Every product in ayna’s catalog for this category. Yours are highlighted in pink." />
          <ProductRanking rows={ex.products} />
        </section>
      </div>
      <section className="ps-card" aria-labelledby="sh-heat">
        <CardHead id="sh-heat" title="Where you win and where you don’t" desc="Your share of top-3 picks for each need at each budget. Darker means you’re picked more. Hatched means no product fit those shoppers." right={<SyntheticBadge />} />
        <Heatmap grid={c.grid} />
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="sh-sku">
        <CardHead id="sh-sku" title="What happened to each of your products" desc="For every shopper your product could help, did it make the top 3, and if not, why." />
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Product</th><th className="ps-r">Made the top 3</th><th className="ps-r">Fit, but others ranked higher</th><th className="ps-r">On hold: a fact is missing</th><th className="ps-r">Not safe for that shopper</th></tr></thead>
            <tbody>{c.skus.map((s) => <tr key={s.sku}><td><strong>{s.name}</strong></td><td className="ps-r">{s.selected}</td><td className="ps-r">{s.eligible_lost}</td><td className="ps-r">{s.insufficient_info}</td><td className="ps-r">{s.excluded}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {method ? <Methodology k={meta.k || 3} onClose={() => setMethod(false)} /> : null}
    </>
  );
}

/* ---------------- Lost recommendations (pp.10-11) ---------------- */
const reasonKey = (id) => (id === 'diversity_tie' || id === 'unclassified' ? 'ps-hatch' : id === 'budget' ? 'is-pink' : id === 'relevance' || id === 'below_cutoff' ? 'is-ink' : 'is-blue');
const reasonFill = (id) => (id === 'diversity_tie' || id === 'unclassified' ? 'hatch' : id === 'budget' ? 'pink' : id === 'relevance' || id === 'below_cutoff' ? '' : 'sky');

export function Losses({ b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  if (!c) return null;
  const f = c.funnel;
  const notEligible = f.insufficient_info + f.excluded;
  const max = Math.max(f.in_scope, 1);
  const allSims = (b.simulations || []).filter((s) => s.category === c.id);
  const sims = [...allSims].filter((s) => s.after.inclusion.num !== s.before.inclusion.num).sort((x, y) => (y.after.inclusion.num - y.before.inclusion.num) - (x.after.inclusion.num - x.before.inclusion.num));
  const flat = allSims.length - sims.length;
  const rows = [
    ['Shoppers you could help', f.in_scope, 'One of your products is relevant to their need'],
    ['Your product fit', f.eligible, 'Passed every safety and fit rule'],
    ['Made the top 3', f.placed, 'Recommended to the shopper'],
    ['Fit, but missed the top 3', f.eligible_lost, f.eligible ? `${fmtPct((f.eligible_lost / f.eligible) * 100)} of the shoppers you fit` : 'N/A'],
    ['Couldn’t be shown', notEligible, `${f.insufficient_info} on hold for a missing fact · ${f.excluded} not safe for that shopper`],
  ];
  return (
    <>
      <div className="ps-top"><CategoryTabs cats={b.categories} cat={c} setCat={setCat} /><SyntheticBadge text={SYNTHETIC} /></div>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '3 1 520px' }} aria-labelledby="lo-funnel">
          <CardHead id="lo-funnel" title="From relevant to recommended" desc="Where your products drop off. Shoppers your products can’t help are never counted as a miss." />
          <div className="ps-funnel">
            {rows.map(([l, n, note]) => (
              <div key={l} className="ps-funnel-row"><span style={{ fontWeight: 700 }}>{l}</span><span><span className="ps-funnel-bar" style={{ width: `${Math.max((n / max) * 100, 4)}%` }}>{n}</span></span><span className="ps-small">{note}</span></div>
            ))}
          </div>
          <p className="ps-small">“Not safe for that shopper” (for example pregnancy or an allergy) is a rule ayna never relaxes, so it isn’t something to fix.</p>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '2 1 360px' }} aria-labelledby="lo-reasons">
          <CardHead id="lo-reasons" title={`Why you missed the top 3 for ${f.eligible_lost} shoppers`} desc="The main reason for each miss, with what you can do about it. Price is compared directly; the rest come from the engine’s own scores." />
          <ReasonStack reasons={f.reasons} />
          {f.reasons.length ? f.reasons.map((r) => <HBar key={r.id} name={r.label} label={<><i className={`ps-key ${reasonKey(r.id)}`} />{r.label}</>} sub={r.action} max={Math.max(...f.reasons.map((x) => x.share || 0), 1)} value={r.share} text={`${r.n} · ${fmtPct(r.share)}`} tone={reasonFill(r.id)} />) : <p>No eligible losses.</p>}
          <p className="ps-small ps-muted">Reasons sum to {f.eligible_lost}{f.sumsToLost ? '' : ' (check failed)'}.</p>
        </section>
      </div>
      <section className="ps-card ps-card--plain" aria-labelledby="lo-ex">
        <CardHead id="lo-ex" title="Examples" desc="Real results from the matching engine for a few of the made-up shoppers." />
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Made-up shopper</th><th>Your product</th><th>Why it missed</th><th>Recommended instead</th></tr></thead>
            <tbody>{f.examples.map((e) => <tr key={e.scenarioId + e.sku}><td>{e.label}</td><td>{c.skus.find((x) => x.sku === e.sku)?.name || e.sku}</td><td><strong>{f.reasons.find((r) => r.id === e.reason)?.label || e.reason}</strong><br /><span className="ps-small">{e.detail}</span></td><td className="ps-small">{e.placed.join(', ') || 'Nothing qualified'}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '1 1 420px' }} aria-labelledby="lo-sim">
          <CardHead id="lo-sim" title="What if your price were 20% lower?" right={<span className="ps-badge ps-badge--dark">Simulation</span>} desc="Same engine, same competitors, same shoppers. Only your price changes." />
          {sims.length ? sims.map((s) => (
            <div key={s.sku} className="ps-item">
              <div className="ps-item-head"><strong>{s.name}</strong><span className="ps-small">{s.changeLabel}</span></div>
              <span>Recommended to <b>{s.before.inclusion.num}</b> → <b>{s.after.inclusion.num}</b> of {s.scenarios} shoppers ({s.after.inclusion.num - s.before.inclusion.num > 0 ? '+' : ''}{Math.round((s.after.inclusion.value - s.before.inclusion.value) * 1000) / 10} points)</span>
              <span className="ps-small ps-muted">{s.displacedOtherSlots} picks would move over from other brands. Safety rules still {s.safetyOk ? 'held' : 'FAILED'}.</span>
            </div>
          )) : <p>{allSims.length ? 'A 20% lower price changes nothing for any of your products here.' : 'No priced product to simulate in this category.'}</p>}
          {sims.length && flat ? <p className="ps-small">{flat} other product{flat === 1 ? '' : 's'}: no change.</p> : null}
          <p className="ps-small ps-muted">Made-up shoppers, not customers or sales.</p>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 320px' }} aria-labelledby="lo-bound">
          <CardHead id="lo-bound" title="Special cases" desc="Checked separately and kept out of the numbers above." />
          {[['Shoppers who are pregnant, breastfeeding, latex-allergic or on certain medicines', c.boundary], ['Shoppers who skipped questions', c.unknown]].map(([l, s]) => (
            <div key={l} className="ps-item"><strong>{l}</strong><span className="ps-small">{Object.entries(s).filter(([, n]) => n).map(([k, n]) => `${STAGE_LABEL[k]}: ${n}`).join(' · ') || 'No cases'}</span></div>
          ))}
        </section>
      </div>
    </>
  );
}

/* ---------------- Competitors (p.12) ---------------- */
export function Competitors({ b }) {
  const comps = b.competitors || [];
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const row = comps[i];
  if (!row) return <Empty title="No comparable products">No comparable products in the same category and benchmark.</Empty>;
  const chosen = (picked || row.peers.slice(0, 3).map((p) => p.sku)).filter((s) => row.peers.some((p) => p.sku === s));
  const cols = [row, ...row.peers.filter((p) => chosen.includes(p.sku))];
  const toggle = (sku) => setPicked((cur) => {
    const base = cur || row.peers.slice(0, 3).map((p) => p.sku);
    if (base.includes(sku)) return base.filter((s) => s !== sku);
    return base.length >= 3 ? base : [...base, sku];
  });
  const themeLabel = Object.fromEntries((b.claims.rows || []).map((r) => [r.theme, r.label]));
  const attrs = [
    ['Brand', (x, j) => (j === 0 ? b.displayName || b.brand : x.brand)],
    ['Price', (x) => money(x.price)],
    ['Materials or ingredients', (x) => (x.materials === 'complete' ? 'Complete' : 'Unknown')],
    ['Use instructions', (x) => (x.instructions === 'present' ? 'Complete' : 'Incomplete')],
    ['Regulatory record', (x) => x.regulatory || 'Unknown'],
    ['Claims on file', (x) => x.claims],
    ['Direct product studies (draft)', (x) => x.direct],
    ['Claim themes', (x) => (x.themes.length ? x.themes.map((t) => themeLabel[t] || t).join(', ') : 'None logged')],
    ['Information completeness', (x) => (x.completeness == null ? 'N/A' : `${x.completeness}%`)],
    ['Last verified', (x) => x.lastVerified || 'Never'],
  ];
  return (
    <>
      <section className="ps-card" aria-labelledby="co-h">
        <CardHead id="co-h" title="Side-by-side with competitors" desc="Products of the same type, closest in price first. Tap to pick up to three. Public information only." right={<ProductPicker items={comps} value={i} onChange={(k) => { setI(k); setPicked(null); }} />} />
        <div className="ps-pills" role="group" aria-label="Competitors to compare">
          {row.peers.map((p) => (
            <button key={p.sku} type="button" className="ps-pill" aria-pressed={chosen.includes(p.sku)} disabled={!chosen.includes(p.sku) && chosen.length >= 3} onClick={() => toggle(p.sku)}>
              {p.name} <span className="ps-muted">· {p.brand} · {money(p.price)}</span>
            </button>
          ))}
        </div>
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Attribute</th>{cols.map((x, j) => <th key={x.sku} className={j === 0 ? 'is-you' : ''}>{x.name}</th>)}</tr></thead>
            <tbody>{attrs.map(([label, fn]) => <tr key={label}><td><strong>{label}</strong></td>{cols.map((x, j) => <td key={x.sku} className={j === 0 ? 'is-you' : ''}>{String(fn(x, j))}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="ps-small ps-muted">A competitor may hold private evidence ayna hasn’t seen. Brand-nominated competitors come in a later phase; the neutral benchmark stays fixed.</p>
      </section>
    </>
  );
}

/* ---------------- Intelligence feed (p.12) ---------------- */
export function Feed({ b, ack, setAck }) {
  const items = b.feed || [];
  const TYPE = { qa_correction: 'Fact correction', clinician_review: 'Clinical review', stale: 'Freshness', claim_flag: 'Claim review flag' };
  return (
    <section className="ps-card" aria-labelledby="fd-h">
      <CardHead id="fd-h" title="Intelligence feed" desc="This is the baseline snapshot. New competitors, price and claim changes appear from the next refresh, each with its source and date." />
      <ul className="ps-list">
        {items.map((f, k) => {
          const id = `${f.type}-${f.sku}-${k}`;
          return (
            <li key={id} className="ps-item" style={ack[id] ? { opacity: 0.6 } : undefined}>
              <div className="ps-item-head"><strong>{f.title}</strong><span className="ps-chip">{TYPE[f.type] || f.type}</span></div>
              <span className="ps-small">{f.name}{f.date ? ` · ${f.date}` : ''}</span>
              <span className="ps-small">{f.detail}</span>
              <button type="button" className="ps-btn ps-btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAck(id)}>{ack[id] ? 'Acknowledged' : 'Acknowledge'}</button>
            </li>
          );
        })}
        {!items.length ? <li className="ps-item">Nothing flagged on your products.</li> : null}
      </ul>
    </section>
  );
}

/* ---------------- Reports and methodology (p.12) ---------------- */
export function Reports({ data, b, onExport }) {
  const r = data.run;
  const meta = useMemo(() => [
    ['Run', r.runId], ['Created', new Date(r.createdAt).toLocaleString('en-US')], ['Engine', r.engine], ['Adapter', r.adapterVersion], ['Code', r.gitSha],
    ['Scenario set', r.scenarioSetVersion], ['Category set', r.categorySetVersion], ['Top-K', r.k], ['Weights', r.weights], ['Replay', r.deterministic ? 'Identical' : 'Varied'],
  ], [r]);
  return (
    <>
      <div className="ps-row">
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 380px' }} aria-labelledby="rp-run">
          <CardHead id="rp-run" title="This benchmark run" />
          <div className="ps-table-wrap"><table className="ps-table"><tbody>{meta.map(([k, v]) => <tr key={k}><td><strong>{k}</strong></td><td>{String(v)}</td></tr>)}</tbody></table></div>
          <p className="ps-small">Catalog versions: {data.categories.map((c) => `${c.label} ${c.catalogVersion}`).join(' · ')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="ps-btn ps-btn--ink" onClick={onExport}>Download aggregate CSV</button>
            <button type="button" className="ps-btn" onClick={() => window.print()}>Print report</button>
          </div>
        </section>
        <section className="ps-card" style={{ flex: '2 1 480px' }} aria-labelledby="rp-def">
          <CardHead id="rp-def" title="Definitions" />
          <ul className="ps-list">
            <li className="ps-item"><strong>Share of top-3 picks (slot share)</strong><span className="ps-small">Your placements across final top-{r.k} lists ÷ all placements in those lists, counting every brand in ayna’s catalog for the category.</span></li>
            <li className="ps-item"><strong>Shoppers you reached (scenario inclusion)</strong><span className="ps-small">Scenarios with at least one of your products placed ÷ all scenarios, no-result scenarios included. Brands’ rates don’t add to 100%.</span></li>
            <li className="ps-item"><strong>Win rate when you qualified (eligible to placed)</strong><span className="ps-small">Scenarios with a placement ÷ scenarios where at least one of your products qualified. N/A when none qualified.</span></li>
            <li className="ps-item"><strong>Claims checked by a person (review coverage)</strong><span className="ps-small">Claims reviewed by a person ÷ all inventoried claims. Pending claims stay in the denominator.</span></li>
            <li className="ps-item"><strong>Scenarios</strong><span className="ps-small">Fictional shoppers in a fixed design, equal weights. Not a population estimate. Safety boundary and skipped-answer cases are reported separately.</span></li>
            <li className="ps-item"><strong>Engine</strong><span className="ps-small">ayna’s production matching code, run read-only on a frozen catalog. Partner status, affiliate links and payments are not inputs; a test proves changing them leaves placements unchanged.</span></li>
          </ul>
        </section>
      </div>
      <section className="ps-card ps-card--pink" aria-labelledby="rp-limits">
        <CardHead id="rp-limits" title="What this is not" />
        <p>Not market share, demand, sales, clinical superiority or legal certification, and not a promise of placement. No consumer health data, conversations, wearable data or user events feed this page. Every conclusion shows its scope and date.</p>
        <p className="ps-small">Viewing {b.displayName || b.brand}. Evidence statuses are drafts from an AI-assisted research pass until a reviewer signs them off.</p>
      </section>
    </>
  );
}
