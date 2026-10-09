import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { ECOSYSTEM_AREAS } from '../data/ecosystemAreas.js';
import { selectEcosystemProducts } from '../utils/recommendationSelection.js';

function CabinetProduct({ product, quizAnswers, onOpen }) {
  const details = quizAnswers ? getProductMatchDetailsForProduct(product, quizAnswers) : null;
  const score = details?.matchStatus === 'scored' && Number.isFinite(details.percent) ? details.percent : null;
  const image = product.image || product.imageUrl || product.images?.[0];
  return <button type="button" className="ayna-cabinet-object" onClick={() => onOpen?.(product)} aria-label={`View ${product.name}${score != null ? `, ${score} percent match` : ''}`}>
    <span className="ayna-cabinet-product-image"><ProductImage src={image} alt="" allowBrandLogo={product.type === 'digital'} style={{ objectFit: 'contain' }} /></span>
    {score != null && <span className="ayna-match-stamp"><strong>{score}%</strong><small>MATCH</small></span>}
    <span className="ayna-cabinet-product-name">{product.name}</span>
    {score != null && <span className="ayna-cabinet-match-bar" aria-hidden="true"><span style={{ width: `${score}%` }} /></span>}
  </button>;
}

export default function EcosystemScreen({
  myProducts = [], authUser = null, suggestedEcosystemProducts = [], name = 'You',
  relatedReads = [], savedProducts = {}, headerInitial = 'A', onOpenProduct,
  onOpenArticle, onOpenSaved, onBrowse, onGoCommunity, onRetake,
  onRequestEcosystemReset, ecosystemNotice, onOpenMonthlyCheckin, onOpenProfile,
  quizAnswers = null, onOpenWhyMatch, onAddToEcosystem, topAreas = [], onToggleSaved,
}) {
  const currentProducts = quizAnswers
    ? selectEcosystemProducts(myProducts, quizAnswers, quizAnswers.fullHealthIntake?.recommendedProductsPerArea)
    : myProducts;
  const currentIds = new Set(currentProducts.map((product) => product.id));
  const earlierProducts = myProducts.filter((product) => !currentIds.has(product.id));
  const groups = [...currentProducts.reduce((map, product) => {
    const key = product.areaKey || 'other';
    if (!map.has(key)) map.set(key, { key, label: ECOSYSTEM_AREAS.find((area) => area.key === key)?.label || 'More support', products: [] });
    map.get(key).products.push(product);
    return map;
  }, new Map()).values()];
  const shelfProducts = (currentProducts.length ? currentProducts : suggestedEcosystemProducts).slice(0, 3);
  const savedCount = Object.keys(savedProducts || {}).length;

  return <div className="ayna-fresh-ecosystem ayna-cabinet-home">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

    <section className="ayna-cabinet-stage" aria-labelledby="ayna-cabinet-title">
      <div className="ayna-cabinet-topline"><span>MY ECOSYSTEM</span><button type="button" onClick={onRetake}>Update picks</button></div>
      <h1 id="ayna-cabinet-title">{name === 'You' ? 'Your' : `${name}'s`} cabinet</h1>
      {topAreas[0] && <span className="ayna-cabinet-focus">{topAreas[0]}</span>}
      {groups.length > 0 && <div className="ayna-ecosystem-area-map" aria-label="Picks by health area">{groups.map((group) => <a key={group.key} href={`#ayna-area-${group.key}`}><span>{group.label}</span><span className="ayna-area-dots" aria-hidden="true">{group.products.slice(0, 5).map((product) => <i key={product.id} />)}</span><strong>{group.products.length}</strong></a>)}</div>}
      <div className="ayna-cabinet-shelf" aria-label={currentProducts.length ? 'Your highest matching products' : 'Products worth considering'}>
        {shelfProducts.length ? shelfProducts.map((product) => <CabinetProduct key={product.id} product={product} quizAnswers={authUser ? quizAnswers : null} onOpen={onOpenProduct} />) : <p>Your cabinet is ready for its first pick.</p>}
      </div>
      <div className="ayna-cabinet-foot"><span>{myProducts.length} in your cabinet</span><button type="button" onClick={onBrowse}>Shop products <span aria-hidden="true">→</span></button></div>
      {ecosystemNotice && <p className="ayna-cabinet-notice" role="status">{ecosystemNotice}</p>}
    </section>

    <section className="ayna-home-today"><div><small>TODAY</small><h2>How is it working?</h2></div><button type="button" onClick={onOpenMonthlyCheckin}>Check in <span aria-hidden="true">→</span></button></section>

    {groups.map((group, index) => <section key={group.key} id={`ayna-area-${group.key}`} className="ayna-cabinet-collection ayna-area-collection" aria-labelledby={`ayna-area-title-${group.key}`}>
      <div className="ayna-cabinet-section-head"><h2 id={`ayna-area-title-${group.key}`}><small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>{group.label}</h2><span>{group.products.length} {group.products.length === 1 ? 'pick' : 'picks'}</span></div>
      <div className="ayna-editorial-product-grid">{group.products.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[product.id]} onToggleSaved={onToggleSaved} />)}</div>
    </section>)}

    {suggestedEcosystemProducts.length > 0 && <section className="ayna-cabinet-collection" aria-labelledby="ayna-cabinet-next-title">
      <div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-next-title">Worth a look</h2></div>
      <div className="ayna-editorial-product-grid">{suggestedEcosystemProducts.map((product) => <div className="ayna-cabinet-suggestion" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}>Add to cabinet</button></div>)}</div>
    </section>}

    {relatedReads.length > 0 && <section className="ayna-cabinet-reads" aria-labelledby="ayna-cabinet-reads-title"><div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-reads-title">Read next</h2></div>{relatedReads.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article} compact onClick={() => onOpenArticle?.(article)} />)}</section>}

    <section className="ayna-cabinet-more" aria-label="More ways to manage your cabinet">
      {earlierProducts.length > 0 && <details><summary>Earlier picks <span>{earlierProducts.length}</span></summary><p>Kept in your Ecosystem outside your current shortlist.</p><div className="ayna-editorial-product-grid">{earlierProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} />)}</div></details>}
      <details><summary>Manage Ecosystem <span>{savedCount} saved</span></summary><button type="button" onClick={onRetake}>Update recommendations</button><button type="button" className="ayna-destructive-text" onClick={onRequestEcosystemReset}>Reset Ecosystem</button></details>
    </section>
    <LegalFooter />
  </div>;
}
