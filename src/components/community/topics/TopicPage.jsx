import { Fragment, useCallback, useEffect, useState } from 'react';
import TopicCover from './TopicCover.jsx';
import TopicEditor from './TopicEditor.jsx';
import TopicSheetFrame from './TopicSheetFrame.jsx';
import TopicMembersSheet from './TopicMembersSheet.jsx';
import * as topics from '../../../utils/community/userTopics.js';
import { VISIBILITY_COPY } from '../../../utils/community/topicRules.js';
import { nextCursor } from '../../../utils/community/communityStore.js';

const STATUS_NOTE = {
  pending: 'Only you and people in it can see this topic until the ayna team has checked it.',
  hidden: 'The ayna team hid this topic after a report. Only you can see it.',
};

/**
 * One user-created topic: cover, what it's for, members, Join or Leave,
 * Post here, and for its owners Edit, Members, Invite link and Delete.
 * Posts render with the host screen's own post card (renderPost), so a
 * post looks the same here as in the feed.
 */
export default function TopicPage({ variant = 'web', supabase, user, topicId, renderPost, onCompose, onRequireAuth, onDeleted, onShowRules, refreshKey = 0, onTopicsChanged, toast }) {
  const [topic, setTopic] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing | error
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [editing, setEditing] = useState(false);
  const [members, setMembers] = useState(false);
  const [invite, setInvite] = useState(null); // { link } when shown
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [armDelete, setArmDelete] = useState(false);
  const [reload, setReload] = useState(0);
  const app = variant === 'app';
  const say = (text) => (toast ? toast(text) : setProblem(text));

  useEffect(() => {
    if (!supabase || !topicId) return undefined;
    let active = true;
    (async () => {
      const row = await topics.getUserTopic(supabase, { id: topicId });
      if (!active) return;
      if (!row) { setState('missing'); return; }
      setTopic(row); setState('ok');
      const list = await topics.listTopicPosts(supabase, row.id);
      if (!active) return;
      setPosts(list); setCursor(list.length >= 20 ? nextCursor(list, 'recent') : null);
    })().catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [supabase, topicId, refreshKey, reload]);

  useEffect(() => { if (!armDelete) return undefined; const t = window.setTimeout(() => setArmDelete(false), 4000); return () => window.clearTimeout(t); }, [armDelete]);

  const can = topics.topicPermissions(topic, user?.id);
  const run = useCallback(async (fn, done) => {
    setBusy(true); setProblem('');
    try { await fn(); if (done) say(done); setReload((n) => n + 1); onTopicsChanged?.(); } catch (e) { setProblem(topics.topicError(e)); } finally { setBusy(false); }
  }, [onTopicsChanged]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'loading') return <div className="ut-page" aria-busy="true"><div className="ut-cover is-head is-skeleton" /><p className="ut-muted">Looking into it…</p></div>;
  if (state !== 'ok') return <div className="ut-page"><div className="ut-empty"><h2>{state === 'missing' ? 'This topic isn’t available' : 'This topic didn’t load'}</h2><p>{state === 'missing' ? 'It may be private, waiting for review, or deleted.' : 'Check your connection and try again.'}</p>{state === 'error' && <button type="button" className={app ? 'am-primary' : 'ay-btn ay-btn--primary'} onClick={() => { setState('loading'); setReload((n) => n + 1); }}>Try again</button>}</div></div>;

  const join = () => (user ? run(() => topics.joinUserTopic(supabase, user.id, topic.id), 'Joined') : onRequireAuth?.('joining topics'));
  const leave = () => run(() => topics.leaveUserTopic(supabase, user.id, topic.id), 'Left the topic');
  const post = () => (user ? onCompose?.(topic) : onRequireAuth?.('posting in Community'));
  const shareInvite = async () => {
    setBusy(true); setProblem('');
    try {
      const code = await topics.getTopicInviteCode(supabase, topic.id);
      const link = topics.topicInviteLink(code, typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform?.() && /aynahealth\.co$/.test(window.location.hostname) ? window.location.origin : undefined);
      if (!link) throw new Error('community_topic_unavailable');
      setInvite({ link });
    } catch (e) { setProblem(topics.topicError(e)); } finally { setBusy(false); }
  };
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(invite.link); say('Invite link copied'); } catch { setProblem('Copy didn’t work. Select the link and copy it.'); }
  };
  const remove = async () => {
    if (!armDelete) { setArmDelete(true); return; }
    setBusy(true);
    try { await topics.deleteUserTopic(supabase, topic.id); onTopicsChanged?.(); say('Topic deleted'); onDeleted?.(); } catch (e) { setProblem(topics.topicError(e)); setBusy(false); }
  };
  const loadMore = async () => {
    setBusy(true);
    try { const more = await topics.listTopicPosts(supabase, topic.id, { cursor }); setPosts((p) => [...p, ...more]); setCursor(more.length >= 20 ? nextCursor(more, 'recent') : null); } catch (e) { setProblem(topics.topicError(e)); } finally { setBusy(false); }
  };
  const takeOut = (p) => run(async () => { await topics.removePostFromTopic(supabase, p.id); setPosts((list) => list.filter((x) => x.id !== p.id)); }, 'Removed from the topic');

  const primary = app ? 'am-primary' : 'ay-btn ay-btn--primary';
  const secondary = app ? 'am-secondary ut-btn-secondary' : 'ay-btn ay-btn--secondary';
  const facts = [topics.memberCountLabel(topic.member_count), `${Number(topic.post_count) || 0} ${Number(topic.post_count) === 1 ? 'post' : 'posts'}`, VISIBILITY_COPY[topic.visibility]?.label].filter(Boolean);

  return <div className={`ut-page is-${variant}`}>
    <TopicCover topic={topic} size="head" />
    <div className="ut-head-copy">
      {topic.description && <p className="ut-desc">{topic.description}</p>}
      <p className="ut-meta">{facts.join(' · ')}<span aria-hidden="true"> · </span>{topics.topicByline(topic)}</p>
      {STATUS_NOTE[topic.status] && <p className="ut-status" role="status">{STATUS_NOTE[topic.status]}</p>}
    </div>
    <div className="ut-toolbar">
      {can.canPost && <button type="button" className={primary} disabled={busy} onClick={post}>Post here</button>}
      {!user && <button type="button" className={primary} onClick={() => onRequireAuth?.('joining topics')}>Sign in to join</button>}
      {can.canJoin && <button type="button" className={can.canPost ? secondary : primary} disabled={busy} onClick={join}>Join</button>}
      {can.canLeave && <button type="button" className={secondary} disabled={busy} onClick={leave}>Leave</button>}
      {can.canShareInvite && <button type="button" className={secondary} disabled={busy} onClick={shareInvite}>Invite link</button>}
      {can.canEdit && <button type="button" className="ut-text-btn" onClick={() => setEditing(true)}>Edit</button>}
      {can.canManageCoowners && <button type="button" className="ut-text-btn" onClick={() => setMembers(true)}>Members</button>}
      {can.canDelete && <button type="button" className={`ut-text-btn${armDelete ? ' is-armed' : ''}`} disabled={busy} onClick={remove}>{armDelete ? 'Tap again to delete' : 'Delete'}</button>}
      {can.canReport && <button type="button" className="ut-text-btn" onClick={() => setReporting(true)}>Report</button>}
    </div>
    {problem && <p className={app ? 'am-error' : 'cm-error'} role="alert">{problem}</p>}

    <section className="ut-posts" aria-label={`Posts in ${topic.name}`}>
      {posts.length === 0 ? <div className="ut-empty">
        <h2>No posts here yet</h2>
        <p>{can.canPost ? 'Start it off with a question or what worked for you.' : can.canJoin ? 'Join to post here.' : 'Posts in this topic show up here.'}</p>
        {can.canPost && <button type="button" className={primary} onClick={post}>Post here</button>}
      </div> : posts.map((p, i) => <Fragment key={p.id}>
        {renderPost(p, i)}
        {can.canRemovePosts && <button type="button" className="ut-text-btn ut-takeout" disabled={busy} onClick={() => takeOut(p)}>Remove from this topic</button>}
      </Fragment>)}
      {cursor && <button type="button" className={secondary} disabled={busy} onClick={loadMore}>{busy ? 'Loading…' : 'Show more posts'}</button>}
    </section>

    {editing && <TopicEditor variant={variant} supabase={supabase} user={user} topic={topic} canChangeAudience={can.canChangeAudience} onShowRules={onShowRules} onClose={() => setEditing(false)} onSaved={(saved) => { setEditing(false); if (saved) setTopic((t) => ({ ...t, ...saved })); say(saved?.status === 'pending' && topic.status === 'visible' ? 'Saved. The ayna team will check the new name.' : 'Topic updated'); setReload((n) => n + 1); onTopicsChanged?.(); }} />}
    {members && <TopicMembersSheet variant={variant} supabase={supabase} user={user} topic={topic} onClose={() => { setMembers(false); setReload((n) => n + 1); }} />}
    {invite && <TopicSheetFrame variant={variant} title="Invite link" onClose={() => setInvite(null)}>
      <p className="ut-muted">Anyone with this link can join {topic.name}. Share it only with people you want in.</p>
      <input className="ut-invite" readOnly value={invite.link} aria-label="Invite link" onFocus={(e) => e.target.select()} />
      <div className="ut-actions"><button type="button" className={primary} data-autofocus onClick={copyInvite}>Copy link</button></div>
    </TopicSheetFrame>}
    {reporting && <TopicSheetFrame variant={variant} title="Report topic" onClose={() => setReporting(false)}>
      <label className="ut-label" htmlFor="ut-report-reason">What’s wrong</label>
      <select id="ut-report-reason" data-autofocus value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
        <option value="spam">Spam or selling</option><option value="harassment">Harassment</option><option value="misinformation">Health misinformation</option><option value="unsafe_advice">Unsafe advice</option><option value="other">Something else</option>
      </select>
      <div className="ut-actions"><button type="button" className={primary} disabled={busy} onClick={async () => {
        setBusy(true);
        try { await topics.reportUserTopic(supabase, user.id, topic.id, reportReason); setReporting(false); say('Report sent. The ayna team will look at it.'); } catch (e) { setProblem(topics.topicError(e)); setReporting(false); } finally { setBusy(false); }
      }}>Send report</button></div>
    </TopicSheetFrame>}
  </div>;
}
