// Shared empty / error state: one sticker-style illustration, one line,
// one action. Used wherever a list can be empty or a feed can fail.
const ART = {
  bookmark: <path d="M8 4h8v16l-4-3-4 3V4Z" />,
  chat: <path d="M4 6h16v10H10l-5 4v-4H4V6Z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  offline: <><path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0" /><path d="M4 4l16 16" /></>,
  spark: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />,
};

export default function EmptyState({ art = 'spark', tone = 'pink', title, body, actionLabel, onAction, secondaryLabel, onSecondary, compact = false }) {
  return (
    <div className={`ay-empty ay-empty--${tone}${compact ? ' is-compact' : ''}`} role="status">
      <div className="ay-empty-art" aria-hidden="true">
        <span className="ay-empty-card" />
        <span className="ay-empty-card is-front"><svg viewBox="0 0 24 24">{ART[art] || ART.spark}</svg></span>
      </div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {(actionLabel || secondaryLabel) && (
        <div className="ay-empty-actions">
          {actionLabel && <button type="button" className="ay-btn" onClick={onAction}>{actionLabel}</button>}
          {secondaryLabel && <button type="button" className="ay-btn is-ghost" onClick={onSecondary}>{secondaryLabel}</button>}
        </div>
      )}
    </div>
  );
}
