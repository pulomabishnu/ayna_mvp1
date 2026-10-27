import { useEffect, useState } from 'react';
import { readTour, replayTour, setTipsEnabled, TOUR_EVENT } from './tourStore.js';

/**
 * Settings > Tips: the "Show tips" switch and "Replay the tour". The switch
 * is Settings' own (passed in as renderSwitch) so it looks like the others.
 * `variant="web"`: the website's You > Settings and privacy rows (WebYou),
 * with the site's own switch. Same store, so it's one setting on both.
 */
export default function TipsSettings({ renderSwitch, variant = 'app' }) {
  const [prefs, setPrefs] = useState(readTour);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const on = () => setPrefs(readTour());
    window.addEventListener(TOUR_EVENT, on);
    return () => window.removeEventListener(TOUR_EVENT, on);
  }, []);
  const on = prefs.enabled === true;
  const toggle = () => { setTipsEnabled(!on); setStatus(on ? 'Tips are off.' : 'Tips are on for pages you haven’t opened yet.'); };
  const replay = () => { replayTour(); setStatus('Tips are back. You’ll see them again on each page.'); };
  if (variant === 'web') {
    return (
      <section className="wy-sec ay-tips-set is-web" aria-labelledby="wy-tips-h">
        <h2 className="ay-group__title" id="wy-tips-h">Tips</h2>
        <ul className="ay-group wy-rows">
          <li className="ay-group__row wy-row">
            <span className="ay-group__text">
              <span className="ay-group__value" id="wy-tips-show">Show tips</span>
              <span className="ay-group__note">Once on each page</span>
            </span>
            <span className="ay-group__end">
              <button type="button" role="switch" aria-checked={on} aria-labelledby="wy-tips-show" className="wy-switch" onClick={toggle}><span aria-hidden="true" /></button>
            </span>
          </li>
          <li>
            <button type="button" className="ay-group__row ay-group__row--link wy-row ay-tips-set__replay" onClick={replay}>
              <span className="ay-group__text"><span className="ay-group__value">Replay the tour</span></span>
            </button>
          </li>
        </ul>
        <p className="wy-foot ay-tips-set__status" role="status">{status}</p>
      </section>
    );
  }
  return (
    <section aria-label="Tips" className="ay-set-group is-butter ay-tips-set">
      <h2>Tips</h2>
      <div className="ay-set-card">
        <div className="ay-set-row ay-tips-set__row">
          <span className="ay-set-title"><b>Show tips</b><small>Once on each page</small></span>
          {renderSwitch({ on, onClick: toggle, label: 'Show tips' })}
        </div>
        <button type="button" className="ay-set-row ay-tips-set__replay" onClick={replay}>
          <span className="ay-set-title">Replay the tour</span>
        </button>
      </div>
      <p className="ay-tips-set__status" role="status">{status}</p>
    </section>
  );
}
