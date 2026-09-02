import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import EcosystemOrbit from '../components/EcosystemOrbit.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';

export default function EcosystemScreen({
  myProducts = [],
  name = 'You',
  tags = '',
  relatedReads = [],
  headerInitial = 'A',
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onBrowse,
  onRetake,
}) {
  const [selectedSeat, setSelectedSeat] = useState(null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out' }}>
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} />

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, lineHeight: 1.3 }}>
          {`Good morning, ${name}`}
        </div>
        <div style={{ fontSize: 12.5, color: '#78716C', marginTop: 5, lineHeight: 1.5 }}>
          Built from what's in your ecosystem — shifts as you add to it.
        </div>
      </div>

      <div style={{ padding: '18px 20px 0' }}>
        <EcosystemOrbit products={myProducts} name={name} tags={tags} onSelect={setSelectedSeat} onExploreArea={onBrowse} />
      </div>

      {selectedSeat && !selectedSeat.gap && (
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 16 }}>{selectedSeat.label}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10.5, color: '#78716C' }}>
              {selectedSeat.products.length} product{selectedSeat.products.length === 1 ? '' : 's'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
            {selectedSeat.products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onOpenProduct && onOpenProduct(p)} />
            ))}
          </div>
        </div>
      )}

      {relatedReads.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Reads for you</div>
          {relatedReads.map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
          ))}
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <div
          onClick={onRetake}
          style={{
            textAlign: 'center',
            padding: 14,
            border: '1px solid #E1D5CE',
            borderRadius: 99,
            fontSize: 13.5,
            color: '#78716C',
            cursor: 'pointer',
          }}
        >
          Retake the intake
        </div>
      </div>
    </div>
  );
}
