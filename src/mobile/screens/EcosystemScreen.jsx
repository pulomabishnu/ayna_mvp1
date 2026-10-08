import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import EcosystemOrbit from '../components/EcosystemOrbit.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';

export default function EcosystemScreen({
  myProducts = [],
  name = 'You',
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
  const listTitle = showingArea ? selectedSeat.label : 'In your ecosystem';
  const listProducts = showingArea ? selectedSeat.products : myProducts;

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 44, background: 'var(--ayna-bg)', animation: 'ay-page .2s ease-out' }}>
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onOpenProfile={onOpenProfile} />

      <section style={{ padding: '18px 20px 0' }}>
        <h1 style={{ margin: 0, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', letterSpacing: '-.035em', color: 'var(--ayna-heading)' }}>Your ecosystem</h1>
        <p style={{ margin: '5px 0 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Everything supporting you right now.</p>
      </section>

      <section style={{ margin: '18px 20px 0', borderRadius: 24, background: 'linear-gradient(145deg,#241C3E 0%,#4D3A63 64%,#A9647A 130%)', color: '#fff', overflow: 'hidden', padding: '18px 8px 14px', boxShadow: '0 16px 36px rgba(36,28,62,.16)' }}>
        <div style={{ padding: '0 12px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.11em', opacity: .58 }}>Personal health map</div>
            <div style={{ marginTop: 5, fontWeight: 750, fontSize: 17 }}>{showingArea ? selectedSeat.label : `${myProducts.length} active support${myProducts.length === 1 ? '' : 's'}`}</div>
          </div>
          {showingArea && <button type="button" onClick={() => setSelectedKey(null)} style={{ border: '1px solid rgba(255,255,255,.24)', background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: 999, padding: '7px 10px', fontWeight: 700, fontSize: 10.5 }}>Show all</button>}
        </div>
        <EcosystemOrbit products={myProducts} name={name} selectedKey={selectedKey} onSelectKey={setSelectedKey} onSelect={setSelectedSeat} onExploreArea={onBrowse} />
        <div style={{ textAlign: 'center', fontSize: 10.5, opacity: .6, marginTop: -5 }}>Tap an area to focus your ecosystem</div>
      </section>

      <section style={{ padding: '28px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{listTitle}</h2>
          <span style={{ color: 'var(--ayna-text-faint)', fontSize: 11.5 }}>{listProducts.length} item{listProducts.length === 1 ? '' : 's'}</span>
        </div>
        <div>
          {listProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} variant="list" onClick={() => onOpenProduct?.(p)} quizAnswers={quizAnswers} onOpenWhyMatch={onOpenWhyMatch} />)}
        </div>
        <button type="button" onClick={onBrowse} style={{ width: '100%', marginTop: 16, border: '1px solid var(--ayna-border)', background: '#fff', color: 'var(--ayna-deep-space)', borderRadius: 13, minHeight: 46, fontWeight: 750, cursor: 'pointer' }}>+ Add something</button>
      </section>

      {relatedReads.length > 0 && (
        <section style={{ padding: '30px 20px 0' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 'calc(18px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>Worth knowing</h2>
          <ArticleCard article={relatedReads[0]} onClick={() => onOpenArticle?.(relatedReads[0])} />
        </section>
      )}

      <section style={{ padding: '28px 20px 0' }}>
        <div style={{ borderTop: '1px solid var(--ayna-border)', paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={onOpenMonthlyCheckin} style={{ minHeight: 44, borderRadius: 12, border: 0, background: 'var(--ayna-deep-space)', color: '#fff', fontWeight: 750 }}>Monthly check-in</button>
          <button type="button" onClick={onRetake} style={{ minHeight: 44, borderRadius: 12, border: '1px solid var(--ayna-border)', background: '#fff', color: 'var(--ayna-text)', fontWeight: 700 }}>Update profile</button>
        </div>
      </section>
      <LegalFooter />
    </div>
  );
}
