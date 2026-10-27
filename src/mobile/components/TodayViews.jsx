import { useState } from 'react';
import { PillTabs, pillPanelProps, Plate, SnapCarousel } from '../../components/ui/ay/index.js';
import { resolveCatalogProductImage } from '../../components/ProductTileImage.jsx';
import './today-views.css';

/**
 * Today's one toggle (founder Oct 26 evening: "toggles instead of stacking").
 * One view at a time: Today (her 1 to 3 things and her log), Your week,
 * Routine, Products. Every panel stays mounted (hidden), so nothing on Today
 * is removed, only folded. The chosen view is remembered for the session.
 */
const KEY = 'ayna_today_view_v1';
const VIEWS = ['today', 'week', 'routine', 'products'];
const readView = () => { try { const v = sessionStorage.getItem(KEY); return VIEWS.includes(v) ? v : 'today'; } catch { return 'today'; } };
const saveView = (v) => { try { sessionStorage.setItem(KEY, v); } catch { /* private mode */ } };

function PlateRow({ products, onOpenProduct, label }) {
  return (
    <SnapCarousel
      label={label}
      size="plate"
      items={products.map((p) => ({
        key: p.id,
        node: (
          <button type="button" className="ay-tv__pbtn" onClick={() => onOpenProduct?.(p)}>
            <Plate src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="ay-tv__plate" />
            <span className="ay-tv__name">{p.name}</span>
            {p.brand && <span className="ay-tv__brand">{p.brand}</span>}
          </button>
        ),
      }))}
    />
  );
}

export default function TodayViews({ today, todayCount = 0, week, routine, groups = [], onOpenProduct, onAllProducts }) {
  const tabs = [
    { id: 'today', label: 'Today', count: todayCount },
    { id: 'week', label: 'Your week' },
    { id: 'routine', label: 'Routine' },
    { id: 'products', label: 'Products' },
  ];
  const [view, setView] = useState(readView);
  const pick = (v) => { setView(v); saveView(v); };
  const shownGroups = groups.filter((g) => g.items.length);
  const [group, setGroup] = useState(null);
  const curGroup = shownGroups.find((g) => g.id === group) || shownGroups[0] || null;
  return (
    <section className="ay-tv" aria-label="Today">
      <PillTabs tabs={tabs} active={view} onChange={pick} label="Today views" idBase="ay-tv" />
      <div {...pillPanelProps('ay-tv', 'today', view)} className="ay-tv__panel">{today}</div>
      <div {...pillPanelProps('ay-tv', 'week', view)} className="ay-tv__panel">{week}</div>
      <div {...pillPanelProps('ay-tv', 'routine', view)} className="ay-tv__panel">{routine}</div>
      <div {...pillPanelProps('ay-tv', 'products', view)} className="ay-tv__panel">
        {shownGroups.length > 1 && <PillTabs tabs={shownGroups.map((g) => ({ id: g.id, label: g.label, count: g.items.length }))} active={curGroup?.id} onChange={setGroup} label="Your products" idBase="ay-tvp" className="is-sub" />}
        {curGroup
          ? <div {...(shownGroups.length > 1 ? pillPanelProps('ay-tvp', curGroup.id, curGroup.id) : {})}><PlateRow products={curGroup.items} onOpenProduct={onOpenProduct} label={`${curGroup.label} products`} /></div>
          : <p className="ay-tv__empty">No products yet. Explore finds the ones that fit you.</p>}
        {onAllProducts && <button type="button" className="ay-tv__more" onClick={onAllProducts}>See all your products</button>}
      </div>
    </section>
  );
}
