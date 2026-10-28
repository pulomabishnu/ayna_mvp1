/**
 * The one back control on the website (P1-8, docs/terminology.md): a left
 * chevron and the parent's name ("Library", "Community", "You", "Your
 * ecosystem"), a 44px row, top left under the header. Same pattern as the
 * app's back row. Styles: src/styles/chrome.css (.ay-backlink).
 *
 * Pass `href` for a real link (it still calls onClick for in-app routing on
 * a plain click), or only `onClick` for a button.
 */
export default function BackLink({ label = 'Back', onClick, href, className = '', disabled = false }) {
  const icon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>;
  const cls = `ay-backlink${className ? ` ${className}` : ''}`;
  if (href) {
    const go = (e) => {
      if (!onClick || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onClick(e);
    };
    return <a href={href} className={cls} onClick={go}>{icon}<span>{label}</span></a>;
  }
  return <button type="button" className={cls} onClick={onClick} disabled={disabled}>{icon}<span>{label}</span></button>;
}
