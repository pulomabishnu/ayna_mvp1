import React from 'react';
import { LEVELS } from '../pdp/evidenceLevels.js';
import { cardEvidence, cardSafety, cardSizes, cardFacts, cardPerUse } from '../../utils/productCardFacts.js';
import { BRAND_FALLBACK } from '../../mobile/data/brandFallback.js';
import '../../styles/pcard.css';

/*
 * The pieces the website card, the app card and the ServiceCard share
 * (PDP build brief "Product cards", Explore audit v2 sections 10-12), so
 * every card puts the same fact in the same place on both platforms.
 */

/** No photo yet: a plain plate with the brand name in the display face (no oval, no tint). */
export function PlateName({ product, label = '' }) {
  // The brand (or the brand already at the start of its name), else the name.
  const name = String(product?.brand || BRAND_FALLBACK[product?.id] || product?.name || '').trim() || 'ayna';
  return (
    <span className="ay-plate-name" role="img" aria-label={label || `No photo yet for ${product?.name || name}`}>
      <span aria-hidden="true">{name}</span>
    </span>
  );
}

/** The 10px evidence mark (filled .gov, half peer-reviewed, outline brand), same drawing as the PDP. */
export function EvMark({ level }) {
  const def = LEVELS.find((l) => l.id === level);
  if (!def) return null;
  return (
    <svg className={`ay-pcard__evmark is-${def.mark}`} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      {def.mark === 'half' && <path d="M5 1.25a3.75 3.75 0 0 0 0 7.5Z" fill="currentColor" />}
      <circle cx="5" cy="5" r="3.75" fill={def.mark === 'filled' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeDasharray={def.mark === 'dotted' ? '1.2 1.6' : undefined} />
    </svg>
  );
}

const SafetyGlyph = () => (
  <svg className="ay-pcard__safeicon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M8 1.6 14.6 13.4H1.4L8 1.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 6.2v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.6" r=".9" fill="currentColor" />
  </svg>
);

/** Slot 6: the evidence mark with its words, and a safety icon when the product has a top warning. */
export function EvidenceRow({ product, evidence = undefined, safety = undefined }) {
  const ev = evidence === undefined ? cardEvidence(product) : evidence;
  const warn = safety === undefined ? cardSafety(product) : safety;
  if (!ev && !warn) return null;
  return (
    <p className="ay-pcard__ev">
      {ev ? <span className="ay-pcard__evtext" title={ev.label}><EvMark level={ev.level} /><span>{ev.text}</span><span className="sr-only"> ({ev.label})</span></span> : <span className="ay-pcard__evtext is-none">Not graded yet</span>}
      {warn && <span className="ay-pcard__safe" title={warn}><SafetyGlyph /><span>Safety note</span><span className="sr-only">: {warn}</span></span>}
    </p>
  );
}

/** Slot 4 extras: the per-use chip (reusables, supplies) and the real size pills. */
export function PriceExtras({ product }) {
  const per = cardPerUse(product);
  const sizes = cardSizes(product);
  if (!per && !sizes.length) return null;
  const shown = sizes.slice(0, 3);
  return (
    <>
      {per && <span className="ay-pcard__peruse" title={per.math}>{per.text}<span className="sr-only">. {per.math}</span></span>}
      {shown.length > 0 && (
        <span className="ay-pcard__sizes" aria-label={`Sizes: ${sizes.join(', ')}`}>
          {shown.map((s) => <span key={s} className="ay-pcard__size" aria-hidden="true">{s}</span>)}
          {sizes.length > shown.length && <span className="ay-pcard__size is-more" aria-hidden="true">+{sizes.length - shown.length}</span>}
        </span>
      )}
    </>
  );
}

/** Slot 5: two or three facts from the record. */
export function FactChips({ product, facts = undefined }) {
  const list = facts === undefined ? cardFacts(product) : facts;
  if (!list.length) return null;
  return <ul className="ay-pcard__facts" aria-label="Key facts">{list.map((f) => <li key={f}>{f}</li>)}</ul>;
}
