/* Partner Studio screens. Each one follows a section of the Phase 1 plan (page numbers in comments). */
import React, { useMemo, useState } from 'react';
import { Kpi, HBar, SyntheticBadge, DraftBadge, Empty, CardHead, Heatmap, ReasonStack, Drawer, Ring, InfoTip, Icon } from './ui.jsx';
import { ratePct, money, SYNTHETIC } from './format.js';
import { explore, versus } from './engine/explore.js';
import { C } from './chartColors.js';
import { BACKING as CR_BACKING, TOPICS as CR_TOPICS, PRODUCTS as CR_PRODUCTS, CHECKED as CR_CHECKED, productsOf as crProductsOf, researchedBrands as crResearchedBrands } from './engine/claimsResearch.js';
import { Panel, ViewSwitch, RankedBars, Stacked100, Dumbbell, Matrix, Pareto, FunnelBars, GroupedBars, BeforeAfter, TrendLine, SortTable, Findings, Method } from './charts.jsx';

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
function BrandRanking({ rows, brand, limit = 10, totalSlots, compact = false }) {
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
          <span role="cell" className="ps-rank-name"><span>{r.brand}{r.brand === brand ? <em> (you)</em> : null}{r.partner && r.brand !== brand ? <PartnerTag /> : null}</span>{compact ? null : <small>{r.products} product{r.products === 1 ? '' : 's'}</small>}</span>
          <span role="cell" className="ps-rank-bar"><span style={{ width: `${(r.slots / top) * 100}%` }} /><b>{r.slots}</b></span>
          <span role="cell" className="ps-r ps-rank-share">{r.share == null ? 'N/A' : `${r.share}%`}</span>
        </div>
      ))}
      {compact ? null : <div className="ps-rank-foot">
        <span className="ps-small ps-muted">{rows.length} brands · {totalSlots} top-3 picks in total</span>
        {rows.length > limit ? <button type="button" className="ps-link" onClick={() => setAll((v) => !v)}>{all ? 'Show top 10' : `Show all ${rows.length}`}</button> : null}
      </div>}
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
const shortName = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);

/** Tabs inside a card: peers of one thing (Leaderboard, Head to head, By need). */
function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="ps-seg" role="tablist" aria-label={label}>
      {tabs.map(([id, text, icon]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className="ps-seg-btn" onClick={() => onChange(id)}>
          {icon ? <Icon name={icon} /> : null}{text}
        </button>
      ))}
    </div>
  );
}

/** You vs one rival on the same shoppers: who got picked. */
function HeadToHead({ meta, ex, b, name }) {
  const rivals = ex.takenBy.slice(0, 6).map((t) => t.brand);
  const fallback = ex.brands.filter((x) => !x.you && x.slots).slice(0, 6).map((x) => x.brand);
  const list = rivals.length ? rivals : fallback;
  const [rival, setRival] = useState(list[0] || '');
  const pick = list.includes(rival) ? rival : list[0];
  const outcomes = b.categories.find((c) => c.id === meta.id)?.outcomes || '';
  const v = pick ? versus(meta, b.brand, outcomes, pick) : null;
  if (!pick || !v || !v.fit) return <p className="ps-small">None of your products fit these shoppers yet, so there’s no head to head.</p>;
  const segs = [
    ['onlyYou', `Only ${name}`, 'is-ink'],
    ['both', 'Both picked', 'is-pink'],
    ['onlyThem', `Only ${pick}`, 'is-blue'],
    ['neither', 'Neither', 'is-butter'],
  ];
  const youWin = v.onlyYou + v.both;
  const themWin = v.onlyThem + v.both;
  return (
    <div className="ps-vs">
      <div className="ps-chips" role="group" aria-label="Pick a competitor">
        {list.map((r) => <button key={r} type="button" className="ps-chip-btn" aria-pressed={r === pick} onClick={() => setRival(r)}>{r}</button>)}
      </div>
      <div className="ps-vs-score">
        <div className="ps-vs-side is-you"><span className="ps-small">{name}</span><span className="ps-num">{youWin}</span><span className="ps-small ps-muted">picked</span></div>
        <span className="ps-vs-mid">vs</span>
        <div className="ps-vs-side"><span className="ps-small">{pick}</span><span className="ps-num">{themWin}</span><span className="ps-small ps-muted">picked</span></div>
      </div>
      <p className="ps-vs-caption">Out of the <b>{v.fit}</b> shoppers your products fit.</p>
      <div className="ps-vs-bar" role="img" aria-label={segs.map(([k, l]) => `${l} ${v[k]}`).join(', ')}>
        {segs.map(([k, , cls]) => (v[k] ? <span key={k} className={cls} style={{ flex: `${v[k]} 1 0` }}>{v[k] / v.fit >= 0.08 ? v[k] : ''}</span> : null))}
      </div>
      <ul className="ps-vs-legend">
        {segs.map(([k, l, cls]) => <li key={k}><i className={cls} />{l}<b>{v[k]}</b></li>)}
      </ul>
    </div>
  );
}

/** One row per shopper need: a status pill, your picks, and who leads it. */
function ByNeed({ meta, brand, outcomes }) {
  const rows = useMemo(() => meta.needs.map((n) => {
    const e = explore(meta, brand, outcomes, { need: n });
    return { need: n, me: e.brandSlots, rank: e.rank.rank, leader: e.brands[0], slots: e.slots };
  }), [meta, brand, outcomes]);
  const status = (r) => {
    if (!r.slots) return ['No match yet', 'ps-pill-st--none'];
    if (r.rank === 1) return ['You lead', 'ps-pill-st--win'];
    if (r.me) return [`#${r.rank}`, 'ps-pill-st--mid'];
    return ['Not picked', 'ps-pill-st--lose'];
  };
  return (
    <ul className="ps-needs">
      {rows.map((r) => {
        const [label, tone] = status(r);
        return (
          <li key={r.need} className="ps-need">
            <span className="ps-need-name">{r.need}</span>
            <span className={`ps-pill-st ${tone}`}>{label}</span>
            <span className="ps-need-meta">{r.slots ? <>You {r.me} · {r.leader.you ? 'you lead' : <>{r.leader.brand} {r.leader.slots}</>}</> : 'Nothing recommended'}</span>
          </li>
        );
      })}
    </ul>
  );
}

const FIX = {
  relevance: { icon: 'target', title: 'Say clearly what it’s for' },
  budget: { icon: 'tag', title: 'Fit the under-$25 budget' },
  below_cutoff: { icon: 'doc', title: 'Fill in missing product facts' },
  format: { icon: 'layers', title: 'Offer another format' },
};

export function Overview({ data, b, go, actionState }) {
  const open = (b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done');
  const [catId, setCatId] = useState(b.categories[0]?.id);
  const [tab, setTab] = useState('rank');
  const [rankMode, setRankMode] = useState('brands');
  const c = b.categories.find((x) => x.id === catId) || b.categories[0];
  const meta = data.categories.find((x) => x.id === c?.id);
  const ex = useMemo(() => (meta?.rows ? explore(meta, b.brand, c.outcomes) : null), [meta, b.brand, c]);
  if (!ex) return null;
  const name = b.displayName || b.brand;
  const me = ex.brands.find((x) => x.you) || { slots: 0 };
  const leader = ex.brands[0];
  const fit = ex.eligibleToPlaced.den;
  const top3 = ex.brands.filter((x) => !x.you && x.slots > 0).slice(0, 3);
  const RING_COLORS = ['#f7badd', '#769ebe', '#c9d9e6'];
  const rest = ex.slots - me.slots - top3.reduce((a2, x) => a2 + x.slots, 0);
  const ring = [
    { label: `${name} (you)`, value: me.slots, color: '#3e2723', you: true },
    ...top3.map((x, k) => ({ label: x.brand, value: x.slots, color: RING_COLORS[k] })),
    { label: 'Everyone else', value: Math.max(rest, 0), color: '#e4cf86' },
  ];
  const sims = (b.simulations || []).filter((s) => s.category === c.id && s.after.inclusion.num > s.before.inclusion.num)
    .sort((x, y) => (y.after.inclusion.num - y.before.inclusion.num) - (x.after.inclusion.num - x.before.inclusion.num));
  const fixes = [
    ...sims.slice(0, 1).map((s) => ({ key: `sim-${s.sku}`, icon: 'tag', title: `Price ${shortName(s.name, name)} at ${String(s.changeLabel).split(' ')[0]}`, detail: 'A test run with only the price changed.', impact: `+${s.after.inclusion.num - s.before.inclusion.num} shoppers`, go: 'losses' })),
    ...(c.funnel.reasons || []).filter((r) => r.n && FIX[r.id]).map((r) => ({ key: r.id, icon: FIX[r.id].icon, title: FIX[r.id].title, detail: r.action, impact: `${r.n} lost picks`, go: 'losses' })),
  ].slice(0, 3);
  const flags = new Set((b.feed || []).map((f) => f.title)).size;
  const catLabel = c.label.toLowerCase();
  const how = `ayna runs ${ex.scenarios} made-up shoppers through the same matching engine as the app and counts which products land in each top 3. All ${meta.universe} ${catLabel} products in ayna’s catalog compete (${meta.brands} brands). No real customers or sales. Updated ${new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
  const TABS = [['rank', 'Leaderboard', 'trophy'], ['vs', 'Head to head', 'swap'], ['need', 'By shopper need', 'target']];
  const TAB_INFO = {
    rank: 'Every brand in the category, partner or not, by how many top-3 spots it won. ayna partner tags never change a rank.',
    vs: 'Pick a competitor. Of the shoppers your products fit, this shows who got picked: only you, both, only them, or neither.',
    need: 'Where you win and where you don’t, for each thing shoppers came looking for.',
  };
  return (
    <>
      <div className="ps-ov-bar">
        <CategoryTabs cats={b.categories} cat={c} setCat={setCatId} />
        <span className="ps-ov-how">How this works <InfoTip text={how} label="How this works" /></span>
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" icon="trophy" label="Your rank" value={me.slots ? `#${me.rank}` : '–'} den={`of ${ex.brands.length} brands`} info={`Brands ranked by how many top-3 spots their products won across ${ex.scenarios} made-up shoppers in ${catLabel}.`} />
        <Kpi tone="pink" icon="hash" label="Times picked" value={String(me.slots)} den={`of ${ex.slots} top-3 spots (${ex.slotShare.pct ?? 0}%)`} info="Every made-up shopper gets a top 3. This is how many of those spots went to your products." />
        <Kpi tone="deep" icon="swap" label="Fit but lost" value={String(ex.lost)} den={`of ${fit} shoppers you fit`} info="Shoppers your product passed every safety and fit check for, but someone else got the spot." />
        <Kpi tone="plain" icon="crown" label="Category leader" value={leader?.brand || '–'} den={leader ? `${leader.slots} picks (${leader.share}%)` : ''} info="The brand with the most top-3 spots in this category." />
      </div>
      <div className="ps-ov-main">
        <section className="ps-card ps-tabcard" aria-label="Compare">
          <div className="ps-tabcard-head">
            <Tabs tabs={TABS} value={tab} onChange={setTab} label="Compare" />
            <InfoTip text={TAB_INFO[tab]} />
          </div>
          {tab === 'rank' ? (
            <div className="ps-tabpane">
              <div className="ps-tabpane-bar">
                <div className="ps-toggle" role="group" aria-label="Rank by">
                  <button type="button" aria-pressed={rankMode === 'brands'} onClick={() => setRankMode('brands')}>Brands</button>
                  <button type="button" aria-pressed={rankMode === 'products'} onClick={() => setRankMode('products')}>Products</button>
                </div>
                <button type="button" className="ps-link" onClick={() => go('share')}>Filter by need and budget ›</button>
              </div>
              {rankMode === 'brands' ? <BrandRanking rows={ex.brands} brand={b.brand} totalSlots={ex.slots} limit={8} compact /> : <ProductRanking rows={ex.products} limit={8} />}
            </div>
          ) : null}
          {tab === 'vs' ? <div className="ps-tabpane"><HeadToHead meta={meta} ex={ex} b={b} name={name} /></div> : null}
          {tab === 'need' ? <div className="ps-tabpane"><ByNeed meta={meta} brand={b.brand} outcomes={c.outcomes} /></div> : null}
        </section>
        <aside className="ps-rail">
          <section className="ps-card" aria-labelledby="ov-ring">
            <CardHead id="ov-ring" icon="share" title="Share of top-3 spots" info={`All ${ex.slots} top-3 spots, split by brand.`} />
            <Stacked100 rows={[{ label: 'All spots', counts: Object.fromEntries(ring.map((x) => [x.label, x.value])) }]} keys={ring.map((x) => ({ key: x.label, label: `${x.label} ${pct1(x.value, ex.slots)}`, color: x.color, dark: x.you }))} />
            <p className="ps-small ps-muted">Claims reviewed by a person: {ratePct(b.evidence.metrics.reviewCoverage)}</p>
          </section>
          <section className="ps-card" aria-labelledby="ov-fix">
            <CardHead id="ov-fix" icon="actions" title="Fix this next" right={<button type="button" className="ps-btn ps-btn--sm" onClick={() => go('actions')}>All {open.length}</button>} />
            {fixes.length ? (
              <ol className="ps-fixlist">
                {fixes.map((f, k) => (
                  <li key={f.key}>
                    <button type="button" className="ps-fixrow" onClick={() => go(f.go)}>
                      <span className="ps-fix-num">{k + 1}</span>
                      <span className="ps-fixrow-text"><strong>{f.title}</strong><span className="ps-impact">{f.impact}</span></span>
                      <InfoTip text={f.detail} label={f.title} />
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="ps-small">Nothing to fix: you made the top 3 every time you fit.</p>}
          </section>
          <button type="button" className="ps-card ps-flagcard" onClick={() => go('feed')}>
            <span className="ps-fix-icon"><Icon name="alert" /></span>
            <span><strong>{flags ? `${flags} to check on your products` : 'Nothing flagged'}</strong><span className="ps-small ps-muted">Reviews, freshness, claim flags</span></span>
            <span aria-hidden="true">›</span>
          </button>
        </aside>
      </div>
    </>
  );
}

/* ---------------- Action queue (p.11) ---------------- */
export function Actions({ b, actionState, setAction }) {
  const [filter, setFilter] = useState('open');
  const list = (b.actions || []).filter((a) => filter === 'all' || (actionState[a.id] || 'open') === filter);
  return (
    <section className="ps-card" aria-labelledby="act-h">
      <CardHead id="act-h" icon="actions" title="Action queue" info="Safety and regulatory first, then evidence, documentation and differentiation. Status saves on this device." right={
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

/* ---------------- Shared evidence status scale (plan p.4; draft until human review) ---------------- */
const EV_GROUP = { direct: 'direct', indirect: 'indirect', regulatory_only: 'indirect', brand_reported: 'limited', experience_only: 'limited', not_located: 'none' };
const EV = {
  direct: { label: 'Product-specific evidence identified', short: 'Product-specific', color: C.good },
  indirect: { label: 'Indirect or ingredient-level evidence', short: 'Indirect', color: C.goodLight },
  limited: { label: 'Limited relevant evidence', short: 'Limited', color: C.amberLight },
  none: { label: 'No supporting documentation located', short: 'None located', color: C.amber },
};
const EV_LEGEND = [...Object.entries(EV).map(([key, v]) => ({ key, label: v.label, color: v.color })), { key: 'na', label: 'Not claimed or not stated', color: C.missing }];
const EV_RANK = { direct: 0, indirect: 1, regulatory_only: 2, brand_reported: 3, experience_only: 4, not_located: 5 };
const bestStatus = (list) => list.filter(Boolean).sort((a, b) => EV_RANK[a] - EV_RANK[b])[0] || null;
const evCell = (status) => {
  if (!status) return { text: '–', color: C.missing, title: 'Not claimed or not stated in reviewed sources' };
  const g = EV[EV_GROUP[status]];
  return { text: status === 'regulatory_only' ? 'Regulatory only' : status === 'experience_only' ? 'Reviews only' : g.short, color: g.color, title: `${g.label}${STATUS_NOTE[status] ? `. ${STATUS_NOTE[status]}` : ''}` };
};
const prettyTheme = (t, labels) => (t == null ? 'Not grouped yet' : labels[t] || String(t).replace(/[_-]/g, ' ').replace(/^./, (x) => x.toUpperCase()));
const median = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const pctOf = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
const updatedOn = (data) => new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const groupCounts = (statuses) => statuses.reduce((a, s) => { const g = EV_GROUP[s]; if (g) a[g] = (a[g] || 0) + 1; return a; }, {});

function Picker({ comps, i, setI, label = 'Your product' }) {
  return <ProductPicker items={comps} value={i} onChange={setI} label={label} />;
}

/* ---------------- Evidence gaps (pp.4-5) ---------------- */
const nextAction = (mine, peer) => {
  if (mine === 'direct') return 'Maintain documentation.';
  if (peer === 'direct') return 'A competitor has a product-specific study for this. Assess a product-specific study.';
  if (!mine || mine === 'not_located' || mine === 'experience_only') return 'Clarify the exact claim, or send the source behind it.';
  if (mine === 'brand_reported') return 'Send the study you cite so a reviewer can check it.';
  if (mine === 'regulatory_only') return 'A clearance covers intended use, not every claim. Check the wording against it.';
  return 'Send product-specific evidence for review.';
};

export function Evidence({ data, b, openSource }) {
  const comps = b.competitors || [];
  const [i, setI] = useState(0);
  const [view, setView] = useState('gap');
  const sku = comps[i];
  if (!sku) return <Empty title="No products in a Phase 1 category">Evidence gaps need at least one product in a benchmarked category.</Empty>;
  const m = b.evidence.metrics;
  const rec = b.evidence.skus.find((r) => r.sku === sku.sku);
  const labels = Object.fromEntries((b.claims.rows || []).map((r) => [r.theme, r.label]));
  const peers = [...sku.peers].sort((x, y) => (y.claims > 0) - (x.claims > 0)).slice(0, 3);
  const myThemeStatus = {};
  for (const cl of rec?.claims || []) for (const t of cl.themes) myThemeStatus[t] = bestStatus([myThemeStatus[t], cl.status]);
  const themes = [...new Set([...Object.keys(myThemeStatus), ...peers.flatMap((p) => p.themes)])];
  const cols = [{ key: sku.sku, label: shortName(sku.name, b.displayName || b.brand), sub: 'You', you: true }, ...peers.map((p) => ({ key: p.sku, label: p.name, sub: `${p.brand} · ${money(p.price)}` }))];
  const docCell = (val, good, label) => (val === good ? { text: label || 'Complete', color: C.goodLight } : { text: val === 'Unknown' || val == null ? 'Not located' : String(val), color: C.missing });
  const rows = [
    ...themes.map((t) => ({ key: `t-${t}`, label: prettyTheme(t, labels), group: 'Claims and health outcomes' })),
    { key: 'materials', label: 'Material or ingredient disclosure', group: 'Documentation' },
    { key: 'instructions', label: 'Use instructions', group: 'Documentation' },
    { key: 'regulatory', label: 'Regulatory record', group: 'Documentation' },
    { key: 'completeness', label: 'Information completeness', group: 'Documentation' },
  ];
  const cell = (r, c) => {
    const p = c.you ? sku : peers.find((x) => x.sku === c.key);
    if (r.key.startsWith('t-')) {
      const t = r.key.slice(2);
      const s = c.you ? myThemeStatus[t] : p.themeStatus?.[t];
      const v = evCell(s);
      return c.you && rec ? { ...v, onClick: () => openSource(rec) } : v;
    }
    if (r.key === 'materials') return docCell(p.materials, 'complete');
    if (r.key === 'instructions') return p.instructions === 'present' ? { text: 'Complete', color: C.goodLight } : { text: 'Incomplete', color: C.amberLight };
    if (r.key === 'regulatory') return p.regulatory === 'On file' ? { text: 'On file', color: C.goodLight } : { text: p.regulatory || 'Not located', color: C.missing };
    return { text: p.completeness == null ? 'N/A' : `${p.completeness}%`, color: p.completeness == null ? C.missing : undefined };
  };
  // KPIs (brand level, draft statuses until human review)
  const allMine = b.evidence.skus.flatMap((r) => r.claims.map((cl) => cl.status));
  const mineG = groupCounts(allMine);
  const relevant = (mineG.direct || 0) + (mineG.indirect || 0);
  const gapPp = m.draft.direct?.value != null && m.draft.peerMedianDirect != null ? Math.round((m.draft.direct.value - m.draft.peerMedianDirect) * 1000) / 10 : null;
  const gaps = themes.map((t) => {
    const mine = myThemeStatus[t];
    const peerBest = bestStatus(peers.map((p) => p.themeStatus?.[t]));
    const score = (mine === 'direct' ? 99 : 0) + (peerBest === 'direct' ? 0 : peerBest && EV_GROUP[peerBest] === 'indirect' ? 1 : 2) + (!mine ? 0 : 0.5);
    return { t, mine, peerBest, score, holder: peers.find((p) => p.themeStatus?.[t] === peerBest) };
  }).filter((g) => g.mine !== 'direct').sort((x, y) => x.score - y.score);
  // Dumbbell dimensions on one 0-100 scale
  const peerAll = sku.peers;
  const anyDoc = (st) => { const v = Object.values(st || {}); return v.length ? pctOf(v.filter((s) => EV_GROUP[s] === 'direct' || EV_GROUP[s] === 'indirect').length, v.length) : null; };
  const myClaims = rec?.claims.length || 0;
  const dims = [
    { label: 'Claims with product-specific evidence', unit: '%', you: myClaims ? pctOf(rec.claims.filter((x) => x.status === 'direct').length, myClaims) : null, bench: median(peerAll.filter((p) => p.claims > 0).map((p) => pctOf(p.direct, p.claims))), note: 'Draft statuses' },
    { label: 'Claims with any documented evidence', unit: '%', you: myClaims ? anyDoc(myThemeStatus) : null, bench: median(peerAll.filter((p) => p.claims > 0).map((p) => anyDoc(p.themeStatus))), note: 'Product-specific or indirect' },
    { label: 'Information completeness', unit: '%', you: sku.completeness, bench: median(peerAll.map((p) => p.completeness)), note: 'Required fields present' },
  ];
  const mix = [
    { label: `${shortName(sku.name, b.displayName || b.brand)} (you)`, you: true, counts: groupCounts((rec?.claims || []).map((x) => x.status)) },
    ...peerAll.filter((p) => p.claims > 0).slice(0, 6).map((p) => ({ label: `${p.name} (${p.brand})`, counts: groupCounts(Object.values(p.themeStatus || {})) })),
  ];
  const peerWithClaims = peerAll.filter((p) => p.claims > 0).length;
  const findings = [
    myClaims ? `${myClaims} claim${myClaims === 1 ? '' : 's'} logged for ${sku.name}; ${rec.claims.filter((x) => x.status === 'direct').length} with product-specific evidence (draft).` : `ayna has no claim wording logged for ${sku.name} yet, so its evidence can’t be compared claim by claim.`,
    peerWithClaims ? `${peerWithClaims} of ${peerAll.length} comparable products have claims on file. The heatmap shows the ${peers.length} closest.` : `None of the ${peerAll.length} comparable products have claims logged yet either, so this category has no evidence benchmark yet.`,
    sku.completeness != null && dims[2].bench != null ? `Information completeness is ${sku.completeness}% vs a ${dims[2].bench}% median for comparable products.` : 'Information completeness isn’t available for this product.',
    `Human review coverage is ${ratePct(m.reviewCoverage)}. Every status here is a draft from an AI-assisted research pass until a reviewer signs it off.`,
  ];
  const actions = [
    ...gaps.slice(0, 2).map((g) => ({ text: `${prettyTheme(g.t, labels)}: ${nextAction(g.mine, g.peerBest)}`, note: g.holder ? `${g.holder.name} (${g.holder.brand}) shows ${evCell(g.peerBest).text.toLowerCase()} evidence.` : 'No comparable product documents this yet.' })),
    ...(sku.instructions !== 'present' ? [{ text: 'Publish verified use instructions.', note: 'Missing instructions lower information completeness.' }] : []),
    ...(sku.regulatory !== 'On file' ? [{ text: 'Link the FDA record if one exists, or confirm none applies.' }] : []),
    { text: 'Send the studies behind your claims for review.', note: 'Confidential documents stay private and never appear in competitor views.' },
  ].slice(0, 4);
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <Picker comps={comps} i={i} setI={setI} />
        <span className="ps-small ps-muted">Compared with the {peers.length} closest-priced products of the same type. <DraftBadge text="Draft, awaiting human review" /></span>
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" icon="evidence" label="Claims with relevant evidence" value={allMine.length ? String(relevant) : 'N/A'} den={allMine.length ? `of ${allMine.length} claims on file (draft)` : 'No claims logged yet'} info="Claims with product-specific or indirect evidence located, across your products. Draft statuses until human review." />
        <Kpi tone="pink" icon="target" label="Product-specific coverage" value={m.draft.direct?.den ? `${Math.round(m.draft.direct.value * 1000) / 10}%` : 'N/A'} den={m.draft.direct?.den ? `${m.draft.direct.num} of ${m.draft.direct.den} claims` : 'No claims logged yet'} info="Share of your claims backed by a study of the product itself. Does not imply a positive result." />
        <Kpi tone="deep" icon="alert" label="Priority evidence gaps" value={String(gaps.length)} den={`for ${shortName(sku.name, b.displayName || b.brand)}`} info="Claim themes where you lack product-specific evidence, ranked with competitor-documented themes first." />
        <Kpi tone="plain" icon="swap" label="Difference vs competitors" value={gapPp == null ? 'N/A' : `${gapPp > 0 ? '+' : ''}${gapPp} pp`} den={gapPp == null ? 'Needs claims on file for you and peers' : `vs median of ${m.draft.peerBrands} brands`} info="Your product-specific evidence coverage minus the median of matched comparable products." />
        <Kpi tone="plain" icon="doc" label="Reviewed by a person" value={ratePct(m.reviewCoverage)} den={`${m.reviewCoverage.num} of ${m.reviewCoverage.den} claims`} info="Reviewed claims / all inventoried claims. Pending claims stay in the denominator." />
      </div>
      <div className="ps-split">
        <Panel id="ev-heat" title="Competitive evidence heatmap" info="Rows are claim themes and documentation fields. Columns are your product and the closest comparable products. Click one of your cells to see the sources on file.">
          <Matrix rows={rows} cols={cols} cell={cell} legend={EV_LEGEND} corner="Claim or field" />
          {!themes.length ? <p className="ps-small ps-muted">No claim themes logged for this product or its closest competitors, so only documentation is compared.</p> : null}
        </Panel>
        <Panel id="ev-alt" title={view === 'gap' ? 'Gap vs competitors' : view === 'mix' ? 'Evidence mix by product' : 'Evidence gaps, ranked'} info="Switch views for the gap to the competitor median, the mix of evidence statuses, or the ranked list of gaps." right={<ViewSwitch views={[['gap', 'Gap'], ['mix', 'Mix'], ['rank', 'Ranked']]} value={view} onChange={setView} />}>
          {view === 'gap' ? <Dumbbell rows={dims} youLabel={shortName(sku.name, b.displayName || b.brand)} benchLabel={`Median of ${peerAll.length} comparable products`} /> : null}
          {view === 'mix' ? <Stacked100 rows={mix} keys={Object.entries(EV).map(([key, v]) => ({ key, label: v.label, color: v.color }))} /> : null}
          {view === 'rank' ? (gaps.length ? (
            <ol className="ps-rankgap">
              {gaps.slice(0, 8).map((g) => <li key={g.t}><b>{prettyTheme(g.t, labels)}</b><span className="ps-small">You: {evCell(g.mine).text} · Best competitor: {evCell(g.peerBest).text}</span><span className="ps-small ps-muted">{nextAction(g.mine, g.peerBest)}</span></li>)}
            </ol>
          ) : <p className="ps-small">No open gaps for this product.</p>) : null}
        </Panel>
      </div>
      <Panel id="ev-src" title="Research and sources on file" info="Study design, population, sample size, outcome and limitations are recorded during human review. None of these sources has been reviewed yet.">
        <SortTable rows={(rec?.sources || []).map((s, k) => ({ id: k, ...s }))} columns={[
          { key: 'title', label: 'Source', render: (s) => (s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title) },
          { key: 'type', label: 'Type', render: (s) => (s.type ? s.type.replace(/_/g, ' ') : 'Source') },
          { key: 'supports', label: 'Supports', render: (s) => s.supports || '–' },
          { key: 'review', label: 'Design and limitations', render: () => <span className="ps-muted">Recorded at human review</span> },
        ]} limit={8} />
      </Panel>
      <Findings findings={findings} actions={actions} />
      <Method updated={updatedOn(data)} scope={`${peerAll.length} comparable products`} items={[
        'Sources: the ayna product passport claim ledger (claim wording, evidence type, source links) and catalog documentation fields.',
        'Statuses follow the Phase 1 plan: product-specific, indirect or ingredient-level, limited, none located. No automatic efficacy grade.',
        'Every status is a draft from an AI-assisted research pass until a named reviewer signs it off. Pending claims are never counted as unsupported.',
        'Unknown is not false: it means ayna hasn’t located the record. A competitor may hold private evidence ayna hasn’t seen.',
        'Comparable products: same category in the benchmark universe, closest in price first.',
      ]} />
    </>
  );
}

/* ---------------- Health claims (pp.6-7): claims quoted from each product page ---------------- */
const BACK_KEYS = [
  { key: 'product_study', label: CR_BACKING.product_study.label, color: C.good },
  { key: 'ingredient_study', label: CR_BACKING.ingredient_study.label, color: C.goodLight },
  { key: 'unnamed_study', label: CR_BACKING.unnamed_study.label, color: C.amberLight },
  { key: 'none', label: CR_BACKING.none.label, color: C.amber },
];
const backCounts = (claims) => claims.reduce((a, c) => { a[c.backing] = (a[c.backing] || 0) + 1; return a; }, {});

export function Claims({ b }) {
  const brand = b.brand;
  const mine = crProductsOf(brand);
  const [i, setI] = useState(0);
  const [onlyProduct, setOnlyProduct] = useState('');
  if (!mine.length) {
    return (
      <Empty title={`Claim research for ${b.displayName || brand} isn’t done yet`}>
        <p>Health claims quotes each claim from the product’s own page and shows what the page cites behind it. So far this is done for {crResearchedBrands().join(', ')}. {b.displayName || brand} is next.</p>
      </Empty>
    );
  }
  const you = mine[Math.min(i, mine.length - 1)];
  const rivals = CR_PRODUCTS.filter((p) => p.brand !== brand);
  const cols = [you, ...rivals];
  const all = cols.flatMap((p) => p.claims.map((c, k) => ({ ...c, id: `${p.sku}-${k}`, product: p.name, brand: p.brand, url: p.url, you: p.brand === brand })));
  const yc = backCounts(you.claims);
  const clinical = you.claims.filter((c) => c.topic === 'clinical');
  const clinicalUnbacked = clinical.filter((c) => c.backing !== 'product_study');
  const topics = Object.keys(CR_TOPICS).filter((t) => cols.some((p) => p.claims.some((c) => c.topic === t)));
  const rivalStudy = rivals.filter((p) => p.claims.some((c) => c.backing === 'product_study'));
  const name = b.displayName || brand;
  const findings = [
    `${you.name}: ${you.claims.length} claims checked on its page. ${yc.product_study || 0} rest on a study of the product, ${yc.ingredient_study || 0} on ingredient research, ${(yc.unnamed_study || 0) + (yc.none || 0)} name no source.`,
    you.study ? `The page describes its own study: ${you.study}` : 'The page describes no study of this product.',
    clinical.length ? `${clinical.length} “clinically” claims; ${clinicalUnbacked.length} not tied to a study of this product (${clinicalUnbacked.map((c) => `“${c.text.replace(/\.$/, '')}”`).join(', ') || 'none'}).` : 'No “clinically” wording on the page.',
    rivalStudy.length ? `Competitors that describe their own product studies: ${rivalStudy.map((p) => p.name).join(', ')}. Those studies are unnamed and unlinked on their pages.` : 'None of the compared competitors describe a study of their own product.',
  ];
  const actions = [
    ...(clinicalUnbacked.length ? [{ text: `Back or reword “${clinicalUnbacked[0].text.replace(/\.$/, '')}”.`, note: 'Name the clinician, guideline or study, or drop the word “clinically”.' }] : []),
    ...((yc.none || 0) ? [{ text: `Add a source for the ${yc.none} claim${yc.none === 1 ? '' : 's'} with none.`, note: 'Or soften the wording to what you can document.' }] : []),
    ...(yc.ingredient_study ? [{ text: 'Say plainly when research is on an ingredient, not your product.', note: 'Shoppers and reviewers read “studies show” as studies of the product.' }] : []),
    ...(you.study ? [{ text: 'Publish your study’s full method and numbers.', note: 'A named, linked study is stronger than competitors’ unnamed footnotes.' }] : [{ text: 'Consider a product-specific study for your main claim.' }]),
  ].slice(0, 4);
  const rows = all.filter((c) => !onlyProduct || c.product === onlyProduct);
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        {mine.length > 1 ? (
          <label className="ps-field-label">Your product
            <select className="ps-select" value={i} onChange={(e) => setI(Number(e.target.value))}>{mine.map((p, k) => <option key={p.sku} value={k}>{p.name}</option>)}</select>
          </label>
        ) : null}
        <span className="ps-small ps-muted">Compared with {rivals.map((p) => p.name).join(', ')}. Quoted from each product page on {CR_CHECKED}.</span>
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" icon="claims" label="Claims on your page" value={String(you.claims.length)} den={`${you.name}`} info="Health and benefit claims quoted from the product page." />
        <Kpi tone="pink" icon="evidence" label="Backed by a study of the product" value={String(yc.product_study || 0)} den={you.study ? 'study described on the page' : 'no product study on the page'} />
        <Kpi tone="deep" icon="doc" label="Backed by ingredient research only" value={String(yc.ingredient_study || 0)} den="published research, not this product" />
        <Kpi tone="plain" icon="alert" label="No source named" value={String((yc.none || 0) + (yc.unnamed_study || 0))} den={`of ${you.claims.length} claims`} />
        <Kpi tone="plain" icon="target" label="“Clinically” without a product study" value={`${clinicalUnbacked.length} of ${clinical.length}`} den="claims using the word" />
      </div>
      <div className="ps-split">
        <Panel id="cl-back" title="What each product’s claims rest on" info="Each bar is one product’s claims, split by what its own page cites behind them. This describes the page, not whether a claim is true.">
          <Stacked100 rows={cols.map((p) => ({ label: p.brand === brand ? `${p.name} (you)` : p.name, you: p.brand === brand, counts: backCounts(p.claims) }))} keys={BACK_KEYS} />
        </Panel>
        <Panel id="cl-studies" title="Product studies described" info="Every study of the product itself that these pages describe, as the page describes it. ayna hasn’t reviewed them.">
          <ul className="ps-list">
              {cols.filter((p) => p.study).map((p) => <li key={p.sku} className="ps-item"><strong>{p.name}{p.brand === brand ? ' (you)' : ''}</strong><span className="ps-small">{p.study}</span></li>)}
              {!cols.some((p) => p.study) ? <li className="ps-item">No product studies described on these pages.</li> : null}
            </ul>
        </Panel>
      </div>
      <Panel id="cl-topics" title="Claims by topic" info="How many claims each product makes on each subject. Color shows the strongest thing its page cites for that subject.">
        <Matrix corner="Topic" rows={topics.map((t) => ({ key: t, label: CR_TOPICS[t] }))} cols={cols.map((p) => ({ key: p.sku, label: p.name, sub: p.brand, you: p.brand === brand }))} cell={(r, col) => {
              const p = cols.find((x) => x.sku === col.key);
              const cs = p.claims.filter((c) => c.topic === r.key);
              if (!cs.length) return { text: '–', color: C.missing, title: 'No claim on this topic' };
              const best = ['product_study', 'ingredient_study', 'unnamed_study', 'none'].find((k) => cs.some((c) => c.backing === k));
              return { text: String(cs.length), color: BACK_KEYS.find((k) => k.key === best).color, title: `${cs.length} claim${cs.length === 1 ? '' : 's'}; strongest backing: ${CR_BACKING[best].label}` };
            }} legend={[...BACK_KEYS.map((k) => ({ ...k, label: `Strongest: ${k.label.toLowerCase()}` })), { key: 'na', label: 'No claim', color: C.missing }]} />
      </Panel>
      <Panel id="cl-map" title="Every claim, quoted" info="Exact wording from each product page, what it cites, and a link to check it yourself." right={
        <label className="ps-field-label">Product
          <select className="ps-select" value={onlyProduct} onChange={(e) => setOnlyProduct(e.target.value)}><option value="">All products</option>{cols.map((p) => <option key={p.sku} value={p.name}>{p.name}</option>)}</select>
        </label>
      }>
        <SortTable rows={rows} rowClass={(c) => (c.you ? 'is-you' : '')} initial={{ key: 'product', dir: 'asc' }} limit={14} columns={[
          { key: 'product', label: 'Product', sortValue: (c) => `${c.you ? 0 : 1}${c.product}`, render: (c) => <>{c.product}{c.you ? ' (you)' : ''}</> },
          { key: 'text', label: 'Claim (exact wording)', render: (c) => <>“{c.text}”{c.note ? <small style={{ display: 'block', fontSize: 11.5, color: 'rgba(62,39,35,.78)', marginTop: 2 }}>{c.note}</small> : null}</> },
          { key: 'topic', label: 'Topic', sortValue: (c) => CR_TOPICS[c.topic], render: (c) => CR_TOPICS[c.topic] },
          { key: 'backing', label: 'What the page cites', sortValue: (c) => ['product_study', 'ingredient_study', 'unnamed_study', 'none'].indexOf(c.backing), render: (c) => <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 9px', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', background: BACK_KEYS.find((k) => k.key === c.backing).color }}>{CR_BACKING[c.backing].short}</span> },
          { key: 'source', label: 'Source', render: (c) => (c.source ? <a href={c.source.url} target="_blank" rel="noreferrer">{c.source.label}</a> : <a href={c.url} target="_blank" rel="noreferrer">Product page</a>) },
        ]} />
      </Panel>
      <Findings findings={findings} actions={actions} />
      <Method updated={new Date(`${CR_CHECKED}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} scope={`${cols.length} products`} items={[
        `Source: each product’s own page, read on ${CR_CHECKED}. Claims are quoted exactly; the most material claims per page are included.`,
        '“What the page cites” describes the page, not whether a claim is true: a study of this product, published research on an ingredient, a reference to studies with no name, or nothing.',
        'Studies described on product pages have not been independently reviewed by ayna. Unnamed studies can’t be checked.',
        'ayna does not label claims compliant, false or clinically proven. Regulatory conclusions need appropriate review.',
        `Researched so far: ${crResearchedBrands().join(', ')}. Other partners and competitors are being added.`,
        `${name} can send a correction or the full study and ayna will update this page.`,
      ]} />
    </>
  );
}

/* ---------------- Recommendation share (pp.8-9) ---------------- */
export function Share({ data, b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  const meta = data.categories.find((x) => x.id === c?.id);
  const [need, setNeed] = useState('');
  const [budget, setBudget] = useState('');
  const [format, setFormat] = useState('');
  const [view, setView] = useState('need');
  const ex = useMemo(() => (meta?.rows && c ? explore(meta, b.brand, c.outcomes, { need, budget, format }) : null), [meta, b.brand, c, need, budget, format]);
  const byNeed = useMemo(() => (meta?.rows && c ? meta.needs.map((n) => ({ need: n, e: explore(meta, b.brand, c.outcomes, { need: n, budget, format }) })) : []), [meta, b.brand, c, budget, format]);
  if (!c || !ex) return null;
  const name = b.displayName || b.brand;
  const filtered = need || budget || format;
  const me = ex.brands.find((x) => x.you) || { slots: 0 };
  const topBrands = ex.brands.filter((x) => x.slots > 0).slice(0, 10);
  const ranked = me.slots && !topBrands.some((x) => x.you) ? [...topBrands.slice(0, 9), me] : topBrands.some((x) => x.you) ? topBrands : [...topBrands.slice(0, 9), me];
  const rival3 = ex.brands.filter((x) => !x.you && x.slots > 0).slice(0, 3).map((x) => x.brand);
  const needGroups = byNeed.map(({ need: n, e }) => ({ label: `${n}${e.slots ? '' : ' (no products recommended)'}`, items: [name, ...rival3].map((br) => { const row = e.brands.find((x) => x.brand === br); return { name: br, value: e.slots ? row?.share ?? 0 : null, you: br === b.brand || br === name }; }) }));
  const distKeys = [...ex.brands.filter((x) => x.slots > 0 && !x.you).slice(0, 5).map((x, k) => ({ key: x.brand, label: x.brand, color: [C.rival, C.rival2, '#b9c4ab', C.amberLight, '#e3c9d8'][k] })), { key: '__you', label: `${name} (you)`, color: C.you, dark: true }, { key: '__rest', label: 'Everyone else', color: C.missing }];
  const shownKeys = new Set(distKeys.map((k) => k.key));
  const distCounts = { __you: me.slots, __rest: ex.brands.filter((x) => !x.you && !shownKeys.has(x.brand)).reduce((a, x) => a + x.slots, 0) };
  for (const x of ex.brands) if (shownKeys.has(x.brand)) distCounts[x.brand] = x.slots;
  const skuInfo = Object.fromEntries((c.skus || []).map((s) => [s.name, s]));
  const eligRate = pctOf(ex.eligibleToPlaced.den, ex.scenarios);
  const bestNeed = byNeed.filter((x) => x.e.brandSlots).sort((x, y) => (y.e.slotShare.pct || 0) - (x.e.slotShare.pct || 0))[0];
  const absent = byNeed.filter((x) => x.e.slots && !x.e.brandSlots).map((x) => x.need);
  const findings = [
    `${name} holds ${ex.slotShare.pct ?? 0}% of ${ex.slots} recommendation slots${filtered ? ' for these filters' : ''}, #${me.slots ? me.rank : '–'} of ${ex.brands.length} brands. ${ex.brands[0]?.you ? 'You lead.' : `${ex.brands[0]?.brand} leads with ${ex.brands[0]?.share}%.`}`,
    `Your products fit ${ex.eligibleToPlaced.den} of ${ex.scenarios} shoppers (${eligRate ?? 'N/A'}%) and were recommended to ${ex.eligibleToPlaced.num} of them (${ex.eligibleToPlaced.pct ?? 'N/A'}%).`,
    bestNeed ? `Strongest need: ${bestNeed.need} (${bestNeed.e.slotShare.pct}% of slots).` : 'You aren’t recommended for any single need yet.',
    absent.length ? `Not recommended at all for: ${absent.join(', ')}.` : 'You appear in every need that had recommendations.',
  ];
  const actions = [
    { text: 'See why you lost the shoppers you fit.', note: 'Lost recommendations breaks down every miss by reason.' },
    ...(absent.length ? [{ text: `Check whether a product of yours is made for ${absent[0].toLowerCase()}.`, note: 'If it is, make sure its listing says so plainly.' }] : []),
    { text: 'Treat this as a benchmark, not sales.', note: 'Simulated recommendation share is never retail market share, purchase share or clinical effectiveness.' },
  ];
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
        <SyntheticBadge text="Synthetic benchmark: not real consumer demand or sales" />
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" icon="share" label="Recommendation share" value={ex.slotShare.pct == null ? 'N/A' : `${ex.slotShare.pct}%`} den={`${ex.slotShare.num} of ${ex.slotShare.den} slots`} info="Recommendation slots your products occupied / all slots across the evaluated synthetic shoppers." />
        <Kpi tone="pink" icon="target" label="Eligibility rate" value={eligRate == null ? 'N/A' : `${eligRate}%`} den={`fit ${ex.eligibleToPlaced.den} of ${ex.scenarios} shoppers`} info="Shoppers where at least one of your products passed every safety and fit rule." />
        <Kpi tone="deep" icon="swap" label="Rate when eligible" value={ex.eligibleToPlaced.pct == null ? 'N/A' : `${ex.eligibleToPlaced.pct}%`} den={`${ex.eligibleToPlaced.num} of ${ex.eligibleToPlaced.den}`} info="Recommended / eligible. N/A when none of your products fit." />
        <Kpi tone="plain" icon="trophy" label="Position" value={me.slots ? `#${me.rank}` : '–'} den={`of ${ex.brands.length} brands`} />
        <Kpi tone="plain" icon="reports" label="Change vs last run" value="N/A" den="first benchmark run" info="Needs a second run with the same scenario set, catalog and engine version." />
      </div>
      <div className="ps-split">
        <Panel id="sh-rank" title="Recommendation share by brand" info={`Every brand in ayna’s ${c.label.toLowerCase()} catalog competes (${meta.brands} brands, ${meta.universe} products). Top 10 shown plus you.`}>
          <RankedBars rows={ranked.map((x) => ({ label: x.brand, value: x.share, you: x.you, tag: x.partner && !x.you ? <PartnerTag /> : null, sub: `${x.slots} slots` }))} total={`${ex.slots} recommendation slots across ${ex.scenarios} synthetic shoppers`} />
          <RankKey />
        </Panel>
        <Panel id="sh-alt" title={{ need: 'Share by health need', heat: 'Need × budget', dist: 'Distribution of slots', trend: 'Over time' }[view]} right={<ViewSwitch views={[['need', 'By need'], ['heat', 'Heatmap'], ['dist', 'Distribution'], ['trend', 'Trend']]} value={view} onChange={setView} />} info="Alternative views of the same benchmark.">
          {view === 'need' ? <GroupedBars groups={needGroups} unit="%" /> : null}
          {view === 'heat' ? <><Heatmap grid={c.grid} /><p className="ps-small ps-muted">Your share of slots per need and budget, all formats. Hatched: no product fit.</p></> : null}
          {view === 'dist' ? <Stacked100 rows={[{ label: 'All slots', counts: distCounts }]} keys={distKeys} /> : null}
          {view === 'trend' ? <TrendLine points={[{ label: updatedOn(data), value: ex.slotShare.pct ?? 0 }]} /> : null}
        </Panel>
      </div>
      <Panel id="sh-tbl" title="Product ranking" info="Every product in the category, sortable. Eligibility is shown for your products.">
        <SortTable rows={ex.products.map((p) => ({ ...p, eligible: p.you && skuInfo[p.name] ? skuInfo[p.name].selected + skuInfo[p.name].eligible_lost : null }))} rowClass={(p) => (p.you ? 'is-you' : '')} initial={{ key: 'slots', dir: 'desc' }} limit={15} columns={[
          { key: 'rank', label: '#', num: true },
          { key: 'name', label: 'Product', render: (p) => <>{p.name}{p.partner && !p.you ? <PartnerTag /> : null}</> },
          { key: 'brand', label: 'Brand' },
          { key: 'slots', label: 'Slots', num: true },
          { key: 'share', label: 'Share', num: true, render: (p) => (p.share == null ? 'N/A' : `${p.share}%`) },
          { key: 'eligible', label: 'Eligible shoppers', num: true, render: (p) => (p.eligible == null ? '–' : p.eligible) },
        ]} />
      </Panel>
      <Findings findings={findings} actions={actions} />
      <Method updated={updatedOn(data)} scope={`engine ${data.run.adapterVersion}`} items={[
        `Recommendation share = slots occupied by the brand / all slots across the evaluated synthetic shoppers (top ${meta.k || 3} per shopper; lists with fewer products count actual slots).`,
        'Scenarios: fictional shoppers in a fixed design (need × life stage × budget × format × fragrance sensitivity), equal weights. Not a population estimate.',
        `Engine: ayna’s production matching code, run read-only on a frozen catalog (${meta.catalogVersion}). Partner status and payments are never inputs; a test proves changing them leaves placements unchanged.`,
        'This is simulated recommendation share. It is never retail market share, purchase share or clinical effectiveness.',
      ]} />
    </>
  );
}

/* ---------------- Lost recommendations (pp.10-11) ---------------- */
const LOSS = {
  diversity_tie: { label: 'Lower comparative ranking (tie or shelf variety)', short: 'Tie or variety', fix: false },
  relevance: { label: 'Insufficient health-need relevance', short: 'Relevance', fix: true },
  budget: { label: 'Budget mismatch', short: 'Budget', fix: true },
  format: { label: 'Product format mismatch', short: 'Format', fix: true },
  evidence: { label: 'Insufficient evidence documentation', short: 'Evidence', fix: true },
  below_cutoff: { label: 'Below the match-score cutoff', short: 'Low match score', fix: true },
  insufficient_info: { label: 'Missing product attributes', short: 'Missing facts', fix: true, color: C.amber },
  excluded: { label: 'Safety exclusion', short: 'Safety', fix: false, color: C.red },
  unclassified: { label: 'Other documented reasons', short: 'Other', fix: false },
};
const LOSS_ACTION = {
  relevance: 'Make sure the listing says plainly which need it is made for.',
  budget: 'Test a smaller pack or a lower price point (see the price test).',
  format: 'Consider whether a second format fits shoppers who prefer it.',
  evidence: 'Send product-specific evidence for review.',
  below_cutoff: 'Check the need mapping and published facts for this product.',
  insufficient_info: 'Send the official ingredient or materials list so the engine can check it.',
};

export function Losses({ data, b, cat, setCat }) {
  const [view, setView] = useState('funnel');
  const [allEx, setAllEx] = useState(false);
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  if (!c) return null;
  const f = c.funnel;
  const reasons = [
    ...f.reasons.map((r) => ({ id: r.id, n: r.n })),
    { id: 'insufficient_info', n: f.insufficient_info },
    { id: 'excluded', n: f.excluded },
  ].filter((r) => r.n > 0).map((r) => ({ ...r, ...(LOSS[r.id] || { label: r.id, short: r.id }) })).sort((x, y) => y.n - x.n);
  const totalLost = reasons.reduce((a, r) => a + r.n, 0);
  const top = reasons[0];
  const steps = [
    { label: 'Evaluated shoppers', n: c.scenarios, note: 'Synthetic shoppers in this category' },
    { label: 'Health-need relevant', n: f.in_scope, note: 'One of your products is made for their need' },
    { label: 'Safety-eligible', n: f.in_scope - f.excluded, note: `${f.excluded} excluded by safety rules` },
    { label: 'Eligible with complete facts', n: f.eligible, note: `${f.insufficient_info} on hold for a missing fact` },
    { label: 'Recommended', n: f.placed, note: 'Made the shopper’s top 3' },
  ];
  const skus = c.skus || [];
  const rcols = reasons.map((r) => ({ key: r.id, label: r.short }));
  const skuVal = (s, id) => (id === 'insufficient_info' ? s.insufficient_info : id === 'excluded' ? s.excluded : s.reasons?.[id] ?? null);
  const maxCell = Math.max(1, ...skus.flatMap((s) => rcols.map((col) => skuVal(s, col.key) || 0)));
  const sims = (b.simulations || []).filter((s) => s.category === c.id);
  const findings = [
    `Your products were relevant to ${f.in_scope} of ${c.scenarios} shoppers and recommended to ${f.placed} (${pctOf(f.placed, f.eligible) ?? 'N/A'}% of the ${f.eligible} eligible).`,
    top ? `Most frequent reason: ${top.label.toLowerCase()}, ${top.n} of ${totalLost} (${pctOf(top.n, totalLost)}%).` : 'No losses recorded.',
    f.insufficient_info ? `${f.insufficient_info} shoppers couldn’t be shown your product because a required fact is missing. That is the most fixable group.` : 'No shoppers were held back by missing product facts.',
    f.excluded ? `${f.excluded} shoppers were excluded by safety rules (for example pregnancy or an allergy). ayna never relaxes these, so they aren’t something to fix.` : 'No safety exclusions in this category.',
  ];
  const actions = [
    ...(f.insufficient_info ? [{ text: LOSS_ACTION.insufficient_info, note: `Affects ${f.insufficient_info} shoppers.` }] : []),
    ...reasons.filter((r) => r.fix && r.id !== 'insufficient_info').slice(0, 2).map((r) => ({ text: LOSS_ACTION[r.id], note: `${r.label}: ${r.n} shoppers.` })),
    ...(sims.some((s) => s.after.inclusion.num > s.before.inclusion.num) ? [{ text: 'Review the price test before changing price.', note: 'It is a hypothetical simulation, kept separate from real outcomes.' }] : []),
  ].slice(0, 4);
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <CategoryTabs cats={b.categories} cat={c} setCat={setCat} />
        <SyntheticBadge text="Synthetic benchmark: not real consumer demand or sales" />
      </div>
      <div className="ps-grid ps-grid--kpi">
        <Kpi tone="ink" icon="hash" label="Evaluated opportunities" value={String(c.scenarios)} den="synthetic shoppers" />
        <Kpi tone="pink" icon="target" label="Eligible opportunities" value={String(f.eligible)} den={`${pctOf(f.eligible, c.scenarios)}% of evaluated`} />
        <Kpi tone="deep" icon="share" label="Recommendation rate" value={pctOf(f.placed, f.eligible) == null ? 'N/A' : `${pctOf(f.placed, f.eligible)}%`} den={`${f.placed} of ${f.eligible} eligible`} />
        <Kpi tone="plain" icon="losses" label="Most frequent reason" value={top ? top.short : '–'} den={top ? `${top.n} of ${totalLost} misses` : ''} info={top?.label} />
        <Kpi tone="plain" icon="doc" label="Fixable with documentation" value={String(f.insufficient_info)} den="shoppers held by a missing fact" />
      </div>
      <div className="ps-split">
        <Panel id="lo-rank" title="Why your products weren’t recommended" info="One primary reason per missed shopper, so the reasons add up to every shopper you didn’t get. Safety exclusions are shown for completeness and are never something to change.">
          <RankedBars unit="" rows={reasons.map((r) => ({ label: r.label, value: r.n, color: r.color, sub: r.fix ? null : 'Not something to change' }))} valueText={(r) => `${r.value} · ${pctOf(r.value, totalLost)}%`} total={`${totalLost} missed shoppers (relevant shoppers minus recommended)`} />
        </Panel>
        <Panel id="lo-alt" title={{ funnel: 'Recommendation funnel', pareto: 'Pareto of reasons', product: 'Reasons by product', sim: 'Price test' }[view]} right={<ViewSwitch views={[['funnel', 'Funnel'], ['pareto', 'Pareto'], ['product', 'By product'], ['sim', 'Price test']]} value={view} onChange={setView} />} info="Funnel stages follow the matching engine’s own order, all against the same denominator.">
          {view === 'funnel' ? <FunnelBars steps={steps} /> : null}
          {view === 'pareto' ? <Pareto rows={reasons.map((r) => ({ label: r.label, short: r.short, n: r.n, color: r.color }))} /> : null}
          {view === 'product' ? (skus.length ? <Matrix corner="Product" rows={skus.map((s) => ({ key: s.sku, label: shortName(s.name, b.displayName || b.brand) }))} cols={rcols} cell={(r, col) => { const s = skus.find((x) => x.sku === r.key); const v = skuVal(s, col.key); return v == null ? { text: '–', color: C.missing, title: 'Per-product reasons arrive with the next benchmark run' } : { text: String(v), color: v ? `rgba(62,39,35,${(0.08 + 0.6 * (v / maxCell)).toFixed(2)})` : undefined, dark: v / maxCell > 0.6 }; }} /> : <p className="ps-small">No products in this category.</p>) : null}
          {view === 'sim' ? (sims.length ? <><BeforeAfter rows={sims.map((s) => ({ label: `${shortName(s.name, b.displayName || b.brand)} at ${String(s.changeLabel).split(' ')[0]}`, before: s.before.inclusion.num, after: s.after.inclusion.num }))} unit=" shoppers" /><p className="ps-small ps-muted">Hypothetical: same engine, competitors and shoppers, only the price changes. Safety rules still held in every run. Not a forecast.</p></> : <p className="ps-small">No priced product to simulate.</p>) : null}
        </Panel>
      </div>
      <Panel id="lo-tbl" title="Product-level losses" info="Exact counts per product. Each shopper counts once per product.">
        <SortTable rows={skus.map((s) => { const r = Object.entries(s.reasons || {}).sort((x, y) => y[1] - x[1])[0]; return { id: s.sku, name: s.name, selected: s.selected, eligible_lost: s.eligible_lost, insufficient_info: s.insufficient_info, excluded: s.excluded, top: r ? (LOSS[r[0]]?.short || r[0]) : null }; })} initial={{ key: 'eligible_lost', dir: 'desc' }} columns={[
          { key: 'name', label: 'Product' },
          { key: 'selected', label: 'Recommended', num: true },
          { key: 'eligible_lost', label: 'Eligible, not recommended', num: true },
          { key: 'insufficient_info', label: 'Missing facts', num: true },
          { key: 'excluded', label: 'Safety excluded', num: true },
          { key: 'top', label: 'Top reason', render: (r) => r.top || '–' },
        ]} />
        <details className="ps-method" open={allEx} onToggle={(e) => setAllEx(e.currentTarget.open)}>
          <summary>Examples from the matching engine ({f.examples.length})</summary>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead><tr><th>Made-up shopper</th><th>Your product</th><th>Why it missed</th><th>Recommended instead</th></tr></thead>
              <tbody>{f.examples.map((e) => <tr key={e.scenarioId + e.sku}><td>{e.label}</td><td>{skus.find((x) => x.sku === e.sku)?.name || e.sku}</td><td><strong>{LOSS[e.reason]?.label || e.reason}</strong><br /><span className="ps-small">{e.detail}</span></td><td className="ps-small">{e.placed.join(', ') || 'Nothing qualified'}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Panel>
      <Findings findings={findings} actions={actions} />
      <Method updated={updatedOn(data)} scope={`engine ${data.run.adapterVersion}`} items={[
        'Each missed shopper gets one primary reason, so reasons are mutually exclusive and sum to relevant shoppers minus recommended.',
        'Funnel stages follow the engine’s order: relevance, safety rules, required facts, then ranking. All use the evaluated shoppers as the denominator.',
        `Special cases checked separately: shoppers who are pregnant, breastfeeding, latex-allergic or on certain medicines (${Object.values(c.boundary || {}).reduce((a, n) => a + n, 0)} results) and shoppers who skipped questions (${Object.values(c.unknown || {}).reduce((a, n) => a + n, 0)}).`,
        'ayna never suggests removing safety restrictions or clinical safeguards to win recommendations. Price tests are hypothetical and kept apart from real outcomes.',
      ]} />
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
        <CardHead id="co-h" icon="competitors" title="Side-by-side with competitors" info="Products of the same type, closest in price first. Tap to pick up to three. Public information only." right={<ProductPicker items={comps} value={i} onChange={(k) => { setI(k); setPicked(null); }} />} />
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
      <CardHead id="fd-h" icon="feed" title="Intelligence feed" info="This is the baseline snapshot. New competitors, price and claim changes appear from the next refresh, each with its source and date." />
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
          <CardHead id="rp-run" icon="reports" title="This benchmark run" />
          <div className="ps-table-wrap"><table className="ps-table"><tbody>{meta.map(([k, v]) => <tr key={k}><td><strong>{k}</strong></td><td>{String(v)}</td></tr>)}</tbody></table></div>
          <p className="ps-small">Catalog versions: {data.categories.map((c) => `${c.label} ${c.catalogVersion}`).join(' · ')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="ps-btn ps-btn--ink" onClick={onExport}>Download aggregate CSV</button>
            <button type="button" className="ps-btn" onClick={() => window.print()}>Print report</button>
          </div>
        </section>
        <section className="ps-card" style={{ flex: '2 1 480px' }} aria-labelledby="rp-def">
          <CardHead id="rp-def" icon="doc" title="Definitions" />
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
        <CardHead id="rp-limits" icon="alert" title="What this is not" />
        <p>Not market share, demand, sales, clinical superiority or legal certification, and not a promise of placement. No consumer health data, conversations, wearable data or user events feed this page. Every conclusion shows its scope and date.</p>
        <p className="ps-small">Viewing {b.displayName || b.brand}. Evidence statuses are drafts from an AI-assisted research pass until a reviewer signs them off.</p>
      </section>
    </>
  );
}
