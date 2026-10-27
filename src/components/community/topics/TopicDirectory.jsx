import { useEffect, useState } from 'react';
import TopicCover from './TopicCover.jsx';
import { listUserTopics, joinUserTopic, memberCountLabel, topicByline, topicError } from '../../../utils/community/userTopics.js';

const SECTIONS = [['browse', 'Popular'], ['friends', 'Friends’'], ['mine', 'Yours']];

/**
 * Topics started by members. Underline tabs (parallel views), a grid of
 * cover cards, Join right on the card. Curated ayna topics stay where they
 * are (topic chips); this is the members' shelf next to them.
 */
export default function TopicDirectory({ variant = 'web', supabase, user, onOpen, onCreate, onSuggest, onRequireAuth, refreshKey = 0, onTopicsChanged }) {
  const [section, setSection] = useState('browse');
  const [rows, setRows] = useState(null);
  const [problem, setProblem] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tick, setTick] = useState(0);
  const app = variant === 'app';

  useEffect(() => {
    let active = true;
    setRows(null);
    listUserTopics(supabase, { section }).then((res) => { if (active) setRows(res.rows); }).catch((e) => { if (active) { setRows([]); setProblem(topicError(e)); } });
    return () => { active = false; };
  }, [supabase, section, refreshKey, tick]);

  const pick = (key) => {
    if (key !== 'browse' && !user) { onRequireAuth?.(key === 'mine' ? 'your topics' : 'friends’ topics'); return; }
    setSection(key);
  };
  const join = async (t) => {
    if (!user) { onRequireAuth?.('joining topics'); return; }
    setBusyId(t.id); setProblem('');
    try { await joinUserTopic(supabase, user.id, t.id); setTick((n) => n + 1); onTopicsChanged?.(); } catch (e) { setProblem(topicError(e)); } finally { setBusyId(null); }
  };

  const empty = section === 'mine' ? ['You’re not in any topics yet', 'Start one, or join one from Popular.']
    : section === 'friends' ? ['No friends’ topics yet', 'Topics your friends start for friends show up here.']
      : ['No member topics yet', 'Be the first to start one.'];

  return <section className={`ut-dir is-${variant}`} aria-labelledby="ut-dir-title">
    <div className="ut-dir__head">
      <h2 id="ut-dir-title" className="ut-h2">Topics by members</h2>
      <button type="button" className={app ? 'am-primary ut-start' : 'ay-btn ay-btn--primary ut-start'} onClick={() => (user ? onCreate?.() : onRequireAuth?.('starting a topic'))}>Start a topic</button>
    </div>
    <div className="ut-tabs" role="tablist" aria-label="Topics">
      {SECTIONS.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={section === key} className="ut-tab" onClick={() => pick(key)}>{label}</button>)}
    </div>
    {problem && <p className={app ? 'am-error' : 'cm-error'} role="alert">{problem}</p>}
    {!rows ? <div className="ut-grid" aria-busy="true" aria-label="Loading topics">{[0, 1, 2].map((k) => <div key={k} className="ut-card is-skeleton"><div className="ut-cover is-card" /></div>)}</div>
      : rows.length === 0 ? <div className="ut-empty"><h3>{empty[0]}</h3><p>{empty[1]}</p></div>
        : <ul className="ut-grid">{rows.map((t) => <li key={t.id} className="ut-card">
          <button type="button" className="ut-card__open" onClick={() => onOpen?.(t)} aria-label={`Open ${t.name}`}>
            <TopicCover topic={t} size="card" />
          </button>
          <div className="ut-card__body">
            {t.description && <p className="ut-card__desc">{t.description}</p>}
            <p className="ut-meta">{memberCountLabel(t.member_count)} · {topicByline(t)}</p>
            {t.status === 'pending' && <p className="ut-badge">Waiting for review</p>}
            {t.status === 'hidden' && <p className="ut-badge is-alert">Hidden by the ayna team</p>}
          </div>
          {t.my_role ? <button type="button" className="ut-text-btn ut-card__act" onClick={() => onOpen?.(t)}>Open</button>
            : t.visibility !== 'private' && <button type="button" className="ut-text-btn ut-card__act" disabled={busyId === t.id} onClick={() => join(t)}>{busyId === t.id ? 'Joining…' : 'Join'}</button>}
        </li>)}</ul>}
    {onSuggest && <p className="ut-suggest">Want ayna to add a topic for everyone? <button type="button" className="ut-text-btn" onClick={onSuggest}>Suggest a topic</button></p>}
  </section>;
}
