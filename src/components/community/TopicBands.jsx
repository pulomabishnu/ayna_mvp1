import { topicLabel } from '../../utils/community/topics.js';
import { Chip } from '../ui/ay';
import '../../styles/unique-b.css';

/**
 * Community topics as one row of plain chips (Community critique, Oct 27):
 * My topics, All, up to three topics she follows, then the Topics sheet.
 * Colour only shows which one is on (espresso); no rotating tones, no
 * arrows. Same filter as before (scope). The row scrolls sideways
 * ("is-onerow", unique-b.css) so it never stacks.
 * max: how many followed topics show before "More topics".
 */
const PLUS = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;

export default function TopicBands({ followed = [], scope = 'all', onScope, onEdit, editLabel = null, max = 99, suggest = [], onFollow = null, className = '' }) {
  // Following nothing yet: a few topics to follow in one tap (the same follow as the Topics sheet).
  const offers = !followed.length && onFollow ? suggest.slice(0, 3) : [];
  // At most five filters at the top (advisor, Oct 26): the rest live in the Topics sheet.
  max = Math.min(max, followed.length ? 3 : 0);
  const items = [
    { key: 'all', label: 'All' },
    ...(followed.length ? [{ key: 'mine', label: 'My topics' }] : []),
    ...followed.slice(0, max).map((k) => ({ key: k, label: topicLabel(k) })),
  ];
  const more = followed.length > max;
  return (
    <div className={`ub-topics ay-topic-chips ${className}`.trim()} role="group" aria-label="Filter posts by topic">
      {items.map((t) => {
        const on = scope === t.key;
        return <Chip key={t.key} selected={on} onClick={() => onScope?.(on && t.key !== 'all' && t.key !== 'mine' ? 'all' : t.key)}>{t.label}</Chip>;
      })}
      {offers.map((k) => (
        <Chip key={k} icon={PLUS} aria-label={`Follow ${topicLabel(k)}`} onClick={() => { onFollow(k); onScope?.(k); }}>{topicLabel(k)}</Chip>
      ))}
      {onEdit && <Chip className="is-edit" onClick={onEdit}>{editLabel || (more ? 'More topics' : followed.length ? 'Edit topics' : 'Follow topics')}</Chip>}
    </div>
  );
}
