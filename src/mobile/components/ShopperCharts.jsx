import './ShopperCharts.css';
// Two small animated charts for the shopper card. Every number shown is real:
// product counts from the Ecosystem, and the order the person ranked trust in.
const TONES = ['var(--legacy-pink)', 'var(--ay-mint)', 'var(--legacy-butter)', 'var(--ay-peri)', 'var(--ay-paper)'];

export function ShelfDonut({ shelf = [], total = 0 }) {
  if (!total || !shelf.length) return null;
  const R = 15.915; // circumference 100
  const offsets = shelf.reduce((acc, s, i) => [...acc, (i ? acc[i - 1] : 25) - (i ? (shelf[i - 1].value / total) * 100 : 0)], []);
  return <figure className="ay-chart ay-donut">
    <figcaption>Your shelf</figcaption>
    <div className="ay-donut-body">
      <svg viewBox="0 0 42 42" role="img" aria-label={shelf.map((s) => `${s.label} ${s.value}`).join(', ')}>
        <circle cx="21" cy="21" r={R} className="ay-donut-track" />
        {shelf.map((s, i) => {
          const pct = (s.value / total) * 100;
          const el = <circle key={s.label} cx="21" cy="21" r={R} className="ay-donut-seg" stroke={TONES[i % TONES.length]}
            strokeDasharray={`${Math.max(0, pct - 1.2)} ${100 - Math.max(0, pct - 1.2)}`} strokeDashoffset={offsets[i]} style={{ '--i': i }} />;
          return el;
        })}
        <text x="21" y="21.5" className="ay-donut-num">{total}</text>
        <text x="21" y="27" className="ay-donut-cap">{total === 1 ? 'pick' : 'picks'}</text>
      </svg>
      <ul>{shelf.map((s, i) => <li key={s.label} style={{ '--i': i }}><i style={{ background: TONES[i % TONES.length] }} />{s.label}<b>{s.value}</b></li>)}</ul>
    </div>
  </figure>;
}

export function TrustBars({ trust = [] }) {
  if (!trust.length) return null;
  return <figure className="ay-chart ay-trust">
    <figcaption>What you trust most</figcaption>
    <ol>{trust.map((t, i) => <li key={t} style={{ '--w': `${100 - i * 28}%`, '--i': i }}>
      <span className="ay-trust-rank">{i + 1}</span>
      <span className="ay-trust-bar"><b>{t}</b></span>
    </li>)}</ol>
  </figure>;
}
