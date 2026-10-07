import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import EcosystemOrbit from '../components/EcosystemOrbit.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import LegalFooter from '../components/LegalFooter.jsx';

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
  onOpenMonthlyCheckin,
  onOpenProfile,
  quizAnswers = null,
  onOpenWhyMatch,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const showingArea = selectedSeat && !selectedSeat.gap;
  const gridTitle = showingArea ? selectedSeat.label : 'In your ecosystem';
  const gridProducts = showingArea ? selectedSeat.products : myProducts;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out', background: '#FFFCF9' }}>
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onOpenProfile={onOpenProfile} />

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 650, fontSize: 'calc(24px * var(--ayna-text-scale, 1))', lineHeight: 1.2, color: '#241C3E' }}>
          Your ecosystem
        </div>
        <div style={{ marginTop: 5, fontFamily: "'Inter',sans-serif", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: '#78716C' }}>
          Everything supporting you right now.
        </div>
      </div>

      <div style={{ padding: '10px 20px 0' }}>
        <EcosystemOrbit
          products={myProducts}
          name={name}
          tags={tags}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
          onSelect={setSelectedSeat}
          onExploreArea={onBrowse}
        />
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(16px * var(--ayna-text-scale, 1))' }}>{gridTitle}</div>
          {showingArea ? (
            <div onClick={() => setSelectedKey(null)} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: '#4D3A63', cursor: 'pointer' }}>
              Show all
            </div>
          ) : (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: '#78716C' }}>
              {gridProducts.length} item{gridProducts.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
          {gridProducts.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => onOpenProduct && onOpenProduct(p)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} />
          ))}
        </div>
      </div>

      {relatedReads.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', marginBottom: 12 }}>Worth knowing</div>
          {relatedReads.map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
          ))}
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <CtaBanner title="Anything changed?" buttonLabel="Monthly check-in" onClick={onOpenMonthlyCheckin} />
      </div>

      <div style={{ padding: '4px 20px 0' }}>
        <div
          onClick={onRetake}
          style={{
            textAlign: 'center',
            padding: 14,
            border: '1px solid #E7E0DB',
            borderRadius: 12,
            fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))',
            color: '#78716C',
            cursor: 'pointer',
            background: '#FFFFFF',
          }}
        >
          Update my health profile
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
