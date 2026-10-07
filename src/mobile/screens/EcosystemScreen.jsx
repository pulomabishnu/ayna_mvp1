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
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const showingArea = selectedSeat && !selectedSeat.gap;
  const gridTitle = showingArea ? selectedSeat.label : 'In your Ecosystem';
  const gridProducts = showingArea ? selectedSeat.products : myProducts;
  const savedList = Object.values(savedProducts || {});
  const nextSaved = savedList[0];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out' }}>
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.3 }}>
          {getTimeGreeting()}, {name}
        </div>
        {ecosystemNotice && <p role="status" style={{ margin: '12px 0 0', padding: '11px 14px', borderRadius: 14, background: 'var(--ayna-peach)', color: 'var(--ayna-heading)', fontSize: 13, lineHeight: 1.45 }}>{ecosystemNotice}</p>}
      </div>

      <section aria-label="Your next steps" style={{ margin: '18px 20px 0', padding: 18, borderRadius: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 7 }}>Your next steps</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', lineHeight: 1.25 }}>
          {nextSaved ? 'Pick up where you left off' : 'Make this space yours'}
        </div>
        <p style={{ margin: '8px 0 14px', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.5 }}>
          {nextSaved ? `${savedList.length} saved product${savedList.length === 1 ? '' : 's'} in your shortlist. Revisit one when you’re ready.` : 'Save products you want to revisit, and check in when your needs change.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={nextSaved ? () => onOpenProduct?.(nextSaved) : onBrowse} style={{ border: 0, borderRadius: 99, padding: '10px 14px', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: 'pointer' }}>
            {nextSaved ? `View ${nextSaved.name || 'saved product'}` : 'Explore products'}
          </button>
          <button type="button" onClick={nextSaved ? onOpenSaved : onOpenMonthlyCheckin} style={{ border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '10px 14px', background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: 'pointer' }}>
            {nextSaved ? 'Your saved list' : 'Monthly check-in'}
          </button>
        </div>
      </section>

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
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(16px * var(--ayna-text-scale, 1))' }}>{gridTitle}</div>
          {showingArea ? (
            <div onClick={() => setSelectedKey(null)} style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', color: '#A2603C', cursor: 'pointer' }}>
              Show all
            </div>
          ) : (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', color: '#78716C' }}>
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
