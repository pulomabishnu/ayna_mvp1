import ProductImage from '../components/ProductImage.jsx';

const colors = {
  cream: '#FAF6F1',
  navy: '#242A52',
  muted: '#5E564E',
};

export default function RevealScreen({ myProducts = [], topAreas = [], onContinue, onBack, onGoBrowse }) {
  const preview = myProducts.slice(0, 3);
  const hasMatches = preview.length > 0;

  return (
    <main style={{ flex: 1, minHeight: '100dvh', overflowY: 'auto', background: colors.cream, color: colors.navy, fontFamily: "'DM Sans',sans-serif", padding: 'max(20px, env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button type="button" onClick={onBack} aria-label="Back to your health answers" style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #CFC3B4', background: '#fff', color: colors.navy, fontSize: 23, cursor: 'pointer' }}>
          <span aria-hidden="true">‹</span>
        </button>

        <div style={{ marginTop: 24, color: '#A2603C', fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Your results</div>
        <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 36, lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 700, margin: '8px 0 12px' }}>
          {hasMatches ? 'Your first matches' : 'Your answers are in'}
        </h1>
        <p style={{ margin: 0, color: colors.muted, fontSize: 16, lineHeight: 1.5 }}>
          {hasMatches
            ? 'Here are products selected from the needs you shared. See what they are before deciding whether to make an account.'
            : 'We could not find a confident product match yet. You can revisit your answers or explore the full catalog.'}
        </p>

        {topAreas.length > 0 && <div aria-label="Areas in your profile" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {topAreas.slice(0, 4).map((area) => <span key={area} style={{ padding: '7px 10px', border: '1px solid #E6DDD1', borderRadius: 10, background: '#fff', color: colors.navy, fontSize: 13, fontWeight: 600 }}>{area}</span>)}
        </div>}

        {hasMatches && <section aria-labelledby="reveal-matches-title" style={{ marginTop: 30 }}>
          <h2 id="reveal-matches-title" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, letterSpacing: '-.04em', fontWeight: 700, margin: '0 0 14px' }}>Picked for your profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 13 }}>
            {preview.map((product) => (
              <article key={product.id} style={{ minWidth: 0 }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: '#F3ECE2', borderRadius: 14, overflow: 'hidden' }}>
                  <ProductImage src={product.image || product.imageUrl} alt={product.name} allowBrandLogo={product.type === 'digital'} style={{ objectFit: 'contain' }} />
                </div>
                <div style={{ minWidth: 0, paddingTop: 9 }}>
                  <div style={{ color: colors.muted, fontSize: 12, lineHeight: 1.3 }}>{product.brand || String(product.category || '').replaceAll('-', ' ')}</div>
                  <div style={{ color: colors.navy, fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginTop: 4 }}>{product.name}</div>
                </div>
              </article>
            ))}
          </div>
          {myProducts.length > preview.length && <p style={{ color: colors.muted, fontSize: 13, margin: '12px 0 0' }}>And {myProducts.length - preview.length} more in your Ecosystem.</p>}
        </section>}

        <div style={{ marginTop: 30, display: 'grid', gap: 10 }}>
          {hasMatches && <button type="button" onClick={onContinue} style={{ minHeight: 52, width: '100%', border: 0, borderRadius: 10, background: colors.navy, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Create an account to save my Ecosystem</button>}
          <button type="button" onClick={onGoBrowse} style={{ minHeight: 44, width: '100%', border: '1px solid #CFC3B4', borderRadius: 10, background: 'transparent', color: colors.navy, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Browse products</button>
          {!hasMatches && <button type="button" onClick={onBack} style={{ minHeight: 44, width: '100%', border: 0, background: 'transparent', color: colors.navy, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Update my answers</button>}
        </div>
      </div>
    </main>
  );
}
