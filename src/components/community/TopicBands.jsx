import { topicLabel } from '../../utils/community/topics.js';
import '../../styles/unique-b.css';

/**
 * Community topics as colour blocks (uniqueness pass; cb919aa4 stacked colour
 * bars, the masterclass decks): one chunky block per topic she follows, plus
 * All and My topics, tones taking turns (pink, butter, butter-deep); the
 * selected one is espresso with a tick. Same filter as before (scope).
 * max: how many topic blocks show before the "More topics" block (app).
 */
const ARROW = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>;
const TICK = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
const TONES = ['pink', 'butter', 'deep'];

export default function TopicBands({ followed = [], scope = 'all', onScope, onEdit, editLabel = null, max = 99, suggest = [], onFollow = null, className = '' }) {
  // Following nothing yet: a few topics to follow in one tap (the same follow as the Topics sheet).
  const offers = !followed.length && onFollow ? suggest.slice(0, 3) : [];
  // At most five filters at the top (advisor, Oct 26): the rest live in the Topics sheet.
  max = Math.min(max, followed.length ? 3 : 0);
  const items = [
    ...(followed.length ? [{ key: 'mine', label: 'My topics' }] : []),
    { key: 'all', label: 'All' },
    ...followed.slice(0, max).map((k) => ({ key: k, label: topicLabel(k) })),
  ];
  const more = followed.length > max;
  return (
    <div className={`ub-topics ${className}`.trim()} role="group" aria-label="Filter posts by topic">
      {items.map((t, i) => {
        const on = scope === t.key;
        return (
          <button key={t.key} type="button" className={`ub-topic is-${on ? 'on' : TONES[i % TONES.length]}`} aria-pressed={on} onClick={() => onScope?.(on && t.key !== 'all' && t.key !== 'mine' ? 'mine' : t.key)}>
            <span>{t.label}</span>{on ? TICK : ARROW}
          </button>
        );
      })}
      {offers.map((k, i) => (
        <button key={k} type="button" className={`ub-topic is-${TONES[(i + 1) % TONES.length]}`} aria-label={`Follow ${topicLabel(k)}`} onClick={() => { onFollow(k); onScope?.(k); }}>
          <span>{topicLabel(k)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      ))}
      {onEdit && <button type="button" className="ub-topic is-edit" onClick={onEdit}><span>{editLabel || (more ? 'More topics' : followed.length ? 'Edit topics' : 'Follow topics')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>}
    </div>
  );
}
