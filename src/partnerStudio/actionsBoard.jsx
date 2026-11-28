/* Action plan: one compact row per action. The finding and what it is worth stay
   visible; tap a row to see why, what to do, and to reply with a note, links,
   screenshots or documents. */
import React, { useEffect, useState } from 'react';
import { Kpi } from './ui.jsx';
import { ViewSwitch } from './charts.jsx';
import { groupActions } from './engine/actionGroups.js';
import { ACCEPT, checkFiles, fileSize, loadSubmissions, parseLinks, saveSubmission } from './engine/submissions.js';

const TIER = {
  safety: { label: 'Product rules', cls: 'is-pink' },
  evidence: { label: 'Research', cls: 'is-ink' },
  documentation: { label: 'Product facts', cls: 'is-sky' },
  differentiation: { label: 'Growth', cls: 'is-sky2' },
};
const EFFORT = { S: 'Quick fix', M: 'Some work', L: 'Bigger change' };
const LANES = [
  { id: 'open', label: 'To do' },
  { id: 'in_progress', label: 'Working on it' },
  { id: 'done', label: 'Done' },
];
const PAGE = (id) => {
  if (id.startsWith('review') || id.startsWith('flags')) return ['claims', 'View claim comparison'];
  if (/^(group-)?(fix|clin|stale)/.test(id)) return ['feed', 'View product updates'];
  return ['losses', 'View why products miss'];
};

const readNotes = (key) => { try { return JSON.parse(window.localStorage.getItem(key) || '{}'); } catch { return {}; } };

/** Image preview for an attached file; other files show their extension. */
function Thumb({ f }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!String(f.type).startsWith('image/') || !(f.blob instanceof Blob)) return undefined;
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(f.blob);
    return () => { if (reader.readyState === 1) reader.abort(); };
  }, [f]);
  return url ? <img src={url} alt="" /> : <span className="ps-resp-ext">{(f.name.split('.').pop() || 'file').slice(0, 4).toUpperCase()}</span>;
}

function Respond({ a, brand, saved, onSaved }) {
  const [text, setText] = useState(() => saved?.text ?? (readNotes(`ps-notes:${brand}`)[a.id] || ''));
  const [linkText, setLinkText] = useState((saved?.links || []).join('\n'));
  const [files, setFiles] = useState(saved?.files || []);
  const [problems, setProblems] = useState([]);
  const [state, setState] = useState('');
  const [drag, setDrag] = useState(false);
  const add = (list) => {
    const { ok, rejected } = checkFiles([...list], files.length);
    setProblems(rejected);
    setFiles((cur) => [...cur, ...ok.map((f, k) => ({ id: `${Date.now()}-${k}-${f.name}`, name: f.name, type: f.type, size: f.size, blob: f }))]);
  };
  const links = parseLinks(linkText);
  const empty = !text.trim() && !links.length && !files.length;
  const save = async () => {
    setState('saving');
    try {
      const rec = await saveSubmission(brand, a.id, { text: text.trim(), links, files, title: a.title });
      onSaved(rec);
      setState('saved');
    } catch { setState('error'); }
  };
  const mail = `mailto:team@aynahealth.co?subject=${encodeURIComponent(`Partner Studio: ${a.title}`)}&body=${encodeURIComponent(`${text.trim()}${links.length ? `\n\nLinks:\n${links.join('\n')}` : ''}${files.length ? `\n\nFiles to attach: ${files.map((f) => f.name).join(', ')}` : ''}`)}`;
  return (
    <section className="ps-resp" aria-label="Your response">
      <h4 className="ps-why-h">Your response</h4>
      <label className="ps-resp-label">Write a reply<textarea className="ps-ab-text" rows={3} value={text} placeholder="What you changed, what you are sending, or a question for the ayna team" onChange={(e) => { setText(e.target.value); setState(''); }} /></label>
      <label className="ps-resp-label">Links<textarea className="ps-ab-text" rows={2} value={linkText} placeholder="Paste links to studies, product pages or documents, one per line" onChange={(e) => { setLinkText(e.target.value); setState(''); }} /></label>
      {links.length ? <ul className="ps-resp-links">{links.map((l) => <li key={l}><a href={l} target="_blank" rel="noreferrer">{l}</a></li>)}</ul> : null}
      <div
        className={`ps-resp-drop${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); setState(''); }}
      >
        <span><b>Add screenshots or documents</b><small>Images, PDF, Word, Excel or CSV, up to 10 MB each. Drag files here or</small></span>
        <label className="ps-btn ps-btn--sm">Choose files<input type="file" multiple accept={ACCEPT} className="ps-visually-hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; setState(''); }} /></label>
      </div>
      {problems.length ? <p className="ps-small" role="alert">Not added: {problems.map((p) => `${p.name} (${p.why})`).join(', ')}.</p> : null}
      {files.length ? (
        <ul className="ps-resp-files">
          {files.map((f) => (
            <li key={f.id}>
              <Thumb f={f} />
              <span>{f.name}<small>{fileSize(f.size)}</small></span>
              <button type="button" className="ps-link" onClick={() => { setFiles((cur) => cur.filter((x) => x.id !== f.id)); setState(''); }} aria-label={`Remove ${f.name}`}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="ps-ab-row">
        <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" disabled={empty || state === 'saving'} onClick={save}>{state === 'saving' ? 'Saving…' : 'Save response'}</button>
        <a className="ps-btn ps-btn--sm" href={mail}>Email it to ayna</a>
      </div>
      <p className="ps-small ps-muted" role="status">
        {state === 'saved' ? 'Saved on this device. ' : state === 'error' ? 'Couldn’t save in this browser. ' : ''}
        Responses stay on this device until brand accounts launch and they can go straight to the ayna team. Email sends the text and links; attach the files yourself.
      </p>
    </section>
  );
}

function ActionRow({ a, lane, setAction, go, brand, saved, onSaved, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const tier = TIER[a.tier] || TIER.differentiation;
  const [page, pageLabel] = PAGE(a.id);
  const idx = LANES.findIndex((l) => l.id === lane);
  const rid = `ps-act-${a.id}`;
  return (
    <li className={`ps-row${open ? ' is-open' : ''}${lane === 'done' ? ' is-done' : ''}`}>
      <button type="button" className="ps-row-head" aria-expanded={open} aria-controls={rid} onClick={() => setOpen((v) => !v)}>
        <span className={`ps-ab-tier ${tier.cls}`}>{tier.label}</span>
        <span className="ps-row-title">{a.title}</span>
        <span className="ps-row-meta">
          {a.affected ? <span><b>{a.affected}</b> {a.affected === 1 ? 'scenario' : 'scenarios'}</span> : null}
          <span>{EFFORT[a.effort] || 'Some work'}</span>
          {saved ? <span className="ps-row-flag">Response saved</span> : null}
        </span>
        <span className="ps-row-chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div className="ps-row-body" id={rid}>
          <div className="ps-row-cols">
            <section><h4 className="ps-why-h">Why this matters</h4><p className="ps-small">{a.issue}</p><p className="ps-small ps-muted">Source: {a.trace}. {a.confidence}.</p></section>
            <section><h4 className="ps-why-h">What to do</h4><p className="ps-small">{a.action}</p></section>
          </div>
          <div className="ps-ab-row">
            {idx > 0 ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => setAction(a.id, LANES[idx - 1].id)}>Move back</button> : null}
            {idx < LANES.length - 1 ? <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => setAction(a.id, LANES[idx + 1].id)}>{idx === 0 ? 'Start working on it' : 'Mark done'}</button> : null}
            {go ? <button type="button" className="ps-link ps-ab-go" onClick={() => go(page)}>{pageLabel} ›</button> : null}
          </div>
          {onSaved ? <Respond key={saved?.updatedAt || 'new'} a={a} brand={brand} saved={saved} onSaved={onSaved} /> : null}
        </div>
      ) : null}
    </li>
  );
}

/** Top actions for the Overview: same rows, no response form. */
export function ActionPreview({ b, actionState = {}, go, limit = 3 }) {
  const open = groupActions(b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done');
  if (!open.length) return <p className="ps-small">Nothing to review right now.</p>;
  return (
    <ul className="ps-rows">
      {open.slice(0, limit).map((a) => <ActionRow key={a.id} a={a} lane={actionState[a.id] || 'open'} setAction={() => go('actions')} go={go} brand={b.brand} />)}
    </ul>
  );
}

export function Actions({ b, actionState, setAction, go }) {
  const [lane, setLane] = useState('open');
  const [saved, setSaved] = useState({});
  useEffect(() => {
    let live = true;
    loadSubmissions(b.brand).then((s) => { if (live) setSaved(s); });
    return () => { live = false; };
  }, [b.brand]);
  const list = groupActions(b.actions || []);
  const laneOf = (a) => actionState[a.id] || 'open';
  const open = list.filter((a) => laneOf(a) !== 'done');
  const stake = open.reduce((n, a) => n + (a.affected || 0), 0);
  const quick = open.filter((a) => a.effort === 'S').length;
  const done = list.length - open.length;
  if (!list.length) return <section className="ps-card"><h2 className="ps-tile-title">Nothing to do right now</h2><p className="ps-small">Nothing on your products needs attention right now.</p></section>;
  const rows = list.filter((a) => laneOf(a) === lane);
  return (
    <>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="actions" label="Open actions" value={String(open.length)} den={`${done} done so far`} meter={list.length ? (done / list.length) * 100 : 0} /></div>
        <div className="b-4"><Kpi tone="pink" icon="target" label="Scenarios affected" value={String(stake)} den="simulated scenarios your open actions affect" /></div>
        <div className="b-4"><Kpi tone="deep" icon="doc" label="Quick fixes" value={String(quick)} den="usually just sending ayna a document" /></div>
      </div>
      <section className="ps-card ps-panel">
        <div className="ps-panel-head">
          <h2>Your actions</h2>
          <div className="ps-panel-right"><ViewSwitch label="Status" views={LANES.map((l) => [l.id, `${l.label} (${list.filter((a) => laneOf(a) === l.id).length})`])} value={lane} onChange={setLane} /></div>
        </div>
        <p className="ps-small ps-muted">Tap an action to see why it matters and to reply with a note, links, screenshots or documents.</p>
        {rows.length ? (
          <ul className="ps-rows">
            {rows.map((a, k) => <ActionRow key={a.id} a={a} lane={lane} setAction={setAction} go={go} brand={b.brand} saved={saved[a.id]} onSaved={(rec) => setSaved((s) => ({ ...s, [a.id]: rec }))} defaultOpen={k === 0 && lane === 'open'} />)}
          </ul>
        ) : <p className="ps-ab-empty">{lane === 'done' ? 'Finished actions land here.' : lane === 'in_progress' ? 'Open an action and press Start working on it to move it here.' : 'All caught up.'}</p>}
      </section>
    </>
  );
}
