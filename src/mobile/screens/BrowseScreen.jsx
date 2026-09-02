import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import CategoryChips from '../components/CategoryChips.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { ARTICLE_CATEGORIES } from '../data/articleRows.js';

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
  articles = [],
  ctaVariant = 'gradient',
  headerInitial = 'A',
  searchValue,
  onSearchChange,
  onOpenProduct,
  onOpenArticle,
  onOpenSaved,
  onGoEco,
  onStartQuiz,
  hasEcosystem = false,
}) {
  const [mode, setMode] = useState('products');
  const [category, setCategory] = useState('all');

  // Real macro-group matching (category + keyword scanning, via the site's
  // existing itemMatchesMacroGroup in Discovery.jsx) is intentionally NOT
  // reimplemented here — deferred until real product data is wired into
  // this screen, at which point it should be reused rather than duplicated.
  // Until then, every chip shows the full list; only the active/highlighted
  // state is real.
  const filtered = products;

  const articlesById = new Map(articles.map((a) => [a.id, a]));
  const rows = ARTICLE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.articleIds.map((id) => articlesById.get(id)).filter(Boolean),
  })).filter((row) => row.items.length > 0);

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

      {/* Once the ecosystem exists, Browse stays pure browsing — the
          "update your health" prompt lives on the Ecosystem screen instead,
          after its Reads section. */}
      {!hasEcosystem && ctaVariant !== 'none' && (ctaVariant === 'gradient' || ctaVariant === 'inline') ? (
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
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#78716C', fontSize: 13.5 }}>
          No reads yet.
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.id} style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 20px 11px' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 17 }}>{row.label}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
              {row.items.map((a) => (
                <LibraryCard key={a.id} article={a} onClick={() => onOpenArticle && onOpenArticle(a)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
