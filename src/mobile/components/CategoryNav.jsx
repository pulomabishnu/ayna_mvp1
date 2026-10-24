import { sentenceCase } from '../../utils/sentenceCase.js';
import { FolderTabs } from '../../components/shop/ShopBits.jsx';
import { ALL_PRODUCTS, itemMatchesMacroGroup, isTeenProduct } from '../../data/products.js';

// One real product we host per area, for the photo peeking out of the selected tab.
const photoCache = new Map();
function areaPhoto(id) {
  if (photoCache.has(id)) return photoCache.get(id);
  const p = ALL_PRODUCTS.find((it) => String(it.image || '').startsWith('/') && !it.hidden && !isTeenProduct(it) && it.type !== 'digital' && (id === 'all' || itemMatchesMacroGroup(it, id)));
  photoCache.set(id, p?.image || '');
  return p?.image || '';
}

/**
 * Shop areas as folder tabs on a rule (the same component as the website's
 * Shop), then the toolbar the screen passes in as `action`.
 */
export default function CategoryNav({ groups, active, onSelect, action }) {
  return <div className="ayna-category-index">
    <FolderTabs tabs={groups.map((g) => ({ id: g.id, label: g.id === 'all' ? 'All' : sentenceCase(g.label) }))} active={active} onSelect={onSelect} label="Shop areas" photoFor={areaPhoto} />
    {action}
  </div>;
}
