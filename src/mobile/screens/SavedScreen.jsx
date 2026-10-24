import { useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getSafetyAlerts } from '../utils/shopperProfileData.js';
import { addFeedback } from '../../utils/feedback.js';
import { CompareToggle } from '../../components/compare/CompareControls.jsx';
import SavedReminders from '../../components/save/SavedReminders.jsx';
import { ADD_TO_ROUTINE, IN_ROUTINE } from '../../utils/routineCopy.js';

const Check = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

const FILTERS = [['all', 'All'], ['eco', IN_ROUTINE], ['new', 'Not added yet'], ['flag', 'Safety notes']];

export default function SavedScreen({ savedProducts = {}, myProducts = [], onBack, onBrowse, onOpenProduct, onToggleSaved, onGoEco, onAddToEcosystem, quizAnswers = null, onOpenWhyMatch, onOpenCompare }) {
  const [filter, setFilter] = useState('all');
  // Just added on this visit: the button reads "Added" with a check.
  const [justAdded, setJustAdded] = useState({});
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
      <button type="button" onClick={onBrowse}>Explore</button>
    </header>
    {items.length > 0 && <>
      <nav className="ayna-saved-filters" aria-label="Saved product filters">{FILTERS.map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}<small>{items.filter((product) => matchesFilter(product, key)).length}</small></button>)}</nav>
      <div className="ayna-saved-content">
        <SavedReminders resolve={(id) => savedProducts[id] || null} onOpenProduct={onOpenProduct} />
        {onOpenCompare && items.length > 1 && <div className="ayna-saved-compare"><CompareToggle onOpenCompare={() => onOpenCompare()} /></div>}
        {visible.length === 0 ? <EmptyState compact art="search" tone="mint" title="Nothing here yet" body="None of your saved products fit this filter." actionLabel="Show all saved" onAction={() => setFilter('all')} /> : <div className="ayna-editorial-product-grid">{visible.map((product) => <div key={product.id}>
          <ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} isSaved onToggleSaved={onToggleSaved} />
          <button className="ayna-saved-ecosystem-action ay-press" type="button" onClick={(e) => {
            if (ecosystemIds.has(product.id)) { onGoEco?.(); return; }
            addFeedback(e, { imageSrc: product.image || product.imageUrl });
            setJustAdded((m) => ({ ...m, [product.id]: true }));
            onAddToEcosystem?.(product);
          }}>{ecosystemIds.has(product.id) ? (justAdded[product.id] ? <span className="ay-added-morph"><Check />Added</span> : IN_ROUTINE) : ADD_TO_ROUTINE}</button>
          {flaggedIds.has(product.id) && <button className="ayna-saved-safety" type="button" onClick={() => onOpenProduct?.(product)}>Safety note</button>}
        </div>)}</div>}
        <button className="ayna-saved-ecosystem" type="button" onClick={onGoEco}>Open my ecosystem</button>
        <LegalFooter />
      </div>
    </>}
    {items.length === 0 && <EmptyState art="heart" tone="pink" title="Nothing saved yet." body="When something catches your eye, tap Save and it’ll live here." actionLabel="Go to Explore" onAction={onBrowse} />}
  </div>;
}
