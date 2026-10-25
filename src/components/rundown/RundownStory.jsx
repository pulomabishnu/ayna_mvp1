import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import NotUsefulMenu from './NotUsefulMenu.jsx';
import ProductCard from '../ProductCard.jsx';
import AppProductCard from '../../mobile/components/ProductCard.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { READ_PHOTOS } from '../../data/readCovers.js';
import { ProductSheetContext } from '../../mobile/productSheetContext.js';
import { ProductQuickActions } from '../../mobile/components/ProductQuick.jsx';
import { Mark, Shapes } from '../personality/DS.jsx';
import { Seal } from '../personality/Bits.jsx';
import './rundown-ds.css';
import { DataViz, DATA_KINDS } from './DataCharts.jsx';
import './rundown-data.css';

/**
 * The rundown as a full-screen story (UX spec 8): progress at the top, tap
 * right for next and left for previous, swipe, pause, exit, save, ask ayna.
 * Reduced motion: no auto-advance and no slide; she moves on by tapping.
 * Screen readers: a modal dialog with "Card 2 of 6" announced, every control
 * a real button, Arrow keys and Escape work.
 */
const AUTO_MS = 8000;
const HRSA_FIND_CARE = 'https://findahealthcenter.hrsa.gov/';
const OUTCOME_LABELS = { helpful: 'Helpful', no_change: 'No change', worse: 'Worse', side_effect: 'Side effect', unsure: 'Not sure', stopped: 'Stopped' };
const LEVEL_WORDS = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'];
const STILL = new Set(['checkin', 'care', 'followup']); // never auto-advance past these

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const isControl = (el) => Boolean(el?.closest?.('button, a, input, select, textarea, [role="group"]'));

function Evidence({ level }) {
  if (!level) return null;
  return <span className="ay-rd-meter" role="img" aria-label={LEVEL_WORDS[level]} data-level={level}><i /><i /><i /><b>{LEVEL_WORDS[level]}</b></span>;
}

/* One drawn mark per kind of card, in a disc beside its label (decoration only). */
const KICKER_MARK = { pattern: 'wave', change: 'star', match: 'heart', saved: 'heart', education: 'asterisk', symptom: 'flower', goal: 'star', community: 'flower', win: 'sparkle', week: 'moon', safety: 'asterisk', frame: 'sparkle' };

/* Type as form (Wrapped 2024): one big visual per card, only from real data:
   today's date, the story's own contents, the read's real photo, her own count. */
function CardArt({ card }) {
  if (card.kind === 'opening') {
    const day = String(card.key || '').split(':')[1] || '';
    const d = day ? new Date(`${day}T12:00:00`) : null;
    // Today's date as a big Bricolage numeral on a colour disc, with drawn shapes around it.
    return d ? <div className="ay-rd-art is-opening" aria-hidden="true"><span className="ay-rd-art__date"><b>{d.getDate()}</b><small>{d.toLocaleDateString('en-US', { weekday: 'long' })}</small></span><Shapes className="ay-rd-art__shapes" /></div> : null;
  }
  if (card.kind === 'closing') return <div className="ay-rd-art is-closing" aria-hidden="true"><Seal className="ay-rd-art__seal" text="your rundown · see you tomorrow · " /></div>;
  if (card.kind === 'read' && READ_PHOTOS[card.readId]) return <div className="ay-rd-art is-photo" aria-hidden="true"><img src={READ_PHOTOS[card.readId]} alt="" /></div>;
  if (card.kind === 'stat') {
    const m = String(card.title || '').match(/\d+/);
    return m ? <div className="ay-rd-art is-stat" aria-hidden="true"><span className="ay-rd-art__num">{m[0]}</span></div> : null;
  }
  // Cards that are only words get a small drawn composition from their own kind (Wrapped's layered shapes, ayna's marks).
  if (!card.facts && !card.steps && (['text', 'checkin', 'followup', 'safety'].includes(card.kind) || card.category === 'symptom' || card.category === 'safety')) {
    const mark = KICKER_MARK[card.category] || 'sparkle';
    return <div className="ay-rd-art is-marks" aria-hidden="true"><span className="ay-rd-art__disc"><Mark name={mark} /></span><Mark name="sparkle" className="ay-rd-art__s1" /><Mark name={mark === 'flower' ? 'star' : 'flower'} className="ay-rd-art__s2" /></div>;
  }
  return null;
}

function Body({ card, h, done }) {
  const it = card.item;
  switch (card.kind) {
    case 'checkin':
      return (
        <div className="ay-rd-choices" role="group" aria-label={card.title}>
          {card.options.values.map((v, i) => (
            <button key={String(v)} type="button" className="ay-rd-chip" aria-pressed={done?.value === v} onClick={() => h.checkIn(card, v)}>{card.options.labels[i]}</button>
          ))}
          {done && <p className="ay-rd-note" role="status">Saved to your log.</p>}
        </div>
      );
    case 'followup':
      return (
        <div className="ay-rd-choices" role="group" aria-label="How did it go?">
          {Object.entries(OUTCOME_LABELS).map(([k, label]) => <button key={k} type="button" className="ay-rd-chip" aria-pressed={done?.value === k} onClick={() => h.outcome(card, k)}>{label}</button>)}
          {done && <p className="ay-rd-note" role="status">Thanks. ayna will use this.</p>}
        </div>
      );
    case 'match': {
      const m = card.match;
      // The founder's product card (the one in Explore), as a row. The app
      // (product sheet available): tap it for the sheet over this card, and
      // Buy, Save, Add to my routine are one tap each under it.
      if (h.sheet) {
        return (
          <div className="ay-rd-product has-open">
            <AppProductCard product={m.product} variant="row" quizAnswers={h.sheet.quizAnswers || null} matchOpts={h.sheet.matchOpts} onClick={() => h.openSheet(m.product)} onOpenWhyMatch={() => h.openSheet(m.product)} />
            <Evidence level={m.evidence} />
            <ProductQuickActions product={m.product} saved={h.sheet.isSaved(m.product.id)} onToggleSaved={h.sheetSave} inRoutine={h.sheet.inRoutine(m.product.id)} onAddToRoutine={h.sheetAdd} placement="rundown" />
          </div>
        );
      }
      return (
        <div className="ay-rd-product">
          <ProductCard product={m.product} className="is-row" matchPercent={m.percent} matchLabel={matchText(m.percent)} why={m.why} onOpen={h.whyMatch || undefined} onShowWhy={h.whyMatch || null} />
          <Evidence level={m.evidence} />
          {h.whyMatch && <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => h.whyMatch(m.product)}>Why this match?</button></span>}
        </div>
      );
    }
    case 'saved': {
      // A product held back for safety never shows a %: "Safety hold · Match unavailable".
      return (
        <div className={`ay-rd-product${h.sheet ? ' has-open' : ''}`}>
          {h.sheet
            ? <AppProductCard product={card.product} variant="row" quizAnswers={h.sheet.quizAnswers || null} matchOpts={h.sheet.matchOpts} onClick={() => h.openSheet(card.product)} onOpenWhyMatch={() => h.openSheet(card.product)} />
            : <ProductCard product={card.product} className="is-row" onOpen={h.whyMatch || undefined} />}
          <span className="ay-rd-actions">
            {h.compare && <button type="button" className="ay-rd-primary" onClick={() => h.compare(card.product)}>Compare</button>}
            {h.ask && <button type="button" className="ay-rd-link" onClick={() => h.ask(`Is ${card.product.name} a good fit for me?`)}>Ask ayna</button>}
            {h.unsave && <button type="button" className="ay-rd-link" onClick={() => h.unsave(card.product)}>Remove</button>}
            <button type="button" className="ay-rd-link" onClick={() => h.next()}>Keep saved</button>
          </span>
        </div>
      );
    }
    case 'community':
      return h.openPost && card.communityItem?.id ? <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => h.openPost(card.communityItem.id)}>Read the post</button></span> : null;
    case 'read':
      return h.openRead ? <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => h.openRead(card.readId)}>Learn more</button></span> : null;
    case 'care': {
      const tel = it?.level === 'urgent' && /911/.test(it?.title || '');
      return (
        <span className="ay-rd-actions">
          {tel ? <a className="ay-rd-primary" href="tel:911">Call 911</a>
            : h.findCare ? <button type="button" className="ay-rd-primary" onClick={() => h.findCare(it)}>Find care</button>
              : <a className="ay-rd-primary" href={HRSA_FIND_CARE} target="_blank" rel="noopener noreferrer">Find care<span className="sr-only"> (opens in a new tab)</span></a>}
        </span>
      );
    }
    case 'opening': {
      // What is inside, in story order (the real card labels).
      const inside = (h.list || []).filter((c) => c.category !== 'frame');
      return inside.length ? <ol className="ay-rd-art__inside" aria-label="In this rundown">{inside.map((c) => <li key={c.key}>{c.kicker}</li>)}</ol> : null;
    }
    case 'period':
    case 'cycle':
      if (card.check) {
        return (
          <div className="ay-rd-choices ay-rdd-check" role="group" aria-label={card.title}>
            {card.check.options.map((o) => <button key={o.value} type="button" className="ay-rd-chip" onClick={() => h.periodAnswer(card, o.value)}>{o.label}</button>)}
          </div>
        );
      }
      return (<>
        {card.flowAsk && (
          <div className="ay-rd-choices ay-rdd-check" role="group" aria-label={card.flowAsk.title}>
            <p className="ay-rd-basis">{card.flowAsk.title}</p>
            {card.flowAsk.options.map((o) => <button key={o.value} type="button" className="ay-rd-chip" onClick={() => h.logFlow(card, o.value)}>{o.label}</button>)}
          </div>
        )}
        {card.note && <p className="ay-rd-note" role="status">{card.note}</p>}
      </>);
    case 'list':
      return <ul className="ay-rd-lines">{card.lines.map((l) => <li key={l}>{l}</li>)}</ul>;
    case 'closing':
      return (<>
        {h.askFollowUp && card.followUps?.length > 0 && (
          <div className="ay-rd-asks">
            <p className="ay-rd-basis">Ask ayna about today</p>
            <ul>
              {card.followUps.map((f) => <li key={f.question}><button type="button" onClick={() => h.askFollowUp(f)}><span>{f.question}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button></li>)}
            </ul>
          </div>
        )}
        <span className="ay-rd-actions">
          {h.ask && <button type="button" className="ay-rd-primary" onClick={() => h.ask('')}>Ask ayna</button>}
          {h.explore && <button type="button" className="ay-rd-link" onClick={h.explore}>Explore for you</button>}
          <button type="button" className="ay-rd-link" onClick={h.close}>Done</button>
          {h.remindTomorrow && <button type="button" className="ay-rd-link" onClick={h.remindTomorrow}>Remind me tomorrow</button>}
        </span>
      </>);
    default:
      return null;
  }
}

/**
 * @param {{ cards, title, onClose, onSeen, onCheckIn, onOutcome, onAsk, onWhyMatch, onSave, onCompare, onUnsave, onOpenRead, onExplore, onFindCare, onNotUseful, onRemindTomorrow, onAction }} props
 */
export default function RundownStory({ cards, title = 'Your daily rundown', onClose, onSeen, onCheckIn, onOutcome, onAsk, onAskFollowUp, onSeeData, onWhyMatch, onSave, onCompare, onUnsave, onOpenRead, onOpenPost, onExplore, onFindCare, onNotUseful, onRemindTomorrow, onAction, onPeriodAnswer }) {
  // The app's product sheet (null on the website): opens over this story,
  // which stays on the same card, paused, until the sheet closes.
  const sheet = useContext(ProductSheetContext);
  const suspended = Boolean(sheet?.isOpen);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState({});
  const [hidden, setHidden] = useState({});
  const [msg, setMsg] = useState('');
  const [rm] = useState(reducedMotion);
  const rootRef = useRef(null);
  const [backTo] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const startX = useRef(null);
  const list = cards.filter((c) => !hidden[c.key]);
  const n = list.length;
  const card = list[Math.min(i, n - 1)];
  // The cards can be rebuilt while she is on one (her period answer adjusts
  // the rest): stay on the same card by key, never jump.
  const curKey = useRef(card?.key);
  const sig = list.map((c) => c.key).join('|');
  const prevSig = useRef(sig);
  useEffect(() => {
    if (prevSig.current !== sig) {
      prevSig.current = sig;
      const k = sig.split('|').indexOf(curKey.current);
      if (k >= 0 && k !== i) { setI(k); return; }
    }
    curKey.current = sig.split('|')[Math.min(i, n - 1)];
  }, [sig, i, n]);
  // In the app the product card has one-tap Buy, Save and Add: it waits for her.
  const auto = !rm && !paused && !suspended && card && !STILL.has(card.kind) && !card.check && !card.flowAsk && card.kind !== 'closing' && !(sheet && card.kind === 'match');

  const close = useCallback(() => { onClose?.({ seen: i + 1, count: n }); try { backTo?.focus?.(); } catch { /* gone */ } }, [onClose, i, n, backTo]);
  const go = useCallback((d) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);
  useEffect(() => { if (card) onSeen?.(card); }, [card, onSeen]);
  useEffect(() => { rootRef.current?.focus(); }, []);
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => go(1), AUTO_MS);
    return () => clearTimeout(t);
  }, [auto, i, go]);
  useEffect(() => {
    const key = (e) => {
      if (suspended) return; // the product sheet on top has the keys
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, close, suspended]);
  if (!card) return null;

  const h = {
    list,
    next: () => go(1),
    close,
    checkIn: (c, v) => { onCheckIn?.(c.field, v); setDone((s) => ({ ...s, [c.key]: { value: v } })); onAction?.(c, 'answer'); },
    periodAnswer: (c, v) => { onPeriodAnswer?.(v); onAction?.(c, 'answer'); },
    logFlow: (c, v) => { onCheckIn?.('flow', v); onAction?.(c, 'answer'); },
    outcome: (c, v) => { onOutcome?.(c.item, v); setDone((s) => ({ ...s, [c.key]: { value: v } })); onAction?.(c, 'answer'); },
    whyMatch: onWhyMatch ? (p) => { onAction?.(card, 'open'); onWhyMatch(p); } : null,
    compare: onCompare ? (p) => { onAction?.(card, 'open'); onCompare(p); } : null,
    unsave: onUnsave ? (p) => { onUnsave(p); setMsg('Removed from your saved items.'); onAction?.(card, 'not_relevant'); go(1); } : null,
    openRead: onOpenRead ? (id) => { onAction?.(card, 'open'); onOpenRead(id); } : null,
    openPost: onOpenPost ? (id) => { onAction?.(card, 'open'); onOpenPost(id); } : null,
    sheet,
    openSheet: sheet ? (p) => { onAction?.(card, 'open'); sheet.open(p); } : null,
    sheetSave: sheet ? (p) => { const was = sheet.isSaved(p.id); sheet.toggleSaved(p); if (!was) onAction?.(card, 'save'); } : null,
    sheetAdd: sheet ? (p) => { sheet.addToRoutine(p); onAction?.(card, 'add'); } : null,
    ask: onAsk ? (q) => { onAction?.(card, 'ask'); onAsk(q); } : null,
    explore: onExplore ? () => { onAction?.(card, 'open'); onExplore(); } : null,
    askFollowUp: onAskFollowUp ? (f) => { onAction?.(card, 'ask'); onAskFollowUp(f); } : null,
    findCare: onFindCare,
    remindTomorrow: onRemindTomorrow ? async () => { setMsg(await onRemindTomorrow()); onAction?.(card, 'remind'); } : null,
  };
  const isData = DATA_KINDS.has(card.kind);
  const dataAsk = isData && onAsk ? (card.ask || card.followUps?.[0] || null) : null;
  const hasMore = isData && Boolean(card.facts || card.changed || card.mayAffect || card.canDo || card.more || card.basisLine || card.sources?.length || (!card.protected && onNotUseful));
  const savable = card.kind === 'match' ? card.match.product : card.kind === 'read' ? null : null;
  const tap = (e) => {
    if (isControl(e.target)) return;
    const r = e.currentTarget.getBoundingClientRect();
    go(e.clientX - r.left < r.width * 0.3 ? -1 : 1);
  };
  const tone = card.tone && card.category !== 'safety' ? `is-${card.tone}` : card.category === 'safety' ? 'is-ink' : card.kind === 'opening' || card.kind === 'closing' ? 'is-ink' : ({ pattern: 'is-sky', change: 'is-sky', match: 'is-pink', saved: 'is-pink', education: 'is-butter', symptom: 'is-butter', goal: 'is-butter', community: 'is-sky', win: 'is-pink', week: 'is-sky' })[card.category] || 'is-butter';

  const node = (
    <div ref={rootRef} className={`ay-rd ${tone} is-${card.kind}${rm ? ' is-still' : ''}`} role="dialog" aria-modal="true" aria-roledescription="story" aria-label={title} tabIndex={-1}>
      {/* Phone: the frame is the screen. Desktop: a 9:16 poster on a dark scrim (DESIGN_RESEARCH_OCT24 B5). */}
      <div className="ay-rd-frame">
      <div className="ay-rd-top">
        <ol className="ay-rd-progress" aria-hidden="true">
          {list.map((c, k) => <li key={c.key} className={k < i ? 'is-done' : k === i ? `is-now${auto ? ' is-running' : ''}` : ''} style={k === i ? { '--ay-rd-ms': `${AUTO_MS}ms` } : undefined}><i /></li>)}
        </ol>
        <div className="ay-rd-bar">
          <span className="ay-rd-count">{title}</span>
          {!rm && <button type="button" className="ay-rd-icon" aria-pressed={paused} aria-label={paused ? 'Play' : 'Pause'} onClick={() => setPaused((v) => !v)}>{paused ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>}</button>}
          <button type="button" className="ay-rd-icon" aria-label="Close rundown" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{`Card ${i + 1} of ${n}: ${card.title}`}</p>
      <div
        className="ay-rd-stage"
        onClick={tap}
        onPointerDown={(e) => { startX.current = e.clientX; }}
        onPointerUp={(e) => { if (startX.current == null) return; const dx = e.clientX - startX.current; startX.current = null; if (Math.abs(dx) > 50 && !isControl(e.target)) { e.preventDefault(); go(dx < 0 ? 1 : -1); } }}
      >
        <article className={`ay-rd-card${isData ? ' is-data' : ''}`} key={`${card.key}:${card.title}`} aria-labelledby={`ay-rd-t-${i}`}>
          {!isData && <CardArt card={card} />}
          <p className="ay-rd-kicker"><span className="ay-rd-kicker__disc" aria-hidden="true"><Mark name={KICKER_MARK[card.category] || 'sparkle'} /></span>{card.kicker}</p>
          <h2 id={`ay-rd-t-${i}`} className={`ay-rd-title${String(card.title || '').length > 64 ? ' is-long' : ''}`}>{card.title}</h2>
          {card.body && <p className="ay-rd-body">{card.body}</p>}
          {isData && <DataViz card={card} />}
          {isData ? (<>
            <Body card={card} h={h} done={done[card.key]} />
            {/* One action (founder, Oct 24 23:53): Ask why, else See data. The
                working (how ayna got this, sources, Not useful) folds away. */}
            {!card.check && !card.flowAsk && (dataAsk ? <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => h.ask(dataAsk)}>Ask why</button></span>
              : card.seeData && onSeeData ? <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => { onAction?.(card, 'open'); onSeeData(card.seeData); }}>See data</button></span> : null)}
            {hasMore && (
              <details className="ay-rdd-more">
                <summary>How ayna got this</summary>
                {card.facts && <dl className="ay-rd-facts">{card.facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>}
                {(card.changed || card.mayAffect || card.canDo) && (
                  <dl className="ay-rd-steps">
                    {card.changed && <div><dt>What changed</dt><dd>{card.changed}</dd></div>}
                    {card.mayAffect && <div><dt>What it may affect</dt><dd>{card.mayAffect}</dd></div>}
                    {card.canDo && <div><dt>What you can do</dt><dd>{card.canDo}</dd></div>}
                  </dl>
                )}
                {card.more && <p className="ay-rd-basis">{card.more}</p>}
                {card.basisLine && <p className="ay-rd-basis">{card.basisLine}</p>}
                {(card.sources || []).length > 0 && <p className="ay-rd-basis">Source: {card.sources.map((s, k) => <span key={s.url}>{k ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>}
                {dataAsk && card.seeData && onSeeData && <button type="button" className="ay-rd-link" onClick={() => { onAction?.(card, 'open'); onSeeData(card.seeData); }}>See data</button>}
                {!card.protected && onNotUseful && <NotUsefulMenu onPick={(reason) => { onNotUseful(card, reason); setHidden((s) => ({ ...s, [card.key]: true })); setMsg('Thanks. You will see less like this.'); }} />}
              </details>
            )}
          </>) : (<>
            {card.facts && <dl className="ay-rd-facts">{card.facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>}
            {(card.changed || card.mayAffect || card.canDo) && (
              <dl className="ay-rd-steps">
                {card.changed && <div><dt>What changed</dt><dd>{card.changed}</dd></div>}
                {card.mayAffect && <div><dt>What it may affect</dt><dd>{card.mayAffect}</dd></div>}
                {card.canDo && <div><dt>What you can do</dt><dd>{card.canDo}</dd></div>}
              </dl>
            )}
            {card.seeData && onSeeData && <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => { onAction?.(card, 'open'); onSeeData(card.seeData); }}>See data</button></span>}
            {card.reason && <p className="ay-rd-basis">{card.reason}</p>}
            {card.basisLine && <p className="ay-rd-basis">{card.basisLine}</p>}
            {card.footnote && <p className="ay-rd-basis">{card.footnote}</p>}
            {(card.sources || []).length > 0 && <p className="ay-rd-basis">Source: {card.sources.map((s, k) => <span key={s.url}>{k ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>}
            <Body card={card} h={h} done={done[card.key]} />
            {card.kind !== 'opening' && card.kind !== 'closing' && (
              <div className="ay-rd-foot">
                {savable && onSave && !sheet && <button type="button" className="ay-rd-link" onClick={() => { onSave(savable); setMsg('Saved.'); onAction?.(card, 'save'); }}>Save</button>}
                {/* A fact from her data: "Ask why" under it (team sync, Oct 25). */}
                {onAsk && card.ask && <button type="button" className="ay-rd-link" onClick={() => h.ask(card.ask)}>{['change', 'pattern', 'data'].includes(card.category) ? 'Ask why' : 'Ask ayna about this'}</button>}
                {!card.protected && onNotUseful && <NotUsefulMenu onPick={(reason) => { onNotUseful(card, reason); setHidden((s) => ({ ...s, [card.key]: true })); setMsg('Thanks. You will see less like this.'); }} />}
              </div>
            )}
          </>)}
          {msg && <p className="ay-rd-note" role="status">{msg}</p>}
        </article>
      </div>
      <div className="ay-rd-nav">
        <button type="button" className="ay-rd-icon" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous card"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
        <span aria-hidden="true">{i + 1} / {n}</span>
        <button type="button" className="ay-rd-icon" onClick={() => (i === n - 1 ? close() : go(1))} aria-label={i === n - 1 ? 'Finish' : 'Next card'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
      </div>
      </div>
    </div>
  );
  const host = (typeof document !== 'undefined' && (document.querySelector('.ayna-mobile') || document.querySelector('.app-container'))) || null;
  return host ? createPortal(node, host) : node;
}
