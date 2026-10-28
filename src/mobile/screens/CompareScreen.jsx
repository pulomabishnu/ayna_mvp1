import { useMemo } from 'react';
import CompareTable from '../../components/compare/CompareTable.jsx';
import { compareStore, useCompare, COMPARE_MAX, COMPARE_MIN } from '../../utils/compareStore.js';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/catalog.js';
import { similarProducts } from '../../components/pdp/commerce.js';
import { matchPercentFor } from '../utils/matchScore.js';

/**
 * Compare 2 to 4 products (app). Opened from Saved, the save prompt and
 * cards in select mode. With fewer than two picked, it offers her Saved
 * items and close alternatives to add.
 */
export default function CompareScreen({ onBack, onOpenProduct, savedProducts = {}, quizAnswers = null, matchOpts = null }) {
  const byId = useMemo(() => new Map(ALL_PRODUCTS.map((p) => [p.id, p])), []);
  const c = useCompare((id) => byId.get(id));
  const products = c.products;
  const matchFor = quizAnswers ? (p) => matchPercentFor(p, quizAnswers, matchOpts) : null;
  const detailsFor = quizAnswers ? (p) => getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts || undefined) : null;
  const picked = new Set(c.ids);
  const savedList = Object.values(savedProducts || {}).filter((p) => p?.id && !picked.has(p.id)).map((p) => byId.get(p.id) || p);
  const similar = products[0] ? similarProducts(products[0], { limit: 4, exclude: c.ids }) : [];
  const suggestions = [...savedList, ...similar.filter((s) => !savedList.some((x) => x.id === s.id))].slice(0, 8);
  return (
    <div className="ay-cmpv" data-tour="compare" style={{ minHeight: '100%', background: 'var(--ayna-bg)' }}>
      <div className="ay-cmpv__top">
        <button type="button" className="ay-cmpv__back" onClick={onBack} aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
      </div>
      <h1 id="ay-cmpv-h">Compare</h1>
      <p>{products.length < COMPARE_MIN ? `Pick ${COMPARE_MIN} to ${COMPARE_MAX} products to see them side by side.` : 'Side by side, from what is on file. ayna never calls one product the best for everyone.'}</p>
      <CompareTable products={products} matchFor={matchFor} detailsFor={detailsFor} onOpen={onOpenProduct} onRemove={(p) => compareStore.remove(p.id)} headingId="ay-cmpv-h" />
      {products.length === 1 && <p>Comparing: {products[0].name}. <button type="button" className="ay-cmp2__x" style={{ display: 'inline' }} onClick={() => compareStore.clear()}>Clear</button></p>}
      {!c.full && suggestions.length > 0 && (
        <section className="ay-cmpv__pick" aria-label="Add a product to compare">
          <p>{savedList.length ? 'Add from your Saved or similar products' : 'Add a similar product'}</p>
          <ul>{suggestions.map((p) => <li key={p.id}><button type="button" onClick={() => compareStore.add(p)}><span>{p.name}</span><span aria-hidden="true">+</span></button></li>)}</ul>
        </section>
      )}
    </div>
  );
}
