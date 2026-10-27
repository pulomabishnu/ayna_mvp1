import { useState } from 'react';
import { PillTabs, pillPanelProps, Plate } from '../../components/ui/ay/index.js';
import { resolveCatalogProductImage } from '../../components/ProductTileImage.jsx';
import './today-views.css';

/**
 * Today's one toggle (founder Oct 26 evening: "toggles instead of stacking").
 * One view at a time: Your week, Check-in, Routine, Products. Every panel
 * stays mounted (hidden), so nothing on Today is removed, only folded.
 * The chosen view is remembered for the session.
 */
const KEY = 'ayna_today_view_v1';
const readView = () => { try { return sessionStorage.getItem(KEY) || 'week'; } catch { return 'week'; } };
const saveView = (v) => { try { sessionStorage.setItem(KEY, v); } catch { /* private mode */ } };

function PlateRow({ products, onOpenProduct, empty }) {
  if (!products.length) return <p className="ay-tv__empty">{empty}</p>;
  return (
    <ul className="ay-tv__plates">
      {products.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => onOpenProduct?.(p)}>
            <Plate src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="ay-tv__plate" />
            <span className="ay-tv__name">{p.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function TodayViews({ week, checkin, routine, groups = [], onOpenProduct, onAllProducts }) {
  const tabs = [
    { id: 'week', label: 'Your week' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'routine', label: 'Routine' },
    { id: 'products', label: 'Products' },
  ];
  const [view, setView] = useState(() => { const v = readView(); return tabs.some((t) => t.id === v) ? v : 'week'; });
  const pick = (v) => { setView(v); saveView(v); };
  const shownGroups = groups.filter((g) => g.items.length);
  const [group, setGroup] = useState(shownGroups[0]?.id || 'routine');
  const curGroup = shownGroups.find((g) => g.id === group) || shownGroups[0] || null;
  return (
    <section className="ay-tv" aria-label="Today">
      <PillTabs tabs={tabs} active={view} onChange={pick} label="Today views" idBase="ay-tv" />
      <div {...pillPanelProps('ay-tv', 'week', view)} className="ay-tv__panel">{week}</div>
      <div {...pillPanelProps('ay-tv', 'checkin', view)} className="ay-tv__panel">{checkin}</div>
      <div {...pillPanelProps('ay-tv', 'routine', view)} className="ay-tv__panel">{routine}</div>
      <div {...pillPanelProps('ay-tv', 'products', view)} className="ay-tv__panel">
        {shownGroups.length > 1 && <PillTabs tabs={shownGroups.map((g) => ({ id: g.id, label: g.label, count: g.items.length }))} active={curGroup?.id} onChange={setGroup} label="Your products" idBase="ay-tvp" className="is-sub" />}
        {curGroup
          ? <div {...(shownGroups.length > 1 ? pillPanelProps('ay-tvp', curGroup.id, curGroup.id) : {})}><PlateRow products={curGroup.items} onOpenProduct={onOpenProduct} empty="" /></div>
          : <p className="ay-tv__empty">No products yet. Explore finds the ones that fit you.</p>}
        {onAllProducts && <button type="button" className="ay-tv__more" onClick={onAllProducts}>See all your products</button>}
      </div>
    </section>
  );
}
