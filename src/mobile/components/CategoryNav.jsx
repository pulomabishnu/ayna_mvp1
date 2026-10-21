import { sentenceCase } from '../../utils/sentenceCase.js';
/**
 * Shop by need: every area as a filter chip in one sideways row (selected =
 * pink with a check), then the toolbar the screen passes in as `action`.
 */
export default function CategoryNav({ groups, active, onSelect, action }) {
  return <div className="ayna-category-index">
    <div className="ayna-shop-category-row" role="group" aria-label="Shop by need">
      {groups.map((group) => <button className="ayna-shop-category" type="button" key={group.id} aria-pressed={active === group.id} onClick={() => onSelect(group.id)}>{sentenceCase(group.label)}</button>)}
    </div>
    {action}
  </div>;
}
