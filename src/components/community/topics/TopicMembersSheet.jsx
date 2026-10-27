import { useEffect, useState } from 'react';
import TopicSheetFrame from './TopicSheetFrame.jsx';
import { listTopicMembers, setTopicCoowner, removeTopicMember, topicError } from '../../../utils/community/userTopics.js';
import { getProfilesByIds } from '../../../utils/community/communityStore.js';

const ROLE = { owner: 'Started it', coowner: 'Co-owner', member: 'Member' };

/** Owner only: make members co-owners (they can edit and remove posts) or remove them. */
export default function TopicMembersSheet({ variant = 'web', supabase, user, topic, onClose }) {
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState(new Map());
  const [busyId, setBusyId] = useState(null);
  const [problem, setProblem] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await listTopicMembers(supabase, topic.id);
      const profiles = await getProfilesByIds(supabase, list.map((m) => m.user_id));
      if (active) { setRows(list); setNames(profiles); }
    })().catch((e) => { if (active) { setRows([]); setProblem(topicError(e)); } });
    return () => { active = false; };
  }, [supabase, topic.id, tick]);

  const act = async (id, fn) => {
    setBusyId(id); setProblem('');
    try { await fn(); setTick((n) => n + 1); } catch (e) { setProblem(topicError(e)); } finally { setBusyId(null); }
  };

  return <TopicSheetFrame variant={variant} title="Members" onClose={onClose}>
    <p className="ut-muted">Co-owners can edit the topic and remove posts from it. Only you can delete it.</p>
    {!rows ? <p className="ut-muted">Loading…</p> : <ul className="ut-members">
      {rows.map((m) => {
        const p = names.get(m.user_id);
        const me = m.user_id === user?.id;
        return <li key={m.user_id}>
          <span className="ut-member-name"><strong>{me ? 'You' : p?.display_name || 'Member'}</strong><small>{p?.username ? `@${p.username} · ` : ''}{ROLE[m.role]}</small></span>
          {m.role !== 'owner' && <span className="ut-member-actions">
            <button type="button" className="ut-text-btn" disabled={busyId === m.user_id} onClick={() => act(m.user_id, () => setTopicCoowner(supabase, topic.id, m.user_id, m.role !== 'coowner'))}>{m.role === 'coowner' ? 'Make member' : 'Make co-owner'}</button>
            <button type="button" className="ut-text-btn" disabled={busyId === m.user_id} onClick={() => act(m.user_id, () => removeTopicMember(supabase, topic.id, m.user_id))}>Remove</button>
          </span>}
        </li>;
      })}
    </ul>}
    {problem && <p className={variant === 'app' ? 'am-error' : 'cm-error'} role="alert">{problem}</p>}
  </TopicSheetFrame>;
}
