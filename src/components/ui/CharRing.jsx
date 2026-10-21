// Character-limit ring for text areas that have a limit (web and app).
// The ring fills as you type; near the limit it shows how many are left,
// espresso first, pink in the last 10%, and a negative number past the
// limit. It never cuts text: the form's submit stays off while over.
// Screen readers hear the count once it matters (20% left, then over).

export default function CharRing({ value, max, id, className = '' }) {
  const len = String(value || '').length;
  const left = max - len;
  const ratio = Math.min(1, len / max);
  const near = left <= Math.max(10, Math.round(max * 0.2));
  const late = left <= Math.max(5, Math.round(max * 0.1));
  const r = 8;
  const c = 2 * Math.PI * r;
  const state = left < 0 ? 'is-over' : late ? 'is-late' : near ? 'is-near' : '';
  return (
    <span id={id} className={`ay-charring ${state} ${className}`.trim()} aria-live={near ? 'polite' : 'off'}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle className="ay-charring__track" cx="10" cy="10" r={r} />
        <circle className="ay-charring__fill" cx="10" cy="10" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} transform="rotate(-90 10 10)" />
      </svg>
      {near && <span className="ay-charring__n">{left}</span>}
      <span className="sr-only">{left < 0 ? `${-left} characters over the limit of ${max}` : near ? `${left} characters left` : `Up to ${max} characters`}</span>
    </span>
  );
}
