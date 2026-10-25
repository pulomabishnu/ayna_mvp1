import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildRundown } from './buildRundown.js';
import { buildWeeklyRecap } from './weeklyRecap.js';
import RundownStory from './RundownStory.jsx';
import { markCardSeen, markNotUseful, markPeriodAnswer, markRundownViewed, markWeeklySeen, readRundownMemory, setRundownOwner } from './rundownStore.js';
import { autoLaunchDecision, listenForExternalOpens, openedExternally, urlIsDeepLink } from './autoLaunch.js';
import { setTodayAskContext } from '../../utils/askToday.js';
import { getAskHealthPref } from '../../health/askHealthPref.js';
import { getProductMatchDetailsForProduct, getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';
import { whyLine } from '../../utils/whyLine.js';
import { evidenceLevel } from '../pdp/evidenceLevel.js';
import { addDays } from '../../health/dailyLog.js';
import { trackToday } from '../../health/todayAnalytics.js';
import { localAt, RUNDOWN_HOUR, scheduleTodayReminder } from '../../health/todayReminders.js';
import { rememberedOnDevice, withoutRemembered } from '../../health/remembered.js';
import { withoutMedicines } from '../../health/medicineProduct.js';
import { readRoutinePrefs } from '../../health/routines.js';
import { onboardingDoneAt, onboardingJustFinished } from '../../health/onboardingSignal.js';
import './rundown.css';
import { MarkSticker } from '../personality/DS.jsx';

const REMIND_TEXT = {
  scheduled: 'We will send “Your daily rundown is ready.” tomorrow morning, if notifications are on in the ayna app.',
  signed_out: 'Sign in to get a reminder on your phone.',
  offline: 'You are offline, so we could not set the reminder.',
  error: 'We could not set the reminder. Try again in a moment.',
};

/**
 * Your Daily Rundown hero on Today, the story it opens, and the weekly recap
 * entry (UX spec 7 to 10). Self-contained: Today hands in what it already
 * has (the useToday result `t`, her answers, products, saved items) and the
 * handlers it can offer. A card with no handler simply has no button for it.
 */
export default function Rundown({
  t, userId = null, intake = null, products = [], saved = [], community = [], variant = 'app', matchOpts = undefined, healthProfile = null,
  onAsk, onSeeData, onOpenProduct, onWhyMatch, onToggleSaved, onCompare, onOpenRead, onExplore, onFindCare, onEditAnswers,
  // No profile yet: the Rundown card still leads Today and says how to get one.
  onSetUp,
  // A Community card's "Read the post".
  onOpenPost,
  // The app (founder, Oct 24 20:12): when the daily rundown ends or she exits,
  // onFinish({ starters, toChat }) hands the end-of-rundown questions to the
  // ayna chat as its starters; toChat is false when she left for something
  // else (a read, a post), so only the starters carry over.
  onFinish,
  // The app's one-screen Home: the card only (the weekly recap is on the full dashboard).
  compact = false,
}) {
  const [memory, setMemory] = useState(() => { setRundownOwner(userId); return readRundownMemory(); });
  const [open, setOpen] = useState(null); // 'daily' | 'weekly' | null
  const catalogReady = useCatalogReady();
  const today = t.today;

  // Her matches, scored by the one engine (no other source of a percent),
  // with the same inputs as Shop and the product page (health profile,
  // history), so the Rundown never shows a different number. Not what she
  // already has, said no to, tried without luck, saved (Saved has its own
  // card), or accessories (team direction 65; src/health/remembered.js).
  const matches = useMemo(() => {
    if (!intake || !catalogReady) return [];
    const seen = new Set();
    const remembered = rememberedOnDevice({ tries: t.tries, saved: Object.fromEntries((saved || []).filter((p) => p?.id).map((p) => [p.id, true])), prefs: readRoutinePrefs() });
    // No medicine as a Rundown pick (src/health/medicineProduct.js).
    return withoutMedicines(withoutRemembered(products, remembered)).filter((p) => p?.id && !seen.has(p.id) && seen.add(p.id)).map((product) => {
      let details = null;
      try { details = getProductMatchDetailsForProduct(product, intake, healthProfile, matchOpts); } catch { details = null; }
      if (!details || details.matchStatus !== 'scored' || !Number.isFinite(details.percent)) return null;
      if (details.recommendable === false || ['dismissed', 'tried', 'not_for_me'].includes(details.history)) return null;
      // Held back for safety: never a Rundown match (founder decision 3).
      if (details.eligibility === 'restricted' || details.restricted === true) return null;
      return { product, percent: details.percent, needId: details.needId, needSignal: details.needSignal || null, why: whyLine(product, details), evidence: evidenceLevel(product).level };
    }).filter(Boolean);
  }, [products, intake, catalogReady, t.tries, saved, healthProfile, matchOpts]);

  // Her goals in her own words, for the match card's title ("A match for your hot flashes goal").
  const needLabels = useMemo(() => {
    if (!intake || !catalogReady) return {};
    try { return Object.fromEntries(getSelectedNeeds(intake).map((n) => [n.id, n.phrase || n.label || ''])); } catch { return {}; }
  }, [intake, catalogReady]);
  const daily = useMemo(() => buildRundown({
    today, decision: t.decision, patterns: t.patterns, log: t.log, tries: t.tries, healthRows: t.healthRows,
    matches, saved, reads: Boolean(onOpenRead), community, memory, hasProfile: Boolean(intake), needLabels,
    hormonalBC: Boolean(t.hormonalBC), postCycle: Boolean(t.postCycle), pregnant: Boolean(t.pregnant),
  }), [today, t.decision, t.patterns, t.log, t.tries, t.healthRows, matches, saved, onOpenRead, community, memory, intake, needLabels, t.hormonalBC, t.postCycle, t.pregnant]);
  const weekly = useMemo(() => buildWeeklyRecap({ today, log: t.log, tries: t.tries, patterns: t.patterns, saved }), [today, t.log, t.tries, t.patterns, saved]);
  const cards = open === 'weekly' ? weekly.cards : daily.cards;

  const [highlight, setHighlight] = useState(false);
  const start = (kind, { auto = false } = {}) => {
    const list = kind === 'weekly' ? weekly.cards : daily.cards;
    trackToday('rundown_opened', { kind, count: list.length, categories: [...new Set(list.map((c) => c.category))] });
    if (kind === 'weekly') markWeeklySeen(today);
    else setMemory(markRundownViewed(today, { auto }));
    setHighlight(false);
    setOpen(kind);
  };

  // Ask ayna reads today's picture from here (on this device only; see utils/askToday.js).
  useEffect(() => {
    const y = addDays(today, -1);
    const has = (e) => Boolean(e && ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'].some((f) => e[f] != null));
    const content = daily.cards.filter((c) => c.category !== 'frame');
    const weekChanges = weekly.cards.find((c) => c.key === 'weekly:changes')?.lines || [];
    setTodayAskContext({
      today,
      signals: {
        hasRundown: content.length > 0,
        hasYesterdayLog: has(t.log?.[y]),
        lowSleepOrEnergy: [t.log?.[today], t.log?.[y]].some((e) => e?.sleep === 1 || e?.mood === 1) || content.some((c) => c.explain?.kind === 'sleep'),
        hasRecentChanges: weekChanges.length > 0 || content.some((c) => c.category === 'change'),
        hasHistory: (t.tries || []).some((x) => x?.outcome),
      },
      focus: (t.decision?.items || []).map((it) => ({ title: it.title, reason: it.reason })),
      rundown: content.map(({ category, title, changed, canDo, explain }) => ({ category, title, changed, canDo, explain })),
      log: { today: t.log?.[today] || null, yesterday: t.log?.[y] || null },
      recent: weekChanges,
    });
  }, [today, daily.cards, weekly.cards, t.log, t.tries, t.decision]);

  // Auto-launch: the first open of the day at or after 8 (autoLaunch.js).
  const hasContent = daily.cards.length > 0;
  useEffect(() => {
    listenForExternalOpens();
    const check = () => {
      if (document.visibilityState === 'hidden') return;
      const mem = readRundownMemory();
      let reduced = false;
      try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduced = false; }
      // Never right after setup: the onboarding signal when this device has one
      // (set on "See my Today"), else the old guess from empty history.
      const firstTime = onboardingDoneAt()
        ? onboardingJustFinished({ hours: 12 })
        : !Object.keys(mem.shown || {}).length && !Object.keys(t.log || {}).some((d) => d < today);
      const decision = autoLaunchDecision({
        now: new Date(), today, surface: variant, hasContent, memory: mem, reducedMotion: reduced,
        externalOpen: openedExternally() || urlIsDeepLink(), firstTime,
        dialogOpen: Boolean(document.querySelector('[aria-modal="true"]')),
      });
      if (decision === 'open') {
        trackToday('rundown_opened', { kind: 'daily', count: daily.cards.length, categories: [...new Set(daily.cards.map((c) => c.category))] });
        setMemory(markRundownViewed(today, { auto: true }));
        setOpen('daily');
      }
      else if (decision === 'highlight') setHighlight(true);
    };
    const id = setTimeout(check, 600); // after the screen settles (and any deep link has landed)
    document.addEventListener('visibilitychange', check);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', check); };
  }, [today, variant, hasContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // End of the rundown: Ask about a card she just saw. Answers that need
  // her health data only get it when Ask's health switch is on.
  const askExtra = (f) => {
    const card = daily.cards.find((c) => c.key === f.cardKey);
    const text = card ? [card.title, card.changed, card.canDo].filter(Boolean).join(' ') : '';
    const context = text ? `From her Daily Rundown today: ${text}` : '';
    return { usesHealth: Boolean(context), buildContext: (on) => (on ? context : ''), context: getAskHealthPref()?.on ? context : '' };
  };
  // The closing card's questions, as the chat's starters for this session.
  const starters = () => (daily.cards.find((c) => c.kind === 'closing')?.followUps || []).map((f) => ({ question: f.question, cardKey: f.cardKey, ...askExtra(f) }));
  const finish = (toChat) => { if (open === 'daily' && onFinish) onFinish({ starters: starters(), toChat }); };
  const askFollowUp = onAsk ? (f) => {
    close({ seen: daily.cards.length, count: daily.cards.length });
    finish(false);
    onAsk(f.question, askExtra(f));
  } : undefined;
  const onSeen = useCallback((card) => { if (open === 'daily') markCardSeen(card, today); }, [open, today]);
  const onAction = (card, action) => trackToday('rundown_card_action', { kind: open, category: card.category, action });
  const close = ({ seen, count }) => {
    trackToday('rundown_closed', { kind: open, seen, count });
    setOpen(null);
    setMemory(readRundownMemory());
  };

  if (!daily.cards.length && !weekly.cards.length) {
    if (intake || !onSetUp) return null;
    return (
      <section className={`ay-rd-hero${compact ? ' is-compact' : ''}`} aria-labelledby="ay-rd-hero-h">
        <div className="ay-rd-hero__card is-setup">
          <p className="ay-rd-hero__kicker">Today</p>
          <h2 id="ay-rd-hero-h">Your Daily Rundown</h2>
          <p>Create your health profile and this becomes 60 seconds on what matters for your health each day, with the reason for each thing.</p>
          <button type="button" className="ay-rd-hero__go" onClick={onSetUp}>Create your health profile</button>
        </div>
      </section>
    );
  }
  return (
    <section className={`ay-rd-hero${compact ? ' is-compact' : ''}`} aria-labelledby="ay-rd-hero-h">
      {daily.cards.length > 0 && (
        <div className={`ay-rd-hero__card${highlight ? ' is-new' : ''}`} data-tour="rundown-card">
          <MarkSticker name="sparkle" tone="pink" className="ay-rd-hero__sticker" />
          {highlight && <p className="ay-rd-hero__new">Ready for today</p>}
          <p className="ay-rd-hero__kicker">{daily.cards.some((c) => c.protected) ? 'Something important today' : 'Today'}</p>
          <h2 id="ay-rd-hero-h">Your Daily Rundown</h2>
          <p>60 seconds. The things worth knowing about your health today.</p>
          {/* A peek at what is inside: the real card labels, in story order. */}
          {daily.cards.filter((c) => c.category !== 'frame').length > 0 && (
            <ol className="ay-rd-hero__inside" aria-label="Inside today's rundown">
              {daily.cards.filter((c) => c.category !== 'frame').slice(0, 4).map((c) => <li key={c.key} className={`is-${c.category}`}>{c.kicker}</li>)}
            </ol>
          )}
          <button type="button" className="ay-rd-hero__go" onClick={() => start('daily')}>Start rundown</button>
        </div>
      )}
      {weekly.cards.length > 0 && !compact && (
        <button type="button" className="ay-rd-hero__week" onClick={() => start('weekly')}>
          <span><b>Your week on ayna</b><small>Here is what changed.</small></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
      {open && cards.length > 0 && (
        <RundownStory
          cards={cards}
          title={open === 'weekly' ? 'Your week on ayna' : 'Your daily rundown'}
          onClose={(s) => { close(s); finish(true); }}
          onSeen={onSeen}
          onAction={onAction}
          onCheckIn={(field, value) => t.saveLog(today, { [field]: value })}
          onPeriodAnswer={(answer) => {
            // "No, ended yesterday" is a real log answer (no flow today); "Yes"
            // and "Not sure" are kept for today on this device (rundownStore.js).
            if (answer === 'ended') t.saveLog(today, { flow: 'none' });
            setMemory(markPeriodAnswer(today, answer));
          }}
          onOutcome={(item, outcome) => t.recordOutcome(item, outcome)}
          onAsk={onAsk ? (q) => { close({ seen: 0, count: cards.length }); finish(false); onAsk(q); } : undefined}
          onAskFollowUp={open === 'daily' ? askFollowUp : undefined}
          onSeeData={onSeeData ? (d) => { close({ seen: 0, count: cards.length }); onSeeData(d); } : undefined}
          onWhyMatch={onWhyMatch || onOpenProduct ? (p) => { close({ seen: 0, count: cards.length }); (onWhyMatch || onOpenProduct)(p); } : undefined}
          onSave={onToggleSaved ? (p) => onToggleSaved(p) : undefined}
          onUnsave={onToggleSaved ? (p) => onToggleSaved(p) : undefined}
          onCompare={onCompare ? (p) => { close({ seen: 0, count: cards.length }); onCompare(p); } : undefined}
          onOpenRead={onOpenRead ? (id) => { close({ seen: 0, count: cards.length }); finish(false); onOpenRead(id); } : undefined}
          onOpenPost={onOpenPost ? (id) => { close({ seen: 0, count: cards.length }); finish(false); onOpenPost(id); } : undefined}
          onExplore={onExplore ? () => { close({ seen: 0, count: cards.length }); onExplore(); } : undefined}
          onFindCare={onFindCare}
          onNotUseful={(card, reason) => {
            setMemory(markNotUseful(card, reason, today));
            trackToday('rundown_card_action', { kind: open, category: card.category, action: 'not_useful' });
            if (reason === 'info_changed') onEditAnswers?.();
          }}
          onRemindTomorrow={open === 'daily' ? async () => REMIND_TEXT[await scheduleTodayReminder({ kind: 'rundown', sendAt: localAt(addDays(today, 1), RUNDOWN_HOUR) })] || REMIND_TEXT.error : undefined}
        />
      )}
    </section>
  );
}
