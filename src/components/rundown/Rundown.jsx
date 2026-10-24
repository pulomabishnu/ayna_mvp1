import { useCallback, useMemo, useState } from 'react';
import { buildRundown } from './buildRundown.js';
import { buildWeeklyRecap } from './weeklyRecap.js';
import RundownStory from './RundownStory.jsx';
import { markCardSeen, markNotUseful, markWeeklySeen, readRundownMemory, setRundownOwner } from './rundownStore.js';
import { getProductMatchDetailsForProduct, useCatalogReady } from '../../data/catalog.js';
import { whyLine } from '../../utils/whyLine.js';
import { evidenceLevel } from '../pdp/evidenceLevel.js';
import { addDays } from '../../health/dailyLog.js';
import { trackToday } from '../../health/todayAnalytics.js';
import { localAt, RUNDOWN_HOUR, scheduleTodayReminder } from '../../health/todayReminders.js';
import './rundown.css';

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
  t, userId = null, intake = null, products = [], saved = [], community = [], matchOpts = undefined, healthProfile = null,
  onAsk, onOpenProduct, onWhyMatch, onToggleSaved, onCompare, onOpenRead, onExplore, onFindCare, onEditAnswers,
}) {
  const [memory, setMemory] = useState(() => { setRundownOwner(userId); return readRundownMemory(); });
  const [open, setOpen] = useState(null); // 'daily' | 'weekly' | null
  const catalogReady = useCatalogReady();
  const today = t.today;

  // Her matches, scored by the one engine (no other source of a percent),
  // with the same inputs as Shop and the product page (health profile,
  // history), so the Rundown never shows a different number. Products she
  // said are not relevant, and accessories, are not put forward.
  const matches = useMemo(() => {
    if (!intake || !catalogReady) return [];
    const seen = new Set();
    return products.filter((p) => p?.id && !seen.has(p.id) && seen.add(p.id)).map((product) => {
      let details = null;
      try { details = getProductMatchDetailsForProduct(product, intake, healthProfile, matchOpts); } catch { details = null; }
      if (!details || details.matchStatus !== 'scored' || !Number.isFinite(details.percent)) return null;
      if (details.recommendable === false || ['dismissed', 'tried', 'not_for_me'].includes(details.history)) return null;
      return { product, percent: details.percent, needId: details.needId, needSignal: details.needSignal || null, why: whyLine(product, details), evidence: evidenceLevel(product).level };
    }).filter(Boolean);
  }, [products, intake, catalogReady, healthProfile, matchOpts]);

  const daily = useMemo(() => buildRundown({
    today, decision: t.decision, patterns: t.patterns, log: t.log, tries: t.tries, healthRows: t.healthRows,
    matches, saved, reads: Boolean(onOpenRead), community, memory,
  }), [today, t.decision, t.patterns, t.log, t.tries, t.healthRows, matches, saved, onOpenRead, community, memory]);
  const weekly = useMemo(() => buildWeeklyRecap({ today, log: t.log, tries: t.tries, patterns: t.patterns, saved }), [today, t.log, t.tries, t.patterns, saved]);
  const cards = open === 'weekly' ? weekly.cards : daily.cards;

  const start = (kind) => {
    const list = kind === 'weekly' ? weekly.cards : daily.cards;
    trackToday('rundown_opened', { kind, count: list.length, categories: [...new Set(list.map((c) => c.category))] });
    if (kind === 'weekly') markWeeklySeen(today);
    setOpen(kind);
  };
  const onSeen = useCallback((card) => { if (open === 'daily') markCardSeen(card, today); }, [open, today]);
  const onAction = (card, action) => trackToday('rundown_card_action', { kind: open, category: card.category, action });
  const close = ({ seen, count }) => {
    trackToday('rundown_closed', { kind: open, seen, count });
    setOpen(null);
    setMemory(readRundownMemory());
  };

  if (!daily.cards.length && !weekly.cards.length) return null;
  return (
    <section className="ay-rd-hero" aria-labelledby="ay-rd-hero-h">
      {daily.cards.length > 0 && (
        <div className="ay-rd-hero__card">
          <p className="ay-rd-hero__kicker">{daily.cards.some((c) => c.protected) ? 'Something important today' : 'Today'}</p>
          <h2 id="ay-rd-hero-h">Your Daily Rundown</h2>
          <p>60 seconds. The things worth knowing about your health today.</p>
          <button type="button" className="ay-rd-hero__go" onClick={() => start('daily')}>Start rundown</button>
        </div>
      )}
      {weekly.cards.length > 0 && (
        <button type="button" className="ay-rd-hero__week" onClick={() => start('weekly')}>
          <span><b>Your week on ayna</b><small>Here is what changed.</small></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
      {open && cards.length > 0 && (
        <RundownStory
          cards={cards}
          title={open === 'weekly' ? 'Your week on ayna' : 'Your daily rundown'}
          onClose={close}
          onSeen={onSeen}
          onAction={onAction}
          onCheckIn={(field, value) => t.saveLog(today, { [field]: value })}
          onOutcome={(item, outcome) => t.recordOutcome(item, outcome)}
          onAsk={onAsk ? (q) => { close({ seen: 0, count: cards.length }); onAsk(q); } : undefined}
          onWhyMatch={onWhyMatch || onOpenProduct ? (p) => { close({ seen: 0, count: cards.length }); (onWhyMatch || onOpenProduct)(p); } : undefined}
          onSave={onToggleSaved ? (p) => onToggleSaved(p) : undefined}
          onUnsave={onToggleSaved ? (p) => onToggleSaved(p) : undefined}
          onCompare={onCompare ? (p) => { close({ seen: 0, count: cards.length }); onCompare(p); } : undefined}
          onOpenRead={onOpenRead ? (id) => { close({ seen: 0, count: cards.length }); onOpenRead(id); } : undefined}
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
