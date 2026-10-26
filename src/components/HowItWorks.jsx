import React, { useEffect, useState } from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';
import { SAMPLE_PROFILE_CHIPS, getSampleFunnel } from '../utils/sampleFunnel';
import { evidenceCatalogCounts } from '../utils/evidenceCatalogCounts';
import { EdPage, EdBlock } from './editorial/EdPage';
import { StickerButton } from './ui/ay';

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

function EvidenceLevels() {
  const [c, setC] = useState(null);
  useEffect(() => { let live = true; evidenceCatalogCounts().then((r) => { if (live) setC(r); }); return () => { live = false; }; }, []);
  return (
    <>
      <ul className="ip-facts" aria-busy={!c || undefined}>
        {LEVEL_TILES.map((l) => (
          <li key={l.id}>
            <b>{c ? c[l.id] : '…'}</b>
            <strong>{l.title}</strong>
            <span>{l.cap}</span>
          </li>
        ))}
      </ul>
      <p className="ed-caption" style={{ marginTop: 12 }}>{c ? `Products with at least one source at each level, out of ${c.total} products in the catalog today.` : 'Counting the catalog…'}</p>
    </>
  );
}

export default function HowItWorks({ onBack, backLabel, onViewSources }) {
  const funnel = getSampleFunnel();
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <EdPage
      title="How ayna picks your matches."
      crumb="How it works"
      lede="ayna compares products with the health profile and preferences you choose to share, then adds cited research, clinical guidance, safety information and community context where available."
      onBack={onBack} backLabel={backLabel}
      photo="marble-counter"
    >
      {/* Standards, said once on the page (#18 Tower 28). The team's wording, unchanged. */}
      <section className="ed-block" aria-label="Our standards">
        <ul className="ip-standards">
          <li>{ICON.scale}<b>Relevant, not paid-first.</b><span>Personalized picks are ranked on relevance to you, not on commission rate or partnership status. Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.</span></li>
          <li>{ICON.check}<b>Graded only from .gov sources.</b><span>Unsupported claims are labeled, not upgraded into facts.</span></li>
          <li>{ICON.note}<b>ayna is not a doctor, and never pretends to be.</b><span>Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can include published guidance, clinician-authored sources or clearly labeled brand-provided clinician claims; it does not mean every product has been independently reviewed by an ayna clinician.</span></li>
        </ul>
      </section>

      <EdBlock title="Four steps, in order." intro="The numbers below are a sample profile run live on today's catalog, not your results.">
        <ol className="ed-hiw">
          <li>
            <span className="ed-hiw__n" aria-hidden="true">1</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 1: </span>You tell us</h3>
            <p>Stage of life, goals, sensitivities and the details you choose to share.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-tags">{SAMPLE_PROFILE_CHIPS.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">2</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 2: </span>We narrow the market</h3>
            <p>Products across the open market are filtered for category fit, known safety conflicts and relevance.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-figrow"><span>In the catalog</span><b>{funnel.catalog.toLocaleString()}</b></div>
              <div className="ed-figrow"><span>Matched to this profile</span><b>{funnel.matched}</b></div>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">3</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 3: </span>We add evidence</h3>
            <p>Published research, clinical guidance, product and safety sources, and community experience, where available.</p>
            <div className="ed-hiw__demo">
              {/* .gov sources only (founder rule); was "ACOG guidance", which is not a .gov source. */}
              <div className="ed-tags">{['MedlinePlus', 'NIH research', 'CDC data'].map((t) => <span key={t}>{t}</span>)}</div>
              <span className="ed-caption">Unsupported claims are labeled, not upgraded into facts.</span>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">4</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 4: </span>Your ecosystem</h3>
            <p>Your strongest fits, each shown with its match reason and source context.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-figrow"><span>strong fits (80+), each with its match reason</span><b>{funnel.strong}</b></div>
            </div>
          </li>
        </ol>
      </EdBlock>

      <EdBlock title="From the whole catalog to your short list.">
        <HowItWorksFunnel />
      </EdBlock>

      <EdBlock title="Evidence, by level." intro="Every source on a product is sorted into one of four levels. Only the first can give a grade.">
        <EvidenceLevels />
      </EdBlock>

      <EdBlock title="Signals we look at.">
        <ul className="ed-rows">
          {MATCH_INPUTS.map((x) => <li key={x} className="ed-body">{x}</li>)}
        </ul>
        <p style={{ marginTop: 24 }}><StickerButton onClick={openSources}>Read our sources</StickerButton></p>
      </EdBlock>
    </EdPage>
  );
}
