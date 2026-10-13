/**
 * Calm care note shared by the website Ecosystem and the app Ecosystem.
 * One icon, one or two short sentences, an optional small "Find care" link.
 */
export default function CareNote({ lines = [], prominent = false, onFindCare, findCareHref, className = '' }) {
  if (!lines.length) return null;
  const link = onFindCare
    ? <button type="button" className="ay-carenote__link" onClick={onFindCare}>Find care <span aria-hidden="true">→</span></button>
    : findCareHref
      ? <a className="ay-carenote__link" href={findCareHref} target="_blank" rel="noopener noreferrer">Find care <span aria-hidden="true">→</span></a>
      : null;
  return (
    <aside className={`ay-carenote${prominent ? ' is-prominent' : ''}${className ? ` ${className}` : ''}`} role="note" aria-label="A note on care">
      <span className="ay-carenote__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1z" /><path d="M12 10.5v5M9.5 13h5" /></svg>
      </span>
      <div className="ay-carenote__body">
        {lines.map((line) => <p key={line}>{line}</p>)}
        {link}
      </div>
    </aside>
  );
}
