import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import EcosystemOrbit from '../components/EcosystemOrbit.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import LegalFooter from '../components/LegalFooter.jsx';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const gridTitle = showingArea ? selectedSeat.label : 'Matched for you';
  const gridProducts = showingArea ? selectedSeat.products : myProducts;

  return (
    // Same purple→orange hero as the landing page and intake (2026-09-22
    // request). The gradient is on the scroll container, so it stays put
    // while the content scrolls over it.
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px', animation: 'ay-page .25s ease-out', background: 'var(--ayna-gradient-hero, linear-gradient(165deg,#2A1F4E 0%,#4E3866 42%,#8A4A3C 74%,#D97A2B 100%))', color: '#FFF9F2' }}>
      <MobileHeader variant="dark" transparent activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onOpenProfile={onOpenProfile} />

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.3, color: '#FFF9F2' }}>
          {getTimeGreeting()}, {name}
        </div>
      </div>

      <div style={{ padding: '18px 20px 0' }}>
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

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(16px * var(--ayna-text-scale, 1))', color: '#FFF9F2' }}>{gridTitle}</div>
          {showingArea ? (
            <div onClick={() => setSelectedKey(null)} style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', color: '#FFC774', cursor: 'pointer' }}>
              Show all
            </div>
          ) : (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', color: 'rgba(255,249,242,.72)' }}>
              {gridProducts.length} product{gridProducts.length === 1 ? '' : 's'}
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
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', marginBottom: 12, color: '#FFF9F2' }}>Reads for you</div>
          {relatedReads.map((a) => (
            <ArticleCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
          ))}
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <CtaBanner title="Update Ayna on your health" buttonLabel="Monthly check-in" onClick={onOpenMonthlyCheckin} />
      </div>

      <div style={{ padding: '4px 20px 0' }}>
        <div
          onClick={onRetake}
          style={{
            textAlign: 'center',
            padding: 14,
            border: '1px solid rgba(255,249,242,.4)',
            borderRadius: 99,
            fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))',
            color: '#FFF9F2',
            cursor: 'pointer',
          }}
        >
          Retake the intake
        </div>
      </div>
      <LegalFooter variant="light" />
    </div>
  );
}
