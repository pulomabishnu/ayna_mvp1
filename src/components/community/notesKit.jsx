// Shared bits for the Community redesign (website + app): the composer's
// character-limit ring, the designed default avatar and the prompt-tile icons.

/**
 * Character-limit ring (the pattern Twitter/X tested: a ring that fills as
 * you type, a number only near the limit). Hidden until she starts typing.
 */
export function CharRing({ length, max, className = 'ay-ring' }) {
  if (!length) return null;
  const r = 10;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, length / max);
  const left = max - length;
  const near = left <= Math.max(20, Math.round(max * 0.1));
  return <span className={`${className}${near ? ' is-near' : ''}${left <= 0 ? ' is-max' : ''}`}>
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 14 14)" />
    </svg>
    {near && <b aria-hidden="true">{left}</b>}
    <span className="ay-sr" aria-live="polite">{near ? `${left} characters left` : ''}</span>
  </span>;
}

const ASTERISK = 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9';
/** Designed default avatar: initials on a flat paper tone, or ayna's asterisk for anonymous. */
export function DefaultFace({ name, anonymous }) {
  if (anonymous) return <svg className="ay-face-ast" viewBox="0 0 24 24" aria-hidden="true"><path d={ASTERISK} /></svg>;
  const initials = String(name || 'a').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'A';
  return <span className="ay-face-ini">{initials}</span>;
}

const PROMPT_ICONS = {
  question: <><path d="M9.2 9a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.1-1.4 2.1v.5" /><path d="M12 17.6v.1" /></>,
  star: <path d="M12 4.2l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" />,
  spark: <path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5Z" />,
  hand: <><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6" /><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4.2-2.3L4.5 15a1.5 1.5 0 0 1 2.5-1.7L8 14.6" /></>,
  share: <><path d="M12 15V3.5" /><path d="m7.5 8 4.5-4.5L16.5 8" /><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" /></>,
};
export function PromptIcon({ name, size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PROMPT_ICONS[name]}</svg>;
}
