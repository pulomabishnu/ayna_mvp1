/* Brand responses: the ayna team's inbox of notes, links and files that brands
   send from their action plan. Only shown when submissions are switched on. */
import React, { useCallback, useEffect, useState } from 'react';
import { Empty } from './ui.jsx';
import { Panel } from './charts.jsx';
import { fileSize } from './engine/submissions.js';
import { accessTokenFromBrowser } from './auth.js';

const STATUS = { new: 'New', in_review: 'In review', done: 'Done' };

export function Inbox({ fetcher = fetch, brand }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [all, setAll] = useState(false);
  const auth = () => { const t = accessTokenFromBrowser(); return t ? { Authorization: `Bearer ${t}` } : {}; };
  const load = useCallback(() => {
    const q = all ? '' : `?brand=${encodeURIComponent(brand)}`;
    fetcher(`/api/partner-submissions${q}`, { headers: auth() })
      .then(async (res) => { if (!res.ok) throw new Error(String(res.status)); const j = await res.json(); setRows(j.submissions || []); setError(''); })
      .catch(() => setError('Couldn’t load responses. The submissions table may not be set up yet.'));
  }, [all, brand, fetcher]);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id, status) => {
    const res = await fetcher('/api/partner-submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ id, status }) });
    if (res.ok) setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
  };
  return (
    <Panel className="b-12" id="ib" title="Brand responses" info="Notes, links and files brands sent from their action plan. Files open through links that expire after an hour." right={<label className="ps-check"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> All brands</label>}>
      {error ? <p className="ps-small" role="alert">{error}</p> : null}
      {rows && !rows.length ? <Empty title="No responses yet">When a brand sends a response from its action plan, it shows up here.</Empty> : null}
      {rows?.length ? (
        <ul className="ps-rows">
          {rows.map((r) => (
            <li key={r.id} className="ps-row is-open">
              <div className="ps-row-body" style={{ paddingTop: 14 }}>
                <div className="ps-ab-row"><b>{r.brand}</b><span className="ps-small ps-muted">{r.actionTitle || r.actionId}</span><span className="ps-row-flag">{STATUS[r.status] || r.status}</span><span className="ps-small ps-muted" style={{ marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleString('en-US')}{r.author ? ` · ${r.author}` : ''}</span></div>
                {r.body ? <p className="ps-small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{r.body}</p> : null}
                {r.links?.length ? <ul className="ps-resp-links">{r.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noreferrer">{l}</a></li>)}</ul> : null}
                {r.files?.length ? <ul className="ps-resp-links">{r.files.map((f) => <li key={f.name}>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : f.name} <span className="ps-muted">({fileSize(f.size)})</span></li>)}</ul> : null}
                <div className="ps-ab-row">
                  {r.status !== 'in_review' ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => setStatus(r.id, 'in_review')}>Mark in review</button> : null}
                  {r.status !== 'done' ? <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => setStatus(r.id, 'done')}>Mark done</button> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}
