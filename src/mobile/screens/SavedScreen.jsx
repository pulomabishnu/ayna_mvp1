import { useState } from 'react';
import { CATEGORY_LABELS } from '../../data/products.js';

/**
 * Mobile port of the "Saved screens B + C" design reference (filled grid +
 * empty state). Badges/filters below are computed from real state already
 * in the app — ecosystem membership (myProducts) and each product's own
 * safety.recalls field — not fabricated. Match % reuses the same
 * normalizePercent/getRealMatchPercent logic as ProductModal.jsx (desktop),
 * duplicated here rather than imported so this file has no dependency on
 * the desktop component's own JSX.
 */

function normalizePercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  if (pct < 0 || pct > 100) return null;
  return Math.round(pct);
}

function getRealMatchPercent(product) {
  const candidates = [
    product?.matchPercentage,
    product?.matchPercent,
    product?.matchScore,
    product?.aynaMatchPercentage,
    product?.aynaMatchPercent,
    product?.aynaMatch,
  ];
  for (const value of candidates) {
    const pct = normalizePercent(value);
    if (pct != null) return pct;
  }
  return null;
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-heading)' }}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.7" strokeLinecap="round" style={{ fill: filled ? 'var(--ayna-brown)' : 'none', stroke: 'var(--ayna-brown)' }}>
      <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--ayna-text-faint)', flex: 'none' }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

const BADGE_STYLES = {
  eco: { background: 'rgba(47,107,79,.92)', color: '#F2F8F4', label: 'IN ECOSYSTEM' },
  new: { background: 'var(--ayna-glass-bg)', color: 'var(--ayna-text-muted)', label: 'NOT TRIED' },
  flag: { background: 'rgba(180,64,42,.92)', color: '#FFF6F2', label: 'RECALL FLAG' },
};

function statusFor(item, ecoIds) {
  if (item?.safety?.recalls) return 'flag';
  if (ecoIds.has(item.id)) return 'eco';
  return 'new';
}

function SavedCard({ item, status, onOpen, onRemove }) {
  const badge = BADGE_STYLES[status];
  const match = getRealMatchPercent(item);
  const image = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : undefined);

  return (
    <article
      onClick={onOpen}
      style={{
        minWidth: 0,
        cursor: 'pointer',
        background: 'var(--ayna-surface)',
        border: '1px solid var(--ayna-border)',
        borderRadius: 18,
        padding: 10,
        boxShadow: '0 1px 2px rgba(41,37,36,.04)',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 13, overflow: 'hidden', background: image ? 'var(--ayna-bg-alt)' : 'linear-gradient(150deg,#F6DCC026,#F6DCC04d)', backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove from saved"
          style={{
            position: 'absolute', right: 8, top: 8, width: 30, height: 30, borderRadius: 99,
            background: 'rgba(255,255,255,.94)', border: '1px solid rgba(26,23,20,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}
        >
          <HeartIcon filled />
        </button>
        <div style={{ position: 'absolute', left: 8, bottom: 8, fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '.8px', padding: '4px 7px', borderRadius: 99, background: badge.background, color: badge.color }}>
          {badge.label}
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginTop: 9 }}>{categoryLabel(item.category)}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, lineHeight: 1.25, marginTop: 4, color: 'var(--ayna-text)' }}>{item.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
        {item.price && <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>{item.price}</div>}
        {match != null && <div style={{ fontSize: 11.5, color: '#2F6B4F' }}>{match}%</div>}
      </div>
    </article>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'eco', label: 'In ecosystem' },
  { key: 'new', label: 'Not tried' },
  { key: 'flag', label: 'Flagged' },
];

export default function SavedScreen({ savedProducts = {}, myProducts = [], onBack, onBrowse, onOpenProduct, onToggleSaved, onGoEco }) {
  const [filter, setFilter] = useState('all');
  const items = Object.values(savedProducts);
  const ecoIds = new Set(myProducts.map((p) => p.id));
  const withStatus = items.map((item) => ({ item, status: statusFor(item, ecoIds) }));

  const counts = {
    all: withStatus.length,
    eco: withStatus.filter((x) => x.status === 'eco').length,
    new: withStatus.filter((x) => x.status === 'new').length,
    flag: withStatus.filter((x) => x.status === 'flag').length,
  };
  const visible = filter === 'all' ? withStatus : withStatus.filter((x) => x.status === filter);
  const notInEcoCount = withStatus.length - counts.eco;
  const isEmpty = items.length === 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      <div
        style={{
          flex: 'none',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: isEmpty ? 12 : 14,
          borderBottom: isEmpty ? 'none' : '1px solid var(--ayna-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={onBack}
            style={{ width: 36, height: 36, flex: 'none', borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <BackIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, color: 'var(--ayna-heading)' }}>Saved</div>
            {!isEmpty && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1px', color: 'var(--ayna-accent-dark)', background: 'var(--ayna-peach)', borderRadius: 99, padding: '4px 8px' }}>
                {items.length} ITEM{items.length === 1 ? '' : 'S'}
              </div>
            )}
          </div>
        </div>

        {!isEmpty && (
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginTop: 14, paddingBottom: 2 }}>
            {FILTERS.map((f) => (
              <div
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  flex: 'none',
                  fontSize: 12,
                  padding: '7px 13px',
                  borderRadius: 99,
                  cursor: 'pointer',
                  border: '1px solid ' + (filter === f.key ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'),
                  background: filter === f.key ? 'var(--ayna-cta-bg)' : 'transparent',
                  color: filter === f.key ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                  fontWeight: filter === f.key ? 600 : 400,
                }}
              >
                {f.label} {counts[f.key]}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isEmpty ? '10px 22px 30px' : '16px 20px 0' }}>
        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: 210, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,199,116,.42),rgba(255,199,116,0) 68%)', animation: 'ay-drift 16s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '1px solid var(--ayna-border)' }} />
              <svg width="58" height="58" viewBox="0 0 24 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', stroke: 'var(--ayna-accent-dark)' }}>
                <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
              </svg>
            </div>

            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 29, lineHeight: 1.2, margin: '4px 0 0', textAlign: 'center', color: 'var(--ayna-heading)' }}>Nothing saved yet.</div>
            <div style={{ margin: '10px 0 0', padding: '0 12px', fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
              Tap the heart on anything in Browse. We'll watch it for recalls and price drops while it sits here.
            </div>
            <div
              onClick={onBrowse}
              style={{ marginTop: 22, display: 'block', width: '100%', textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, padding: 14, borderRadius: 99, cursor: 'pointer', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)' }}
            >
              Browse products
            </div>

            <div style={{ marginTop: 30, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Start from your profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
              <div onClick={onBrowse} style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 18, padding: '14px 15px', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, flex: 'none', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 17, background: 'var(--ayna-peach)', color: 'var(--ayna-accent-dark)' }}>1</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ayna-text)' }}>Cycle support</div>
                  <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>Your most-viewed category</div>
                </div>
                <ChevronIcon />
              </div>
              <div onClick={onGoEco} style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 18, padding: '14px 15px', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, flex: 'none', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 17, background: '#E7E3F2', color: 'var(--ayna-purple)' }}>2</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ayna-text)' }}>Your ecosystem gaps</div>
                  <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>See what's still missing</div>
                </div>
                <ChevronIcon />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {visible.map(({ item, status }) => (
                <SavedCard
                  key={item.id}
                  item={item}
                  status={status}
                  onOpen={() => onOpenProduct && onOpenProduct(item)}
                  onRemove={() => onToggleSaved && onToggleSaved(item)}
                />
              ))}
            </div>

            {notInEcoCount > 0 && (
              <div style={{ margin: '22px 0 0', border: '1px dashed var(--ayna-border)', borderRadius: 22, padding: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, lineHeight: 1.3, margin: '0 0 5px', color: 'var(--ayna-heading)' }}>Ready to make these a routine?</div>
                <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5, margin: '0 0 13px' }}>
                  Move {notInEcoCount} save{notInEcoCount === 1 ? '' : 's'} into your ecosystem to get recall alerts on {notInEcoCount === 1 ? 'it' : 'them'}.
                </div>
                <div onClick={onGoEco} style={{ display: 'inline-block', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, padding: '11px 18px', borderRadius: 99, cursor: 'pointer', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)' }}>
                  Sort into ecosystem
                </div>
              </div>
            )}

            <div style={{ height: 104 }} />
          </>
        )}
      </div>
    </div>
  );
}
