import MobileHeader from '../components/MobileHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';

function excerpt(text, max = 280) {
  const t = String(text || '').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

function CommunityPost({ product, onOpenProduct }) {
  const image = product?.image || product?.imageUrl || product?.images?.[0];
  const text = excerpt(product?.communityReview || product?.summary || '');
  if (!text) return null;
  return (
    <article style={{ padding: '18px 20px 20px', borderBottom: '1px solid var(--ayna-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--ayna-bg-alt)', color: 'var(--ayna-purple)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>C</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 750, fontSize: 13 }}>Community member</div>
          <div style={{ marginTop: 2, color: 'var(--ayna-text-faint)', fontSize: 10.5 }}>shared a product experience</div>
        </div>
        <button type="button" aria-label="More" style={{ border: 0, background: 'transparent', color: 'var(--ayna-text-faint)', fontSize: 20, cursor: 'pointer' }}>···</button>
      </div>

      <p style={{ margin: '14px 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ayna-text)' }}>{text}</p>

      <button type="button" onClick={() => onOpenProduct?.(product)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: 10, borderRadius: 14, border: '1px solid var(--ayna-border)', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
        <div style={{ width: 52, height: 52, borderRadius: 11, overflow: 'hidden', background: 'var(--ayna-bg-alt)', flex: 'none' }}><ProductImage src={image} alt={product.name} compact /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ayna-text-faint)' }}>{product.brand || String(product.name || '').split(' ')[0]}</div>
          <div style={{ marginTop: 3, fontWeight: 720, fontSize: 12.5, lineHeight: 1.25 }}>{product.name}</div>
        </div>
        <div style={{ color: 'var(--ayna-purple)', fontSize: 16 }}>›</div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingTop: 13, color: 'var(--ayna-text-muted)' }}>
        <button type="button" style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', fontSize: 16, cursor: 'pointer' }}>♡</button>
        <button type="button" style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', fontSize: 15, cursor: 'pointer' }}>◯</button>
        <button type="button" style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', fontSize: 15, marginLeft: 'auto', cursor: 'pointer' }}>↗</button>
        <button type="button" style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', fontSize: 15, cursor: 'pointer' }}>♡</button>
      </div>
    </article>
  );
}

export default function CommunityScreen({ products = [], headerInitial = 'A', onOpenSaved, onOpenProfile, onOpenProduct }) {
  const posts = products.filter((p) => String(p?.communityReview || '').trim()).slice(0, 8);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', paddingBottom: 104, animation: 'ay-page .2s ease-out' }}>
      <MobileHeader variant="light" initial={headerInitial} onOpenSaved={onOpenSaved} onOpenProfile={onOpenProfile} />
      <section style={{ padding: '14px 20px 0' }}>
        <h1 style={{ margin: 0, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', letterSpacing: '-.035em', color: 'var(--ayna-heading)' }}>Community</h1>
        <div style={{ display: 'flex', gap: 18, marginTop: 16, borderBottom: '1px solid var(--ayna-border)' }}>
          {['For You', 'Following', 'Questions', 'Reviews'].map((tab, i) => <button key={tab} type="button" style={{ position: 'relative', border: 0, background: 'transparent', padding: '0 0 11px', color: i === 0 ? 'var(--ayna-deep-space)' : 'var(--ayna-text-faint)', fontWeight: i === 0 ? 750 : 600, fontSize: 12, cursor: 'pointer' }}>{tab}{i === 0 && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: 'var(--ayna-purple)' }} />}</button>)}
        </div>
      </section>

      <section style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--ayna-border)' }}>
        <button type="button" style={{ width: '100%', border: 0, background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ayna-deep-space)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11 }}>{headerInitial}</div>
          <div style={{ flex: 1, border: '1px solid var(--ayna-border)', borderRadius: 15, padding: '12px 13px', color: 'var(--ayna-text-faint)', background: '#fff', fontSize: 12.5 }}>Ask a question or share an experience…</div>
        </button>
      </section>

      {posts.length ? posts.map((p) => <CommunityPost key={p.id} product={p} onOpenProduct={onOpenProduct} />) : (
        <div style={{ padding: '44px 20px', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Community experiences will appear here as they’re available.</div>
      )}
    </div>
  );
}
