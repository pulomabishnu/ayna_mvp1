import React, { useEffect, useState } from 'react';
import MatchPill from '../MatchPill.jsx';
import SafetyHoldNote from '../match/SafetyHoldNote.jsx';
import BleedingEvaluationNote from '../match/BleedingEvaluationNote.jsx';
import { matchText, shownMatchPercent, MATCH_UNAVAILABLE, SAFETY_HOLD } from '../../utils/matchDisplay.js';
import PdpIcon from './PdpIcon.jsx';
import { splitShow, SHOW_FIRST } from './pdpParts.js';
import { LEVELS, levelLabel, levelCountWords } from './evidenceLevels.js';
import './pdp-v7.css';

/**
 * The product page's shared parts (website page, app page, app sheet):
 * one match line, the Is it for you checklist, the At a glance bento, the
 * evidence meter, the safety box and "Show all N". Decisions live in
 * pdpParts.js; these only draw them.
 */

/** "Show all N": the first few, then the rest in place. Everything stays in the page. */
export function ShowAll({ items, n = SHOW_FIRST, render, className = '', label = 'items', itemClass }) {
  const [open, setOpen] = useState(false);
  const { shown, rest, total } = splitShow(items, n);
  if (!total) return null;
  const li = (x, i, hidden = false) => <li key={i} className={itemClass ? itemClass(x) : undefined} hidden={hidden || undefined}>{render(x, i)}</li>;
  return (
    <>
      <ul className={className}>
        {shown.map((x, i) => li(x, i))}
        {rest.map((x, i) => li(x, i + shown.length, !open))}
      </ul>
      {rest.length > 0 && (
        <button type="button" className="ayv-showall" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show fewer' : `Show all ${total}${label ? ` ${label}` : ''}`}
        </button>
      )}
    </>
  );
}

/** The one match line under the price: % + why, a safety hold, the bleeding evaluation, or nothing. Never 0%. */
export function MatchLine({ state, onWhy = null, onFix = null, onQuiz = null }) {
  if (!state) return null;
  if (state.kind === 'pct') {
    const body = <><MatchPill percent={state.percent} size="sm" /><span className="ayv-match__why">{state.why || 'Why ayna picked this for you'}</span>{onWhy && <span className="ayv-match__go">See why</span>}</>;
    return onWhy
      ? <button type="button" className="ayv-match" data-tour="pdp-why" onClick={onWhy} aria-label={`${matchText(state.percent)}${state.why ? `. ${state.why}` : ''}. See why`}>{body}</button>
      : <p className="ayv-match" data-tour="pdp-why">{body}</p>;
  }
  if (state.kind === 'hold') {
    return (
      <div className="ayv-match is-hold" data-tour="pdp-why">
        {state.hold ? <SafetyHoldNote hold={state.hold} onFix={onFix} compact /> : <p className="ayv-match__row"><MatchPill hold size="sm" /><span className="ayv-match__why">{MATCH_UNAVAILABLE}</span></p>}
        {onWhy && <button type="button" className="ayv-textbtn" onClick={onWhy} aria-label={`${SAFETY_HOLD}. ${MATCH_UNAVAILABLE}. See why`}>See why</button>}
      </div>
    );
  }
  if (state.kind === 'evaluation') {
    return (
      <div className="ayv-match is-hold" data-tour="pdp-why">
        {state.note ? <BleedingEvaluationNote note={state.note} /> : <p className="ayv-match__why">{state.text}</p>}
        {onWhy && <button type="button" className="ayv-textbtn" onClick={onWhy}>See why</button>}
      </div>
    );
  }
  if (state.kind === 'none') {
    return onWhy
      ? <button type="button" className="ayv-match is-none" data-tour="pdp-why" onClick={onWhy}><span className="ayv-match__why">{state.text}</span><span className="ayv-match__go">See why</span></button>
      : <p className="ayv-match is-none" data-tour="pdp-why"><span className="ayv-match__why">{state.text}</span></p>;
  }
  if (state.kind === 'quiz') {
    return <button type="button" className="ayv-match is-none" data-tour="pdp-why" onClick={onQuiz || undefined}><span className="ayv-match__why">See how it fits you</span><span className="ayv-match__go">Get matched</span></button>;
  }
  return null;
}

/** The evidence grade as 3 bars + its word. The bars fill once (none under reduced motion). */
export function EvidenceMeter({ meter, onMore = null, moreLabel = 'See the literature', size = 'md' }) {
  if (!meter) return null;
  return (
    <div className={`ayv-meter is-${size}${meter.empty ? ' is-empty' : ''}`} data-level={meter.level}>
      <p className="ayv-meter__k">Evidence</p>
      {meter.empty ? (
        <p className="ayv-meter__word">{meter.label}</p>
      ) : (
        <p className="ayv-meter__row">
          <span className="ayv-meter__bars" role="img" aria-label={`${meter.label}, ${meter.level} of ${meter.of}`}>
            {Array.from({ length: meter.of }, (_, i) => <i key={i} className={i < meter.level ? 'is-on' : undefined} style={{ '--i': i }} />)}
          </span>
          <span className="ayv-meter__word">{meter.label}{meter.need && <span className="ayv-meter__for"> for {meter.need}</span>}</span>
        </p>
      )}
      {meter.note && <p className="ayv-meter__note">{meter.note}</p>}
      {onMore && <button type="button" className="ayv-textbtn" onClick={onMore}>{moreLabel}</button>}
    </div>
  );
}

/**
 * One evidence mark (PDP audit 12, signature 4): an 8px circle, 1.5px ink.
 * filled = checked against .gov, half = peer-reviewed, outline = the brand's,
 * dotted = people's experiences. Always paired with its words for screen
 * readers; the visible label shows the first time on a screen.
 */
export function EvidenceMark({ level }) {
  const def = LEVELS.find((l) => l.id === level);
  if (!def) return null;
  return (
    <svg className={`ayv-mark8 is-${def.mark}`} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      {def.mark === 'half' && <path d="M5 1.25a3.75 3.75 0 0 0 0 7.5Z" fill="currentColor" />}
      <circle cx="5" cy="5" r="3.75" fill={def.mark === 'filled' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeDasharray={def.mark === 'dotted' ? '1.2 1.6' : undefined} />
    </svg>
  );
}

/** "● 1 .gov · ◐ 4 peer-reviewed · ○ 3 from Saalt": the counts per level, from evidenceFor. */
export function EvidenceCounts({ ev, people = true, className = '' }) {
  if (!ev) return null;
  const list = LEVELS.filter((l) => (people || l.id !== 'people') && ev.counts[l.id] > 0);
  if (!list.length) return null;
  return (
    <ul className={`ayv-evcounts ${className}`.trim()} aria-label="Sources on file by level">
      {list.map((l) => (
        <li key={l.id}><EvidenceMark level={l.id} /><span>{levelCountWords(l.id, ev.counts[l.id], ev.brand)}</span><span className="sr-only"> ({levelLabel(l.id, ev.brand)})</span></li>
      ))}
    </ul>
  );
}

/**
 * The evidence header (calm): the grade or "Not graded yet", one sentence
 * why, the counts per level. Top of Scientific literature, compact in ayna
 * summary. Reads the one evidence function, so it matches Compare.
 */
export function EvidenceHeader({ ev, compact = false, onMore = null, moreLabel = 'See the research', id = undefined }) {
  if (!ev) return null;
  return (
    <div className={`ayv-evhead${compact ? ' is-compact' : ''}${ev.graded ? ' is-graded' : ''}`}>
      <p className="ayv-evhead__status" id={id}>{ev.status}</p>
      {ev.why && <p className="ayv-evhead__why">{ev.why}</p>}
      <EvidenceCounts ev={ev} people={!compact} />
      {onMore && <button type="button" className="ayv-textbtn" onClick={onMore}>{moreLabel}</button>}
    </div>
  );
}

/** The four levels with their marks and words (a key, shown once in Scientific literature). */
export function EvidenceKey({ brand = '' }) {
  return (
    <ul className="ayv-evkey" aria-label="How each source was checked">
      {LEVELS.map((l) => <li key={l.id}><EvidenceMark level={l.id} /><span>{levelLabel(l.id, brand)}</span>{l.grades && <span className="ayv-evkey__note"> · the only level ayna grades from</span>}</li>)}
    </ul>
  );
}

/**
 * The safety line, directly under the buy button (PDP audit 7.5, P0 #3).
 * Calm register: white surface, 3px ink rule on the left, an SVG alert icon,
 * ink text, no pink, no shadow, never animated. `lines` comes from
 * pdpParts.safetyLineFor (her IUD first when she has one; TSS for cups and
 * discs). "Safety details" jumps to the Safety block inside ayna summary.
 */
export function SafetyLine({ text = '', lines = null, onGo = null }) {
  const list = (lines && lines.length ? lines : text ? [{ kind: 'warning', text }] : []).filter((l) => l && l.text);
  if (!list.length) return null;
  const go = onGo || (() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'safety' })));
  return (
    <div className="ayv-safeline" role="note" aria-label="Safety">
      <svg className="ayv-safeline__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5M12 17.2h.01" /></svg>
      <div className="ayv-safeline__body">
        {list.map((l, i) => <p key={`${l.kind}-${i}`} className={`ayv-safeline__text is-${l.kind}`}>{i === 0 && <span className="sr-only">Safety: </span>}{l.text}</p>)}
        <button type="button" className="ayv-textbtn ayv-safeline__go" onClick={go}>Safety details</button>
      </div>
    </div>
  );
}

/** Every store on file, one row each: the Buy link first, price where known, ↗ for links. Only when there is more than one. */
export function WhereToBuy({ rows, onOpen = null }) {
  if (!rows || rows.length < 2) return null;
  return (
    <section className="ayv-where" aria-labelledby="ayv-where-h">
      <h2 id="ayv-where-h" className="ayv-where__h">Where to buy</h2>
      <ul className="ayv-where__list">
        {rows.map((r) => (
          <li key={`${r.name}-${r.url}`}>
            {r.url
              ? <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen?.(r)}><span className="ayv-where__name">{r.name}{r.host && <small className="ayv-where__host">{r.host}</small>}</span>{r.price && <span className="ayv-where__price">{r.price}</span>}{r.inStock && <span className="ayv-where__stock">In stock</span>}<span aria-hidden="true" className="ayv-where__go">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              : <span className="ayv-where__row"><span className="ayv-where__name">{r.name}</span>{r.inStock && <span className="ayv-where__stock">In stock</span>}<span className="ayv-where__nolink">No link yet</span></span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/**
 * Buy stays in reach (founder, Oct 25): once the hero's action row scrolls
 * out of view, a slim bar with the price, Buy and Save. `mode` 'scroll' sits
 * at the bottom of the app's own scroll area (page or sheet, above the tab
 * bar); 'fixed' sits above the website's phone tab bar. Hidden while she is
 * typing (keyboard open) and before she has scrolled past the actions.
 */
export function StickyBuy({ model, watch, saved = false, onSave = null, mode = 'scroll', onBuy = null, wideOff = false }) {
  const [past, setPast] = useState(false);
  const [typing, setTyping] = useState(false);
  const [wide, setWide] = useState(() => wideOff && typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches);
  const [bottom, setBottom] = useState(0);
  useEffect(() => {
    const el = watch?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    let root = null;
    // The element that really scrolls (the app's page or sheet); the website scrolls the document (root null).
    for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) { const oy = window.getComputedStyle(n).overflowY; if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) { root = n; break; } }
    const io = new IntersectionObserver(([e]) => {
      const top = root ? root.getBoundingClientRect().top : 0;
      setPast(!e.isIntersecting && e.boundingClientRect.bottom < top + 8);
    }, { root, threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  useEffect(() => {
    const isField = (t) => t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !/^(button|checkbox|radio|submit)$/i.test(t.type || '');
    const on = (e) => setTyping(isField(e.target));
    const off = () => setTyping(false);
    document.addEventListener('focusin', on);
    document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);
  useEffect(() => {
    if (mode !== 'fixed') return undefined;
    const read = () => {
      const nav = document.querySelector('nav.ay-tabbar--main');
      const r = nav ? nav.getBoundingClientRect() : null;
      setBottom(r && r.height && window.getComputedStyle(nav).display !== 'none' ? Math.max(0, window.innerHeight - r.top) : 0);
      if (wideOff && typeof window.matchMedia === 'function') setWide(window.matchMedia('(min-width: 1024px)').matches);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [mode, wideOff]);
  if (!model?.url || !past || typing || wide) return null;
  return (
    <div className={`ayv-stickybuy is-${mode}`} style={mode === 'fixed' ? { bottom } : undefined} role="region" aria-label="Buy">
      {model.price && <span className="ayv-stickybuy__price">{model.price}</span>}
      <a className="ayv-stickybuy__buy" href={model.url} target="_blank" rel="noopener noreferrer" onClick={() => onBuy?.()}>
        {model.isService ? 'Visit' : model.retailer && model.retailer.length <= 14 ? `Buy at ${model.retailer}` : 'Buy'}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens the seller’s site)</span>
      </a>
      {onSave && (
        <button type="button" className={`ayv-stickybuy__save${saved ? ' is-on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Saved' : 'Save'} onClick={onSave}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
    </div>
  );
}

/** The price, big, and one muted line of what it buys (count, supply, per unit). */
export function PriceLine({ main, notes = [] }) {
  if (!main && !notes.length) return null;
  return (
    <div className="ayv-price">
      {main && <span className="ayv-price__main">{main}</span>}
      {notes.length > 0 && <span className="ayv-price__notes">{notes.join(' · ')}</span>}
    </div>
  );
}

// ===========================================================================
// PDP audit Oct 25: the decision block (sections 12-15). One component each,
// shared by the website page, the app page and the app sheet.
// ===========================================================================

/** The scalloped plate (signature 2): 12 lobes, lobe depth 8% of the width. */
const PLATE_PATH = (() => {
  const pts = [];
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * Math.PI * 2;
    const r = 41.5 + 4 * (1 + Math.cos(12 * t));
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();
export function ScallopPlate({ tone = 'white', stroke = false, className = '' }) {
  return (
    <svg className={`ayv-plate is-${tone}${stroke ? ' has-stroke' : ''} ${className}`.trim()} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d={PLATE_PATH} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * The match lock-up (signature 3): espresso pill "92% match" (32px, 15/700),
 * a reason about this product, and "Why 92%?" that opens the explainer in
 * place (no modal): Raised it / Lowered it / ayna doesn't know yet, then
 * "Partnerships never change this score." and Ask ayna why.
 * Other states (safety hold, bleeding evaluation, no profile) keep MatchLine.
 */
export function MatchLockup({ state, breakdown = null, onAskWhy = null, onFull = null, onFix = null, onQuiz = null, idBase = 'ay-why' }) {
  const [open, setOpen] = useState(false);
  if (!state) return null;
  if (state.kind !== 'pct') return <MatchLine state={state} onWhy={onFull} onFix={onFix} onQuiz={onQuiz} />;
  const shown = shownMatchPercent(state.percent);
  const why = shown != null ? `Why ${shown}%?` : 'Why this fit?';
  const reason = breakdown?.reason || state.why || '';
  const lists = breakdown ? [['Raised it', breakdown.raised], ['Lowered it', breakdown.lowered], ['ayna doesn’t know yet', breakdown.unknown]].filter(([, l]) => l && l.length) : [];
  return (
    <div className="ayv-lock" data-tour="pdp-why">
      <p className="ayv-lock__row">
        <MatchPill percent={state.percent} size="lock" className="ayv-lock__pill" />
        {reason && <span className="ayv-lock__reason">{reason}.</span>}
        {' '}<button type="button" className="ayv-lock__why" aria-expanded={open} aria-controls={`${idBase}-panel`} onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : why}</button>
      </p>
      <div id={`${idBase}-panel`} className="ayv-lock__panel" hidden={!open || undefined}>
        {lists.length ? lists.map(([title, items]) => (
          <div key={title} className="ayv-lock__list">
            <p className="ayv-lock__h">{title}</p>
            <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )) : <p className="ayv-lock__h">The engine’s reasons are on the full breakdown.</p>}
        <p className="ayv-lock__foot">Partnerships never change this score.</p>
        <p className="ayv-lock__actions">
          {onAskWhy && <button type="button" className="ayv-obtn" onClick={() => onAskWhy(`Why is my match ${shown != null ? `${shown}%` : 'a partial fit'}?`)}><PdpIcon name="ask" size={16} />Ask ayna why</button>}
          {onFull && <button type="button" className="ayv-textbtn" onClick={onFull}>See the full breakdown</button>}
        </p>
      </div>
    </div>
  );
}

/** Price 22/600 (web) or 20/600 (app), then ayna's own per-cycle or per-day maths, muted, prefixed with ≈. */
export function PriceRow({ main = '', perUse = null, notes = [] }) {
  if (!main && !perUse && !notes.length) return null;
  return (
    <p className="ayv-pricerow">
      {main && <span className="ayv-pricerow__main">{main}</span>}
      {perUse && <span className="ayv-pricerow__per" title={perUse.math}>{perUse.text}<span className="sr-only">. {perUse.math}</span></span>}
      {!perUse && notes.length > 0 && <span className="ayv-pricerow__per">{notes.join(' · ')}</span>}
    </p>
  );
}

/** Highlights (12, signature 5): 2-4 white tiles, a big number (Bricolage 800 22) and a 13px caption. */
export function Highlights({ items = [], note = '' }) {
  if (!items.length) return null;
  return (
    <section className="ayv-hl" aria-label="Highlights">
      <ul className="ayv-hl__row">
        {items.map((h) => (
          <li key={h.id} className="ayv-hl__tile">
            <PdpIcon name={h.icon} size={20} />
            <span className="ayv-hl__num">{(() => { const m = String(h.value).match(/^(.*?\d)\s+(mL|hrs|yrs|days|mg|mcg|IU)$/); return m ? <>{m[1]}<span className="ayv-hl__unit"> {m[2]}</span></> : h.value; })()}</span>
            <span className="ayv-hl__cap">{h.caption}</span>
          </li>
        ))}
      </ul>
      {note && <p className="ayv-hl__note">{note}</p>}
    </section>
  );
}

const HEART2 = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';
/**
 * The actions row (7.10, 15 OutlineButton): three equal 44px outline buttons,
 * Save (heart), Add to routine (plus), Ask about this (speech bubble). After
 * tapping: "Saved" and "In my routine" with a filled icon. "Not for me" is a
 * quiet text link under them.
 */
export function ActionsRow({ saved = false, onSave = null, inRoutine = false, onRoutine = null, onAsk = null, saveLabel = '', notForMe = null, routineWords = ['Add to routine', 'In my routine'] }) {
  if (!onSave && !onRoutine && !onAsk) return null;
  return (
    <div className="ayv-acts">
      <div className="ayv-acts__row">
        {onSave && <button type="button" className={`ayv-obtn${saved ? ' is-on' : ''}`} aria-pressed={saved} aria-label={saveLabel || undefined} onClick={onSave}><svg viewBox="0 0 24 24" width="16" height="16" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART2} /></svg><span>{saved ? 'Saved' : 'Save'}</span></button>}
        {onRoutine && <button type="button" className={`ayv-obtn${inRoutine ? ' is-on' : ''}`} aria-pressed={inRoutine} onClick={onRoutine}><PdpIcon name={inRoutine ? 'check' : 'plus'} size={16} /><span>{inRoutine ? routineWords[1] : routineWords[0]}</span></button>}
        {onAsk && <button type="button" className="ayv-obtn" onClick={onAsk}><PdpIcon name="ask" size={16} /><span>Ask</span><span className="sr-only"> about this product</span></button>}
      </div>
      {notForMe}
    </div>
  );
}

/**
 * Ask about this product (7.8, 15 AskSheet/AskPanel): a right-side panel on
 * the website (400px), a bottom sheet in the app. Title, "Uses your profile.
 * Not medical advice.", three starters that change with what ayna knows, and
 * the box. Esc or the close button returns focus to the Ask button.
 */
export function AskPanel({ open, onClose, title, starters = [], onAsk, variant = 'panel', children = null }) {
  const ref = React.useRef(null);
  const [text, setText] = useState('');
  useEffect(() => {
    if (!open) return undefined;
    const prev = typeof document !== 'undefined' ? document.activeElement : null;
    window.requestAnimationFrame(() => ref.current?.querySelector('button, input')?.focus());
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.(); } };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); try { prev?.focus?.({ preventScroll: true }); } catch { /* gone */ } };
  }, [open, onClose]);
  if (!open) return null;
  const send = (q) => { const t = String(q || '').trim(); if (t) { onAsk?.(t); setText(''); } };
  return (
    <div className={`ayv-ask2 is-${variant}`} data-ask-panel="">
      <div className="ayv-ask2__dim" aria-hidden="true" onClick={onClose} />
      <section ref={ref} className="ayv-ask2__box" role="dialog" aria-modal="true" aria-labelledby="ayv-ask2-h">
        {variant === 'sheet' && <span className="ayv-ask2__grab" aria-hidden="true" />}
        <div className="ayv-ask2__head">
          <h2 id="ayv-ask2-h" className="ayv-ask2__title">{title}</h2>
          <button type="button" className="ayv-ask2__close" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        <p className="ayv-ask2__sub">Uses your profile. Not medical advice.</p>
        {children || (
          <>
            <ul className="ayv-ask2__starters">{starters.map((q) => <li key={q}><button type="button" className="ayv-obtn is-left" onClick={() => send(q)}>{q}</button></li>)}</ul>
            <form className="ayv-ask2__form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
              <label className="sr-only" htmlFor="ayv-ask2-input">Ask anything about this product</label>
              <input id="ayv-ask2-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything…" maxLength={300} />
              <button type="submit" className="ayv-ask2__send" disabled={!text.trim()}>Ask</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
