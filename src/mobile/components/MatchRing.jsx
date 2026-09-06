// Same ring-with-inset-circle look as the match indicator already shipped
// on the Saved screen's single-item hero card, pulled out here so every
// product card can share one implementation instead of redrawing it.
export default function MatchRing({ percent, size = 40, onClick }) {
  if (percent == null) return null;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const inset = Math.max(4, Math.round(size * 0.16));

  return (
    <div
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `Why ${clamped}% match` : undefined}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: `conic-gradient(#F0A84B ${clamped}%, rgba(255,255,255,.55) 0)`,
        display: 'grid',
        placeItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'absolute', inset, borderRadius: '50%', background: 'var(--ayna-surface)' }} />
      <div
        style={{
          position: 'relative',
          fontWeight: 600,
          fontSize: size <= 28 ? 9.5 : size <= 40 ? 12 : 14,
          color: 'var(--ayna-accent-dark)',
        }}
      >
        {clamped}
      </div>
    </div>
  );
}
