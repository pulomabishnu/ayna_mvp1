/* Partner Studio screens (Phase 1 plan, p.12). Each reads one brand rollup from /api/partner-studio. */
import React, { useMemo, useState } from 'react';
import { Kpi, HBar, Donut, SyntheticBadge, DraftBadge, Empty, CardHead, ShelfField, Heatmap, ReasonStack } from './ui.jsx';
import { fmtPct, ratePct, money, SYNTHETIC, vsPeers } from './format.js';

const STATUS_LABEL = {
  direct: 'Direct product study',
  indirect: 'Indirect: ingredient or guideline',
  regulatory_only: 'Regulatory record, not efficacy evidence',
  brand_reported: 'Brand-reported, study not located',
  experience_only: 'Experience only',
  not_located: 'Not located in reviewed sources',
};
const STATUS_TONE = { direct: 'ps-chip--ink', indirect: 'ps-chip--blue', regulatory_only: 'ps-chip--blue', brand_reported: 'ps-chip--pink', experience_only: 'ps-chip--dash', not_located: 'ps-chip--dash' };
const TIER_LABEL = { safety: 'Safety or regulatory', evidence: 'Evidence', documentation: 'Documentation', differentiation: 'Differentiation' };
const STAGE_LABEL = { selected: 'Placed', eligible_lost: 'Eligible, not placed', insufficient_info: 'On hold: missing fact', excluded: 'Ruled out for safety or life stage', out_of_scope: 'Not a candidate' };


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

/* ---------------- Overview ---------------- */
const reasonKey = (id) => (id === 'diversity_tie' || id === 'unclassified' ? 'ps-hatch' : id === 'budget' ? 'is-pink' : id === 'relevance' ? 'is-ink' : 'is-blue');
const reasonFill = (id) => (id === 'diversity_tie' || id === 'unclassified' ? 'hatch' : id === 'budget' ? 'pink' : id === 'relevance' ? '' : 'sky');

const shortCat = (label) => label.split(' and ')[0].toLowerCase();
const rankText = (b) => b.categories.filter((c) => c.rank.rank).map((c) => `#${c.rank.rank} of ${c.rank.of} in ${shortCat(c.label)}`).join(' · ');

/** Plain-language read of the by-need bars: strongest need and needs with no slots. */
function Openings({ c }) {
  const scored = c.byNeed.filter((n) => n.slotShare != null);
  const best = [...scored].sort((x, y) => y.slotShare - x.slotShare)[0];
  const none = scored.filter((n) => n.slotShare === 0).map((n) => n.need.toLowerCase());
  if (!best) return null;
  return (
    <div className="ps-callout">
      <strong>Read this as</strong>
      {best.slotShare > 0 ? <span>Strongest: <b>{best.need}</b>, {best.slotShare}% of slots ({best.brandSlots} of {best.slots}).</span> : <span>No slots won in any need yet.</span>}
      {none.length && best.slotShare > 0 ? <span>No slots in {none.join(', ')}. Check Lost recommendations for why.</span> : null}
    </div>
  );
}

export function Overview({ data, b, go, actionState }) {
  const t = b.totals;
  const open = (b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done');
  const one = b.categories.length === 1 ? b.categories[0] : null;
  const shareCmp = one ? vsPeers(one.slotShare, one.field?.peerMedian) : (rankText(b) ? { dir: 'flat', text: rankText(b) } : null);
  const ranks = rankText(b);
  const lost = b.categories.reduce((a, c) => a + c.funnel.eligible_lost, 0);
  const [fieldCat, setFieldCat] = useState(b.categories[0]?.id);
  const fc = b.categories.find((c) => c.id === fieldCat) || b.categories[0];
  return (
    <>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Slot share" badge={<SyntheticBadge text="Synthetic" />} value={t.slotShare.pct == null ? 'N/A' : `${t.slotShare.pct}%`} meter={t.slotShare.pct} cmp={shareCmp} den={`${t.slotShare.num} of ${t.slotShare.den} top-3 recommendation slots`} />
        <Kpi tone="pink" label="Scenario inclusion" badge={<SyntheticBadge text="Synthetic" />} value={t.inclusion.pct == null ? 'N/A' : `${t.inclusion.pct}%`} meter={t.inclusion.pct} cmp={ranks ? { dir: 'flat', text: `Rank by slots: ${ranks}` } : { dir: 'down', text: 'Not placed in any scenario yet' }} den={`In ${t.inclusion.num} of ${t.inclusion.den} fictional scenarios`} />
        <Kpi tone="deep" label="Eligible to placed" badge={<SyntheticBadge text="Synthetic" />} value={t.eligibleToPlaced.pct == null ? 'N/A' : `${t.eligibleToPlaced.pct}%`} meter={t.eligibleToPlaced.pct} cmp={lost ? { dir: 'down', text: `Lost ${lost} eligible scenario${lost === 1 ? '' : 's'}` } : { dir: 'up', text: 'No eligible losses' }} den={`Placed in ${t.eligibleToPlaced.num} of ${t.eligibleToPlaced.den} scenarios where you were eligible`} />
        <Kpi tone="plain" label="Evidence review coverage" badge={<DraftBadge text="Review" />} value={t.reviewCoverage.pct == null ? 'N/A' : `${t.reviewCoverage.pct}%`} meter={t.reviewCoverage.pct} cmp={t.reviewCoverage.den ? { dir: t.reviewCoverage.num < t.reviewCoverage.den ? 'down' : 'up', text: `${t.reviewCoverage.den - t.reviewCoverage.num} claim${t.reviewCoverage.den - t.reviewCoverage.num === 1 ? '' : 's'} awaiting a reviewer` } : { dir: 'flat', text: 'No claims logged yet' }} den={`${t.reviewCoverage.num} of ${t.reviewCoverage.den} inventoried claims human-reviewed`} />
      </div>
      <div className="ps-strip" aria-label="Benchmark scope">
        {data.categories.filter((c) => b.categories.some((x) => x.id === c.id)).map((c) => (
          <React.Fragment key={c.id}><span><b>{c.label}</b>: {c.baseline} fictional scenarios, {c.universe} products from {c.brands} brands, top {data.run.k}</span><span className="sep" /></React.Fragment>
        ))}
        <span>Run {new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · equal weights · {data.run.deterministic ? 'replay identical' : 'replay varied'}</span>
        <button type="button" className="ps-link" onClick={() => go('reports')}>Methodology</button>
      </div>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '3 1 520px' }} aria-labelledby="ov-cats">
          <CardHead id="ov-cats" title="Where you show up" desc="Your share of the top-3 recommendation slots, overall and for each need ayna matches in this category." right={<SyntheticBadge />} />
          {b.categories.map((c) => (
            <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'center' }}>
              <Donut value={c.slotShare == null ? null : c.slotShare / 100} label={c.label} sub={`${c.brandSlots} of ${c.slots} slots`} />
              <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="ps-small" style={{ fontWeight: 700 }}>Slot share by need {c.rank.rank ? `· #${c.rank.rank} of ${c.rank.of} brands` : ''}</span>
                {c.byNeed.map((n) => <HBar key={n.need} label={n.need} value={n.slotShare} text={n.slotShare == null ? 'N/A' : `${n.slotShare}%`} />)}
                <Openings c={c} />
              </div>
            </div>
          ))}
          <p className="ps-chart-foot">{SYNTHETIC}.</p>
        </section>
        {fc ? (
          <section className="ps-card ps-card--plain" style={{ flex: '2 1 380px' }} aria-labelledby="ov-field">
            <CardHead id="ov-field" title="You vs the shelf" desc="Every brand with a product in this benchmark, ranked by slots won. Other brands stay anonymous." right={<CategoryTabs cats={b.categories} cat={fc} setCat={setFieldCat} />} />
            <ShelfField field={fc.field} max={10} />
            <p className="ps-chart-foot">{SYNTHETIC}. {fc.field?.totalSlots} slots across {fc.scenarios} scenarios.</p>
          </section>
        ) : null}
      </div>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '1 1 420px' }} aria-labelledby="ov-actions">
          <div className="ps-card-head"><h2 id="ov-actions">Top actions</h2><button type="button" className="ps-btn ps-btn--sm" onClick={() => go('actions')}>All {open.length}</button></div>
          <ol className="ps-list">
            {open.slice(0, 3).map((a) => (
              <li key={a.id} className="ps-item">
                <div className="ps-item-head"><strong>{a.title}</strong><span className="ps-chip">{TIER_LABEL[a.tier]}</span></div>
                <span className="ps-small">{a.action}</span>
              </li>
            ))}
            {!open.length ? <li className="ps-item">No open actions.</li> : null}
          </ol>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 420px' }} aria-labelledby="ov-alerts">
          <div className="ps-card-head"><h2 id="ov-alerts">Alerts</h2><button type="button" className="ps-btn ps-btn--sm" onClick={() => go('feed')}>Feed</button></div>
          <ul className="ps-list">
            {(b.feed || []).slice(0, 4).map((f, i) => <li key={i} className="ps-item"><strong>{f.title}</strong><span className="ps-small">{f.name}</span></li>)}
            {!(b.feed || []).length ? <li className="ps-item">Nothing flagged on your products in this snapshot.</li> : null}
          </ul>
        </section>
      </div>
    </>
  );
}

/* ---------------- Action queue ---------------- */
export function Actions({ b, actionState, setAction }) {
  const [filter, setFilter] = useState('open');
  const list = (b.actions || []).filter((a) => filter === 'all' || (actionState[a.id] || 'open') === filter);
  return (
    <section className="ps-card" aria-labelledby="act-h">
      <div className="ps-card-head">
        <div><h2 id="act-h">Action queue</h2><p className="ps-small ps-muted">Safety and regulatory first, then evidence, documentation and differentiation. Status saves on this device.</p></div>
        <div className="ps-tabs" role="group" aria-label="Filter">
          {['open', 'in_progress', 'done', 'all'].map((f) => <button key={f} type="button" className="ps-tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'in_progress' ? 'In progress' : f[0].toUpperCase() + f.slice(1)}</button>)}
        </div>
      </div>
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
            <label className="ps-small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Status
              <select value={actionState[a.id] || 'open'} onChange={(e) => setAction(a.id, e.target.value)} style={{ border: '1.5px solid #3e2723', borderRadius: 999, padding: '6px 10px', background: '#ffedac' }}>
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

/* ---------------- Evidence gaps ---------------- */
export function Evidence({ b, openSource }) {
  const m = b.evidence.metrics;
  const statuses = Object.entries(m.draft.byStatus).filter(([, n]) => n > 0);
  const total = statuses.reduce((a, [, n]) => a + n, 0);
  return (
    <>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Review coverage" value={ratePct(m.reviewCoverage)} den={`${m.reviewCoverage.num} of ${m.reviewCoverage.den} inventoried claims signed off by a reviewer`} />
        <Kpi tone="pink" label="Direct-evidence coverage" value={ratePct(m.directCoverage)} den={m.directCoverage.den ? `${m.directCoverage.num} of ${m.directCoverage.den} reviewed claims` : 'N/A until claims are reviewed'} />
        <Kpi tone="deep" label="Documented support" value={ratePct(m.supportCoverage)} den="Needs a reviewer's judgement per claim" />
        <Kpi tone="plain" label="Information completeness" value={m.completeness.mine == null ? 'N/A' : `${m.completeness.mine}%`} den={`Peer median ${m.completeness.peerMedian ?? 'N/A'}% across ${m.completeness.peerN} comparable products. Separate from evidence.`} />
      </div>
      <section className="ps-card" aria-labelledby="ev-draft">
        <div className="ps-card-head"><h2 id="ev-draft">Claim evidence, draft statuses</h2><DraftBadge text="Draft: AI-assisted research pass" /></div>
        {total ? (
          <>
            <div className="ps-stack" role="img" aria-label={statuses.map(([s, n]) => `${STATUS_LABEL[s]} ${n}`).join(', ')}>
              {statuses.map(([s, n]) => <span key={s} style={{ flex: `${n} 1 0`, background: s === 'direct' ? '#3e2723' : s === 'indirect' || s === 'regulatory_only' ? '#769ebe' : s === 'brand_reported' ? '#f7badd' : undefined, border: '1.5px solid #3e2723' }} className={s === 'not_located' || s === 'experience_only' ? 'ps-hatch' : ''} />)}
            </div>
            <div className="ps-legend">{statuses.map(([s, n]) => <span key={s}>{STATUS_LABEL[s]}: <strong>{n}</strong></span>)}</div>
            <p className="ps-small">Draft direct-study share {ratePct(m.draft.direct)}; peer median {m.draft.peerMedianDirect == null ? 'N/A' : fmtPct(m.draft.peerMedianDirect * 100)} across {m.draft.peerBrands} peer brands with claims on file. A gap only becomes a finding once a reviewer signs off both sides.</p>
          </>
        ) : <Empty title="No claims inventoried yet">ayna has sources on file for your products but hasn't logged claim wording. Send your current claims and the studies behind them.</Empty>}
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="ev-matrix">
        <h2 id="ev-matrix">Gap matrix</h2>
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Product</th><th>Claims and status</th><th>Materials</th><th>Instructions</th><th>Regulatory source</th><th>Completeness</th><th>Sources</th></tr></thead>
            <tbody>
              {b.evidence.skus.map((r) => (
                <tr key={r.sku}>
                  <td><strong>{r.name}</strong><br /><span className="ps-small ps-muted">{r.qa.label}{r.freshness?.state === 'stale' ? ` · ${r.freshness.daysOverdue} days past review` : ''}</span></td>
                  <td>{r.claims.length ? r.claims.map((c, i) => <div key={i} style={{ marginBottom: 6 }}><span className={`ps-chip ${STATUS_TONE[c.status]}`}>{STATUS_LABEL[c.status]}</span><br /><span className="ps-small">“{c.text}”</span></div>) : <span className="ps-small ps-muted">Not inventoried</span>}</td>
                  <td>{r.dimensions.materials === 'complete' ? 'On file' : 'Unknown'}</td>
                  <td>{r.dimensions.instructions === 'present' ? 'Published' : 'Missing'}</td>
                  <td>{r.dimensions.regulatory}</td>
                  <td>{r.completeness == null ? 'N/A' : `${r.completeness}%`}</td>
                  <td><button type="button" className="ps-btn ps-btn--sm" onClick={() => openSource(r)}>Sources ({r.sources.length})</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ps-small ps-muted">Unknown is not false: a missing record means ayna hasn't located it, not that it doesn't exist. Peers: {b.evidence.peerSkus} products in the same category and benchmark.</p>
      </section>
    </>
  );
}

/* ---------------- Health claims ---------------- */
export function Claims({ b }) {
  const rows = b.claims.rows || [];
  const ledger = b.evidence.skus.flatMap((r) => r.claims.map((c) => ({ ...c, product: r.name })));
  const flagged = ledger.filter((c) => c.flags.length);
  return (
    <>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Claims on file" value={String(ledger.length)} den={`Across ${b.evidence.skus.length} products`} />
        <Kpi tone="pink" label="Flagged for review" value={String(flagged.length)} den="A flag asks a reviewer to look. It is not a violation." />
        <Kpi tone="deep" label="Claim differentiation" value={b.claims.differentiation.pct == null ? 'N/A' : `${b.claims.differentiation.pct}%`} den={`Your themes absent from ${b.claims.peerSkusInventoried} peer products with claims on file`} />
      </div>
      <section className="ps-card" aria-labelledby="cl-land">
        <div className="ps-card-head"><h2 id="cl-land">Claim landscape</h2><DraftBadge text="Themes are draft groupings" /></div>
        {rows.length ? rows.map((r) => (
          <HBar key={r.theme} label={r.label} sub={r.brand.length ? `You: ${r.brand.length} product${r.brand.length > 1 ? 's' : ''}${r.unique ? ' · not seen in peers' : ''}` : 'Not in your claims'} value={r.peerPrevalence.value == null ? null : r.peerPrevalence.value * 100} text={r.peerPrevalence.den ? `${r.peerPrevalence.num}/${r.peerPrevalence.den} peers` : 'N/A'} tone={r.brand.length ? '' : 'blue'} />
        )) : <Empty title="No claim themes yet">Neither you nor comparable products have claim wording logged in this snapshot.</Empty>}
        <p className="ps-chart-foot">Bar: share of peer products whose logged claims include the theme. Not proof of market exclusivity.</p>
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="cl-ledger">
        <h2 id="cl-ledger">Claim ledger and review queue</h2>
        <ul className="ps-list">
          {ledger.map((c, i) => (
            <li key={i} className="ps-item">
              <div className="ps-item-head"><strong>“{c.text}”</strong><span className={`ps-chip ${STATUS_TONE[c.status]}`}>{STATUS_LABEL[c.status]}</span></div>
              <span className="ps-small">{c.product}{c.strength ? ` · strength: ${c.strength}` : ''}{c.sourceUrl ? <> · <a href={c.sourceUrl} target="_blank" rel="noreferrer">source</a></> : null}</span>
              {c.flags.map((f) => <span key={f.id} className="ps-chip ps-chip--pink" style={{ alignSelf: 'flex-start' }}>{f.label}</span>)}
            </li>
          ))}
          {!ledger.length ? <li className="ps-item">No claim wording logged for your products yet.</li> : null}
        </ul>
        <p className="ps-small ps-muted">ayna never rewrites your marketing or declares a claim unlawful. Ambiguous classifications go to counsel.</p>
      </section>
    </>
  );
}

/* ---------------- Recommendation share ---------------- */
export function Share({ data, b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  if (!c) return null;
  const meta = data.categories.find((x) => x.id === c.id);
  return (
    <>
      <div className="ps-top"><CategoryTabs cats={b.categories} cat={c} setCat={setCat} /><SyntheticBadge text={SYNTHETIC} /></div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" label="Slot share" value={c.slotShare == null ? 'N/A' : `${c.slotShare}%`} meter={c.slotShare} cmp={vsPeers(c.slotShare, c.field?.peerMedian)} den={`${c.brandSlots} of ${c.slots} filled top-${c.k} slots`} />
        <Kpi tone="pink" label="Scenario inclusion" value={c.inclusion.pct == null ? 'N/A' : `${c.inclusion.pct}%`} den={`${c.inclusion.num} of ${c.inclusion.den} scenarios`} />
        <Kpi tone="deep" label="Eligible to placed" value={c.eligibleToPlaced.pct == null ? 'N/A' : `${c.eligibleToPlaced.pct}%`} den={`${c.eligibleToPlaced.num} of ${c.eligibleToPlaced.den} eligible scenarios`} />
        <Kpi tone="plain" label="Brand rank by slots" value={c.rank.rank ? `#${c.rank.rank}` : 'Unranked'} cmp={c.field ? { dir: 'flat', text: `${c.field.brands} brands in this benchmark` } : null} den={`of ${c.rank.of} brands with a placement`} />
      </div>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '3 1 520px' }} aria-labelledby="sh-need">
          <CardHead id="sh-need" title="By need" desc="Your slot share for each need ayna matches in this category." />
          {c.byNeed.map((n) => <HBar key={n.need} label={n.need} sub={`${n.brandSlots} of ${n.slots} slots · ${n.scenarios} scenarios`} value={n.slotShare} text={n.slotShare == null ? 'N/A' : `${n.slotShare}%`} />)}
          <p className="ps-chart-foot">{SYNTHETIC}. Slot share; brand-level shares favor larger assortments, so see products below.</p>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '2 1 340px' }} aria-labelledby="sh-field">
          <CardHead id="sh-field" title="You vs the shelf" desc="Slot share for every brand in this benchmark. Dashed line: peer median." />
          <ShelfField field={c.field} max={10} />
        </section>
      </div>
      <section className="ps-card" aria-labelledby="sh-heat">
        <CardHead id="sh-heat" title="Need × budget map" desc="Where you win and where you vanish. Each cell is your slot share for one need at one budget band; darker means more slots." right={<SyntheticBadge />} />
        <Heatmap grid={c.grid} />
        <p className="ps-small">Budget sensitivity: {c.sensitivity.min ?? 'N/A'}% to {c.sensitivity.max ?? 'N/A'}% slot share across bands. A sensitivity range, not a confidence interval for real shoppers. Each cell shows your slots out of all slots in it.</p>
      </section>
      <section className="ps-card ps-card--plain" aria-labelledby="sh-sku">
        <h2 id="sh-sku">Products</h2>
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Product</th><th>Placed</th><th>Eligible, not placed</th><th>On hold</th><th>Ruled out</th></tr></thead>
            <tbody>{c.skus.map((s) => <tr key={s.sku}><td><strong>{s.name}</strong></td><td>{s.selected}</td><td>{s.eligible_lost}</td><td>{s.insufficient_info}</td><td>{s.excluded}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="ps-small ps-muted">Universe: {meta?.universe} products, {meta?.brands} brands. No-result scenarios {c.noResult.num} of {c.noResult.den}; unfilled slots {c.unfilled}. Counts are scenario-level, not shoppers.</p>
      </section>
    </>
  );
}

/* ---------------- Lost recommendations ---------------- */
export function Losses({ b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  if (!c) return null;
  const f = c.funnel;
  const max = Math.max(f.in_scope + f.out_of_scope, 1);
  const allSims = (b.simulations || []).filter((s) => s.category === c.id);
  const sims = [...allSims].sort((x, y) => ((y.after.inclusion.num - y.before.inclusion.num) - (x.after.inclusion.num - x.before.inclusion.num))).filter((s) => s.after.inclusion.num !== s.before.inclusion.num);
  const flat = allSims.length - sims.length;
  const rows = [
    ['Scenarios in this category', f.in_scope + f.out_of_scope, 'Fixed synthetic set'],
    ['A product of yours is relevant', f.in_scope, 'At least one SKU mapped to the need'],
    ['Eligible', f.eligible, 'At least one SKU cleared by safety rules'],
    ['Placed', f.placed, 'In the final top 3'],
    ['Eligible, not placed', f.eligible_lost, f.eligible ? `${fmtPct((f.eligible_lost / f.eligible) * 100)} of eligible` : 'N/A'],
  ];
  return (
    <>
      <div className="ps-top"><CategoryTabs cats={b.categories} cat={c} setCat={setCat} /><SyntheticBadge text={SYNTHETIC} /></div>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '3 1 520px' }} aria-labelledby="lo-funnel">
          <CardHead id="lo-funnel" title="Eligibility funnel" desc="From every scenario in the category down to the ones where you made the top 3." />
          <div className="ps-funnel">
            {rows.map(([l, n, note]) => (
              <div key={l} className="ps-funnel-row"><span style={{ fontWeight: 700 }}>{l}</span><span><span className="ps-funnel-bar" style={{ width: `${Math.max((n / max) * 100, 4)}%` }}>{n}</span></span><span className="ps-small">{note}</span></div>
            ))}
          </div>
          <p className="ps-small">Not eligible: <strong>{f.insufficient_info}</strong> on hold for a missing fact, <strong>{f.excluded}</strong> ruled out by safety or life-stage rules (never optimized away).</p>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '2 1 340px' }} aria-labelledby="lo-reasons">
          <CardHead id="lo-reasons" title="Why eligible products weren't placed" desc="One primary reason per lost scenario, from the engine's own scores." />
          <ReasonStack reasons={f.reasons} />
          {f.reasons.length ? f.reasons.map((r) => <HBar key={r.id} name={r.label} label={<><i className={`ps-key ${reasonKey(r.id)}`} />{r.label}</>} max={Math.max(...f.reasons.map((x) => x.share || 0), 1)} value={r.share} text={`${r.n} · ${fmtPct(r.share)}`} tone={reasonFill(r.id)} />) : <p>No eligible losses.</p>}
          <p className="ps-small">One primary reason per lost scenario; they sum to {f.eligible_lost}{f.sumsToLost ? '' : ' (check failed)'}. Budget is observed (price vs band); the rest are inferred from the engine's own score components.</p>
        </section>
      </div>
      <section className="ps-card ps-card--plain" aria-labelledby="lo-ex">
        <h2 id="lo-ex">Example traces (fictional scenarios)</h2>
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead><tr><th>Scenario</th><th>Your product</th><th>Reason</th><th>Placed instead</th></tr></thead>
            <tbody>{f.examples.map((e) => <tr key={e.scenarioId + e.sku}><td>{e.label}</td><td>{c.skus.find((x) => x.sku === e.sku)?.name || e.sku}</td><td><strong>{f.reasons.find((r) => r.id === e.reason)?.label || e.reason}</strong><br /><span className="ps-small">{e.detail}</span></td><td className="ps-small">{e.placed.join(', ') || 'Nothing (no result)'}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <div className="ps-row">
        <section className="ps-card" style={{ flex: '1 1 420px' }} aria-labelledby="lo-sim">
          <div className="ps-card-head"><h2 id="lo-sim">Simulation lab: price 20% lower</h2><span className="ps-badge ps-badge--dark">Simulation</span></div>
          {sims.length ? sims.map((s) => {
            const a = s.before.inclusion.value ?? 0;
            const z = s.after.inclusion.value ?? 0;
            return (
              <div key={s.sku} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{s.name}</strong><span className="ps-small">{s.changeLabel}</span></div>
                <div style={{ position: 'relative', height: 24, background: '#ffedac', border: '1.5px solid #3e2723', borderRadius: 999 }} role="img" aria-label={`Inclusion ${s.before.inclusion.num} to ${s.after.inclusion.num} of ${s.scenarios}`}>
                  <span style={{ position: 'absolute', top: 10, height: 3, background: '#3e2723', left: `${Math.min(a, z) * 100}%`, width: `${Math.abs(z - a) * 100}%` }} />
                  <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', border: '2px solid #3e2723', background: '#ffedac', left: `calc(${a * 100}% - 8px)` }} />
                  <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', border: '2px solid #3e2723', background: '#3e2723', left: `calc(${z * 100}% - 8px)` }} />
                </div>
                <span className="ps-small">Inclusion {s.before.inclusion.num} → {s.after.inclusion.num} of {s.scenarios} scenarios ({z - a >= 0 ? '+' : ''}{Math.round((z - a) * 1000) / 10} pp). {s.displacedOtherSlots} other-brand slots shift. Safety check {s.safetyOk ? 'passed' : 'failed'}.</span>
              </div>
            );
          }) : <p>{allSims.length ? 'A 20% lower price changes nothing for any of your products here.' : 'No priced product to simulate in this category.'}</p>}
          {sims.length && flat ? <p className="ps-small">{flat} other product{flat === 1 ? '' : 's'}: no change at 20% lower.</p> : null}
          <p className="ps-small ps-muted">Simulated uplift is percentage points of fictional scenarios, not customers or sales. Only price can be simulated; safety facts, ingredients and evidence never change in a simulation.</p>
        </section>
        <section className="ps-card ps-card--plain" style={{ flex: '1 1 320px' }} aria-labelledby="lo-bound">
          <h2 id="lo-bound">Boundary and unknown-input cases</h2>
          <p className="ps-small">Kept out of the baseline numbers.</p>
          {[['Safety boundary (pregnant, breastfeeding, latex allergy, medicines)', c.boundary], ['Skipped answers', c.unknown]].map(([l, s]) => (
            <div key={l} className="ps-item"><strong>{l}</strong><span className="ps-small">{Object.entries(s).filter(([, n]) => n).map(([k, n]) => `${STAGE_LABEL[k]}: ${n}`).join(' · ') || 'No cases'}</span></div>
          ))}
        </section>
      </div>
    </>
  );
}

/* ---------------- Competitors ---------------- */
export function Competitors({ b }) {
  const [i, setI] = useState(0);
  const row = b.competitors[i];
  if (!row) return <Empty title="No comparable products">No peers in the same category and benchmark.</Empty>;
  const cols = [row, ...row.peers];
  const attrs = [
    ['Brand', (x, j) => (j === 0 ? b.displayName || b.brand : x.brand)],
    ['Price', (x) => money(x.price)],
    ['Information completeness', (x) => (x.completeness == null ? 'N/A' : `${x.completeness}%`)],
    ['Claims on file', (x) => x.claims],
    ['Direct product studies (draft)', (x) => x.direct],
    ['Claim themes', (x) => (x.themes.length ? x.themes.join(', ') : 'None logged')],
    ['Fact freshness', (x) => x.freshness || 'Unknown'],
    ['ayna review status', (x) => x.qa],
  ];
  return (
    <section className="ps-card" aria-labelledby="co-h">
      <div className="ps-card-head">
        <div><h2 id="co-h">Compare with peers</h2><p className="ps-small ps-muted">Fixed neutral peer set: same product category inside the same benchmark universe, closest in price. Public information only.</p></div>
        <label className="ps-small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Your product
          <select value={i} onChange={(e) => setI(Number(e.target.value))} style={{ border: '1.5px solid #3e2723', borderRadius: 999, padding: '6px 10px', background: '#ffedac', maxWidth: 260 }}>
            {b.competitors.map((c, k) => <option key={c.sku} value={k}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead><tr><th>Attribute</th>{cols.map((x, j) => <th key={x.sku} style={j === 0 ? { background: '#f7badd' } : undefined}>{x.name}</th>)}</tr></thead>
          <tbody>{attrs.map(([label, fn]) => <tr key={label}><td><strong>{label}</strong></td>{cols.map((x, j) => <td key={x.sku} style={j === 0 ? { background: 'rgba(247,186,221,.35)' } : undefined}>{String(fn(x, j))}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="ps-small ps-muted">A competitor may hold private evidence ayna hasn't seen. Brand-nominated competitors come in a later phase; the neutral set stays fixed.</p>
    </section>
  );
}

/* ---------------- Intelligence feed ---------------- */
export function Feed({ b, ack, setAck }) {
  const items = b.feed || [];
  const TYPE = { qa_correction: 'Fact correction', clinician_review: 'Clinical review', stale: 'Freshness', claim_flag: 'Claim review flag' };
  return (
    <section className="ps-card" aria-labelledby="fd-h">
      <div className="ps-card-head"><div><h2 id="fd-h">Intelligence feed</h2><p className="ps-small ps-muted">Baseline snapshot. New competitors, price and claim changes appear from the next refresh, each with its source and date.</p></div></div>
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

/* ---------------- Reports and methodology ---------------- */
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
          <h2 id="rp-run">This benchmark run</h2>
          <div className="ps-table-wrap"><table className="ps-table"><tbody>{meta.map(([k, v]) => <tr key={k}><td><strong>{k}</strong></td><td>{String(v)}</td></tr>)}</tbody></table></div>
          <p className="ps-small">Catalog versions: {data.categories.map((c) => `${c.label} ${c.catalogVersion}`).join(' · ')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="ps-btn ps-btn--ink" onClick={onExport}>Download aggregate CSV</button>
            <button type="button" className="ps-btn" onClick={() => window.print()}>Print report</button>
          </div>
        </section>
        <section className="ps-card" style={{ flex: '2 1 480px' }} aria-labelledby="rp-def">
          <h2 id="rp-def">Definitions</h2>
          <ul className="ps-list">
            <li className="ps-item"><strong>Slot share</strong><span className="ps-small">Your placements across final top-{r.k} lists ÷ all placements in those lists. Lists with fewer than {r.k} count actual slots.</span></li>
            <li className="ps-item"><strong>Scenario inclusion</strong><span className="ps-small">Scenarios with at least one of your products placed ÷ all scenarios in the category, no-result scenarios included. Rates across brands don't add to 100%.</span></li>
            <li className="ps-item"><strong>Eligible to placed</strong><span className="ps-small">Scenarios with a placement ÷ scenarios where at least one of your products was eligible. N/A when none were eligible.</span></li>
            <li className="ps-item"><strong>Review coverage</strong><span className="ps-small">Claims signed off by a human reviewer ÷ all inventoried claims. Pending claims stay in the denominator.</span></li>
            <li className="ps-item"><strong>Scenarios</strong><span className="ps-small">Fictional quiz answers in a full factorial design (need × life stage × budget band × format × allergy), equal weights. Not a population estimate. Safety boundary and skipped-answer cases are reported separately.</span></li>
            <li className="ps-item"><strong>Engine</strong><span className="ps-small">The production matching code, run read-only on a frozen catalog. Partner status, affiliate links and payments are not inputs; a test proves changing them leaves placements unchanged.</span></li>
          </ul>
        </section>
      </div>
      <section className="ps-card ps-card--pink" aria-labelledby="rp-limits">
        <h2 id="rp-limits">What this is not</h2>
        <p>Not market share, demand, sales, clinical superiority or legal certification, and not a promise of placement. No consumer health data, conversations, wearable data or user events feed this page. Every conclusion shows its scope and date.</p>
        <p className="ps-small">Viewing {b.displayName || b.brand}. Evidence statuses are drafts from an AI-assisted research pass until a reviewer signs them off.</p>
      </section>
    </>
  );
}

