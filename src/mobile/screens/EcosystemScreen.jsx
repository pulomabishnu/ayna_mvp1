import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

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
  quizAnswers = null, onOpenWhyMatch, onAddToEcosystem, topAreas = [],
}) {
  const rankedProducts = myProducts
    .map((product) => ({ product, details: getProductMatchDetailsForProduct(product, quizAnswers) }))
    .sort((a, b) => (b.details.percent ?? -1) - (a.details.percent ?? -1));
  const currentProducts = quizAnswers
    ? rankedProducts.filter(({ details }) => details.matchStatus === 'scored' && details.percent >= 30).map(({ product }) => product)
    : myProducts;
  const earlierProducts = quizAnswers
    ? rankedProducts.filter(({ details }) => details.matchStatus !== 'scored' || details.percent < 30).map(({ product }) => product)
    : [];
  const shelfProducts = (currentProducts.length ? currentProducts : suggestedEcosystemProducts).slice(0, 3);
  const savedCount = Object.keys(savedProducts || {}).length;

  return <div className="ayna-fresh-ecosystem ayna-cabinet-home">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

    <section className="ayna-cabinet-stage" aria-labelledby="ayna-cabinet-title">
      <div className="ayna-cabinet-topline"><span>YOUR CABINET</span><button type="button" onClick={onRetake}>Edit answers</button></div>
      <h1 id="ayna-cabinet-title">{name === 'You' ? 'Your' : `${name}'s`} cabinet</h1>
      {topAreas[0] && <span className="ayna-cabinet-focus">{topAreas[0]}</span>}
      <div className="ayna-cabinet-shelf" aria-label={currentProducts.length ? 'Your highest matching products' : 'Products worth considering'}>
        {shelfProducts.length ? shelfProducts.map((product) => <CabinetProduct key={product.id} product={product} quizAnswers={authUser ? quizAnswers : null} onOpen={onOpenProduct} />) : <p>Your cabinet is ready for its first pick.</p>}
      </div>
      <div className="ayna-cabinet-foot"><span>{myProducts.length} in your cabinet</span><button type="button" onClick={onBrowse}>Shop products <span aria-hidden="true">→</span></button></div>
      {ecosystemNotice && <p className="ayna-cabinet-notice" role="status">{ecosystemNotice}</p>}
    </section>

    <section className="ayna-home-today"><div><small>TODAY</small><h2>How is it working?</h2></div><button type="button" onClick={onOpenMonthlyCheckin}>Check in <span aria-hidden="true">→</span></button></section>

    {currentProducts.length > 0 && <section className="ayna-cabinet-collection" aria-labelledby="ayna-cabinet-picks-title">
      <div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-picks-title">Your picks</h2><span>{currentProducts.length}</span></div>
      <div className="ayna-editorial-product-grid">{currentProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />)}</div>
    </section>}

    {suggestedEcosystemProducts.length > 0 && <section className="ayna-cabinet-collection" aria-labelledby="ayna-cabinet-next-title">
      <div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-next-title">Worth a look</h2></div>
      <div className="ayna-editorial-product-grid">{suggestedEcosystemProducts.map((product) => <div className="ayna-cabinet-suggestion" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}>Add to cabinet</button></div>)}</div>
    </section>}

    {relatedReads.length > 0 && <section className="ayna-cabinet-reads" aria-labelledby="ayna-cabinet-reads-title"><div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-reads-title">Read next</h2></div>{relatedReads.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article} compact onClick={() => onOpenArticle?.(article)} />)}</section>}

    <section className="ayna-cabinet-more" aria-label="More ways to manage your cabinet">
      {earlierProducts.length > 0 && <details><summary>Earlier picks <span>{earlierProducts.length}</span></summary><p>These remain saved, but fit your current answers less closely.</p><div className="ayna-editorial-product-grid">{earlierProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} />)}</div></details>}
      <details><summary>Manage cabinet <span>{savedCount} saved</span></summary><button type="button" onClick={onRetake}>Redo intake and add products</button><button type="button" onClick={onRequestEcosystemReset}>Reset cabinet</button></details>
    </section>
    <LegalFooter />
  </div>;
}
