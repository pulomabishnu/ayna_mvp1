import React, { useEffect, useState } from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';
import { SAMPLE_PROFILE_CHIPS } from '../utils/sampleFunnel';
import { evidenceCatalogCounts } from '../utils/evidenceCatalogCounts';
import { DIMENSION_WEIGHTS, PREFERENCE_SPAN } from '../matching/score.js';
import { MAX_SHOWN_PERCENT } from '../utils/matchDisplay.js';
import { EdPage, EdBlock } from './editorial/EdPage';
import { StickerButton } from './ui/ay';
import ReadMore from './info/ReadMore.jsx';

// What a personalized match is built from. Sponsorship is never one of them.
const MATCH_INPUTS = ['Your profile', 'Published research', 'Clinical guidance + clinician input', 'Community experience'];

const ICON = {
  scale: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v22M9 27h14M6 10h20M6 10l-3 8a3 3 0 006 0zM26 10l-3 8a3 3 0 006 0z" /></svg>,
  check: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4l10 4v7c0 7-4.5 11-10 13-5.5-2-10-6-10-13V8z" /><path d="M11 16l4 4 7-8" /></svg>,
  note: <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" /><path d="M16 10v7M16 21v.5" /></svg>,
};

/* The evidence levels, each with its live catalog count (the product page's own evidenceFor). */
const LEVEL_TILES = [
  { id: 'gov', title: 'Checked against .gov', cap: 'MedlinePlus, NIH, FDA, CDC and other .gov health pages. Only these can give an ayna grade.' },
  { id: 'peer', title: 'Peer-reviewed studies', cap: 'Found on PubMed or PMC. Shown, not graded by ayna.' },
  { id: 'brand', title: 'From the brand', cap: 'The brand’s own claims, recorded as its word, never as proof.' },
  { id: 'people', title: 'People’s experiences', cap: 'Posts and reviews, kept in the Reviews tab.' },
];

/* The four levels as one plain list (critique, Oct 27: no colour-rotating bento): each level with its
   live count and a bar against the catalog total. A product can sit at more than one level, so the
   bars are read one by one, never as parts of a whole. */
function EvidenceLevels() {
  const [c, setC] = useState(null);
  useEffect(() => { let live = true; evidenceCatalogCounts().then((r) => { if (live) setC(r); }); return () => { live = false; }; }, []);
  return (
    <>
      <ul className="ip-levels" aria-busy={!c || undefined}>
        {LEVEL_TILES.map((l, i) => (
          <li key={l.id} className={i === 0 ? 'is-graded' : ''}>
            <span className="ip-levels__top"><strong>{l.title}</strong><b>{c ? c[l.id] : '…'}</b></span>
            <i className="ip-levels__bar" aria-hidden="true"><i style={{ width: c && c.total ? `${Math.round((c[l.id] / c.total) * 100)}%` : 0 }} /></i>
            <span className="ip-levels__cap">{l.cap}</span>
          </li>
        ))}
      </ul>
      <p className="ed-caption" style={{ marginTop: 12 }}>{c ? `Products with at least one source at each level, out of ${c.total} products in the catalog today.` : 'Counting the catalog…'}</p>
    </>
  );
}

const TICK = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;

/* Standards, said once on the page (#18 Tower 28), on the pink band. The team's
   wording, unchanged: the three promises at a glance, their full text one tap away. */
const STANDARDS = [
  { icon: ICON.scale, b: 'Relevant, not paid-first.', t: 'Personalized picks are ranked on relevance to you, not on commission rate or partnership status. Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.' },
  { icon: ICON.check, b: 'Graded only from .gov sources.', t: 'Unsupported claims are labeled, not upgraded into facts.' },
  { icon: ICON.note, b: 'ayna is not a doctor, and never pretends to be.', t: 'Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can include published guidance, clinician-authored sources or clearly labeled brand-provided clinician claims; it does not mean every product has been independently reviewed by an ayna clinician.' },
];
function Standards() {
  return (
    <div className="ip-stdband">
      <ul className="ip-standards">
        {STANDARDS.map((x) => <li key={x.b}>{x.icon}<b>{x.b}</b></li>)}
      </ul>
      <ReadMore label="Read our standards in full">
        <ul className="ip-standards is-full">
          {STANDARDS.map((x) => <li key={x.b}>{x.icon}<b>{x.b}</b><span>{x.t}</span></li>)}
        </ul>
      </ReadMore>
    </div>
  );
}

/* How the % is built, drawn from the engine itself (matching/score.js): the
   need sets the number; the preferences you shared can move it by at most
   PREFERENCE_SPAN of it, split by DIMENSION_WEIGHTS; a skipped question is left out. */
const DIM_LABEL = { context: 'Your situation', format: 'Format', values: 'Values', price: 'Price', evidence: 'Evidence', brand: 'Brand', effort: 'Effort' };
function PercentBuild() {
  const dims = Object.entries(DIMENSION_WEIGHTS);
  const total = dims.reduce((n, [, w]) => n + w, 0);
  const pref = Math.round(PREFERENCE_SPAN * 100);
  return (
    <div className="ip-pct">
      <div className="ip-pct__bar" role="img" aria-label={`Your need sets the match. Your preferences can move it by up to ${pref}%.`}>
        <span className="ip-pct__need" style={{ flexGrow: 100 - pref }}><b>Your need</b><span>sets the match</span></span>
        <span className="ip-pct__pref" style={{ flexGrow: pref }}><b>Your preferences</b><span>up to {pref}%</span></span>
      </div>
      <ul className="ip-pct__dims" aria-label="What your preferences are made of">
        {dims.map(([k, w]) => (
          <li key={k} style={{ flexGrow: w }}><i style={{ '--w': `${Math.round((w / total) * 100)}%` }} /><span>{DIM_LABEL[k] || k}</span></li>
        ))}
      </ul>
      <p className="ed-caption">Safety comes first: a product that conflicts with your answers is held back, never scored up. Shown at most {MAX_SHOWN_PERCENT}%.</p>
    </div>
  );
}

export default function HowItWorks({ onBack, backLabel, onViewSources }) {
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <EdPage
      title="How we match."
      crumb="How it works"
      lede="ayna compares products with the health profile and preferences you choose to share, then adds cited research, clinical guidance, safety information and community context where available."
      onBack={onBack} backLabel={backLabel}
      bandLabel="Our standards"
      band={<Standards />}
    >
      {/* Critique (Oct 27): lead with the one funnel (the live sample counts), then a plain stepper. */}
      <EdBlock title="From the whole catalog to your short list.">
        <HowItWorksFunnel />
      </EdBlock>

      <EdBlock title="Four steps, in order.">
        <ol className="ip-stepper">
          <li>
            <span className="ip-stepper__n" aria-hidden="true">1</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 1: </span>You tell us</h3>
            <p>Stage of life, goals, sensitivities and the details you choose to share.</p>
            <ReadMore label="Sample profile"><div className="ed-tags">{SAMPLE_PROFILE_CHIPS.map((t) => <span key={t}>{t}</span>)}</div></ReadMore>
          </li>
          <li>
            <span className="ip-stepper__n" aria-hidden="true">2</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 2: </span>We narrow the market</h3>
            <p>Products across the open market are filtered for category fit, known safety conflicts and relevance.</p>
          </li>
          <li>
            <span className="ip-stepper__n" aria-hidden="true">3</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 3: </span>We add evidence</h3>
            {/* .gov sources only (founder rule); was "ACOG guidance", which is not a .gov source. */}
            <p>{['MedlinePlus', 'NIH research', 'CDC data'].join(', ')}.</p>
            <ReadMore label="More"><p>Published research, clinical guidance, product and safety sources, and community experience, where available.</p><span className="ed-caption">Unsupported claims are labeled, not upgraded into facts.</span></ReadMore>
          </li>
          <li>
            <span className="ip-stepper__n" aria-hidden="true">4</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 4: </span>Your ecosystem</h3>
            <p>Your strongest fits, each shown with its match reason and source context.</p>
          </li>
        </ol>
      </EdBlock>

      <EdBlock title="How the % is built." intro="One engine for every match. Your need sets it; your preferences fine-tune it.">
        <PercentBuild />
        <ReadMore label="Signals we look at">
          <ul className="ed-rows">
            {MATCH_INPUTS.map((x) => <li key={x} className="ed-body">{x}</li>)}
          </ul>
        </ReadMore>
      </EdBlock>

      <EdBlock title="What we never do.">
        <ul className="ip-ticks">
          <li>{TICK}<span><strong>Brands can’t pay to change your match.</strong> Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.</span></li>
          <li>{TICK}<span><strong>The highest match we show.</strong> {MAX_SHOWN_PERCENT}%.</span></li>
          <li>{TICK}<span><strong>Skipping never lowers a match.</strong> A question you skip is left out of the math.</span></li>
        </ul>
      </EdBlock>

      <EdBlock title="Evidence, by level." intro="Every source on a product is sorted into one of four levels. Only the first can give a grade.">
        <EvidenceLevels />
      </EdBlock>

      <EdBlock title="More about matching">
        <ReadMore label="Why not just ask a chatbot?" lessLabel="Why not just ask a chatbot?">
          <ul className="ip-ticks">
            <li>{TICK}<span><strong>Your profile</strong> Matches start from the answers you choose to share, not a one-off question.</span></li>
            <li>{TICK}<span><strong>A checked catalog</strong> Products carry their sources and safety notes where available. Only .gov sources can give a grade.</span></li>
            <li>{TICK}<span><strong>Real products you can buy</strong> Each match is a real product with where to buy it, and you can compare it side by side.</span></li>
          </ul>
        </ReadMore>
        <p style={{ marginTop: 24 }}><StickerButton onClick={openSources}>Read our sources</StickerButton></p>
      </EdBlock>
    </EdPage>
  );
}
