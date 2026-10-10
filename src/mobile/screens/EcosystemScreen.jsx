import { healthAreaLabel } from '../utils/healthAreaLabel.js';
import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EcosystemChart from '../components/EcosystemChart.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { ECOSYSTEM_AREAS } from '../data/ecosystemAreas.js';
import { selectEcosystemProducts } from '../utils/recommendationSelection.js';

export default function EcosystemScreen({
  myProducts = [], authUser = null, suggestedEcosystemProducts = [], 
  relatedReads = [], savedProducts = {}, headerInitial = 'A', onOpenProduct,
  onOpenArticle, onOpenSaved, onBrowse, onGoCommunity, onRetake,
  onRequestEcosystemReset, ecosystemNotice, onOpenMonthlyCheckin, onOpenProfile,
  quizAnswers = null, onOpenWhyMatch, onAddToEcosystem, onToggleSaved,
}) {
  const currentProducts = quizAnswers
    ? selectEcosystemProducts(myProducts, quizAnswers, quizAnswers.fullHealthIntake?.recommendedProductsPerArea)
    : myProducts;
  const currentIds = new Set(currentProducts.map((product) => product.id));
  const earlierProducts = myProducts.filter((product) => !currentIds.has(product.id));
  const groups = [...currentProducts.reduce((map, product) => {
    const reason = quizAnswers ? getProductMatchDetailsForProduct(product, quizAnswers).reasonDetails?.find((r) => ['primaryGoal', 'otherNeeds'].includes(r.component) && r.score > 0) : null;
    const healthLabel = reason?.text?.replace(/^(Goal: |Another need you selected: )/, '');
    const fallbackKey = ['supplements', 'tests-devices'].includes(product.areaKey) ? 'other' : product.areaKey || 'other';
    const fallback = ECOSYSTEM_AREAS.find((area) => area.key === fallbackKey)?.label;
    const label = healthAreaLabel(healthLabel || (['Supplements', 'Tests + Devices'].includes(fallback) ? 'Other support' : fallback) || 'Other support');
    const key = `area-${encodeURIComponent(label.toLowerCase())}`;
    if (!map.has(key)) map.set(key, { key, label, products: [] });
    map.get(key).products.push(product);
    return map;
  }, new Map()).values()];
  const savedCount = Object.keys(savedProducts || {}).length;

  return <div className="ayna-fresh-ecosystem ayna-cabinet-home">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

    <section className="ayna-cabinet-stage" aria-labelledby="ayna-cabinet-title">
      <div className="ayna-cabinet-topline"><span>YOUR HEALTH CABINET</span><button type="button" onClick={onRetake}>Update picks</button></div>
      <h1 id="ayna-cabinet-title">Your Ecosystem</h1>
      {groups.length > 0 && <EcosystemChart groups={groups} />}
      {currentProducts.length === 0 && <div className="ayna-ecosystem-empty"><span className="ayna-saved-empty-stage" aria-hidden="true"><span /><span /><span /></span><p>No strong matches yet.</p><button type="button" onClick={onBrowse}>Shop</button></div>}
      {ecosystemNotice && <p className="ayna-cabinet-notice" role="status">{ecosystemNotice}</p>}
    </section>


    {groups.map((group, index) => <section key={group.key} id={`ayna-area-${group.key}`} className="ayna-cabinet-collection ayna-area-collection" aria-labelledby={`ayna-area-title-${group.key}`}>
      <div className="ayna-cabinet-section-head"><h2 id={`ayna-area-title-${group.key}`}><small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>{group.label}</h2><span>{group.products.length} {group.products.length === 1 ? 'pick' : 'picks'}</span></div>
      <div className="ayna-editorial-product-grid">{group.products.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[product.id]} onToggleSaved={onToggleSaved} />)}</div>
    </section>)}

    {suggestedEcosystemProducts.length > 0 && <section className="ayna-cabinet-collection" aria-labelledby="ayna-cabinet-next-title">
      <div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-next-title">Worth a look</h2></div>
      <div className="ayna-editorial-product-grid">{suggestedEcosystemProducts.map((product) => <div className="ayna-cabinet-suggestion" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}>Add to Ecosystem</button></div>)}</div>
    </section>}

    {relatedReads.length > 0 && <section className="ayna-cabinet-reads" aria-labelledby="ayna-cabinet-reads-title"><div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-reads-title">Read next</h2></div>{relatedReads.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article} compact onClick={() => onOpenArticle?.(article)} />)}</section>}

    <section className="ayna-home-today"><h2>Check-in</h2><button type="button" onClick={onOpenMonthlyCheckin}>Check in</button></section>

    <section className="ayna-cabinet-more" aria-label="More ways to manage your cabinet">
      {earlierProducts.length > 0 && <details><summary>Earlier picks <span>{earlierProducts.length}</span></summary><p>Kept in your Ecosystem outside your current shortlist.</p><div className="ayna-editorial-product-grid">{earlierProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} />)}</div></details>}
      <details><summary>Manage Ecosystem <span>{savedCount} saved</span></summary><button type="button" onClick={onRetake}>Update recommendations</button><button type="button" className="ayna-destructive-text" onClick={onRequestEcosystemReset}>Reset Ecosystem</button></details>
    </section>
    <LegalFooter />
  </div>;
}
