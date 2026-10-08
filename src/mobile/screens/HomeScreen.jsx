import ProductCard from '../components/ProductCard.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getPersonalizedProductIds } from '../../data/products.js';
import { ECOSYSTEM_AREAS } from '../data/ecosystemAreas.js';

function areaLabel(key) {
  return ECOSYSTEM_AREAS.find((a) => a.key === key)?.label || key;
}

function MiniEcosystem({ products = [], name = 'You', onOpen }) {
  const areas = [...new Set(products.map((p) => p.areaKey).filter(Boolean))].slice(0, 4);
  return (
    <button type="button" onClick={onOpen} style={{ width: '100%', border: 0, borderRadius: 22, padding: 18, background: 'linear-gradient(145deg,#241C3E 0%,#4D3A63 68%,#A9647A 132%)', color: '#fff', textAlign: 'left', cursor: 'pointer', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .6 }}>Your ecosystem</div>
          <div style={{ marginTop: 5, fontWeight: 760, fontSize: 17 }}>{products.length ? `${products.length} active support${products.length === 1 ? '' : 's'}` : 'Start building yours'}</div>
          <div style={{ marginTop: 5, fontSize: 12, opacity: .68 }}>{areas.length ? areas.map(areaLabel).join(' · ') : 'Products, routines and care in one place'}</div>
        </div>
        <div style={{ position: 'relative', width: 94, height: 94, flex: 'none' }}>
          <div style={{ position: 'absolute', inset: 13, border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', left: 34, top: 34, width: 28, height: 28, borderRadius: '50%', background: '#FFFCF9', color: '#241C3E', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10 }}>{String(name || 'Y').slice(0,1).toUpperCase()}</div>
          {areas.map((a, i) => {
            const pos = [[4,35],[36,1],[67,36],[36,67]][i] || [36,36];
            return <div key={a} style={{ position: 'absolute', left: pos[0], top: pos[1], width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(255,255,255,.52)', background: 'rgba(255,255,255,.12)' }} />;
          })}
        </div>
      </div>
      <div style={{ marginTop: 13, fontSize: 11, fontWeight: 720, opacity: .82 }}>Open ecosystem →</div>
    </button>
  );
}

function CommunityPreview({ product, onCommunity }) {
  const text = String(product?.communityReview || '').trim();
  if (!product || !text) return null;
  const excerpt = text.length > 190 ? `${text.slice(0, 187).trim()}…` : text;
  return (
    <button type="button" onClick={onCommunity} style={{ width: '100%', border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--ayna-bg-alt)', display: 'grid', placeItems: 'center', color: 'var(--ayna-purple)', fontWeight: 800 }}>C</div>
        <div>
          <div style={{ fontWeight: 720, fontSize: 13 }}>Community member</div>
          <div style={{ color: 'var(--ayna-text-faint)', fontSize: 10.5 }}>shared an experience</div>
        </div>
      </div>
      <p style={{ margin: '12px 0 12px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ayna-text)' }}>{excerpt}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--ayna-border)', paddingTop: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, overflow: 'hidden', background: 'var(--ayna-bg-alt)', flex: 'none' }}><ProductImage src={product.image || product.imageUrl || product.images?.[0]} alt={product.name} compact /></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 680, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
          <div style={{ color: 'var(--ayna-text-faint)', fontSize: 10.5, marginTop: 2 }}>View community →</div>
        </div>
      </div>
    </button>
  );
}

export default function HomeScreen({ products = [], articles = [], myProducts = [], name = 'You', quizAnswers = null, onOpenProduct, onOpenArticle, onGoEco, onGoCommunity, onGoExplore, onOpenWhyMatch }) {
  const personalizedIds = new Set(getPersonalizedProductIds(quizAnswers || {}, null));
  const recommendations = (personalizedIds.size ? products.filter((p) => personalizedIds.has(p.id)) : products).slice(0, 6);
  const communityProduct = products.find((p) => String(p?.communityReview || '').trim()) || recommendations[0];
  const article = articles[0];
  const firstName = String(name || 'there').trim() || 'there';

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', paddingBottom: 104, animation: 'ay-page .2s ease-out' }}>
      <header style={{ padding: 'max(20px, env(safe-area-inset-top)) 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.045em', color: 'var(--ayna-heading)' }}>ayna</div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--ayna-deep-space)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>{firstName.slice(0,1).toUpperCase()}</div>
      </header>

      <section style={{ padding: '18px 20px 0' }}>
        <h1 style={{ margin: 0, fontSize: 'calc(26px * var(--ayna-text-scale, 1))', letterSpacing: '-.035em', color: 'var(--ayna-heading)' }}>Good morning, {firstName}.</h1>
        <button type="button" onClick={onGoExplore} style={{ marginTop: 15, width: '100%', height: 48, border: '1px solid var(--ayna-border)', borderRadius: 15, background: '#fff', color: 'var(--ayna-text-faint)', padding: '0 14px', textAlign: 'left', fontSize: 13.5, cursor: 'pointer' }}>What are we figuring out today?</button>
      </section>

      <section style={{ padding: '26px 0 0' }}>
        <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--ayna-heading)' }}>For you</h2>
            <div style={{ color: 'var(--ayna-text-faint)', fontSize: 11.5, marginTop: 3 }}>Based on what matters to you</div>
          </div>
          <button type="button" onClick={onGoExplore} style={{ border: 0, background: 'transparent', color: 'var(--ayna-mauve)', fontSize: 11, fontWeight: 750 }}>See all</button>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
          {recommendations.map((p) => <div key={p.id} style={{ width: 168, flex: '0 0 168px' }}><ProductCard product={p} onClick={() => onOpenProduct?.(p)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} /></div>)}
        </div>
      </section>

      <section style={{ padding: '28px 20px 0' }}><MiniEcosystem products={myProducts} name={firstName} onOpen={onGoEco} /></section>

      {communityProduct?.communityReview && (
        <section style={{ padding: '30px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--ayna-heading)' }}>From the community</h2>
            <button type="button" onClick={onGoCommunity} style={{ border: 0, background: 'transparent', color: 'var(--ayna-mauve)', fontSize: 11, fontWeight: 750 }}>Explore</button>
          </div>
          <CommunityPreview product={communityProduct} onCommunity={onGoCommunity} />
        </section>
      )}

      {article && (
        <section style={{ padding: '30px 20px 0' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18, color: 'var(--ayna-heading)' }}>Worth knowing</h2>
          <button type="button" onClick={() => onOpenArticle?.(article)} style={{ width: '100%', border: 0, borderRadius: 20, background: 'var(--ayna-bg-alt)', padding: 16, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ayna-mauve)', fontWeight: 750 }}>Guide</div>
            <div style={{ marginTop: 7, fontSize: 18, lineHeight: 1.25, fontWeight: 760, color: 'var(--ayna-heading)' }}>{article.title}</div>
            <div style={{ marginTop: 8, color: 'var(--ayna-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{article.summary || article.dek || 'Open this guide to learn more.'}</div>
          </button>
        </section>
      )}
    </div>
  );
}
