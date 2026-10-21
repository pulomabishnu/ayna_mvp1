import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import TopicCover from './community/topics/TopicCover.jsx';
import { VISIBILITY_COPY } from '../utils/community/topicRules.js';
import './community/topics/user-topics.css';

/**
 * /admin/topics: the team's review screen for Community topics. Not linked
 * from any nav. The real gate is the server (api/community-topics-admin
 * checks a confirmed ADMIN_EMAILS account and 403s everyone else), so this
 * page loads nothing for anyone else.
 *
 * Three jobs, in the order they need doing: public topics waiting for a
 * check (Approve / Hide), reported topics (Keep / Hide), and topic
 * suggestions people sent from "Suggest a topic" (Mark done). Anonymous
 * creators stay anonymous here too.
 */
const REASONS = { spam: 'Spam', harassment: 'Harassment', misinformation: 'Misinformation', unsafe_advice: 'Unsafe advice', self_harm: 'Self-harm', privacy: 'Privacy', other: 'Other' };
const fmt = (v) => { try { return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; } };

async function call(method, body) {
  const sb = getSupabaseClient();
  const { data } = sb ? await sb.auth.getSession() : { data: null };
  const token = data?.session?.access_token;
  if (!token) return { status: 401 };
  const res = await fetch('/api/community-topics-admin', {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

export default function AdminTopicsPage({ onBack }) {
  const [status, setStatus] = useState('loading'); // loading | ok | unauthenticated | forbidden | error
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await call('GET');
      if (r.status === 401) return setStatus('unauthenticated');
      if (r.status === 403) return setStatus('forbidden');
      if (!r.ok) return setStatus('error');
      setData(r.json); setStatus('ok');
    } catch { setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (key, body, done) => {
    setBusy(key); setNote('');
    try {
      const r = await call('POST', body);
      if (!r.ok) setNote(r.json?.error === 'migration_needed' ? 'Run supabase/community_user_topics_2026-10-21.sql first.' : 'That didn’t save. Try again.');
      else { setNote(done); await load(); }
    } catch { setNote('That didn’t save. Try again.'); } finally { setBusy(null); }
  };

  const topics = data?.topics;
  const suggestions = data?.suggestions;
  const openSuggestions = (suggestions?.rows || []).filter((s) => showDone || !s.reviewed_at);

  const topicRow = (t, actions) => <li key={t.id} className="at-row">
    <div className="at-cover"><TopicCover topic={t} size="preview" /></div>
    <div className="at-copy">
      <strong>{t.name}</strong>
      {t.description && <p>{t.description}</p>}
      <small>{VISIBILITY_COPY[t.visibility]?.label} · {t.creator_label} · {fmt(t.created_at)}</small>
      {t.reports && <small>{t.reports.count} {t.reports.count === 1 ? 'report' : 'reports'}: {Object.entries(t.reports.reasons).map(([k, n]) => `${REASONS[k] || k} ${n}`).join(', ')}</small>}
    </div>
    <div className="at-actions">{actions.map(([label, action, done, primary]) => <button key={action} type="button" className={primary ? 'ay-btn ay-btn--primary' : 'ay-btn ay-btn--secondary'} disabled={Boolean(busy)} onClick={() => act(`${t.id}:${action}`, { action, topicId: t.id }, done)}>{busy === `${t.id}:${action}` ? 'Saving…' : label}</button>)}</div>
  </li>;

  return <section className="ay-container at-page">
    <div className="at-head">
      <h1 className="ay-h1">Community topics</h1>
      <button type="button" className="ay-btn ay-btn--secondary" onClick={onBack}>Back</button>
    </div>
    {status === 'loading' && <p className="ut-muted">Loading…</p>}
    {status === 'unauthenticated' && <p className="ut-muted">Sign in with an admin account to see this.</p>}
    {status === 'forbidden' && <p className="ut-muted">Your account doesn’t have access to this page.</p>}
    {status === 'error' && <p className="ut-muted">Couldn’t load topics. Try again in a bit.</p>}
    {note && <p className="ut-status" role="status">{note}</p>}
    {status === 'ok' && <>
      {!topics?.available && <p className="ut-status">Members can’t start topics yet. Run supabase/community_user_topics_2026-10-21.sql in the Supabase SQL editor to switch them on. Suggestions below still work.</p>}
      {topics?.available && <>
        <section className="at-section" aria-labelledby="at-pending">
          <h2 id="at-pending" className="ut-h2">Waiting for a check <span className="at-n">{topics.pending.length}</span></h2>
          <p className="ut-muted">Public topics show in Community only after you approve them. Hide anything off-topic, selling, or claiming to be run by a clinician.</p>
          {topics.pending.length ? <ul className="at-list">{topics.pending.map((t) => topicRow(t, [['Approve', 'approve', 'Approved. It now shows in Community.', true], ['Hide', 'hide', 'Hidden.']]))}</ul> : <p className="ut-muted">Nothing waiting.</p>}
        </section>
        <section className="at-section" aria-labelledby="at-reported">
          <h2 id="at-reported" className="ut-h2">Reported <span className="at-n">{topics.reported.length}</span></h2>
          {topics.reported.length ? <ul className="at-list">{topics.reported.map((t) => topicRow(t, [['Keep', 'keep', 'Kept. Reports closed.'], ['Hide', 'hide', 'Hidden. Reports closed.', true]]))}</ul> : <p className="ut-muted">No open reports.</p>}
        </section>
        {topics.hidden.length > 0 && <section className="at-section" aria-labelledby="at-hidden">
          <h2 id="at-hidden" className="ut-h2">Hidden <span className="at-n">{topics.hidden.length}</span></h2>
          <ul className="at-list">{topics.hidden.map((t) => topicRow(t, [['Show again', 'restore', 'Visible again.']]))}</ul>
        </section>}
      </>}
      <section className="at-section" aria-labelledby="at-sugg">
        <h2 id="at-sugg" className="ut-h2">Topic suggestions <span className="at-n">{(suggestions?.rows || []).filter((s) => !s.reviewed_at).length}</span></h2>
        <p className="ut-muted">From “Suggest a topic”. Anonymous: no names or accounts are stored.</p>
        {suggestions?.canMark && <label className="ut-check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /><span>Show ones marked done</span></label>}
        {!suggestions?.available ? <p className="ut-muted">The suggestions table isn’t set up yet.</p> : openSuggestions.length ? <ul className="at-list">{openSuggestions.map((s) => <li key={s.id} className="at-row is-text">
          <div className="at-copy"><strong>{s.topic}</strong>{s.reason && <p>{s.reason}</p>}<small>{s.context || 'Community'} · {s.platform === 'app' ? 'App' : 'Website'} · {fmt(s.created_at)}{s.reviewed_at ? ' · Done' : ''}</small></div>
          {suggestions.canMark && <div className="at-actions"><button type="button" className="ay-btn ay-btn--secondary" disabled={Boolean(busy)} onClick={() => act(`s:${s.id}`, { action: s.reviewed_at ? 'suggestion-reopen' : 'suggestion-done', suggestionId: s.id }, s.reviewed_at ? 'Moved back to open.' : 'Marked done.')}>{s.reviewed_at ? 'Reopen' : 'Mark done'}</button></div>}
        </li>)}</ul> : <p className="ut-muted">No open suggestions.</p>}
      </section>
    </>}
  </section>;
}
