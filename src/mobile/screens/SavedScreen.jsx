import { useState } from 'react';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct } from '../../data/products.js';
import { getCategoryInsights } from '../utils/shopperProfileData.js';
import MatchRing from '../components/MatchRing.jsx';

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

// Prefers the live quiz-based relevance score (same engine every other
// product card now uses) over a static field, since saved items are rarely
// pre-tagged with one of the candidates above.
function matchPercentFor(item, quizAnswers) {
  const live = getProfileMatchPercentForProduct(item, quizAnswers);
  return live != null ? live : getRealMatchPercent(item);
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

// Same ⚠️-marker / denial-regex classification as getSafetyAlerts()
// (src/mobile/utils/shopperProfileData.js), duplicated in miniature here
// since this card only needs a short label, not the full alert object.
function recallStatus(item) {
  const t = (item?.safety?.recalls || '').trim();
  const flagworthy = t && (t.includes('⚠') || /no formal recalls?\.?\s*note:/i.test(t));
  if (!flagworthy) return { label: 'No active recalls', background: 'var(--ayna-peach)', color: 'var(--ayna-accent-dark)' };
  const deniesRecall = /\b(not been subject to|no)\b[^.]*\brecalls?\b/i.test(t);
  const mentionsRecall = /\brecalls?\b/i.test(t);
  return mentionsRecall && !deniesRecall
    ? { label: 'Active recall', background: 'rgba(180,64,42,.14)', color: '#B4402A' }
    : { label: 'Safety note', background: 'var(--ayna-peach)', color: 'var(--ayna-accent-dark)' };
}

function tagLabel(tag) {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// The single-save state (design ref: "Saved screen A") — a full-width
// editorial card instead of one small tile floating in an otherwise empty
// grid. The "ecosystem gaps" callout only appears when getCategoryInsights()
// (real ecosystem/saved coverage vs. the catalog) actually finds unexplored
// categories — never fabricated placeholder gaps.
function SingleSavedHero({ item, isInEco, onOpen, onRemove, onAddToEcosystem, gaps, onGoEco, quizAnswers, onOpenWhyMatch }) {
  const match = matchPercentFor(item, quizAnswers);
  const image = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : undefined);
  // Saved items are persisted through compactProduct() (savedProductsStore.js,
  // shared with the desktop site), which doesn't carry `safety` or `tags` —
  // only shown here when a full catalog object slipped through with them
  // intact, never asserted as "no recalls" when we simply have no data.
  const recall = item.safety ? recallStatus(item) : null;
  const prefTag = Array.isArray(item.tags) && item.tags.length ? item.tags[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <article
        onClick={onOpen}
        style={{
          cursor: 'pointer',
          background: 'var(--ayna-surface)',
          border: '1px solid var(--ayna-border)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 6px 22px rgba(41,37,36,.06)',
          animation: 'ay-up .3s ease-out',
        }}
      >
        <div style={{ position: 'relative', height: 230, background: image ? 'var(--ayna-bg-alt)' : 'linear-gradient(160deg,#F3EADC,#EFE3D2)', backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove from saved"
            style={{ position: 'absolute', right: 12, top: 12, width: 38, height: 38, borderRadius: 99, background: 'rgba(255,255,255,.94)', border: '1px solid rgba(26,23,20,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <HeartIcon filled />
          </button>
          <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
            <MatchRing percent={match} size={52} onClick={onOpenWhyMatch ? () => onOpenWhyMatch(item) : undefined} />
          </div>
        </div>
        <div style={{ padding: '17px 18px 19px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>{categoryLabel(item.category)}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, margin: '8px 0 0' }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "'Playfair Display',serif", fontSize: 23, lineHeight: 1.2, color: 'var(--ayna-heading)' }}>{item.name}</div>
            {item.price && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, flex: 'none', color: 'var(--ayna-heading)' }}>{item.price}</div>}
          </div>
          {(item.summary || item.description) && (
            <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginTop: 8 }}>{item.summary || item.description}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
            {prefTag && (
              <div style={{ background: 'rgba(47,107,79,.12)', color: '#2F6B4F', fontSize: 11, padding: '5px 10px', borderRadius: 99 }}>{tagLabel(prefTag)}</div>
            )}
            {recall && (
              <div style={{ background: recall.background, color: recall.color, fontSize: 11, padding: '5px 10px', borderRadius: 99 }}>{recall.label}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div
              onClick={(e) => { e.stopPropagation(); if (!isInEco && onAddToEcosystem) onAddToEcosystem(item); }}
              style={{
                flex: 1,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 13.5,
                padding: 13,
                borderRadius: 99,
                textAlign: 'center',
                cursor: isInEco ? 'default' : 'pointer',
                background: isInEco ? 'var(--ayna-glass-bg)' : 'var(--ayna-cta-bg)',
                color: isInEco ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)',
              }}
            >
              {isInEco ? 'In your ecosystem' : 'Add to my ecosystem'}
            </div>
          </div>
        </div>
      </article>

      {gaps.length > 0 && (
        <div style={{ marginTop: 20, borderRadius: 22, padding: 20, background: 'linear-gradient(140deg,#4E3866,#242A52)', color: '#FFF9F2', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -56, top: -56, width: 190, height: 190, borderRadius: '50%', border: '1px solid rgba(255,255,255,.16)' }} />
          <div style={{ position: 'absolute', right: -16, top: 18, width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)' }} />
          <div style={{ position: 'relative', fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#FFC774' }}>Your ecosystem · {gaps.length} gap{gaps.length === 1 ? '' : 's'}</div>
          <div style={{ position: 'relative', fontFamily: "'Playfair Display',serif", fontSize: 23, lineHeight: 1.25, margin: '8px 0 9px', maxWidth: 235 }}>Saves become a routine once you fill the gaps.</div>
          <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,249,242,.72)', lineHeight: 1.5, maxWidth: 255 }}>{gaps.join(', ')} {gaps.length === 1 ? 'is' : 'are'} still empty for you.</div>
          <div onClick={onGoEco} style={{ position: 'relative', display: 'inline-block', marginTop: 15, background: '#FFC774', color: '#231A12', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, padding: '11px 18px', borderRadius: 99, cursor: 'pointer', animation: 'ay-bob 2.6s ease-in-out infinite' }}>
            See what's missing
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>Saves are private. Only you see this list.</div>
      <div style={{ height: 104 }} />
    </div>
  );
}

function SavedCard({ item, status, onOpen, onRemove, quizAnswers, onOpenWhyMatch }) {
  const badge = BADGE_STYLES[status];
  const match = matchPercentFor(item, quizAnswers);
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
        <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
          <MatchRing percent={match} size={26} onClick={onOpenWhyMatch ? () => onOpenWhyMatch(item) : undefined} />
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginTop: 9 }}>{categoryLabel(item.category)}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, lineHeight: 1.25, marginTop: 4, color: 'var(--ayna-text)' }}>{item.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
        {item.price && <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>{item.price}</div>}
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

export default function SavedScreen({ savedProducts = {}, myProducts = [], products = [], onBack, onBrowse, onOpenProduct, onToggleSaved, onGoEco, onAddToEcosystem, quizAnswers = null, onOpenWhyMatch }) {
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
  const isSingle = items.length === 1;

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
          {isSingle && (
            <div onClick={onBrowse} style={{ flex: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, padding: '10px 17px', borderRadius: 99, cursor: 'pointer', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)' }}>
              Browse
            </div>
          )}
        </div>

        {!isEmpty && !isSingle && (
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
        ) : isSingle ? (
          <SingleSavedHero
            item={withStatus[0].item}
            isInEco={withStatus[0].status === 'eco'}
            onOpen={() => onOpenProduct && onOpenProduct(withStatus[0].item)}
            onRemove={() => onToggleSaved && onToggleSaved(withStatus[0].item)}
            onAddToEcosystem={onAddToEcosystem}
            gaps={getCategoryInsights(myProducts, savedProducts, products).low.map((g) => g.name).slice(0, 3)}
            onGoEco={onGoEco}
            quizAnswers={quizAnswers}
            onOpenWhyMatch={onOpenWhyMatch}
          />
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
                  quizAnswers={quizAnswers}
                  onOpenWhyMatch={onOpenWhyMatch}
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
