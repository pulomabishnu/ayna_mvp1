import { useEffect, useState } from 'react';
import { OPEN_LOG_EVENT } from './openLog.js';
import { useToday } from '../../health/useToday.js';
import { STEP_FOR_FIELD } from '../../health/todayProfilePatch.js';
import { DailyCheckinCard } from '../you/DailyCheckin.jsx';
import { getProductById } from '../../data/catalog.js';
import { todayFixtureOn, makeTodayFixture } from '../../health/todayDevFixture.js';
import Rundown from '../rundown/Rundown.jsx';
import NotUsefulMenu from './NotUsefulMenu.jsx';
import ProfileAskCard from './ProfileAskCard.jsx';
import { askWhyFor } from '../../utils/askPrompts.js';
import '../../styles/today-feed.css';

// The fact first, then "Ask why" (team sync, Oct 25). Not on questions she
// answers here (check-ins, quick questions) or on a product list.
const ASK_WHY = new Set(['insight', 'option', 'care', 'follow_up']);
const askWhy = (item, onAsk) => (onAsk && ASK_WHY.has(item.type) ? () => onAsk(askWhyFor(item.title), { context: [item.title, item.reason].filter(Boolean).join(' ') }) : null);

/** Home's one-screen version of an item: the fact, its reason, and at most three actions. */
function CompactItem({ item, t, onAsk, onFindCare, onOpenFull }) {
  const kicker = item.type === 'care' ? CARE_KICKER[item.level] || 'Care' : KICKER[item.type] || '';
  const acts = item.actions || [];
  const tel = item.type === 'care' && item.level === 'urgent' && /911/.test(item.title);
  const why = askWhy(item, onAsk);
  return (
    <li className={`ay-today__item is-compact is-${item.tier} is-${item.type}${item.level ? ` is-${item.level}` : ''}`}>
      <p className="ay-today__kicker">{kicker}</p>
      <h3 className="ay-today__title">{item.title}</h3>
      {item.reason && <p className="ay-today__why">{item.reason}</p>}
      <div className="ay-today__actions">
        {tel && <a className="ay-today__primary" href="tel:911" onClick={() => t.opened(item)}>Call 911</a>}
        {!tel && acts.some((a) => a.id === 'get_care') && (onFindCare
          ? <button type="button" className="ay-today__primary" onClick={() => { t.opened(item); onFindCare(item); }}>Find care</button>
          : <a className="ay-today__primary" href={HRSA_FIND_CARE} target="_blank" rel="noopener noreferrer" onClick={() => t.opened(item)}>Find care<span className="sr-only"> (opens in a new tab)</span></a>)}
        {why && <button type="button" className="ay-today__text" onClick={why}>Ask why</button>}
        {onOpenFull && <button type="button" className="ay-today__text" onClick={() => onOpenFull(item)}>{acts.some((a) => /^(outcome|answer):|open_triage|show_options|try_this|open_check_in/.test(a.id)) ? 'Answer' : 'More'}</button>}
      </div>
    </li>
  );
}

/**
 * Today with ayna (master prompt sections 62, 135, 136): what decide()
 * chose for today, at the top of Today in the app and the website.
 * 1 to 3 items (safety and care can be more), or "Nothing unusual stands out
 * today". Then her daily log card.
 *
 * Every non-safety item has Useful and Not relevant. Safety and care items
 * cannot be dismissed. Products appear only as a 'products' item after she
 * taps Show options. Copy comes from the decision engine; this file adds
 * only labels for controls.
 */

const KICKER = {
  insight: 'A pattern in your logs',
  follow_up: 'Follow-up',
  check_in: 'Check-in',
  option: 'An option',
  ask: 'A quick question',
  products: 'Products',
};
const CARE_KICKER = { urgent: 'Get help now', prompt: 'Today', routine: 'Worth a visit' };
const PROTECTED = new Set(['safety', 'care']);
const HRSA_FIND_CARE = 'https://findahealthcenter.hrsa.gov/';
const REMINDABLE = new Set(['check_in', 'follow_up', 'option']);

function sourceName(src) {
  if (!src?.url) return null;
  try { return src.label || new URL(src.url).hostname.replace(/^www\./, ''); } catch { return src.label || null; }
}

function Sources({ basis }) {
  const list = (basis?.sources || []).filter((s) => s?.url);
  if (!list.length) return null;
  return (
    <p className="ay-today__src">
      Source{list.length > 1 ? 's' : ''}:{' '}
      {list.map((s, i) => <span key={s.url}>{i ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{sourceName(s)}<span className="sr-only"> (opens in a new tab)</span></a></span>)}
    </p>
  );
}

function TriageForm({ questions, onDone }) {
  // One answer per question: severity is a word; every other question is yes / no.
  const [ans, setAns] = useState({});
  const set = (field, v) => setAns((s) => ({ ...s, [field]: v }));
  const done = () => onDone({
    severity: ans.severity,
    flags: questions.filter((q) => q.field.startsWith('flags:') && ans[q.field] === true).map((q) => q.field.slice(6)),
    worsening: ans.worsening === true,
    persistent: ans.worsening === true,
  });
  return (
    <div className="ay-today__triage">
      {questions.map((q) => (
        <div key={q.field} className="ay-today__q" role="group" aria-label={q.text}>
          <span>{q.text}</span>
          <span className="ay-today__chips">
            {(q.options || ['yes', 'no']).map((o) => {
              const v = q.options ? o : o === 'yes';
              return <button key={o} type="button" className="ay-chip" aria-pressed={ans[q.field] === v} onClick={() => set(q.field, v)}>{o.charAt(0).toUpperCase() + o.slice(1)}</button>;
            })}
          </span>
        </div>
      ))}
      <button type="button" className="ay-today__primary" disabled={!ans.severity} onClick={done}>Done</button>
      {!ans.severity && <p className="ay-today__hint">Choose how strong the pain is to finish.</p>}
    </div>
  );
}

// "My information changed": which part of her profile to open.
const infoSection = (item) => (['pregnancy', 'breastfeeding'].includes(item.basis?.field) ? 'lifeStage' : item.basis?.field || 'support');

function Item({ item, t, onOpenProduct, onAsk, onEditAnswers, onFindCare, checkinId, onOpenLog }) {
  const protectedItem = PROTECTED.has(item.tier);
  const noteText = t.notes[item.id];
  const kicker = item.type === 'care' ? CARE_KICKER[item.level] || 'Care' : KICKER[item.type] || '';
  const acts = item.actions || [];
  const outcomeActs = acts.filter((a) => a.id.startsWith('outcome:'));
  const answerActs = acts.filter((a) => a.id.startsWith('answer:'));
  const triage = acts.find((a) => a.id === 'open_triage');
  const productsAct = acts.find((a) => a.id === 'see_products');
  const has = (id) => acts.some((a) => a.id === id);
  const tel = item.type === 'care' && item.level === 'urgent' && /911/.test(item.title);

  const answer = (a) => {
    const [, field, value] = a.id.split(':');
    if (value === 'add' || (value === 'yes' && ['allergies', 'medications', 'conditions'].includes(field))) { t.opened(item); onEditAnswers?.(STEP_FOR_FIELD[field] || field); return; }
    t.answerSafety(item, field, value);
  };

  return (
    <li className={`ay-today__item is-${item.tier} is-${item.type}${item.level ? ` is-${item.level}` : ''}`}>
      <p className="ay-today__kicker">{kicker}</p>
      <h3 className="ay-today__title">{item.title}</h3>
      {item.body && <p className="ay-today__body">{item.body}</p>}
      {item.reason && <p className="ay-today__why">{item.reason}</p>}
      <Sources basis={item.basis} />

      {triage && <TriageForm questions={triage.questions || []} onDone={(answers) => t.answerTriage(item, answers)} />}

      {outcomeActs.length > 0 && (
        <div className="ay-today__chips" role="group" aria-label="How did it go?">
          {outcomeActs.map((a) => <button key={a.id} type="button" className="ay-chip" onClick={() => t.recordOutcome(item, a.id.slice(8))}>{a.label}</button>)}
        </div>
      )}
      {answerActs.length > 0 && (
        <div className="ay-today__chips" role="group" aria-label={item.title}>
          {answerActs.map((a) => <button key={a.id} type="button" className="ay-chip" onClick={() => answer(a)}>{a.label}</button>)}
        </div>
      )}
      {productsAct && (
        <ul className="ay-today__products">
          {productsAct.productIds.map((id) => {
            const p = getProductById(id);
            return p ? <li key={id}><button type="button" onClick={() => { t.opened(item); onOpenProduct?.(p); }}><span>{p.name}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button></li> : null;
          })}
        </ul>
      )}

      <div className="ay-today__actions">
        {tel && <a className="ay-today__primary" href="tel:911" onClick={() => t.opened(item)}>Call 911</a>}
        {!tel && has('get_care') && (onFindCare
          ? <button type="button" className="ay-today__primary" onClick={() => { t.opened(item); onFindCare(item); }}>Find care</button>
          : <a className="ay-today__primary" href={HRSA_FIND_CARE} target="_blank" rel="noopener noreferrer" onClick={() => t.opened(item)}>Find care<span className="sr-only"> (opens in a new tab)</span></a>)}
        {askWhy(item, onAsk) && <button type="button" className="ay-today__text" onClick={askWhy(item, onAsk)}>Ask why</button>}
        {has('care_summary') && onAsk && <button type="button" className="ay-today__text" onClick={() => { t.opened(item); onAsk('Help me write a short summary of my pain to bring to a doctor visit.'); }}>Make a summary for my visit</button>}
        {has('open_check_in') && <a className="ay-today__primary" href={`#${checkinId}`} onClick={(e) => { e.preventDefault(); t.opened(item); onOpenLog?.(); requestAnimationFrame(() => document.getElementById(checkinId)?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }}>Check in</a>}
        {acts.filter((a) => a.id === 'show_options').map((a) => <button key={a.id} type="button" className="ay-today__primary" onClick={() => t.showOptions(item, a.need)}>Show options</button>)}
        {acts.filter((a) => a.id === 'try_this').map((a) => <button key={a.id} type="button" className="ay-today__primary" onClick={() => t.startTry(item, a)}>Try this</button>)}
        {!protectedItem && REMINDABLE.has(item.type) && <button type="button" className="ay-today__text" onClick={() => t.remindTonight(item)}>Remind me tonight</button>}
        {!protectedItem && !noteText && <button type="button" className="ay-today__text" onClick={() => t.useful(item)}>Useful</button>}
        {!protectedItem && <NotUsefulMenu className="ay-today__text" onPick={(reason) => { t.notUseful(item, reason); if (reason === 'info_changed') onEditAnswers?.(infoSection(item)); }} />}
      </div>
      {noteText && <p className="ay-today__note" role="status">{noteText}</p>}
    </li>
  );
}

/**
 * @param {{ variant: 'app'|'web', userId, intake, healthRows, cycle, hormonalBC, products, onOpenProduct, onAsk, onEditAnswers, onFindCare }} props
 */
export default function TodayFeed({ variant = 'app', userId = null, intake = null, healthRows = [], cycle = null, hormonalBC = false, products = [], onOpenProduct, onAsk, onEditAnswers, onFindCare, onSaveToProfile = null,
  saved = [], community = [], onWhyMatch, onToggleSaved, onCompare, onOpenRead, onExplore, matchOpts = undefined, healthProfile = null, onSetUp, moreHeading = true, showHead = true,
  // The app's ayna home: a Community card's post, and the hand-off to the chat when the rundown ends.
  onOpenPost, onRundownFinish,
  // The app's Home (team sync, Oct 25): one phone screen. The Rundown card and
  // 1 to 3 things for today, each the fact, "Ask why" and one way in;
  // everything else (answering, the log, saves) is on the full dashboard.
  compact = false, onOpenFull = null,
}) {
  // DEV only (?fixture=today): sample logs and tries, dropped from production builds.
  const [fixture] = useState(() => (import.meta.env.DEV && todayFixtureOn() ? makeTodayFixture() : null));
  const t = useToday({ userId, intake: fixture?.intake || intake, healthRows: fixture?.healthRows || healthRows, cycle, hormonalBC, products, fixture, onSaveToProfile, onEditStep: onEditAnswers ? (step) => onEditAnswers(step) : null });
  const { items } = t.decision;
  const checkinId = `ay-today-log-${variant}`;
  // The check-in item and the full log are one action: while the item is on
  // screen, the log opens from its "Check in" instead of also sitting below it.
  const checkInItem = items.some((it) => (it.actions || []).some((a) => a.id === 'open_check_in'));
  const [logOpen, setLogOpen] = useState(false);
  const showLog = !checkInItem || logOpen;
  useEffect(() => {
    const open = () => setLogOpen(true);
    window.addEventListener(OPEN_LOG_EVENT, open);
    return () => window.removeEventListener(OPEN_LOG_EVENT, open);
  }, []);
  return (
    <section className={`ay-today is-${variant}${compact ? ' is-compact' : ''}`} aria-labelledby={`ay-today-h-${variant}`}>
      <div className={compact || !showHead ? 'sr-only' : 'ay-today__head'}>
        <h2 id={`ay-today-h-${variant}`}>Today with ayna</h2>
      </div>
      <Rundown
        t={t}
        userId={userId}
        intake={fixture?.intake || intake}
        products={products}
        matchOpts={matchOpts}
        healthProfile={healthProfile}
        saved={saved}
        community={community}
        onAsk={onAsk}
        onOpenProduct={onOpenProduct}
        onWhyMatch={onWhyMatch}
        onToggleSaved={onToggleSaved}
        onCompare={onCompare}
        onOpenRead={onOpenRead}
        onExplore={onExplore}
        onFindCare={onFindCare}
        onEditAnswers={onEditAnswers}
        onSetUp={onSetUp}
        onOpenPost={onOpenPost}
        onFinish={onRundownFinish}
        variant={variant}
        compact={compact}
        onSeeData={(d) => { try { window.dispatchEvent(new CustomEvent('ayna:health-tab', { detail: { tab: d?.tab } })); } catch { /* old browser */ } }}
      />
      {compact && (items.length > 0
        ? <ul className="ay-today__list is-compact" data-tour="today-things">
          {/* Safety and care always show; the rest stop at three things. */}
          {items.filter((it, i) => PROTECTED.has(it.tier) || i < 3).map((item) => <CompactItem key={item.id} item={item} t={t} onAsk={onAsk} onFindCare={onFindCare} onOpenFull={onOpenFull} />)}
        </ul>
        : <p className="ay-today__empty">{t.decision.empty}</p>)}
      {!compact && (items.length > 0
        ? <ul className="ay-today__list" data-tour="today-things">
          {items.map((item) => <Item key={item.id} item={item} t={t} onOpenProduct={onOpenProduct} onAsk={onAsk} onEditAnswers={onEditAnswers} onFindCare={onFindCare} checkinId={checkinId} onOpenLog={() => setLogOpen(true)} />)}
          {/* One skipped setup question at a time (profileCompleteness.nextProgressiveAsk). */}
          {items.length < 3 && !items.some((i) => i.type === 'ask' || i.level === 'urgent') && <ProfileAskCard intake={intake} today={t.today} onAnswer={onEditAnswers} />}
        </ul>
        : <>
          <p className="ay-today__empty">{t.decision.empty}</p>
          <ProfileAskCard asList intake={intake} today={t.today} onAnswer={onEditAnswers} />
        </>)}
      {!compact && (t.pendingProfileSaves.length > 0 || t.notes['save:done']) && (
        <div className="ay-today__save" role="group" aria-label="Save to your health profile">
          {t.pendingProfileSaves.map((p) => (
            <div key={p.field} className="ay-today__saverow">
              <p>{p.text} Kept on this device for now.</p>
              <span className="ay-today__actions">
                <button type="button" className="ay-today__primary" onClick={() => t.saveAnswerToProfile(p.field)}>{p.kind === 'direct' ? 'Save to your health profile' : 'Update your health profile'}</button>
                <button type="button" className="ay-today__text" onClick={() => t.keepOnDevice(p.field)}>Keep on this device</button>
              </span>
              {t.notes[`save:${p.field}`] && <p className="ay-today__note" role="status">{t.notes[`save:${p.field}`]}</p>}
            </div>
          ))}
          {t.notes['save:done'] && <p className="ay-today__note" role="status">{t.notes['save:done']}</p>}
        </div>
      )}
      {showLog && !compact && <div id={checkinId} className="ay-today__log">
        <DailyCheckinCard variant={variant} log={t.log} save={t.saveLog} saveState={t.saveState} today={t.today} headingId={`${checkinId}-h`} title="Your log" noCycle={Boolean(t.postCycle)} />
      </div>}
      {/* The top of Today ends here (rundown, 1 to 3 items, her log); the rest is below this line. */}
      {moreHeading && !compact && <h2 className="ay-today__more" id={`ay-today-more-${variant}`}>More for you</h2>}
    </section>
  );
}
