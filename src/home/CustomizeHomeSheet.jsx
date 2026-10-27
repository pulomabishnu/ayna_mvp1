import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSheetDrag } from '../mobile/hooks/useSheetDrag.js';
import { CAPS, FIXED_ITEMS, FULL_LINE, capLine, fits, moveWidget, moveWidgetTo, usedSpace } from './homeLayout.js';
import { REGISTRY, DEFAULT_SUMMARY, SUMMARY_RANGES, SUMMARY_TOPICS, categoriesFor, widgetsFor } from './widgets/registry.js';
import { Widget } from './widgets/index.jsx';

const SIZE_LABEL = { small: 'Small', large: 'Large' };

function SizeToggle({ sizes, value, onChange, canLarge = true, label }) {
  if (sizes.length < 2) return null;
  return (
    <span className="ay-chs-size" role="group" aria-label={`Size of ${label}`}>
      {['small', 'large'].filter((s) => sizes.includes(s)).map((s) => (
        <button key={s} type="button" aria-pressed={value === s} disabled={s === 'large' && value !== 'large' && !canLarge} onClick={() => onChange(s)}>{SIZE_LABEL[s]}</button>
      ))}
    </span>
  );
}

function SummaryConfig({ config, onChange, idPrefix }) {
  const c = { ...DEFAULT_SUMMARY, ...(config || {}) };
  return (
    <span className="ay-chs-config">
      <label htmlFor={`${idPrefix}-topic`}>Topic</label>
      <select id={`${idPrefix}-topic`} value={c.topic} onChange={(e) => onChange({ ...c, topic: e.target.value })}>
        {SUMMARY_TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <label htmlFor={`${idPrefix}-range`}>Time</label>
      <select id={`${idPrefix}-range`} value={c.range} onChange={(e) => onChange({ ...c, range: e.target.value })}>
        {SUMMARY_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
    </span>
  );
}

/** Her widgets, in order: drag the handle, or use Move up / Move down. */
function YourWidgets({ widgets, onChange, surface }) {
  const listRef = useRef(null);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(null);
  const indexAt = (y) => {
    const rows = [...(listRef.current?.querySelectorAll(':scope > li') || [])];
    const i = rows.findIndex((r) => { const b = r.getBoundingClientRect(); return y < b.top + b.height / 2; });
    return i < 0 ? rows.length - 1 : i;
  };
  const down = (id) => (e) => { drag.current = { id }; setDragging(id); e.currentTarget.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!drag.current) return;
    const to = indexAt(e.clientY);
    const from = widgets.findIndex((w) => w.id === drag.current.id);
    if (to !== from && to >= 0) onChange(moveWidgetTo(widgets, drag.current.id, to));
  };
  const up = () => { drag.current = null; setDragging(null); };
  if (!widgets.length) return <p className="ay-chs-none">No widgets yet. Add one below.</p>;
  return (
    <ol ref={listRef} className="ay-chs-list">
      {widgets.map((w, i) => {
        const def = REGISTRY[w.id];
        const larger = { ...w, size: 'large' };
        return (
          <li key={w.id} className={`ay-chs-row${dragging === w.id ? ' is-dragging' : ''}`} data-id={w.id}>
            <button type="button" className="ay-chs-handle" aria-label={`Drag to reorder ${def.title}`} onPointerDown={down(w.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
            </button>
            <span className="ay-chs-row__name">{def.title}</span>
            <SizeToggle sizes={def.sizes} value={w.size} label={def.title} canLarge={fits(widgets, larger, surface)} onChange={(size) => onChange(widgets.map((x) => (x.id === w.id ? { ...x, size } : x)))} />
            {def.configurable && <SummaryConfig idPrefix={`chs-${w.id}`} config={w.config} onChange={(config) => onChange(widgets.map((x) => (x.id === w.id ? { ...x, config } : x)))} />}
            <span className="ay-chs-row__moves">
              <button type="button" disabled={i === 0} onClick={() => onChange(moveWidget(widgets, w.id, -1))} aria-label={`Move ${def.title} up`}>Up</button>
              <button type="button" disabled={i === widgets.length - 1} onClick={() => onChange(moveWidget(widgets, w.id, 1))} aria-label={`Move ${def.title} down`}>Down</button>
              <button type="button" onClick={() => onChange(widgets.filter((x) => x.id !== w.id))} aria-label={`Turn off ${def.title}`}>Turn off</button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** One widget she could add: live preview, size, Add. */
function AddCard({ def, widgets, surface, ctx, onAdd }) {
  const [size, setSize] = useState(def.sizes[0]);
  const [config, setConfig] = useState(DEFAULT_SUMMARY);
  const on = widgets.some((w) => w.id === def.id);
  const candidate = { id: def.id, size, ...(def.configurable ? { config } : {}) };
  const room = fits(widgets, candidate, surface);
  const previewCtx = { ...ctx, on: {} };
  return (
    <li className="ay-chs-add">
      <div className="ay-chs-add__head">
        <h4>{def.title}</h4>
        <p>{def.blurb}</p>
      </div>
      <div className="ay-chs-add__preview" inert aria-hidden="true">
        <Widget widget={candidate} ctx={previewCtx} />
      </div>
      <div className="ay-chs-add__controls">
        <SizeToggle sizes={def.sizes} value={size} label={def.title} onChange={setSize} />
        {def.configurable && <SummaryConfig idPrefix={`chs-add-${def.id}`} config={config} onChange={setConfig} />}
        {on
          ? <span className="ay-chs-on">On your Today</span>
          : <button type="button" className="ay-chs-addbtn" disabled={!room} onClick={() => onAdd(candidate)} aria-label={`Add ${def.title}`}>Add</button>}
      </div>
      {!on && !room && <p className="ay-chs-full">{FULL_LINE}</p>}
    </li>
  );
}

/**
 * "Customize Home" (founder, Oct 24 23:21 to 23:23). Changes apply live
 * underneath; nothing here closes the sheet, resets its scroll or the open
 * category, except Done, the close button, the backdrop and a swipe down.
 */
export default function CustomizeHomeSheet({ surface = 'app', widgets, onChange, onReset, onClose, ctx, custom = false }) {
  const hid = useId();
  const where = 'Today';
  const [category, setCategory] = useState(null);
  const [opener] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const finish = () => {
    onClose?.();
    try { if (opener?.isConnected) opener.focus({ preventScroll: true }); } catch { /* gone */ }
  };
  const { sheetRef, grabberProps, close } = useSheetDrag(finish);
  useEffect(() => { sheetRef.current?.querySelector('.ay-chs__done')?.focus({ preventScroll: true }); }, [sheetRef]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const nodes = [...(sheetRef.current?.querySelectorAll('button:not([disabled]), select:not([disabled]), a[href]') || [])].filter((n) => !n.closest('[inert]'));
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const cats = categoriesFor(surface, ctx);
  const cap = CAPS[surface === 'web' ? 'web' : 'app'];

  const node = (
    <div className={`ay-chs-layer is-${surface}`}>
      <div className="ay-chs-dim" aria-hidden="true" onClick={close} />
      <section ref={sheetRef} className="ay-chs" role="dialog" aria-modal="true" aria-labelledby={hid}>
        <button {...grabberProps} aria-label={`Close Customize ${where}`} />
        <header className="ay-chs__top">
          <h2 id={hid}>Customize {where}</h2>
          <button type="button" className="ay-chs__done" onClick={close}>Done</button>
        </header>
        <div className="ay-chs__scroll">
          <section className="ay-chs__sec" aria-labelledby={`${hid}-fixed`}>
            <h3 id={`${hid}-fixed`}>Always on {where}</h3>
            <ul className="ay-chs-fixed">
              {FIXED_ITEMS.map((f) => <li key={f.id}><span>{f.title}</span><small>Always on</small></li>)}
            </ul>
          </section>
          <section className="ay-chs__sec" aria-labelledby={`${hid}-mine`}>
            <h3 id={`${hid}-mine`}>Your widgets</h3>
            <p className={`ay-chs-cap${usedSpace(widgets) >= cap ? ' is-full' : ''}`} role="status" aria-live="polite" data-used={usedSpace(widgets)} data-cap={cap}>{capLine(widgets, surface)}</p>
            <YourWidgets widgets={widgets} onChange={onChange} surface={surface} />
          </section>
          <section className="ay-chs__sec" aria-labelledby={`${hid}-add`}>
            <h3 id={`${hid}-add`}>Add a widget</h3>
            <ul className="ay-chs-cats">
              {cats.map((c) => {
                const open = category === c.id;
                return (
                  <li key={c.id}>
                    <button type="button" className="ay-chs-cat" aria-expanded={open} aria-controls={`${hid}-cat-${c.id}`} onClick={() => setCategory(open ? null : c.id)}>
                      <span>{c.title}</span><small>{widgetsFor(c.id, surface, ctx).length}</small>
                    </button>
                    {open && (
                      <ul id={`${hid}-cat-${c.id}`} className="ay-chs-addlist">
                        {widgetsFor(c.id, surface, ctx).map((def) => <AddCard key={def.id} def={def} widgets={widgets} surface={surface} ctx={ctx} onAdd={(w) => onChange([...widgets, w])} />)}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="ay-chs__foot">
            <button type="button" className="ay-chs-reset" disabled={!custom} onClick={onReset}>Reset to default</button>
          </div>
        </div>
      </section>
    </div>
  );
  const host = typeof document === 'undefined' ? null
    : surface === 'app' ? document.querySelector('.ayna-mobile') : document.querySelector('.app-container') || document.body;
  return host ? createPortal(node, host) : node;
}
