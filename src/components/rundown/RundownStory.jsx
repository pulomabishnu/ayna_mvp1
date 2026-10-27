import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import NotUsefulMenu from './NotUsefulMenu.jsx';
import ItemMenu from '../today/ItemMenu.jsx';
import ProductCard from '../ProductCard.jsx';
import AppProductCard from '../../mobile/components/ProductCard.jsx';
import { matchText } from '../../utils/matchDisplay.js';
import { READ_PHOTOS } from '../../data/readCovers.js';
import { ProductSheetContext } from '../../mobile/productSheetContext.js';
import { ProductQuickActions } from '../../mobile/components/ProductQuick.jsx';
import { holdLine } from '../../utils/matchState.js';
import { DataViz, DATA_KINDS } from './DataCharts.jsx';
import { StoryTop } from '../story/StoryShell.jsx';
import { storyTheme, useStoryGestures } from '../story/storyKit.js';
import '../story/story.css';
import './rundown-story.css';

/**
 * The rundown as a full-screen story (UX spec 8; story pass Oct 27, research
 * in the hand-off): segmented progress at the top, tap right for next and
 * left for previous, hold to pause, swipe down or the 44px X to close.
 * One idea per card: one big visual (a ring, bars, day dots, the product on
 * its plate, a big number with its unit), the claim set big, at most one
 * action. The working ("How ayna got this") folds away; safety never does.
 * Reduced motion: no auto-advance and no slide; she moves on by tapping.
 * Screen readers: a modal dialog with "Card 2 of 6" announced, every control
 * a real button, Arrow keys and Escape work.
 */
const AUTO_MS = 8000;
const HRSA_FIND_CARE = 'https://findahealthcenter.hrsa.gov/';
const OUTCOME_LABELS = { helpful: 'Helpful', no_change: 'No change', worse: 'Worse', side_effect: 'Side effect', unsure: 'Not sure', stopped: 'Stopped' };
const LEVEL_WORDS = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'];
const STILL = new Set(['checkin', 'care', 'followup', 'ask']); // never auto-advance past these

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

function Evidence({ level }) {
  if (!level) return null;
  return <span className="ay-rd-meter" role="img" aria-label={LEVEL_WORDS[level]} data-level={level}><i /><i /><i /><b>{LEVEL_WORDS[level]}</b></span>;
}

/** The number a stat card is about, with its real unit from the same sentence ("5 days", "2 patterns"). */
function statNumber(card) {
  if (card.figure?.of) return { n: card.figure.n, unit: `of ${card.figure.of} days` };
  const m = String(card.title || '').match(/(\d+)\s+(?:of\s+\d+\s+)?([a-z]+)/i);
  return m ? { n: m[1], unit: m[2] } : null;
}

/* One big visual per card, only from real data: today's date, the read's
   real photo, her own count, the cards she just saw. Nothing drawn for show. */
function CardArt({ card, count }) {
  if (card.kind === 'opening' && String(card.key || '').startsWith('opening:')) {
    const day = String(card.key || '').split(':').pop() || '';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : null;
    return d ? <p className="ays-big ay-rd-art is-date" aria-hidden="true"><b>{d.getDate()}</b><small>{`${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${d.toLocaleDateString('en-US', { month: 'long' })}`}</small></p> : null;
  }
  if (card.kind === 'closing') {
    // The cards she just went through, as one closed ring.
    return count > 0 ? (
      <figure className="ay-rdd-viz ay-rdd-ringwrap ay-rd-art is-done" aria-hidden="true">
        <span className="ay-rdd-ringbox">
          <svg viewBox="0 0 120 120" className="ay-rdd-ring"><circle className="ay-rdd-track" cx="60" cy="60" r="52" /><circle className="ay-rdd-arc" cx="60" cy="60" r="52" pathLength="100" style={{ strokeDashoffset: 0 }} transform="rotate(-90 60 60)" /></svg>
          <span className="ay-rdd-center"><b>{count}</b><small>{count === 1 ? 'thing' : 'things'}</small></span>
        </span>
      </figure>
    ) : null;
  }
  if (card.kind === 'read' && READ_PHOTOS[card.readId]) return <div className="ay-rd-art is-photo" aria-hidden="true"><img src={READ_PHOTOS[card.readId]} alt="" /></div>;
  if (card.kind === 'stat') {
    const s = statNumber(card);
    if (!s) return null;
    return (
      <div className="ay-rd-art is-stat" aria-hidden="true">
        <p className="ays-big is-huge"><b>{s.n}</b><small>{s.unit}</small></p>
        {card.figure?.days && <ol className="ay-rd-week">{card.figure.days.map((d) => <li key={d.day} className={d.on ? 'is-on' : ''}><i /><span>{new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' })}</span></li>)}</ol>}
      </div>
    );
  }
  if (card.kind === 'community' && card.body) return <blockquote className="ay-rd-art is-quote"><p>{card.body}</p></blockquote>;
  return null;
}

function Body({ card, h, done }) {
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
      // The founder's product card (Explore's), big: the photo on its white
      // plate is the card's one visual. The app (product sheet available):
      // tap it for the sheet over this card; Buy, Save, Add are one tap each.
      if (h.sheet) {
        return (
          <div className="ay-rd-product has-open">
            <AppProductCard product={m.product} quizAnswers={h.sheet.quizAnswers || null} matchOpts={h.sheet.matchOpts} onClick={() => h.openSheet(m.product)} onOpenWhyMatch={() => h.openSheet(m.product)} />
            <Evidence level={m.evidence} />
            <ProductQuickActions product={m.product} saved={h.sheet.isSaved(m.product.id)} onToggleSaved={h.sheetSave} inRoutine={h.sheet.inRoutine(m.product.id)} onAddToRoutine={h.sheetAdd} placement="rundown" />
          </div>
        );
      }
      return (
        <div className="ay-rd-product">
          <ProductCard product={m.product} matchPercent={m.percent} matchLabel={matchText(m.percent)} why={m.why} onOpen={h.whyMatch || undefined} onShowWhy={h.whyMatch || null} />
          <Evidence level={m.evidence} />
          {h.whyMatch && <span className="ay-rd-actions"><button type="button" className="ay-rd-primary" onClick={() => h.whyMatch(m.product)}>Why this match?</button></span>}
        </div>
      );
    }
    case 'saved': {
      // A product held back for safety never shows a %: "Safety hold · Match unavailable",
      // with what ayna still needs, under the card.
      const st = h.sheet?.matchStateFor?.(card.product) || null;
      return (
        <div className={`ay-rd-product${h.sheet ? ' has-open' : ''}`}>
          {h.sheet
            ? <AppProductCard product={card.product} quizAnswers={h.sheet.quizAnswers || null} matchOpts={h.sheet.matchOpts} onClick={() => h.openSheet(card.product)} onOpenWhyMatch={() => h.openSheet(card.product)} />
            : <ProductCard product={card.product} onOpen={h.whyMatch || undefined} />}
          {st?.kind === 'held' && <p className="ay-rd-holdline"><span className="ay-rd-hold">{st.label}</span>{holdLine(st)}</p>}
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
      const it = card.item;
      const tel = it?.level === 'urgent' && /911/.test(it?.title || '');
      return (
        <span className="ay-rd-actions">
          {tel ? <a className="ay-rd-primary" href="tel:911">Call 911</a>
            : h.findCare ? <button type="button" className="ay-rd-primary" onClick={() => h.findCare(it)}>Find care</button>
              : <a className="ay-rd-primary" href={HRSA_FIND_CARE} target="_blank" rel="noopener noreferrer">Find care<span className="sr-only"> (opens in a new tab)</span></a>}
        </span>
      );
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
      // The questions live on their own last card now (founder, Oct 27 13:51): this one only says goodbye.
      return (
        <span className="ay-rd-actions">
          {h.remindTomorrow && <button type="button" className="ay-rd-primary" onClick={h.remindTomorrow}>Remind me tomorrow</button>}
          {h.explore && <button type="button" className="ay-rd-link" onClick={h.explore}>Explore for you</button>}
          {!h.hasAsk && <button type="button" className="ay-rd-link" onClick={h.close}>Done</button>}
        </span>
      );
    case 'ask':
      // Ask ayna as the last card: 2 or 3 questions from the cards she just saw.
      // A tap opens Ask with that question; that is the way into Ask from here.
      return (<>
        <div className="ay-rd-asks">
          <ul>
            {card.followUps.map((f) => <li key={f.question}><button type="button" onClick={() => h.askFollowUp(f)}><span>{f.question}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button></li>)}
          </ul>
        </div>
        <span className="ay-rd-actions"><button type="button" className="ay-rd-link" onClick={h.close}>Done</button></span>
      </>);
    default:
      return null;
  }
}

/** The working behind a card: what it is based on, sources, Not useful. One tap away, never on the glance. */
function More({ card, h, onSeeData, onNotUseful, hide, dataAsk }) {
  const has = card.facts || card.changed || card.mayAffect || card.canDo || card.more || card.basisLine || card.reason || (card.footnote && card.kind !== 'community') || card.sources?.length || (DATA_KINDS.has(card.kind) && !card.protected && onNotUseful);
  if (!has || card.protected) return null;
  return (
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
      {card.reason && <p className="ay-rd-basis">{card.reason}</p>}
      {card.basisLine && <p className="ay-rd-basis">{card.basisLine}</p>}
      {card.footnote && card.kind !== 'community' && <p className="ay-rd-basis">{card.footnote}</p>}
      {(card.sources || []).length > 0 && <p className="ay-rd-basis">Source: {card.sources.map((s, k) => <span key={s.url}>{k ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>}
      {dataAsk && card.seeData && onSeeData && <button type="button" className="ay-rd-link" onClick={() => h.seeData(card.seeData)}>See data</button>}
      {DATA_KINDS.has(card.kind) && onNotUseful && <NotUsefulMenu onPick={(reason) => hide(card, reason)} />}
    </details>
  );
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
  const [theme] = useState(storyTheme);
  const rootRef = useRef(null);
  const [backTo] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const shown = cards.filter((c) => !hidden[c.key]);
  // The end-of-rundown questions become their own last card (founder, Oct 27 13:51):
  // finishing no longer opens Ask; a tap on a question does.
  const closingCard = shown.find((c) => c.kind === 'closing');
  const askCard = onAskFollowUp && closingCard?.followUps?.length ? { key: `ask:${closingCard.key}`, category: 'frame', kind: 'ask', kicker: '', title: 'Ask ayna about today', followUps: closingCard.followUps.slice(0, 3) } : null;
  const list = askCard ? [...shown, askCard] : shown;
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

  const close = useCallback(() => { onClose?.({ seen: i + 1, count: n }); try { backTo?.focus?.(); } catch { /* gone */ } }, [onClose, i, n, backTo]);
  const go = useCallback((d) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);
  const gest = useStoryGestures({ onPrev: () => go(-1), onNext: () => go(1), onClose: close });
  // In the app the product card has one-tap Buy, Save and Add: it waits for her.
  const auto = !rm && !paused && !gest.held && !suspended && card && !STILL.has(card.kind) && !card.check && !card.flowAsk && card.kind !== 'closing' && !(sheet && card.kind === 'match');

  useEffect(() => { if (card && card.kind !== 'ask') onSeen?.(card); }, [card, onSeen]);
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

  const hide = (c, reason) => { onNotUseful(c, reason); setHidden((s) => ({ ...s, [c.key]: true })); setMsg('Thanks. You will see less like this.'); };
  const h = {
    list,
    hasAsk: Boolean(askCard),
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
    seeData: (d) => { onAction?.(card, 'open'); onSeeData?.(d); },
    sheet,
    openSheet: sheet ? (p) => { onAction?.(card, 'open'); sheet.open(p); } : null,
    sheetSave: sheet ? (p) => { const was = sheet.isSaved(p.id); sheet.toggleSaved(p); if (!was) onAction?.(card, 'save'); } : null,
    sheetAdd: sheet ? (p) => { sheet.addToRoutine(p); onAction?.(card, 'add'); } : null,
    ask: onAsk ? (q) => { onAction?.(card, 'ask'); onAsk(q); } : null,
    explore: onExplore ? () => { onAction?.(card, 'open'); onExplore(); } : null,
    askFollowUp: onAskFollowUp ? (f) => { onAction?.(closingCard || card, 'ask'); onAskFollowUp(f); } : null,
    findCare: onFindCare,
    remindTomorrow: onRemindTomorrow ? async () => { setMsg(await onRemindTomorrow()); onAction?.(card, 'remind'); } : null,
  };
  const isData = DATA_KINDS.has(card.kind);
  const dataAsk = isData && onAsk ? (card.ask || card.followUps?.[0] || null) : null;
  const savable = card.kind === 'match' && !sheet ? card.match.product : null;
  // Two surfaces only (founder, Oct 27: calm, one theme): espresso for the frame,
  // data and safety cards (the Your data band), butter for the rest. Dark mode: both espresso.
  const surface = isData || card.category === 'safety' || ['opening', 'closing', 'ask'].includes(card.kind) ? 'is-espresso' : 'is-butter';
  const content = list.filter((c) => c.category !== 'frame').length;
  // One action on the glance: the card's own (Body), else Ask why / See data.
  const oneAction = isData && !card.check && !card.flowAsk
    ? (dataAsk ? <button type="button" className="ay-rd-primary" onClick={() => h.ask(dataAsk)}>Ask why</button>
      : card.seeData && onSeeData ? <button type="button" className="ay-rd-primary" onClick={() => h.seeData(card.seeData)}>See data</button> : null)
    : !isData && card.seeData && onSeeData ? <button type="button" className="ay-rd-primary" onClick={() => h.seeData(card.seeData)}>See data</button> : null;
  const art = isData ? <DataViz card={card} /> : <CardArt card={card} count={content} />;
  const safety = card.category === 'safety' || card.kind === 'care';

  const node = (
    <div ref={rootRef} className={`ay-rd ays ${surface} is-${card.kind}${rm ? ' is-still' : ''}`} data-theme={theme} role="dialog" aria-modal="true" aria-roledescription="story" aria-label={title} tabIndex={-1}>
      <div className="ay-rd-frame ays-frame">
        <StoryTop
          count={n} index={i} running={auto} ms={AUTO_MS} title={title}
          paused={paused} onPause={rm ? null : () => setPaused((v) => !v)} pauseLabels={['Pause', 'Play']}
          onClose={close} closeLabel="Close rundown"
        />
        <p className="sr-only" aria-live="polite">{`Card ${i + 1} of ${n}: ${card.title}`}</p>
        <div className="ay-rd-stage ays-stage" {...gest.bind}>
          <article className={`ay-rd-card ays-card${isData ? ' is-data' : ''}${art ? ' has-art' : ''}`} key={`${card.key}:${card.title}`} aria-labelledby={`ay-rd-t-${i}`}>
            {art && <div className="ays-visual">{art}</div>}
            <div className="ays-words">
              {/* The frame cards' labels ("Your daily rundown", "Done") repeat the bar: not shown. */}
              {card.kicker && card.category !== 'frame' && <p className="ay-rd-kicker ays-kicker">{card.kicker}</p>}
              <h2 id={`ay-rd-t-${i}`} className={`ay-rd-title ays-title${String(card.title || '').length > 56 ? ' is-long' : ''}`}>{card.title}</h2>
              {card.body && card.kind !== 'community' && <p className="ay-rd-body ays-body">{card.body}</p>}
              {/* Safety stays on the glance: the reason and the sources, never folded. */}
              {safety && card.reason && <p className="ay-rd-basis">{card.reason}</p>}
              {safety && (card.sources || []).length > 0 && <p className="ay-rd-basis">Source: {card.sources.map((s, k) => <span key={s.url}>{k ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>}
              {card.kind === 'community' && card.footnote && <p className="ay-rd-basis">{card.footnote}</p>}
            </div>
            <div className="ays-act">
              <Body card={card} h={h} done={done[card.key]} />
              {oneAction && <span className="ay-rd-actions">{oneAction}</span>}
              {!safety && <More card={card} h={h} onSeeData={onSeeData} onNotUseful={onNotUseful} hide={hide} dataAsk={dataAsk} />}
              {!isData && !['opening', 'closing', 'ask'].includes(card.kind) && ((savable && onSave) || (onAsk && card.ask) || (!card.protected && onNotUseful)) && (
                <div className="ay-rd-foot">
                  {savable && onSave && <button type="button" className="ay-rd-link" onClick={() => { onSave(savable); setMsg('Saved.'); onAction?.(card, 'save'); }}>Save</button>}
                  {/* A fact from her data: "Ask why" under it (team sync, Oct 25). */}
                  {onAsk && card.ask && <button type="button" className="ay-rd-link" onClick={() => h.ask(card.ask)}>{['change', 'pattern', 'data'].includes(card.category) ? 'Ask why' : 'Ask ayna about this'}</button>}
                  {/* One action + a quiet "…" (Today audit, issue 2): Not useful and its reasons live in the menu. */}
                  {!card.protected && onNotUseful && (
                    <ItemMenu label="More for this card" className="ay-rd-menu">
                      <NotUsefulMenu onPick={(reason) => hide(card, reason)} />
                    </ItemMenu>
                  )}
                </div>
              )}
              {msg && <p className="ay-rd-note" role="status">{msg}</p>}
            </div>
          </article>
        </div>
        <div className="ay-rd-nav ays-nav">
          <button type="button" className="ays-icon" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous card"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <span aria-hidden="true">{i + 1} of {n}</span>
          <button type="button" className="ays-icon" onClick={() => (i === n - 1 ? close() : go(1))} aria-label={i === n - 1 ? 'Finish' : 'Next card'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
    </div>
  );
  const host = (typeof document !== 'undefined' && (document.querySelector('.ayna-mobile') || document.querySelector('.app-container'))) || null;
  return host ? createPortal(node, host) : node;
}
