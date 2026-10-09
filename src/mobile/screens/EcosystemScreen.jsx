import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

export default function EcosystemScreen({
  myProducts = [],
  authUser = null,
  suggestedEcosystemProducts = [],
  name = 'You',
  relatedReads = [],
  savedProducts = {},
  headerInitial = 'A',
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onBrowse,
  onGoCommunity,
  onRetake,
  onRequestEcosystemReset,
  ecosystemNotice,
  onOpenMonthlyCheckin,
  onOpenProfile,
  quizAnswers = null,
  onOpenWhyMatch,
  onAddToEcosystem,
  topAreas = [],
}) {
  const rankedProducts = myProducts
    .map((product) => ({ product, details: getProductMatchDetailsForProduct(product, quizAnswers) }))
    .sort((a, b) => (b.details.percent ?? -1) - (a.details.percent ?? -1));
  const matchedProducts = quizAnswers
    ? rankedProducts.filter(({ details }) => details.matchStatus === 'scored' && details.percent >= 30).map(({ product }) => product)
    : myProducts;
  const olderProducts = quizAnswers
    ? rankedProducts.filter(({ details }) => details.matchStatus !== 'scored' || details.percent < 30).map(({ product }) => product)
    : [];
  const gridProducts = matchedProducts;
  const savedList = Object.values(savedProducts || {});
  const nextSaved = savedList[0];
  const featuredProduct = matchedProducts[0] || suggestedEcosystemProducts[0] || nextSaved;
  const featuredImage = featuredProduct?.image || featuredProduct?.imageUrl || featuredProduct?.images?.[0];
  const featuredMatch = featuredProduct && quizAnswers ? getProductMatchDetailsForProduct(featuredProduct, quizAnswers) : null;
  const showFeaturedMatch = featuredMatch?.matchStatus === 'scored' && featuredMatch.percent > 0;

  return (
    <div className="ayna-fresh-ecosystem ayna-figma-ecosystem">
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

      <div className="ayna-figma-eco-intro ayna-eco-dashboard-hero">
        <div className="ayna-eco-hero-top"><span>YOUR SPACE / PERSONAL EDIT</span><span>01</span></div>
        <h1>{name === 'You' ? 'Your' : `${name}'s`}<br />Ecosystem.</h1>
        <p>Picked around your answers.</p>
        <div className="ayna-eco-focus-list"><small>YOUR FOCUS</small>{(topAreas.length ? topAreas.slice(0, 3) : ['Your health, in context']).map((area) => <span key={area}>{area}</span>)}</div>
        <div className="ayna-eco-hero-stats"><div><strong>{matchedProducts.length}</strong><span>current picks</span></div><div><strong>{myProducts.length}</strong><span>in your space</span></div><div><strong>{relatedReads.length}</strong><span>reads for you</span></div></div>
        <div className="ayna-eco-hero-actions"><button type="button" onClick={onRetake}>Update answers <span aria-hidden="true">↗</span></button><button type="button" onClick={onBrowse}>Discover more <span aria-hidden="true">→</span></button></div>
        {ecosystemNotice && <p role="status" style={{ margin: '12px 0 0', padding: '11px 14px', borderRadius: 14, background: 'var(--ayna-peach)', color: 'var(--ayna-heading)', fontSize: 13, lineHeight: 1.45 }}>{ecosystemNotice}</p>}
      </div>

      <div className="ayna-eco-journey" aria-label="How your Ecosystem comes together">
        <div><small>01 / YOU SAID</small><strong>{topAreas[0] || 'Your priorities'}</strong></div>
        <span aria-hidden="true">→</span>
        <div><small>02 / MATCHING NOW</small><strong>{matchedProducts.length} {matchedProducts.length === 1 ? 'fit' : 'fits'}</strong></div>
        <span aria-hidden="true">→</span>
        <div><small>03 / YOU CHOOSE</small><strong>{myProducts.length} saved</strong></div>
      </div>

      <section className="ayna-figma-eco-feature">
        <div className="ayna-eco-section-eyebrow"><span>01 / START HERE</span><span>{featuredProduct ? 'A PICK FROM YOUR SPACE' : 'DISCOVER A PICK'}</span></div>
        <button type="button" className="ayna-figma-eco-photo" onClick={featuredProduct ? () => onOpenProduct?.(featuredProduct) : onBrowse} aria-label={featuredProduct ? `View ${featuredProduct.name}` : 'Browse products'}>
          <ProductImage src={featuredImage} alt={featuredProduct?.name || ''} allowBrandLogo={featuredProduct?.type === 'digital'} />
          {showFeaturedMatch && <span className="ayna-figma-score"><strong>{featuredMatch.percent}</strong><span>match /100<br />for your profile</span></span>}
        </button>
        <div className="ayna-figma-eco-feature-copy">
          <small>{showFeaturedMatch ? 'YOUR TOP SAVED MATCH' : 'SAVED BY YOU'}</small>
          <h2>{featuredProduct?.name || 'Find a product that fits your priorities.'}</h2>
          <p>{featuredProduct ? 'Match, evidence, and real experiences.' : 'Find your first pick.'}</p>
          <button type="button" onClick={featuredProduct ? () => onOpenProduct?.(featuredProduct) : onBrowse}>{featuredProduct ? 'See details and shop' : 'Discover products'} <span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section className="ayna-figma-routine">
        <div className="ayna-figma-routine-head"><strong>In your space</strong><span>{myProducts.length} saved</span></div>
        {myProducts.slice(0, 3).map((product) => <button type="button" key={product.id} onClick={() => onOpenProduct?.(product)}><span>{product.name}</span><span aria-hidden="true">›</span></button>)}
        {myProducts.length === 0 && <p>Your saved products will appear here.</p>}
        {myProducts.length > 3 && <button type="button" className="ayna-eco-see-all" onClick={() => document.getElementById('ayna-eco-picks')?.scrollIntoView({ behavior: 'smooth' })}>See all {myProducts.length} products <span aria-hidden="true">↓</span></button>}
      </section>

      <section className="ayna-figma-checkin"><small>NEXT / THIS MONTH</small><h2>How did it fit your day?</h2><button type="button" onClick={onOpenMonthlyCheckin}>Monthly check-in <span aria-hidden="true">→</span></button></section>

      <div id="ayna-eco-picks" className="ayna-fresh-picks ayna-eco-picks">
        <div className="ayna-eco-list-heading">
          <div><small>02 / YOUR COLLECTION</small><h2>Your picks</h2></div>
          <span>{gridProducts.length} product{gridProducts.length === 1 ? '' : 's'}</span>
        </div>
        <div className="ayna-editorial-product-grid ayna-eco-product-list">
          {gridProducts.map((p) => (
            <ProductCard key={p.id} product={p} variant="list" onClick={() => onOpenProduct && onOpenProduct(p)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />
          ))}
        </div>
        {matchedProducts.length === 0 && <p className="ayna-eco-empty">No strong matches are saved yet. Explore the recommendations below or update your intake answers.</p>}
      </div>

      {suggestedEcosystemProducts.length > 0 && (
        <section aria-label="Top matches to add" className="ayna-eco-suggested">
          <small>03 / MADE FOR YOU</small><h2>Worth a look.</h2>
          <p>Ranked from your answers. Add the ones that fit your life.</p>
          <div className="ayna-eco-product-list">
            {suggestedEcosystemProducts.map((product) => (
              <div key={product.id} className="ayna-eco-suggestion">
                <ProductCard product={product} variant="list" onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />
                <button type="button" className="ayna-eco-add-button" onClick={() => onAddToEcosystem?.(product)}>Add to my Ecosystem <span aria-hidden="true">＋</span></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {olderProducts.length > 0 && (
        <details className="ayna-eco-earlier">
          <summary>Earlier picks · {olderProducts.length}</summary>
          <p>These are still saved, but they do not strongly match your current answers. Open a product to review or remove it.</p>
          <div className="ayna-eco-product-list">
            {olderProducts.map((product) => <ProductCard key={product.id} product={product} variant="list" onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />)}
          </div>
        </details>
      )}

      {relatedReads.length > 0 && (
        <section className="ayna-eco-reads">
          <small>04 / DEEPER DIVES</small><h2>Reads for you.</h2>
          {relatedReads.map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
          ))}
        </section>
      )}

      <section aria-label="Manage your Ecosystem" className="ayna-eco-manage">
        <small>MAKE IT YOURS</small><h2>Keep it current.</h2>
        <p>Update your answers to find new matches. Products already in your Ecosystem stay.</p>
        <button type="button" onClick={onRetake}>Redo intake and add products <span aria-hidden="true">→</span></button>
        <button type="button" className="ayna-eco-reset" onClick={onRequestEcosystemReset}>Reset Ecosystem</button>
      </section>
      <LegalFooter />
    </div>
  );
}
