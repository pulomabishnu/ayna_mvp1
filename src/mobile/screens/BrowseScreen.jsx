import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import CategoryChips from '../components/CategoryChips.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';

function ModeTab({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        paddingBottom: 10,
        color: active ? '#292524' : '#A8A29E',
        borderBottom: '2px solid ' + (active ? '#FFC774' : 'transparent'),
        marginBottom: -1,
      }}
    >
      {label}
    </div>
  );
}

export default function BrowseScreen({
  products = [],
  ctaVariant = 'gradient',
  headerInitial = 'A',
  searchValue,
  onSearchChange,
  onOpenProduct,
  onOpenSaved,
  onGoEco,
  onStartQuiz,
}) {
  const [mode, setMode] = useState('products');
  const [category, setCategory] = useState('All');

  const filtered = category === 'All' ? products : products.filter((p) => p.category === category);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px', animation: 'ay-page .25s ease-out' }}>
      <MobileHeader
        variant="light"
        activeTab="browse"
        initial={headerInitial}
        onOpenSaved={onOpenSaved}
        onGoEco={onGoEco}
      />

      <SearchBar value={searchValue} onChange={onSearchChange} />

      <div style={{ display: 'flex', gap: 18, padding: '0 20px 12px', borderBottom: '1px solid #E1D5CE', margin: '0 0 14px' }}>
        <ModeTab label="Products" active={mode === 'products'} onClick={() => setMode('products')} />
        <ModeTab label="Reads" active={mode === 'reads'} onClick={() => setMode('reads')} />
      </div>

      {ctaVariant !== 'none' && (ctaVariant === 'gradient' || ctaVariant === 'inline') ? (
        <CtaBanner variant={ctaVariant} onClick={onStartQuiz} />
      ) : null}

      {mode === 'products' ? (
        <>
          <CategoryChips active={category} onSelect={setCategory} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11, padding: '0 20px' }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onOpenProduct && onOpenProduct(p)} />
            ))}
          </div>
          <div
            style={{
              margin: '22px 20px 0',
              textAlign: 'center',
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 0.8,
              color: '#A8A29E',
            }}
          >
            ALL OTC · NOT A DIAGNOSIS
          </div>
        </>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#78716C', fontSize: 13.5 }}>
          Reads coming soon.
        </div>
      )}
    </div>
  );
}
