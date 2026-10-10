const COLORS = ['#DBB0CF', '#C6ED58', '#3E2F59', '#B99CC5', '#A5CE4E', '#80699B'];
const CIRCUMFERENCE = 2 * Math.PI * 72;

export default function EcosystemChart({ groups }) {
  const total = groups.reduce((sum, group) => sum + group.products.length, 0);

  return <div className="ayna-ecosystem-chart">
    <div className="ayna-ecosystem-chart-ring" aria-label={`${total} current picks across ${groups.length} health areas`} role="img">
      <svg viewBox="0 0 184 184" aria-hidden="true">
        <circle className="ayna-ecosystem-chart-track" cx="92" cy="92" r="72" />
        {groups.map((group, index) => {
          const share = group.products.length / total * CIRCUMFERENCE;
          const offset = groups.slice(0, index).reduce((sum, previous) => sum + previous.products.length, 0) / total * CIRCUMFERENCE;
          return <circle
            key={group.key}
            className="ayna-ecosystem-chart-segment"
            cx="92" cy="92" r="72"
            stroke={COLORS[index % COLORS.length]}
            strokeDasharray={`${Math.max(0, share - 7)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-offset}
            style={{ '--segment-index': index }}
          />;
        })}
      </svg>
      <div className="ayna-ecosystem-chart-center"><strong>{total}</strong><span>{total === 1 ? 'pick' : 'picks'}</span></div>
    </div>
    <nav className="ayna-ecosystem-chart-legend" aria-label="Your health areas">
      {groups.map((group, index) => <a key={group.key} href={`#ayna-area-${group.key}`} style={{ '--area-color': COLORS[index % COLORS.length] }}>
        <span className="ayna-ecosystem-chart-swatch" aria-hidden="true" />
        <span className="ayna-ecosystem-chart-name">{group.label}</span>
        <strong>{group.products.length}</strong>
      </a>)}
    </nav>
  </div>;
}
