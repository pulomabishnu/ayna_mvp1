import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out' }}>
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

      <div className="ayna-editorial-page-title">
        <p className="ayna-editorial-kicker">{getTimeGreeting()}, {name}</p>
        <h1>Your <em>Ecosystem.</em></h1>
        <p>Thoughtful picks based on what you shared.</p>
        {ecosystemNotice && <p role="status" style={{ margin: '12px 0 0', padding: '11px 14px', borderRadius: 14, background: 'var(--ayna-peach)', color: 'var(--ayna-heading)', fontSize: 13, lineHeight: 1.45 }}>{ecosystemNotice}</p>}
      </div>

      <button type="button" className="ayna-v2-eco-feature" onClick={featuredProduct ? () => onOpenProduct?.(featuredProduct) : onBrowse}>
        <span className="ayna-v2-eco-feature-copy">
          <small>{featuredProduct ? 'A PICK FOR YOU / 01' : 'YOUR SPACE TO DISCOVER'}</small>
          <strong>{featuredProduct ? featuredProduct.name : 'Find your next good thing.'}</strong>
          <span>See the details ↗</span>
        </span>
        {featuredImage && <span className="ayna-v2-eco-feature-image"><ProductImage src={featuredImage} alt="" allowBrandLogo={featuredProduct?.type === 'digital'} style={{ objectFit: 'contain' }} /></span>}
      </button>

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', letterSpacing: '-.04em' }}>Your picks</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--ayna-text-muted)' }}>{gridProducts.length} product{gridProducts.length === 1 ? '' : 's'}</div>
        </div>
        <div className="ayna-editorial-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
          {gridProducts.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => onOpenProduct && onOpenProduct(p)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />
          ))}
        </div>
        {matchedProducts.length === 0 && <p style={{ color: 'var(--ayna-text-muted)', fontSize: 13, lineHeight: 1.5 }}>No strong matches are saved yet. Explore the recommendations below or update your intake answers.</p>}
      </div>

      {suggestedEcosystemProducts.length > 0 && (
        <section aria-label="Top matches to add" style={{ padding: '24px 20px 0' }}>
          <h2 style={{ margin: '0 0 5px', fontFamily: "'Playfair Display',serif", fontSize: 21, color: 'var(--ayna-heading)' }}>Top matches to add</h2>
          <p style={{ margin: '0 0 13px', color: 'var(--ayna-text-muted)', fontSize: 13, lineHeight: 1.5 }}>Ranked from your intake answers. Add the ones you want in your Ecosystem.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
            {suggestedEcosystemProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />
                <button type="button" onClick={() => onAddToEcosystem?.(product)} style={{ width: '100%', minHeight: 44, marginTop: 7, border: '1px solid var(--ayna-border)', borderRadius: 999, background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', fontWeight: 700, cursor: 'pointer' }}>Add to Ecosystem</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {olderProducts.length > 0 && (
        <details style={{ margin: '22px 20px 0', padding: '14px 16px', border: '1px solid var(--ayna-border)', borderRadius: 18, background: 'var(--ayna-surface)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--ayna-heading)' }}>Earlier picks · {olderProducts.length}</summary>
          <p style={{ color: 'var(--ayna-text-muted)', fontSize: 13, lineHeight: 1.5 }}>These are still saved, but they do not strongly match your current answers. Open a product to review or remove it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
            {olderProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} onOpenWhyMatch={onOpenWhyMatch} />)}
          </div>
        </details>
      )}

      {relatedReads.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', marginBottom: 12 }}>Reads for you</div>
          {relatedReads.map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
          ))}
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <CtaBanner title="Update Ayna on your health" buttonLabel="Monthly check-in" onClick={onOpenMonthlyCheckin} />
      </div>

      <section aria-label="Manage your Ecosystem" style={{ margin: '24px 20px 0', padding: 18, borderRadius: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 20, color: 'var(--ayna-heading)' }}>Manage your Ecosystem</h2>
        <p style={{ margin: '8px 0 14px', color: 'var(--ayna-text-muted)', fontSize: 13, lineHeight: 1.5 }}>Update your answers and find new matches. Products already in your Ecosystem will stay.</p>
        <button type="button" onClick={onRetake} style={{ width: '100%', padding: 13, border: 0, borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 700, cursor: 'pointer' }}>Redo intake and add products</button>
        <button type="button" onClick={onRequestEcosystemReset} style={{ width: '100%', marginTop: 10, padding: 11, border: 0, background: 'transparent', color: '#994739', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Reset Ecosystem</button>
      </section>
      <LegalFooter />
    </div>
  );
}
