function Section({ title, children }) {
  return (
    <div style={{ background: '#FFFCF9', border: '1px solid #E1D5CE', borderRadius: 18, padding: 14, marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: 9.5,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#78716C',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 7 }}>{children}</div>
    </div>
  );
}

function SafetyRow({ label, value }) {
  return (
    <div style={{ padding: '9px 0', borderTop: '1px solid #F3EFE9' }}>
      <div style={{ fontSize: 11.5, color: '#78716C', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

export default function ProductDetailScreen({ product, onBack, isSaved = false, onToggleSaved, whyMatched }) {
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
    userRating,
    image,
    summary,
    ingredients,
    effectiveness,
    doctorOpinion,
    communityReview,
    safety = {},
    badges = [],
    whereToBuy = [],
  } = product;

  const hasSafety =
    safety.fdaStatus || safety.materials || safety.allergens || safety.sideEffects || safety.recalls || safety.opinionAlerts;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F3EFE9', animation: 'ay-page .25s ease-out' }}>
      <div
        style={{
          position: 'relative',
          height: 280,
          background: image
            ? `center/cover no-repeat url(${image}), linear-gradient(150deg,#F3EFE9,#E1D5CE)`
            : 'linear-gradient(150deg,#F3EFE9,#E1D5CE)',
        }}
      >
        <div
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 58,
            left: 18,
            width: 36,
            height: 36,
            borderRadius: 99,
            background: 'rgba(255,252,249,.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(41,37,36,.12)',
            zIndex: 3,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </div>
      </div>

      <div style={{ background: '#F3EFE9', borderRadius: '28px 28px 0 0', marginTop: -26, position: 'relative', padding: '22px 20px 40px' }}>
        {category && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#A2603C' }}>
            {category}
          </div>
        )}
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.2, margin: '7px 0 6px' }}>
          {name}
        </div>
        {summary && <div style={{ fontSize: 14, color: '#78716C', lineHeight: 1.5 }}>{summary}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 16px' }}>
          {price && <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 20 }}>{price}</div>}
          {userRating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFC774">
                <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.3 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
              </svg>
              <div style={{ fontSize: 12.5, color: '#57534E' }}>{userRating}</div>
            </div>
          )}
        </div>

        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {badges.map((b) => (
              <div
                key={b}
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9.5,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: '#8a5a1e',
                  background: '#FFEFD6',
                  padding: '5px 10px',
                  borderRadius: 99,
                }}
              >
                {b}
              </div>
            ))}
          </div>
        )}

        {whyMatched && (
          <div style={{ borderRadius: 18, padding: '15px 16px', background: 'linear-gradient(135deg,#242A52,#4E3866)', color: '#FFFCF9', marginBottom: 18 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.65 }}>
              Why this is in your ecosystem
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8 }}>{whyMatched}</div>
          </div>
        )}

        {ingredients && <Section title="Ingredients">{ingredients}</Section>}
        {effectiveness && <Section title="Effectiveness">{effectiveness}</Section>}

        {hasSafety && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E1D5CE', borderRadius: 20, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Safety</div>
            {safety.fdaStatus && <SafetyRow label="FDA status" value={safety.fdaStatus} />}
            {safety.materials && <SafetyRow label="Materials" value={safety.materials} />}
            {safety.allergens && <SafetyRow label="Allergens" value={safety.allergens} />}
            {safety.sideEffects && <SafetyRow label="Side effects" value={safety.sideEffects} />}
            {safety.recalls && <SafetyRow label="Recalls" value={safety.recalls} />}
            {safety.opinionAlerts && <SafetyRow label="Things to know" value={safety.opinionAlerts} />}
          </div>
        )}

        {doctorOpinion && <Section title="Doctor's take">{doctorOpinion}</Section>}
        {communityReview && <Section title="Community says">{communityReview}</Section>}
        {whereToBuy.length > 0 && <Section title="Where to buy">{whereToBuy.join(' · ')}</Section>}
      </div>

      <div style={{ padding: '12px 20px 30px', background: '#FFFCF9', borderTop: '1px solid #E1D5CE', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          onClick={onToggleSaved}
          style={{
            width: 46,
            height: 46,
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            border: '1px solid ' + (isSaved ? '#E8A94F' : '#E1D5CE'),
            background: isSaved ? '#FFEFD6' : '#FFFFFF',
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? '#E8A94F' : 'none'} stroke="#A2603C" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" />
          </svg>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: '#78716C', lineHeight: 1.4 }}>
          {isSaved ? 'Saved to your list.' : 'Tap the heart to save this product.'}
        </div>
      </div>
    </div>
  );
}
