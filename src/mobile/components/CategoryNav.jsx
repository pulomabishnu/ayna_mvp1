import { useState } from 'react';

export default function CategoryNav({ groups, active, onSelect, action }) {
  const [expanded, setExpanded] = useState(false);
  const primary = groups.slice(0, 3);
  const selected = groups.find((group) => group.id === active);
  return <div className="ayna-category-index">
    <div className="ayna-shop-category-row" aria-label="Shop by need">
      {primary.map((group) => <button className="ayna-shop-category" type="button" key={group.id} aria-pressed={active === group.id} onClick={() => onSelect(group.id)}>{group.label === 'Intimate Care' ? 'Intimate' : group.label}</button>)}
      <button className="ayna-shop-category" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{primary.some((group) => group.id === active) ? 'More' : selected?.label || 'More'}</button>
      {action}
    </div>
    {expanded && <div className="ayna-category-expanded" aria-label="All health areas">{groups.slice(3).map((group) => <button type="button" key={group.id} aria-pressed={active === group.id} onClick={() => { onSelect(group.id); setExpanded(false); }}>{group.label}</button>)}</div>}
  </div>;
}
