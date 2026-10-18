// Same order as the area tones on the Ecosystem sections, so ring, legend and
// section numbers always match.
const COLORS = ['#F7BADD', '#769EBE', '#3E2723', '#F7BADD', '#769EBE', '#3E2723'];
const CIRCUMFERENCE = 2 * Math.PI * 72;

function scrollParent(el) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement || document.documentElement;
}

// Eased scroll to an area section (the plain #anchor jump felt abrupt), then
// a short highlight on the section so the eye lands on it.
function glideTo(event, id) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const scroller = scrollParent(target);
  const start = scroller.scrollTop;
  const top = target.getBoundingClientRect().top - (scroller === document.documentElement || scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top);
  const end = Math.max(0, start + top - 72);
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finish = () => {
    target.classList.remove('is-arrived');
    void target.offsetWidth;
    target.classList.add('is-arrived');
    window.setTimeout(() => target.classList.remove('is-arrived'), 1200);
  };
  if (reduce) { scroller.scrollTop = end; finish(); return; }
  const duration = Math.min(1100, 520 + Math.abs(end - start) * 0.35);
  const t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    scroller.scrollTop = start + (end - start) * ease(t);
    if (t < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
}

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
      <div className="ayna-ecosystem-chart-center"><strong>{total}</strong><span>on shelves</span></div>
    </div>
    <nav className="ayna-ecosystem-chart-legend" aria-label="Your health areas">
      {groups.map((group, index) => <a key={group.key} href={`#ayna-area-${group.key}`} onClick={(e) => glideTo(e, `ayna-area-${group.key}`)} style={{ '--area-color': COLORS[index % COLORS.length] }}>
        <span className="ayna-ecosystem-chart-swatch" aria-hidden="true" />
        <span className="ayna-ecosystem-chart-name">{group.label}</span>
        <strong>{group.products.length}</strong>
      </a>)}
    </nav>
  </div>;
}
