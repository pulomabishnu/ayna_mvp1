/* Partner Studio screens. Each one follows a section of the Phase 1 plan (page numbers in comments). */
import React, { useMemo, useState } from 'react';
import { Kpi, SyntheticBadge, DraftBadge, Empty, CardHead, Heatmap, Drawer, Ring, InfoTip } from './ui.jsx';
import { ratePct, money } from './format.js';
import { explore } from './engine/explore.js';
import { C, inkOn } from './chartColors.js';
import { BACKING as CR_BACKING, PRODUCTS as CR_PRODUCTS, TOPICS as CR_TOPICS, CHECKED as CR_CHECKED, productsOf as crProductsOf, rivalsOf as crRivalsOf, researchedBrands as crResearchedBrands } from './engine/claimsResearch.js';
import { Insights, NextSteps } from './tiles.jsx';
import { ClaimCompare } from './claimCompare.jsx';
import { shareSeries, changeSinceLast } from './engine/history.js';
import { Panel, ViewSwitch, RankedBars, Stacked100, Dumbbell, Matrix, Pareto, FunnelBars, BeforeAfter, TrendLine, SortTable, Method } from './charts.jsx';

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

const shortName = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);

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
  return { text: status === 'regulatory_only' ? 'Regulatory only' : status === 'experience_only' ? 'Reviews only' : g.short, color: g.color, dark: g.color === C.you, title: `${g.label}${STATUS_NOTE[status] ? `. ${STATUS_NOTE[status]}` : ''}` };
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
  const page = crProductsOf(b.brand).find((p) => p.sku === sku.sku);
  const pc = page ? backCounts(page.claims) : null;
  const findings = [
    page ? `${page.claims.length} claims on your product page: ${pc.product_study || 0} backed by a product study, ${pc.ingredient_study || 0} by related research.` : myClaims ? `${myClaims} claim${myClaims === 1 ? '' : 's'} logged, ${rec.claims.filter((x) => x.status === 'direct').length} with a product study (draft).` : 'No claim wording logged for this product yet.',
    page ? (() => { const rv = crRivalsOf(page); const st = rv.filter((p) => p.claims.some((c) => c.backing === 'product_study')); return rv.length ? `${st.length} of ${rv.length} researched competitors cite a study of their own product.` : 'No competitor in this category has been researched yet.'; })() : peerWithClaims ? `${peerWithClaims} of ${peerAll.length} similar products have claims on file.` : 'No similar product has claims logged yet either.',
    sku.completeness != null && dims[2].bench != null ? `Info completeness ${sku.completeness}% vs a ${dims[2].bench}% median.` : null,
    `Checked by a person: ${ratePct(m.reviewCoverage)}. Every status is a draft.`,
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
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="evidence" label="Claims citing research" value={allMine.length && !page ? String(relevant) : page ? String((pc.product_study || 0) + (pc.ingredient_study || 0)) : 'N/A'} den={allMine.length && !page ? `of ${allMine.length} claims on file (draft)` : page ? `of ${page.claims.length} claims on your product page` : 'No claims logged yet'} info="Claims with product-specific or indirect evidence located, across your products. Draft statuses until human review." /></div>
        <div className="b-2"><Kpi tone="pink" icon="target" label="Product study rate" value={m.draft.direct?.den && !page ? `${Math.round(m.draft.direct.value * 1000) / 10}%` : page ? `${Math.round(((pc.product_study || 0) / (page.claims.length || 1)) * 100)}%` : 'N/A'} den={m.draft.direct?.den && !page ? `${m.draft.direct.num} of ${m.draft.direct.den} claims` : page ? `${pc.product_study || 0} of ${page.claims.length} claims cite a study of this product` : 'No claims logged yet'} info="Share of your claims backed by a study of the product itself. Does not imply a positive result." /></div>
        <div className="b-2"><Kpi tone="deep" icon="alert" label="Open gaps" value={String(gaps.length)} den={`for ${shortName(sku.name, b.displayName || b.brand)}`} info="Claim themes where you lack product-specific evidence, ranked with competitor-documented themes first." /></div>
        {gapPp != null && !page ? <div className="b-2"><Kpi tone="butter" icon="swap" label="Difference vs competitors" value={`${gapPp > 0 ? '+' : ''}${gapPp} pp`} den={`vs median of ${m.draft.peerBrands} brands`} info="Your product-specific evidence coverage minus the median of matched comparable products." /></div> : <div className="b-2"><Kpi tone="butter" icon="doc" label="Facts complete" value={sku.completeness == null ? 'N/A' : `${sku.completeness}%`} den={dims[2].bench != null ? `vs ${dims[2].bench}% for similar products` : 'required fields present'} info="Share of the facts ayna needs (ingredients, instructions, regulatory record and more) that are on file for this product." /></div>}
        {m.reviewCoverage.den && !page ? <div className="b-2"><Kpi tone="plain" icon="doc" label="Reviewed by a person" value={ratePct(m.reviewCoverage)} den={`${m.reviewCoverage.num} of ${m.reviewCoverage.den} claims`} info="Reviewed claims / all inventoried claims. Pending claims stay in the denominator." /></div> : <div className="b-2"><Kpi tone="plain" icon="doc" label="Sources on file" value={String(rec?.sources?.length || 0)} den="studies, guidelines and pages" info="Every source ayna has on file for this product. A person reviews each one before it counts." /></div>}
        <Panel className="b-8 b-tall" id="ev-heat" title="Your product information next to similar products" info="Rows are claim themes and documentation fields. Columns are your product and the closest comparable products. Click one of your cells to see the sources on file.">
          <Matrix rows={rows} cols={cols} cell={cell} legend={EV_LEGEND} corner="Claim or field" />
          {!themes.length ? <p className="ps-small ps-muted">No claim themes logged for this product or its closest competitors, so only documentation is compared.</p> : null}
        </Panel>
        <Insights className="b-4" items={findings} />
        <NextSteps className="b-4" actions={actions} />
        <Panel className="b-5" id="ev-alt" title={view === 'gap' ? 'Gap vs competitors' : view === 'mix' ? 'Evidence mix by product' : 'Evidence gaps, ranked'} info="Switch views for the gap to the competitor median, the mix of evidence statuses, or the ranked list of gaps." right={<ViewSwitch views={[['gap', 'Gap'], ['mix', 'Mix'], ['rank', 'Ranked']]} value={view} onChange={setView} />}>
          {view === 'gap' ? <Dumbbell rows={dims.filter((d) => d.you != null)} youLabel={shortName(sku.name, b.displayName || b.brand)} benchLabel={`Median of ${peerAll.length} comparable products`} /> : null}
          {view === 'mix' ? <Stacked100 rows={mix} keys={Object.entries(EV).map(([key, v]) => ({ key, label: v.label, color: v.color, dark: v.color === C.you }))} /> : null}
          {view === 'rank' ? (gaps.length ? (
            <ol className="ps-rankgap">
              {gaps.slice(0, 8).map((g) => <li key={g.t}><b>{prettyTheme(g.t, labels)}</b><span className="ps-small">You: {evCell(g.mine).text} · Best competitor: {evCell(g.peerBest).text}</span><span className="ps-small ps-muted">{nextAction(g.mine, g.peerBest)}</span></li>)}
            </ol>
          ) : <p className="ps-small">No open gaps for this product.</p>) : null}
        </Panel>
        <Panel className="b-7" id="ev-src" title="Research and sources on file" info="Study design, population, sample size, outcome and limitations are recorded during human review. None of these sources has been reviewed yet.">
        <SortTable rows={(rec?.sources || []).map((s, k) => ({ id: k, ...s }))} columns={[
          { key: 'title', label: 'Source', render: (s) => (s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title) },
          { key: 'type', label: 'Type', render: (s) => (s.type ? s.type.replace(/_/g, ' ') : 'Source') },
          { key: 'supports', label: 'Supports', render: (s) => s.supports || '–' },
          { key: 'review', label: 'Design and limitations', render: () => <span className="ps-muted">Recorded at human review</span> },
        ]} limit={6} />
      </Panel>
      </div>
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
const CR_BACK = { ...CR_BACKING, ingredient_study: { ...CR_BACKING.ingredient_study, short: 'Related research' } };
const BACK_KEYS = [
  { key: 'product_study', label: CR_BACK.product_study.short, color: C.good, dark: true },
  { key: 'ingredient_study', label: CR_BACK.ingredient_study.short, color: C.goodLight },
  { key: 'unnamed_study', label: CR_BACK.unnamed_study.short, color: C.amberLight },
  { key: 'none', label: CR_BACK.none.short, color: C.amber },
];
const backCounts = (claims) => claims.reduce((a, c) => { a[c.backing] = (a[c.backing] || 0) + 1; return a; }, {});

export function Claims({ b }) {
  const brand = b.brand;
  const mine = crProductsOf(brand);
  const [i, setI] = useState(0);
  const [onlyProduct, setOnlyProduct] = useState('');
  const [cview, setCview] = useState('topic');
  if (!mine.length) {
    return (
      <Empty title={`Claim research for ${b.displayName || brand} isn’t done yet`}>
        <p>So far this is done for {crResearchedBrands().join(', ')}. {b.displayName || brand} is next.</p>
      </Empty>
    );
  }
  const you = mine[Math.min(i, mine.length - 1)];
  const rivals = crRivalsOf(you);
  const cols = [you, ...rivals];
  const all = cols.flatMap((p) => p.claims.map((c, k) => ({ ...c, id: `${p.sku}-${k}`, product: p.name, brand: p.brand, url: p.url, you: p.brand === brand })));
  const yc = backCounts(you.claims);
  const n = you.claims.length;
  const noSource = (yc.none || 0) + (yc.unnamed_study || 0);
  const clinical = you.claims.filter((c) => c.topic === 'clinical');
  const clinicalUnbacked = clinical.filter((c) => c.backing !== 'product_study');
  const accuracy = you.claims.filter((c) => c.topic === 'accuracy');
  const rivalStudy = rivals.filter((p) => p.claims.some((c) => c.backing === 'product_study'));
  const colors = Object.fromEntries(BACK_KEYS.map((k) => [k.key, k.color]));
  const findings = [
    accuracy.length ? 'Your listing text describes a different product.' : null,
    (yc.unnamed_study || 0) ? `${yc.none || 0} of ${n} claims give no source; ${yc.unnamed_study} cite${yc.unnamed_study === 1 ? 's' : ''} one without naming it.` : `${yc.none || 0} of ${n} claims give no source.`,
    you.refs && !(yc.ingredient_study || 0) ? 'You list research, but no claim links to it.' : you.study ? 'Your page describes a study of this product.' : 'No study of this product on the page.',
    rivalStudy.length ? `${[...new Set(rivalStudy.map((p) => p.brand))].join(', ')} cite${new Set(rivalStudy.map((p) => p.brand)).size === 1 ? 's' : ''} a study of ${rivalStudy.length === 1 ? 'its own product' : 'their own products'}.` : 'No competitor cites a study of its own product either.',
  ].filter(Boolean).slice(0, 3);
  const actions = [
    ...(accuracy.length ? [{ text: 'Fix the listing text', note: `${accuracy[0].where ? `${accuracy[0].where}: ` : ''}“${accuracy[0].text.replace(/\.$/, '')}”. ${accuracy[0].note || ''}` }] : []),
    ...(clinicalUnbacked.length ? [{ text: 'Review your “clinically” wording', note: `“${clinicalUnbacked[0].text.replace(/\.$/, '')}”. Your page doesn’t cite a study of this product for it.` }] : []),
    ...(you.refs && (yc.none || 0) ? [{ text: 'Link your references to claims', note: you.refs.label }] : []),
    ...((yc.none || 0) ? [{ text: `Add sources to ${yc.none} claim${yc.none === 1 ? '' : 's'}`, note: 'Or soften the wording to what you can document.' }] : []),
    ...(yc.ingredient_study ? [{ text: 'Say when research isn’t on your product', note: 'Shoppers read “studies show” as studies of the product.' }] : []),
    ...(you.study ? [{ text: 'Publish your study’s numbers', note: you.study }] : [{ text: 'Consider a product study', note: 'For your main claim.' }]),
  ].slice(0, 3);
  const rows = all.filter((c) => !onlyProduct || c.product === onlyProduct);
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        {mine.length > 1 ? (
          <label className="ps-field-label">Your product
            <select className="ps-select" value={i} onChange={(e) => setI(Number(e.target.value))}>{mine.map((p, k) => <option key={p.sku} value={k}>{p.name}</option>)}</select>
          </label>
        ) : null}
        <span className="ps-small ps-muted">{you.name} · quoted from product pages <InfoTip text={`Every claim is quoted exactly from each product page, read on ${CR_CHECKED}. Colors describe what the page cites, not whether a claim is true.`} label="Where this comes from" /></span>
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="claims" label="Claims on your page" value={String(n)} den={`${noSource} with no named source`} meter={n ? ((n - noSource) / n) * 100 : 0} /></div>
        <div className="b-2"><Kpi tone="pink" icon="evidence" label="Product study" value={String(yc.product_study || 0)} den="claims backed by one" /></div>
        <div className="b-2"><Kpi tone="deep" icon="doc" label="Related research" value={String(yc.ingredient_study || 0)} den="claims, not on this product" /></div>
        <div className="b-2"><Kpi tone="butter" icon="alert" label="No source" value={String(yc.none || 0)} den={(yc.unnamed_study || 0) ? `plus ${yc.unnamed_study} unnamed` : `of ${n} claims`} /></div>
        <div className="b-2"><Kpi tone="plain" icon="target" label="“Clinically” wording" value={String(clinical.length)} den={clinical.length ? `${clinicalUnbacked.length} cite no study of this product` : 'not used on your page'} /></div>
        <section className="ps-card ps-tile b-4 ps-ringtile" aria-labelledby="cl-ring">
          <CardHead id="cl-ring" icon="evidence" title="What your claims rest on" />
          <div className="ps-ringwrap">
            <Ring size={190} segments={BACK_KEYS.map((k) => ({ label: k.label, value: yc[k.key] || 0, color: k.color }))} center={String(n)} sub="claims" />
            <ul className="ps-ringlegend">
              {BACK_KEYS.map((k) => <li key={k.key}><i style={{ background: k.color }} /><span>{CR_BACK[k.key].short}</span><b>{yc[k.key] || 0}</b></li>)}
            </ul>
          </div>
        </section>
        <Panel className="b-8" id="cl-topics" title={cview === 'topic' ? 'You vs a competitor' : 'Every claim'} info={cview === 'topic' ? 'One dot per claim, colored by what the page cites. Tap a topic to read the exact words.' : 'Exact wording from each product page.'} right={<>
          {cview === 'all' ? <select className="ps-select ps-select--sm" aria-label="Product" value={onlyProduct} onChange={(e) => setOnlyProduct(e.target.value)}><option value="">All products</option>{cols.map((p) => <option key={p.sku} value={p.name}>{p.name}</option>)}</select> : null}
          <ViewSwitch views={[['topic', 'By topic'], ['all', 'All quotes']]} value={cview} onChange={setCview} />
        </>}>
          {cview === 'topic' ? <ClaimCompare key={you.sku} you={you} rivals={rivals} topics={CR_TOPICS} backing={CR_BACK} colors={colors} /> : null}
          {cview === 'all' ? <SortTable rows={rows} rowClass={(c) => (c.you ? 'is-you' : '')} initial={{ key: 'product', dir: 'asc' }} limit={10} columns={[
            { key: 'product', label: 'Product', sortValue: (c) => `${c.you ? 0 : 1}${c.product}`, render: (c) => <>{c.product}{c.you ? ' (you)' : ''}</> },
            { key: 'text', label: 'Claim', render: (c) => <>“{c.text}”</> },
            { key: 'topic', label: 'Topic', sortValue: (c) => CR_TOPICS[c.topic], render: (c) => CR_TOPICS[c.topic] },
            { key: 'backing', label: 'Cites', sortValue: (c) => ['product_study', 'ingredient_study', 'unnamed_study', 'none'].indexOf(c.backing), render: (c) => <span className="ps-cc-chip" style={{ background: colors[c.backing], color: inkOn(colors[c.backing]) }}>{CR_BACK[c.backing].short}</span> },
            { key: 'source', label: 'Source', render: (c) => (c.source ? <a href={c.source.url} target="_blank" rel="noreferrer">{c.source.label}</a> : <a href={c.url} target="_blank" rel="noreferrer">Page</a>) },
          ]} /> : null}
        </Panel>
        <div className="b-4 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions} />
        </div>
        <Panel className="b-8" id="cl-back" title="Every product compared" info="Each bar is one product’s claims, split by what its page cites.">
          <Stacked100 rows={cols.map((p) => ({ label: p.brand === brand ? `${p.name} (you)` : p.name, you: p.brand === brand, counts: backCounts(p.claims) }))} keys={BACK_KEYS} />
        </Panel>
      </div>
      <Method updated={new Date(`${CR_CHECKED}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} scope={`${cols.length} products`} items={[
        `Source: each product’s own page, read on ${CR_CHECKED}. Claims are quoted exactly; the most material claims per page are included.`,
        'What the page cites describes the page, not whether a claim is true: a study of this product, published research on an ingredient, a reference to studies with no name, or nothing.',
        'Studies described on product pages have not been independently reviewed by ayna. Unnamed studies can’t be checked.',
        'ayna does not label claims compliant, false or clinically proven. Regulatory conclusions need appropriate review.',
        `Researched so far: ${crResearchedBrands().join(', ')}.`,
        `${b.displayName || brand} can send a correction or the full study and ayna will update this page.`,
      ]} />
    </>
  );
}

/* ---------------- Recommendation share (pp.8-9) ---------------- */
/** Why a brand got the share it did for one need in the simulation, and what to do about it. Opened by tapping a cell. */
const BUDGET_LABEL = { 'under-25': 'Under $25', '25-75': '$25 to $75', any: 'Price no factor' };
function NeedWhy({ meta, b, c, need, col, budget, format, onClose }) {
  const name = b.displayName || b.brand;
  const isYou = col === b.brand || col === name;
  const target = isYou ? b.brand : col;
  const e = explore(meta, b.brand, c.outcomes, { need, budget, format });
  const counts = { s: 0, e: 0, i: 0, x: 0, o: 0 };
  const bands = {};
  meta.rows.forEach((r, k) => {
    if (r.need !== need) return;
    if (budget && r.budget !== budget) return;
    if (format === 'any' && r.format) return;
    if (format === 'pref' && !r.format) return;
    const o = c.outcomes[k];
    if (counts[o] != null) counts[o] += 1;
    const band = bands[r.budget] || (bands[r.budget] = { shoppers: 0, you: 0, them: 0 });
    band.shoppers += 1;
    if (r.p.some((pi) => meta.products[pi].brand === b.brand)) band.you += 1;
    if (!isYou && r.p.some((pi) => meta.products[pi].brand === col)) band.them += 1;
  });
  const fit = counts.s + counts.e;
  const row = e.brands.find((x) => x.brand === target) || { slots: 0, share: 0 };
  const picks = e.products.filter((p) => p.brand === target && p.slots > 0);
  const price = {};
  for (const sku of b.competitors || []) { price[sku.name] = sku.price; for (const p of sku.peers || []) price[p.name] = p.price; }
  const mySkus = (c.skus || []);
  const myPrices = mySkus.map((x) => price[x.name]).filter((v) => v != null);
  const examples = (c.funnel.examples || []).filter((x) => x.label.startsWith(`${need} ·`));
  const reasonCount = examples.reduce((m, x) => { m[x.reason] = (m[x.reason] || 0) + 1; return m; }, {});
  const topReason = Object.entries(reasonCount).sort((x, y) => y[1] - x[1])[0]?.[0];
  const sims = (b.simulations || []).filter((x) => x.category === c.id && x.after.inclusion.num > x.before.inclusion.num);
  const winners = e.products.filter((p) => p.slots > 0 && p.brand !== b.brand).slice(0, 3);
  let verdict;
  if (!e.slots) verdict = 'Nothing in the catalog was recommended for this need.';
  else if (isYou && !fit && counts.i) verdict = `Your products were on hold in ${counts.i} scenarios because a product attribute is missing.`;
  else if (isYou && !fit) verdict = 'None of your products is listed for this need, so they weren’t considered.';
  else if (isYou && !counts.s) verdict = `You were eligible in all ${fit} scenarios here, but ${winners.map((p) => p.brand).filter((v, k, arr) => arr.indexOf(v) === k).slice(0, 2).join(' and ')} were selected.`;
  else if (isYou) verdict = `You were selected in ${counts.s} of the ${fit} scenarios where you were eligible.`;
  else verdict = row.slots ? `${col} won ${row.slots} of ${e.slots} top-3 spots for this need.` : `${col} wasn’t picked for this need.`;
  const moves = [];
  if (isYou && !fit && counts.i) moves.push({ t: 'Send your full ingredient list', d: `It releases ${counts.i} scenarios with this need right away.` });
  if (isYou && !fit && !counts.i) moves.push({ t: 'Decide if this need is worth a product', d: `${e.scenarios} simulated scenarios include it. ${winners[0] ? `${winners[0].name} leads.` : ''}` });
  if (topReason && LOSS_ACTION[topReason]) moves.push({ t: LOSS_ACTION[topReason].replace(/\.$/, ''), d: `Most common reason you missed here: ${(LOSS[topReason]?.label || topReason).toLowerCase()}.` });
  const tieMove = topReason === 'diversity_tie' ? { t: 'You already score like the winners', d: 'The difference is shelf variety, not eligibility: ayna mixes brands in each top 3, so ties can go either way.' } : null;
  const cheap = bands['under-25'];
  if (cheap && cheap.shoppers && !cheap.you && Object.values(bands).some((v) => v.you) && myPrices.some((v) => v > 25)) moves.push({ t: 'Under-$25 scenarios never select you', d: `${cheap.shoppers} scenarios here have that budget. Your price: ${myPrices.map((v) => money(v)).join(', ')}.` });
  const needSkus = new Set(examples.map((x) => x.sku));
  const sim = sims.find((x) => needSkus.has(x.sku));
  if (sim) moves.push({ t: `Test ${shortName(sim.name, name)} at ${String(sim.changeLabel).split(' ')[0]}`, d: `In a test run this adds ${sim.after.inclusion.num - sim.before.inclusion.num} scenarios across the category.` });
  if (tieMove) moves.push(tieMove);
  return (
    <Drawer title={`${need}: ${isYou ? 'you' : col}`} onClose={onClose}>
      <p className="ps-why-verdict">{verdict}</p>
      <div className="ps-why-kpis">
        <div><span className="ps-num">{row.share ?? 0}%</span><small>of top-3 spots</small></div>
        <div><span className="ps-num">{e.scenarios}</span><small>scenarios with this need</small></div>
        {isYou ? <div><span className="ps-num">{fit}</span><small>eligible scenarios</small></div> : <div><span className="ps-num">{row.slots}</span><small>times selected</small></div>}
      </div>
      <section>
        <h3 className="ps-why-h">By budget</h3>
        <ul className="ps-why-bands">
          {Object.entries(bands).map(([k, v]) => (
            <li key={k}>
              <span>{BUDGET_LABEL[k] || k}<small>{v.shoppers} scenarios</small></span>
              <span className="ps-why-pill is-you">You {v.you}</span>
              {!isYou ? <span className="ps-why-pill">{col} {v.them}</span> : null}
            </li>
          ))}
        </ul>
      </section>
      {isYou ? (
        moves.length ? (
          <section>
            <h3 className="ps-why-h">How to win this need</h3>
            <ol className="ps-why-moves">{moves.slice(0, 3).map((m, k) => <li key={m.t}><span className="ps-steps-n">{k + 1}</span><span><b>{m.t}</b><small>{m.d}</small></span></li>)}</ol>
          </section>
        ) : null
      ) : (
        <section>
          <h3 className="ps-why-h">Why {col} wins here</h3>
          <ul className="ps-why-list">{picks.map((p) => <li key={p.id}><span>{p.name}<small>{price[p.name] != null ? money(price[p.name]) : 'Price not on file'}</small></span><b>{p.slots} picks</b></li>)}</ul>
          <p className="ps-small">{myPrices.length && picks.some((p) => price[p.name] != null) ? `Your price: ${myPrices.map((v) => money(v)).join(', ')}. ` : ''}Their products are listed for this need and within these scenarios’ budgets.</p>
        </section>
      )}
      {isYou && examples[0] ? (
        <section>
          <h3 className="ps-why-h">One scenario, explained</h3>
          <div className="ps-why-ex"><b>{examples[0].label}</b><span>{examples[0].detail}</span><small>Selected instead: {examples[0].placed.join(', ') || 'nothing qualified'}</small></div>
        </section>
      ) : null}
      <p className="ps-small ps-muted">Simulated shopping scenarios run through ayna’s matching engine. Not actual customer activity, sales or clinical suitability.</p>
    </Drawer>
  );
}

export function Share({ data, b, cat, setCat }) {
  const c = b.categories.find((x) => x.id === cat) || b.categories[0];
  const meta = data.categories.find((x) => x.id === c?.id);
  const [need, setNeed] = useState('');
  const [budget, setBudget] = useState('');
  const [format, setFormat] = useState('');
  const [view, setView] = useState('need');
  const [why, setWhy] = useState(null);
  const ex = useMemo(() => (meta?.rows && c ? explore(meta, b.brand, c.outcomes, { need, budget, format }) : null), [meta, b.brand, c, need, budget, format]);
  const byNeed = useMemo(() => (meta?.rows && c ? meta.needs.map((n) => ({ need: n, e: explore(meta, b.brand, c.outcomes, { need: n, budget, format }) })) : []), [meta, b.brand, c, budget, format]);
  if (!c || !ex) return null;
  const name = b.displayName || b.brand;
  const filtered = need || budget || format;
  const me = ex.brands.find((x) => x.you) || { slots: 0 };
  const topBrands = ex.brands.filter((x) => x.slots > 0).slice(0, 10);
  const ranked = me.slots && !topBrands.some((x) => x.you) ? [...topBrands.slice(0, 9), me] : topBrands.some((x) => x.you) ? topBrands : [...topBrands.slice(0, 9), me];
  const rival3 = ex.brands.filter((x) => !x.you && x.slots > 0).slice(0, 3).map((x) => x.brand);
  const needGroups = byNeed.map(({ need: n, e }) => ({ label: n, items: [name, ...rival3].map((br) => { const row = e.brands.find((x) => x.brand === br); return { name: br, value: e.slots ? row?.share ?? 0 : null, you: br === b.brand || br === name }; }) }));
  const distKeys = [...ex.brands.filter((x) => x.slots > 0 && !x.you).slice(0, 4).map((x, k) => ({ key: x.brand, label: x.brand, color: [C.skyText, C.rival, C.rival2, C.pink][k], dark: k === 0 })), { key: '__you', label: `${name} (you)`, color: C.you, dark: true }, { key: '__rest', label: 'Everyone else', color: C.missing }];
  const shownKeys = new Set(distKeys.map((k) => k.key));
  const distCounts = { __you: me.slots, __rest: ex.brands.filter((x) => !x.you && !shownKeys.has(x.brand)).reduce((a, x) => a + x.slots, 0) };
  for (const x of ex.brands) if (shownKeys.has(x.brand)) distCounts[x.brand] = x.slots;
  const skuInfo = Object.fromEntries((c.skus || []).map((s) => [s.name, s]));
  const eligRate = pctOf(ex.eligibleToPlaced.den, ex.scenarios);
  const bestNeed = byNeed.filter((x) => x.e.brandSlots).sort((x, y) => (y.e.slotShare.pct || 0) - (x.e.slotShare.pct || 0))[0];
  const absent = byNeed.filter((x) => x.e.slots && !x.e.brandSlots).map((x) => x.need);
  const series = shareSeries(data.history, c.id, b.brand);
  const delta = changeSinceLast(series);
  const shortDay = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const trendPoints = series.points.length ? series.points.map((pt) => ({ label: shortDay(pt.createdAt), value: pt.value ?? 0 })) : [{ label: updatedOn(data), value: ex.slotShare.pct ?? 0 }];
  const findings = [
    me.slots ? `#${me.rank} of ${ex.brands.length} brands, ${ex.slotShare.pct ?? 0}% of slots. ${ex.brands[0]?.you ? 'You lead.' : `${ex.brands[0]?.brand} leads (${ex.brands[0]?.share}%).`}` : `Not in any top 3 yet. ${ex.brands[0]?.brand} leads (${ex.brands[0]?.share}%).`,
    delta && !filtered ? `${delta.pp > 0 ? '+' : ''}${delta.pp} points since ${shortDay(delta.since)}.` : null,
    `Eligible in ${ex.eligibleToPlaced.den} of ${ex.scenarios} scenarios, selected in ${ex.eligibleToPlaced.num}.`,
    ex.slots < ex.scenarios * (meta.k || 3) ? `${ex.slots} of ${ex.scenarios * (meta.k || 3)} possible spots were filled; some scenarios had fewer than 3 products that met the rules.` : null,
    bestNeed ? `Best need: ${bestNeed.need} (${bestNeed.e.slotShare.pct}%).` : 'Not picked for any single need yet.',
    absent.length ? `Never picked for: ${absent.join(', ')}.` : null,
  ];
  const actions = [
    { text: 'See why you weren’t selected', note: 'Why products miss breaks down every unselected scenario by reason.' },
    ...(absent.length ? [{ text: `Check whether a product of yours is made for ${absent[0].toLowerCase()}.`, note: 'If it is, make sure its listing says so plainly.' }] : []),
    { text: 'Treat this as a simulation, not sales', note: 'Simulated selection share is never retail market share, purchase share or clinical effectiveness.' },
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
        <SyntheticBadge text="Simulation: synthetic shopping scenarios, not actual activity or sales" />
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="share" label="Simulated selection share" value={ex.slotShare.pct == null ? 'N/A' : `${ex.slotShare.pct}%`} den={`${ex.slotShare.num} of ${ex.slotShare.den} filled spots`} info="Top-3 spots your products filled divided by all filled spots across the simulated scenarios. Scenarios with fewer than 3 eligible products fill fewer spots." meter={ex.brands[0]?.share ? ((ex.slotShare.pct || 0) / ex.brands[0].share) * 100 : 0} cmp={ex.brands[0] && !ex.brands[0].you ? { text: `Leader ${ex.brands[0].brand}: ${ex.brands[0].share}%` } : null} /></div>
        <div className="b-2"><Kpi tone="pink" icon="target" label="Eligible in simulation" value={eligRate == null ? 'N/A' : `${eligRate}%`} den={`${ex.eligibleToPlaced.den} of ${ex.scenarios} scenarios`} info="Scenarios where at least one of your products met the configured matching requirements." /></div>
        <div className="b-2"><Kpi tone="deep" icon="swap" label="Selected when eligible" value={ex.eligibleToPlaced.pct == null ? 'N/A' : `${ex.eligibleToPlaced.pct}%`} den={`${ex.eligibleToPlaced.num} of ${ex.eligibleToPlaced.den}`} info="Selected / eligible scenarios. N/A when none of your products were eligible." /></div>
        <div className="b-2"><Kpi tone="butter" icon="trophy" label="Simulated rank" value={me.slots ? `#${me.rank}` : 'None yet'} den={me.slots ? `of ${ex.brands.filter((x) => x.slots).length} brands with a selection` : '0 selections in this simulation'} /></div>
        <div className="b-2"><Kpi tone="plain" icon="hash" label="Simulated scenarios" value={String(ex.scenarios)} den={`${ex.slots} of ${ex.scenarios * (meta.k || 3)} possible spots filled`} info="Synthetic shopping scenarios run through ayna’s matching engine. Each has up to 3 spots; a scenario fills fewer when fewer products meet the configured rules." /></div>
        <Panel className="b-7 b-tall" id="sh-rank" title="Simulated selection share by brand" info={`Every brand in ayna’s ${c.label.toLowerCase()} catalog is in the simulation (${meta.brands} brands, ${meta.universe} products). Top 10 shown plus you.`}>
          <RankedBars rows={ranked.map((x) => ({ label: x.brand, value: x.share, you: x.you, tag: x.partner && !x.you ? <PartnerTag /> : null, sub: x.slots ? `${x.slots} selections` : 'No selections' }))} total={`${ex.slots} filled spots across ${ex.scenarios} simulated scenarios (${ex.scenarios * (meta.k || 3)} possible)`} />
          <RankKey />
        </Panel>
        <div className="b-5 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions} />
        </div>
        <Panel className="b-12" id="sh-alt" title={{ need: 'Share by health need', heat: 'Need × budget', dist: 'Distribution of slots', trend: 'Over time' }[view]} right={<ViewSwitch views={[['need', 'By need'], ['heat', 'Heatmap'], ['dist', 'Distribution'], ['trend', 'Trend']]} value={view} onChange={setView} />} info="Tap any cell to see why.">
          {view === 'need' ? <Matrix corner="Health need" rows={needGroups.map((g) => ({ key: g.label, label: g.label }))} cols={needGroups[0]?.items.map((it) => ({ key: it.name, label: it.name, sub: it.you ? 'You' : '', you: it.you })) || []} cell={(r, col) => { const it = needGroups.find((g) => g.label === r.key).items.find((x) => x.name === col.key); const open = () => setWhy({ need: r.key, col: col.key }); if (it.value == null) return { text: 'N/A', color: C.missing, title: 'No product was recommended for this need', onClick: open }; const v = it.value; return { onClick: open, text: `${Math.round(v)}%`, color: v ? (it.you ? (v < 34 ? '#fcdcee' : C.pink) : (v < 34 ? C.rival2 : v < 67 ? '#a3bfd6' : C.rival)) : C.missing, title: `${col.key}: ${v}% of slots for ${r.key}. Tap to see why.` }; }} legend={[{ key: 'y', label: 'You (deeper is more)', color: C.pink }, { key: 'r', label: 'Competitors', color: C.rival }]} /> : null}
          {view === 'heat' ? <><Heatmap grid={c.grid} /><p className="ps-small ps-muted">Your share of slots per need and budget, all formats. Hatched: no product was eligible.</p></> : null}
          {view === 'dist' ? <Stacked100 rows={[{ label: 'All slots', counts: distCounts }]} keys={distKeys} /> : null}
          {view === 'trend' ? <><TrendLine points={trendPoints} label={series.skipped ? `${series.skipped} older run${series.skipped === 1 ? '' : 's'} used a different engine or scenario set, so ${series.skipped === 1 ? 'it is' : 'they are'} left out.` : ''} />{filtered ? <p className="ps-small ps-muted">The trend covers all scenarios; filters don’t apply to it.</p> : null}</> : null}
        </Panel>
      <Panel className="b-12" id="sh-tbl" title="Product ranking" info="Every product in the category, sortable. Eligibility is shown for your products.">
        <SortTable rows={ex.products.map((p) => ({ ...p, eligible: p.you && skuInfo[p.name] ? skuInfo[p.name].selected + skuInfo[p.name].eligible_lost : null }))} rowClass={(p) => (p.you ? 'is-you' : '')} initial={{ key: 'slots', dir: 'desc' }} limit={8} columns={[
          { key: 'rank', label: '#', num: true, render: (p) => p.rank ?? '–' },
          { key: 'name', label: 'Product', render: (p) => <>{p.name}{p.partner && !p.you ? <PartnerTag /> : null}</> },
          { key: 'brand', label: 'Brand' },
          { key: 'slots', label: 'Selections', num: true },
          { key: 'share', label: 'Share', num: true, render: (p) => (p.share == null ? 'N/A' : `${p.share}%`) },
          { key: 'eligible', label: 'Eligible scenarios', num: true, render: (p) => (p.eligible == null ? '–' : p.eligible) },
        ]} />
      </Panel>
      </div>
      {why ? <NeedWhy meta={meta} b={b} c={c} need={why.need} col={why.col} budget={budget} format={format} onClose={() => setWhy(null)} /> : null}
      <Method updated={updatedOn(data)} scope={`engine ${data.run.adapterVersion}`} items={[
        `Simulated selection share = top-3 spots filled by the brand / all filled spots. Each scenario has up to ${meta.k || 3} spots; ${ex.scenarios * (meta.k || 3) - ex.slots} of ${ex.scenarios * (meta.k || 3)} stayed empty because fewer products met the rules, and some scenarios had none.`,
        'Scenarios: synthetic shopping scenarios in a fixed design (need × life stage × budget × format × fragrance sensitivity), equal weights. Not a population estimate and not actual customers.',
        `Engine: ayna’s production matching code, run read-only on a frozen catalog (${meta.catalogVersion}). Partner status and payments are never inputs; a test proves changing them leaves placements unchanged.`,
        'This is a simulation. It is never retail market share, purchase share or clinical suitability.',
      ]} />
    </>
  );
}

/* ---------------- Lost recommendations (pp.10-11) ---------------- */
const LOSS = {
  diversity_tie: { label: 'Tied, another brand was selected', short: 'Tie', fix: false },
  relevance: { label: 'Listing doesn’t clearly name the need', short: 'Need match', fix: true },
  budget: { label: 'Price above the scenario’s budget', short: 'Price', fix: true },
  format: { label: 'A different format was preferred', short: 'Format', fix: true },
  evidence: { label: 'Weaker research than the picks', short: 'Research', fix: true },
  below_cutoff: { label: 'Match score too low', short: 'Low match', fix: true },
  insufficient_info: { label: 'Missing product information', short: 'Missing info', fix: true, color: C.amber },
  excluded: { label: 'Excluded by configured product rules', short: 'Product rules', fix: false, color: C.red },
  unclassified: { label: 'Other', short: 'Other', fix: false },
};
const LOSS_ACTION = {
  relevance: 'Make sure the listing says plainly which need it is made for.',
  budget: 'Test a smaller pack or a lower price point (see the price test).',
  format: 'Consider whether a second format fits scenarios that prefer it.',
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
    { label: 'Simulated scenarios', n: c.scenarios, note: 'Synthetic shopping scenarios in this category' },
    { label: 'Need matches your listing', n: f.in_scope, note: 'One of your products is listed for the scenario’s need' },
    { label: 'Passed configured product rules', n: f.in_scope - f.excluded, note: `${f.excluded} excluded by configured product rules` },
    { label: 'Eligible with complete information', n: f.eligible, note: `${f.insufficient_info} on hold for missing product information` },
    { label: 'Selected', n: f.placed, note: 'In the scenario’s top 3' },
  ];
  const skus = c.skus || [];
  const rcols = reasons.map((r) => ({ key: r.id, label: r.short }));
  const skuVal = (s, id) => (id === 'insufficient_info' ? s.insufficient_info : id === 'excluded' ? s.excluded : s.reasons?.[id] ?? null);
  const maxCell = Math.max(1, ...skus.flatMap((s) => rcols.map((col) => skuVal(s, col.key) || 0)));
  const sims = (b.simulations || []).filter((s) => s.category === c.id);
  const findings = [
    `Selected in ${f.placed} of ${f.eligible} scenarios where you were eligible (${pctOf(f.placed, f.eligible) ?? 'N/A'}%).`,
    top ? `Top reason: ${top.short.toLowerCase()} (${top.n} of ${totalLost}).` : 'No losses recorded.',
    f.insufficient_info ? `${f.insufficient_info} scenarios on hold for missing product information. The quickest fix.` : null,
    f.excluded ? `${f.excluded} scenarios excluded by configured product rules. Not something to change.` : null,
  ];
  const actions = [
    ...(f.insufficient_info ? [{ text: LOSS_ACTION.insufficient_info, note: `Affects ${f.insufficient_info} simulated scenarios.` }] : []),
    ...reasons.filter((r) => r.fix && r.id !== 'insufficient_info').slice(0, 2).map((r) => ({ text: LOSS_ACTION[r.id], note: `${r.label}: ${r.n} simulated scenarios.` })),
    ...(sims.some((s) => s.after.inclusion.num > s.before.inclusion.num) ? [{ text: 'Review the price test before changing price.', note: 'It is a hypothetical simulation, kept separate from real outcomes.' }] : []),
  ].slice(0, 4);
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <CategoryTabs cats={b.categories} cat={c} setCat={setCat} />
        <SyntheticBadge text="Simulation: synthetic shopping scenarios, not actual activity or sales" />
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="share" label="Selected when eligible" value={pctOf(f.placed, f.eligible) == null ? 'N/A' : `${pctOf(f.placed, f.eligible)}%`} den={`selected in ${f.placed} of ${f.eligible} eligible scenarios`} meter={pctOf(f.placed, f.eligible) || 0} /></div>
        <div className="b-2"><Kpi tone="pink" icon="target" label="Eligible scenarios" value={String(f.eligible)} den={`${pctOf(f.eligible, c.scenarios)}% of ${c.scenarios} evaluated`} /></div>
        <div className="b-2"><Kpi tone="deep" icon="losses" label="Top reason" value={top ? top.short : '–'} den={top ? `${top.n} of ${totalLost} unselected` : ''} info={top?.label} /></div>
        <div className="b-2"><Kpi tone="butter" icon="doc" label="Missing information" value={String(f.insufficient_info)} den="scenarios on hold" /></div>
        <div className="b-2"><Kpi tone="plain" icon="alert" label="Rule exclusions" value={String(f.excluded)} den="excluded by configured product rules" /></div>
        <Panel className="b-7" id="lo-rank" title="Why your products weren’t selected" info="One primary reason per unselected scenario, so the reasons add up to every scenario where you weren’t selected. Rule exclusions are shown for completeness and are not something to change.">
          <RankedBars unit="" rows={reasons.map((r) => ({ label: r.label, value: r.n, color: r.color, sub: r.fix ? null : 'Not something to change' }))} valueText={(r) => `${r.value} · ${pctOf(r.value, totalLost)}%`} total={`${totalLost} unselected scenarios (need-matched scenarios minus selected)`} />
        </Panel>
        <div className="b-5 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions.length ? actions : [{ text: 'Nothing to fix here.' }]} />
        </div>
        <Panel className="b-5" id="lo-alt" title={{ funnel: 'Selection funnel', pareto: 'Pareto of reasons', product: 'Reasons by product', sim: 'Price test' }[view]} right={<ViewSwitch views={[['funnel', 'Funnel'], ['pareto', 'Pareto'], ['product', 'By product'], ['sim', 'Price test']]} value={view} onChange={setView} />} info="Funnel stages follow the matching engine’s own order, all against the same denominator.">
          {view === 'funnel' ? <FunnelBars steps={steps} /> : null}
          {view === 'pareto' ? <Pareto rows={reasons.map((r) => ({ label: r.label, short: r.short, n: r.n, color: r.color }))} /> : null}
          {view === 'product' ? (skus.length ? <Matrix corner="Product" rows={skus.map((s) => ({ key: s.sku, label: shortName(s.name, b.displayName || b.brand) }))} cols={rcols} cell={(r, col) => { const s = skus.find((x) => x.sku === r.key); const v = skuVal(s, col.key); return v == null ? { text: '–', color: C.missing, title: 'Per-product reasons arrive with the next benchmark run' } : { text: String(v), color: v ? `rgba(62,39,35,${(0.08 + 0.6 * (v / maxCell)).toFixed(2)})` : undefined, dark: v / maxCell > 0.6 }; }} /> : <p className="ps-small">No products in this category.</p>) : null}
          {view === 'sim' ? (sims.length ? <><BeforeAfter rows={sims.map((s) => ({ label: `${shortName(s.name, b.displayName || b.brand)} at ${String(s.changeLabel).split(' ')[0]}`, before: s.before.inclusion.num, after: s.after.inclusion.num }))} unit=" scenarios" /><p className="ps-small ps-muted">Hypothetical: same engine, competitors and scenarios, only the price changes. Product rules still applied in every run. Not a forecast.</p></> : <p className="ps-small">No priced product to simulate.</p>) : null}
        </Panel>
      <Panel className="b-7" id="lo-tbl" title="By product" info="Exact counts per product. Each scenario counts once per product.">
        <SortTable rows={skus.map((s) => { const r = Object.entries(s.reasons || {}).sort((x, y) => y[1] - x[1])[0]; return { id: s.sku, name: shortName(s.name, b.displayName || b.brand), selected: s.selected, eligible_lost: s.eligible_lost, insufficient_info: s.insufficient_info, excluded: s.excluded, top: r ? (LOSS[r[0]]?.short || r[0]) : null }; })} initial={{ key: 'eligible_lost', dir: 'desc' }} columns={[
          { key: 'name', label: 'Product' },
          { key: 'selected', label: 'Selected', num: true },
          { key: 'eligible_lost', label: 'Eligible but not selected', num: true },
          { key: 'insufficient_info', label: 'Missing information', num: true },
          { key: 'excluded', label: 'Rule exclusions', num: true },
          { key: 'top', label: 'Top reason', render: (r) => r.top || '–' },
        ]} />
        <details className="ps-method" open={allEx} onToggle={(e) => setAllEx(e.currentTarget.open)}>
          <summary>Matching-engine results for selected synthetic scenarios ({f.examples.length})</summary>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead><tr><th>Simulated scenario</th><th>Your product</th><th>Why it wasn’t selected</th><th>Selected instead</th></tr></thead>
              <tbody>{f.examples.map((e) => <tr key={e.scenarioId + e.sku}><td>{e.label}</td><td>{skus.find((x) => x.sku === e.sku)?.name || e.sku}</td><td><strong>{LOSS[e.reason]?.label || e.reason}</strong><br /><span className="ps-small">{e.detail}</span></td><td className="ps-small">{e.placed.join(', ') || 'Nothing qualified'}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Panel>
      </div>
      <Method updated={updatedOn(data)} scope={`engine ${data.run.adapterVersion}`} items={[
        'Each unselected scenario gets one primary reason, so reasons are mutually exclusive and sum to need-matched scenarios minus selected.',
        'Funnel stages follow the engine’s order: need match, configured product rules, required information, then ranking. All use the simulated scenarios as the denominator.',
        `Scenarios with configured product rules (pregnancy, breastfeeding, latex allergy or certain medicines) are checked separately (${Object.values(c.boundary || {}).reduce((a, n) => a + n, 0)} results), as are scenarios with skipped questions (${Object.values(c.unknown || {}).reduce((a, n) => a + n, 0)}).`,
        'ayna never suggests removing product rules to win selections. Price tests are hypothetical and kept apart from actual outcomes. These results describe how ayna’s matching engine reads product information; they are not a clinical assessment.',
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
    ['Claims on the product page', (x) => { const pg = CR_PRODUCTS.find((p) => p.sku === x.sku); return pg ? pg.claims.length : x.claims || 'Not researched yet'; }],
    ['Claims backed by a product study', (x) => { const pg = CR_PRODUCTS.find((p) => p.sku === x.sku); return pg ? pg.claims.filter((c) => c.backing === 'product_study').length : x.direct; }],
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
  const TYPE = { qa_correction: 'Fact correction', clinician_review: 'Product review', stale: 'Freshness', claim_flag: 'Claim review flag' };
  return (
    <section className="ps-card" aria-labelledby="fd-h">
      <CardHead id="fd-h" icon="feed" title="Updates on your products" info="This is the baseline snapshot. New competitors, price and claim changes appear from the next refresh, each with its source and date." />
      <ul className="ps-list">
        {items.map((f, k) => {
          const id = `${f.type}-${f.sku}-${k}`;
          return (
            <li key={id} className="ps-item" style={ack[id] ? { opacity: 0.6 } : undefined}>
              <div className="ps-item-head"><strong>{f.type === 'clinician_review' ? 'Product review open' : f.title}</strong><span className="ps-chip">{TYPE[f.type] || f.type}</span></div>
              <span className="ps-small">{f.name}{f.date ? ` · ${f.date}` : ''}</span>
              <span className="ps-small">{f.type === 'clinician_review' ? 'ayna’s reviewer is confirming a product fact before it is final.' : f.detail}</span>
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
            <li className="ps-item"><strong>Scenarios with a selection (scenario inclusion)</strong><span className="ps-small">Scenarios with at least one of your products placed ÷ all scenarios, no-result scenarios included. Brands’ rates don’t add to 100%.</span></li>
            <li className="ps-item"><strong>Selected when eligible</strong><span className="ps-small">Scenarios with a placement ÷ scenarios where at least one of your products qualified. N/A when none qualified.</span></li>
            <li className="ps-item"><strong>Claims checked by a person (review coverage)</strong><span className="ps-small">Claims reviewed by a person ÷ all inventoried claims. Pending claims stay in the denominator.</span></li>
            <li className="ps-item"><strong>Scenarios</strong><span className="ps-small">Synthetic shopping scenarios in a fixed design, equal weights. Not a population estimate. Scenarios with configured product rules and skipped answers are reported separately.</span></li>
            <li className="ps-item"><strong>Engine</strong><span className="ps-small">ayna’s production matching code, run read-only on a frozen catalog. Partner status, affiliate links and payments are not inputs; a test proves changing them leaves placements unchanged.</span></li>
          </ul>
        </section>
      </div>
      <section className="ps-card ps-card--pink" aria-labelledby="rp-limits">
        <CardHead id="rp-limits" icon="alert" title="What this is not" />
        <p>Not market share, demand, sales, clinical superiority or legal certification, and not a promise of placement. No consumer health data, answers, conversations or wearable data feed this page. The one real-world signal is anonymous product activity from the ayna app (how many people saw, opened or clicked each product), shown separately and never used in rankings. Every conclusion shows its scope and date.</p>
        <p className="ps-small">Viewing {b.displayName || b.brand}. Evidence statuses are drafts from an AI-assisted research pass until a reviewer signs them off.</p>
      </section>
    </>
  );
}
