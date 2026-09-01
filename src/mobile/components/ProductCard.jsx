export default function ProductCard({ product, onClick }) {
  const {
    name,
    priceLabel,
    rating,
    hue = '#F3EFE9',
    hue2 = '#E1D5CE',
    categoryColor = '#A2603C',
    evidenceStrength = 1,
    isPowder = false,
  } = product || {};

  const dot = (on) => ({
    width: 6,
    height: 6,
    borderRadius: 99,
    background: on ? categoryColor : '#E1D5CE',
  });

  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E1D5CE',
        borderRadius: 18,
        padding: 10,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(41,37,36,.04)',
        transition: 'transform .16s cubic-bezier(.2,.8,.2,1), box-shadow .16s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage:
            'repeating-linear-gradient(135deg,rgba(255,255,255,.45) 0 6px,rgba(255,255,255,0) 6px 12px),linear-gradient(150deg,' +
            hue +
            ',' +
            hue2 +
            ')',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: isPowder ? 6 : 99,
              background: categoryColor,
              opacity: 0.85,
              boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.55)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 7,
            height: 7,
            borderRadius: 99,
            background: categoryColor,
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          marginTop: 9,
          textWrap: 'pretty',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13 }}>
          {priceLabel}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={dot(evidenceStrength >= 1)} />
          <div style={dot(evidenceStrength >= 2)} />
          <div style={dot(evidenceStrength >= 3)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFC774">
            <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.3 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
          </svg>
          <div style={{ fontSize: 10.5, color: '#A8A29E' }}>{rating}</div>
        </div>
      </div>
    </div>
  );
}
