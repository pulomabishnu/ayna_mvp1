/**
 * The parts every ayna story shares (the Daily Rundown, the weekly recap and
 * ayna Wrapped, app and web), so they look and behave as one thing.
 * Research (story pass, Oct 27): Instagram Stories and Spotify Wrapped set
 * the grammar people already know: segmented progress at the top, tap the
 * right side for next and the left for back, hold to pause, swipe down to
 * leave, and a plain X. Styles: story.css.
 */

const PAUSE = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>;
const PLAY = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;
const CLOSE = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/**
 * Segmented progress (one segment per card; the current one fills while it
 * plays) and the bar under it: the story's name, pause, close.
 * `progress` (0 to 1) drives the current segment when the caller times it;
 * otherwise `running` + `ms` fill it with CSS.
 */
export function StoryTop({ count, index, running = false, ms = 0, progress = null, title, paused, onPause = null, pauseLabels = ['Pause', 'Play'], onClose, closeLabel = 'Close', lead = null }) {
  return (
    <div className="ays-top">
      <ol className="ays-progress" aria-hidden="true">
        {Array.from({ length: count }, (_, k) => {
          const state = k < index ? 'is-done' : k === index ? `is-now${running && progress == null ? ' is-running' : ''}` : '';
          const style = k === index ? (progress != null ? { '--ays-fill': progress } : { '--ays-ms': `${ms}ms` }) : undefined;
          return <li key={k} className={state} style={style}><i /></li>;
        })}
      </ol>
      <div className="ays-bar">
        {lead}
        <span className="ays-name">{title}</span>
        {onPause && <button type="button" className="ays-icon" aria-pressed={paused} aria-label={paused ? pauseLabels[1] : pauseLabels[0]} onClick={onPause}>{paused ? PLAY : PAUSE}</button>}
        {onClose && <button type="button" className="ays-icon is-close" aria-label={closeLabel} onClick={onClose}>{CLOSE}</button>}
      </div>
    </div>
  );
}
