import { useState } from 'react';
import { CATEGORY_LABELS } from '../../data/products.js';
import { getBuyUrl } from '../data/buyUrl.js';

function SpecRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '15px 0', borderBottom: '1px solid #E1D5CE' }}>
      <div style={{ fontSize: 13.5, color: '#A8A29E', flex: 'none', width: 82 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: '#292524', textAlign: 'right' }}>{value}</div>
    </div>
  );
}

function EvidenceRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderTop: '1px solid #F3EFE9' }}>
      <div style={{ fontSize: 13.5, color: '#292524' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#57534E', textDecoration: 'underline', textDecorationColor: '#D8CBC2' }}>{value}</div>
    </div>
  );
}

const VERIFICATION_LABELS = { doctor: 'Clinical guidance', scientific: 'Scientific', community: 'Community' };

export default function ProductDetailScreen({
  product,
  onBack,
  isSaved = false,
  onToggleSaved,
  isInEcosystem = false,
  onAddToEcosystem,
  whyMatched,
  reads = [],
}) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#78716C', fontSize: 13.5 }}>
        No product selected.
      </div>
    );
  }

  const {
    name,
    category,
    price,
    image,
    summary,
    ingredients,
    effectiveness,
    doctorOpinion,
    clinicianAttribution,
    safety = {},
    badges = [],
    whereToBuy = [],
    verificationLinks = {},
  } = product;

  const categoryLabel = CATEGORY_LABELS[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
  const buyUrl = getBuyUrl(product);
  const safetyNote = safety.sideEffects || safety.allergens || safety.recalls || safety.opinionAlerts || null;

  const specRows = [
    summary && { label: 'Summary', value: summary },
    effectiveness && { label: 'Effectiveness', value: effectiveness },
    safetyNote && { label: 'Safety note', value: safetyNote },
    !buyUrl && whereToBuy.length > 0 && { label: 'Where to buy', value: whereToBuy.join(' · ') },
  ].filter(Boolean);

  const evidenceRows = [
    ...Object.entries(verificationLinks).map(([key, entry]) => {
      const count = Array.isArray(entry?.links) ? entry.links.length : 0;
      if (!count) return null;
      return { label: VERIFICATION_LABELS[key] || key, value: `${count} source${count === 1 ? '' : 's'}` };
    }),
    safety.fdaStatus && { label: 'Regulatory', value: safety.fdaStatus },
  ].filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FFFCF9', color: '#292524', animation: 'ay-page .25s ease-out' }}>
      <div style={{ padding: '24px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#242A52" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 14, color: '#242A52' }}>Back</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['summary', 'evidence'].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 17px',
                borderRadius: 99,
                background: activeTab === tab ? '#242A52' : '#FFFCF9',
                color: activeTab === tab ? '#FFFCF9' : '#57534E',
                border: '1.5px solid ' + (activeTab === tab ? '#242A52' : '#E1D5CE'),
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '14px 20px 0', borderRadius: 24, padding: 24, background: 'linear-gradient(150deg,#FFEFD6,#F6DCC0)' }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#FFFFFF',
            borderRadius: 14,
            boxShadow: '0 10px 26px -16px rgba(41,37,36,.35)',
            overflow: 'hidden',
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div style={{ padding: '22px 22px 34px' }}>
        {categoryLabel && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#C0761F' }}>
            {categoryLabel}
          </div>
        )}
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 33, lineHeight: 1.12, margin: '9px 0 10px', color: '#242A52' }}>{name}</div>
        {price && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: '#242A52', marginBottom: 12 }}>{price}</div>}
        {summary && <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#57534E' }}>{summary}</div>}

        <div style={{ display: 'flex', gap: 10, margin: '20px 0 16px' }}>
          {buyUrl ? (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: '#242A52',
                color: '#FFFCF9',
                textAlign: 'center',
                padding: 15,
                borderRadius: 99,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 14.5,
                boxShadow: '0 14px 26px -14px rgba(36,42,82,.7)',
                textDecoration: 'none',
              }}
            >
              Buy Now
            </a>
          ) : (
            <div
              style={{
                flex: 1,
                background: '#E1D5CE',
                color: '#78716C',
                textAlign: 'center',
                padding: 15,
                borderRadius: 99,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 14.5,
              }}
            >
              {whereToBuy.length > 0 ? whereToBuy[0] : 'No link yet'}
            </div>
          )}
          <div
            onClick={onToggleSaved}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 15,
              borderRadius: 99,
              cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 14.5,
              background: isSaved ? '#FFEFD6' : 'transparent',
              color: '#242A52',
              border: '1.5px solid ' + (isSaved ? '#E8A94F' : '#242A52'),
            }}
          >
            {isSaved ? 'Saved' : 'Wishlist'}
          </div>
        </div>

        <div
          onClick={onAddToEcosystem}
          style={{
            display: 'inline-block',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: '#242A52',
            borderBottom: '2px solid #242A52',
            paddingBottom: 2,
            marginBottom: 22,
            cursor: 'pointer',
          }}
        >
          {isInEcosystem ? 'Added to ecosystem ✓' : 'Add to ecosystem'}
        </div>

        {activeTab === 'summary' ? (
          <>
            {specRows.length > 0 && (
              <div style={{ borderTop: '1px solid #E1D5CE' }}>
                {specRows.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            )}

            {ingredients && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E1D5CE', borderRadius: 20, padding: 16, marginTop: 20 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#A8A29E', marginBottom: 4 }}>
                  Inside
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, paddingTop: 8 }}>{ingredients}</div>
              </div>
            )}
          </>
        ) : (
          <>
            {whyMatched && (
              <div
                style={{
                  borderRadius: 20,
                  padding: '17px 18px',
                  background: 'linear-gradient(120deg,#242A52,#4E3866 70%,#5D3F73)',
                  color: '#FFFCF9',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', opacity: 0.62 }}>
                  Why you're seeing this
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 9 }}>{whyMatched}</div>
              </div>
            )}

            {doctorOpinion && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E1D5CE', borderRadius: 20, padding: '17px 18px', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#A8A29E' }}>
                  Clinician opinion
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 9, color: '#292524' }}>{doctorOpinion}</div>
                {clinicianAttribution && (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: '#A8A29E', marginTop: 11 }}>{clinicianAttribution}</div>
                )}
                {badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
                    {badges.map((b) => (
                      <div key={b} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, padding: '7px 13px', borderRadius: 99, background: '#F3EFE9', color: '#57534E' }}>
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {evidenceRows.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E1D5CE', borderRadius: 20, padding: '17px 18px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#A8A29E', marginBottom: 4 }}>
                  Evidence
                </div>
                {evidenceRows.map((row) => (
                  <EvidenceRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            )}
          </>
        )}

        {reads.length > 0 && (
          <>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, margin: '22px 0 10px' }}>Reads</div>
            {reads.map((r) => (
              <div
                key={r.id || r.title}
                onClick={r.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#FFFFFF',
                  border: '1px solid #E1D5CE',
                  borderRadius: 16,
                  padding: '13px 15px',
                  marginBottom: 8,
                  cursor: r.onClick ? 'pointer' : 'default',
                }}
              >
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4, fontWeight: 500 }}>{r.title}</div>
                {r.mins && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#A8A29E', whiteSpace: 'nowrap' }}>{r.mins}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
