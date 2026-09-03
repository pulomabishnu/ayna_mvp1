import ProductCard from '../components/ProductCard.jsx';

export default function SavedScreen({ savedProducts = {}, onBack, onBrowse, onOpenProduct }) {
  const items = Object.values(savedProducts);
  const isEmpty = items.length === 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F3EFE9', animation: 'ay-page .25s ease-out' }}>
      <div style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, paddingBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            background: '#FFFFFF',
            border: '1px solid #E1D5CE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 23 }}>Saved</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#78716C' }}>{items.length}</div>
          <div
            onClick={onBrowse}
            style={{
              padding: '8px 14px',
              borderRadius: 99,
              background: '#FFFFFF',
              border: '1px solid #E1D5CE',
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Browse
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>
        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 30px 0', textAlign: 'center' }}>
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: 99,
                background: '#FFEFD6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8A94F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
              </svg>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 16 }}>Nothing saved yet</div>
            <div style={{ fontSize: 13, color: '#78716C', marginTop: 5, lineHeight: 1.5 }}>Tap the heart on any product.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onOpenProduct && onOpenProduct(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
