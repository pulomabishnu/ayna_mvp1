/* Action queue as a board: To do, Working on it, Done. Each card says what to do,
   what it is worth, and why, and the brand can write notes on it. */
import React, { useState } from 'react';
import { InfoTip, Kpi } from './ui.jsx';
import { groupActions } from './engine/actionGroups.js';

const TIER = {
  safety: { label: 'Safety', cls: 'is-pink' },
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
  if (id.startsWith('review') || id.startsWith('flags')) return ['claims', 'claim comparison'];
  if (/^(group-)?(fix|clin|stale)/.test(id)) return ['feed', 'product updates'];
  return ['losses', 'why it’s missed'];
};

const readNotes = (key) => { try { return JSON.parse(window.localStorage.getItem(key) || '{}'); } catch { return {}; } };
const writeNotes = (key, v) => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage off */ } };

function ActionCard({ a, lane, setAction, note, onNote, go }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(note || '');
  const tier = TIER[a.tier] || TIER.differentiation;
  const [page, pageLabel] = PAGE(a.id);
  const idx = LANES.findIndex((l) => l.id === lane);
  return (
    <article className={`ps-ab-card${lane === 'done' ? ' is-done' : ''}`}>
      <div className="ps-ab-top">
        <span className={`ps-ab-tier ${tier.cls}`}>{tier.label}</span>
        <span className="ps-ab-effort">{EFFORT[a.effort] || 'Some work'}</span>
        <InfoTip text={`${a.issue} Source: ${a.trace}. ${a.confidence}.`} label="Why this matters" />
      </div>
      <h3 className="ps-ab-title">{a.title}</h3>
      {a.affected ? <p className="ps-ab-impact"><b>{a.affected}</b> shopper{a.affected === 1 ? '' : 's'} at stake</p> : null}
      <p className="ps-ab-do">{a.action}</p>
      {note && !open ? <p className="ps-ab-note">{note}</p> : null}
      {open ? (
        <div className="ps-ab-noteedit">
          <textarea className="ps-ab-text" rows={3} value={draft} placeholder="Add a note: who owns this, what you sent, when it's due" onChange={(e) => setDraft(e.target.value)} aria-label={`Note on ${a.title}`} />
          <div className="ps-ab-row">
            <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => { onNote(draft.trim()); setOpen(false); }}>Save note</button>
            <button type="button" className="ps-btn ps-btn--sm" onClick={() => { setDraft(note || ''); setOpen(false); }}>Cancel</button>
          </div>
          <small className="ps-muted">Notes save on this device for now.</small>
        </div>
      ) : null}
      <div className="ps-ab-row ps-ab-actions">
        {idx > 0 ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => setAction(a.id, LANES[idx - 1].id)}>Back</button> : null}
        {idx < LANES.length - 1 ? <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => setAction(a.id, LANES[idx + 1].id)}>{idx === 0 ? 'Start' : 'Mark done'}</button> : null}
        <button type="button" className="ps-btn ps-btn--sm" onClick={() => setOpen((v) => !v)}>{note ? 'Edit note' : 'Add note'}</button>
        {go ? <button type="button" className="ps-link ps-ab-go" onClick={() => go(page)}>See {pageLabel} ›</button> : null}
      </div>
    </article>
  );
}

export function Actions({ b, actionState, setAction, go }) {
  const key = `ps-notes:${b.brand}`;
  const [notes, setNotes] = useState(() => readNotes(key));
  const list = groupActions(b.actions || []);
  const laneOf = (a) => actionState[a.id] || 'open';
  const saveNote = (id, text) => { const next = { ...notes, [id]: text }; if (!text) delete next[id]; setNotes(next); writeNotes(key, next); };
  const open = list.filter((a) => laneOf(a) !== 'done');
  const stake = open.reduce((n, a) => n + (a.affected || 0), 0);
  const quick = open.filter((a) => a.effort === 'S').length;
  const done = list.length - open.length;
  if (!list.length) return <section className="ps-card"><h2 className="ps-tile-title">Nothing to do right now</h2><p className="ps-small">You made the top 3 every time your products fit, and nothing on your products is flagged.</p></section>;
  return (
    <>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="actions" label="Open actions" value={String(open.length)} den={`${done} done so far`} meter={list.length ? (done / list.length) * 100 : 0} /></div>
        <div className="b-4"><Kpi tone="pink" icon="target" label="Shoppers at stake" value={String(stake)} den="made-up shoppers your open actions could win back" /></div>
        <div className="b-4"><Kpi tone="deep" icon="doc" label="Quick fixes" value={String(quick)} den="usually just sending ayna a document" /></div>
      </div>
      <div className="ps-ab-board">
        {LANES.map((l) => {
          const cards = list.filter((a) => laneOf(a) === l.id);
          return (
            <section key={l.id} className={`ps-ab-lane is-${l.id}`} aria-label={l.label}>
              <h2 className="ps-ab-lanehead">{l.label}<span>{cards.length}</span></h2>
              <div className="ps-ab-cards">
                {cards.map((a) => <ActionCard key={a.id} a={a} lane={l.id} setAction={setAction} note={notes[a.id]} onNote={(t) => saveNote(a.id, t)} go={go} />)}
                {!cards.length ? <p className="ps-ab-empty">{l.id === 'done' ? 'Finished actions land here.' : l.id === 'in_progress' ? 'Press Start on a card to move it here.' : 'All caught up.'}</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
