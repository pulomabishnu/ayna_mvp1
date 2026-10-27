import { useState } from 'react';
import { useRoutines } from './useRoutines.js';
import { isMedicineProduct } from '../../health/medicineProduct.js';
import { PillTabs, pillPanelProps, Plate, SnapCarousel } from '../ui/ay/index.js';
import { resolveCatalogProductImage } from '../ProductTileImage.jsx';
import './routine-plates.css';

/**
 * Her routine as a row of plates (founder Oct 26: "toggles instead of
 * stacking", "organize the your products"). The same routines and steps as
 * RoutineSummary (useRoutines), one routine at a time when she has more than
 * one. Each step is a plate (product photo) or a plain tile (a habit), its
 * name and when. The full routine, schedule and shopping list stay one tap
 * away (onOpenRoutine). Medicines are information only and never shown here.
 */
const STEP_ICON = 'M12 6v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z';
const TRACK_ICON = 'M5 19V9m7 10V5m7 14v-7';
const cap = (x) => (x ? `${x.charAt(0).toUpperCase()}${x.slice(1)}` : '');
// "Your period-pain routine" -> "Period pain" (the toggle label).
const shortTitle = (t) => cap(String(t || '').replace(/^your\s+/i, '').replace(/\s+routine$/i, '').replace(/-/g, ' '));

export default function RoutinePlates({ onOpenRoutine, onOpenProduct, onCheckIn, max = 3, emptyAction = null, ...source }) {
  const { routines } = useRoutines(source);
  const list = routines.slice(0, max).map((r) => ({ ...r, start: r.start.filter((it) => !(it.kind === 'product' && isMedicineProduct(it.product))) }));
  const [pick, setPick] = useState(null);
  if (!list.length) {
    return (
      <div className="ay-rp is-empty">
        <p>Your routine shows here once you add products.</p>
        {emptyAction}
      </div>
    );
  }
  const current = list.find((r) => r.need === pick) || list[0];
  return (
    <div className="ay-rp">
      {list.length > 1 && <PillTabs tabs={list.map((r) => ({ id: r.need, label: shortTitle(r.title) }))} active={current.need} onChange={setPick} label="Your routines" idBase="ay-rp" className="is-sub" />}
      <div {...(list.length > 1 ? pillPanelProps('ay-rp', current.need, current.need) : {})}>
        <h3 className="sr-only">{current.title}</h3>
        <SnapCarousel
          label={`${current.title} steps`}
          size="plate"
          items={[
            ...current.start.map((it) => {
              const when = [it.when, it.horizon ? `try for ${it.horizon.label}` : ''].filter(Boolean).map((x) => `${cap(x)}.`).join(' ');
              const inner = <>
                {it.kind === 'product'
                  ? <Plate src={resolveCatalogProductImage(it.product) || ''} alt="" fallback={it.product?.brand || it.title} className="ay-rp__plate" />
                  : <span className="ay-rp__habit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={STEP_ICON} /></svg></span>}
                <span className="ay-rp__name">{it.title}</span>
                {when && <span className="ay-rp__when">{when}</span>}
              </>;
              return {
                key: it.key,
                node: it.kind === 'product' && onOpenProduct
                  ? <button type="button" className="ay-rp__step" onClick={() => onOpenProduct(it.product)}>{inner}</button>
                  : <div className="ay-rp__step">{inner}</div>,
              };
            }),
            {
              key: 'track',
              node: onCheckIn
                ? <button type="button" className="ay-rp__step is-track" onClick={onCheckIn}>
                  <span className="ay-rp__habit is-ink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={TRACK_ICON} /></svg></span>
                  <span className="ay-rp__name">{current.track.title}</span>
                  <span className="ay-rp__when">About 30 seconds. Check in</span>
                </button>
                : <div className="ay-rp__step is-track">
                  <span className="ay-rp__habit is-ink" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={TRACK_ICON} /></svg></span>
                  <span className="ay-rp__name">{current.track.title}</span>
                  <span className="ay-rp__when">About 30 seconds.</span>
                </div>,
            },
          ]}
        />
      </div>
      {onOpenRoutine && <button type="button" className="ay-rp__more" onClick={onOpenRoutine}>See your full routine</button>}
    </div>
  );
}
