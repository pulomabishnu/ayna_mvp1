import { useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getSafetyAlerts } from '../utils/shopperProfileData.js';

const FILTERS = [['all', 'All'], ['eco', 'In Ecosystem'], ['new', 'Saved'], ['flag', 'Safety']];

export default function SavedScreen({ savedProducts = {}, myProducts = [], onBack, onBrowse, onOpenProduct, onToggleSaved, onGoEco, onAddToEcosystem, quizAnswers = null, onOpenWhyMatch }) {
  const [filter, setFilter] = useState('all');
  const items = Object.values(savedProducts);
  const ecosystemIds = new Set(myProducts.map((product) => product.id));
  const alerts = getSafetyAlerts(items, quizAnswers);
  const flaggedIds = new Set(alerts.map((alert) => alert.product?.id));
  const matchesFilter = (product, key) => key === 'all' || (key === 'eco' ? ecosystemIds.has(product.id) : key === 'flag' ? flaggedIds.has(product.id) : !ecosystemIds.has(product.id));
  const visible = items.filter((product) => matchesFilter(product, filter));

  return <div className="ayna-fresh-saved ayna-saved-collection">
    <header className="ayna-saved-header">
      <button type="button" onClick={onBack} aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button>
      <h1>Saved <small>{items.length}</small></h1>
      <button type="button" onClick={onBrowse}>Shop</button>
    </header>
    {items.length > 0 && <>
      <nav className="ayna-saved-filters" aria-label="Saved product filters">{FILTERS.map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}<small>{items.filter((product) => matchesFilter(product, key)).length}</small></button>)}</nav>
      <div className="ayna-saved-content">
        {visible.length === 0 ? <EmptyState compact art="search" tone="mint" title="Nothing in this filter" actionLabel="Show all" onAction={() => setFilter('all')} /> : <div className="ayna-editorial-product-grid">{visible.map((product) => <div key={product.id}>
          <ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} isSaved onToggleSaved={onToggleSaved} />
          <button className="ayna-saved-ecosystem-action" type="button" onClick={() => ecosystemIds.has(product.id) ? onGoEco?.() : onAddToEcosystem?.(product)}>{ecosystemIds.has(product.id) ? 'In Ecosystem' : 'Add to Ecosystem'}</button>
          {flaggedIds.has(product.id) && <button className="ayna-saved-safety" type="button" onClick={() => onOpenProduct?.(product)}>Safety note</button>}
        </div>)}</div>}
        <button className="ayna-saved-ecosystem" type="button" onClick={onGoEco}>Ecosystem</button>
        <LegalFooter />
      </div>
    </>}
    {items.length === 0 && <EmptyState art="bookmark" tone="pink" title="Nothing saved yet" body="Tap the bookmark on any product to keep it here." actionLabel="Start shopping" onAction={onBrowse} />}
  </div>;
}
