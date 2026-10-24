import TopicCover from './TopicCover.jsx';

/** Compact rows of her topics (website rail, app topics sheet). */
export function MyTopicRows({ topics = [], activeId = null, onOpen, limit = 6 }) {
  if (!topics.length) return null;
  return <ul className="ut-rows">{topics.slice(0, limit).map((t) => <li key={t.id}>
    <button type="button" className="ut-row" aria-current={activeId === t.id ? 'page' : undefined} onClick={() => onOpen?.(t)}>
      <TopicCover topic={t} size="chip" />
      <span className="ut-row__name">{t.name}</span>
      {t.status === 'pending' && <small className="ut-row__note">In review</small>}
    </button>
  </li>)}</ul>;
}

/** "Post in" for the composer: everyone (the main feed) or one of her topics. */
export function PostInPicker({ id, topics = [], value = '', onChange, className = '' }) {
  const usable = topics.filter((t) => t.status !== 'hidden');
  if (!usable.length) return null;
  return <label className={`ut-postin ${className}`} htmlFor={id}>
    <span>Post in</span>
    <select id={id} value={value || ''} onChange={(e) => onChange?.(e.target.value || null)}>
      <option value="">Community (everyone)</option>
      {usable.map((t) => <option key={t.id} value={t.id}>{t.name}{t.visibility === 'private' ? ' (invite only)' : t.visibility === 'friends' ? ' (friends)' : ''}</option>)}
    </select>
  </label>;
}
