import { useEffect, useState } from 'react';
import { readTour, replayTour, setTipsEnabled, TOUR_EVENT } from './tourStore.js';

/**
 * Settings > Tips: the "Show tips" switch and "Replay the tour". The switch
 * is Settings' own (passed in as renderSwitch) so it looks like the others.
 */
export default function TipsSettings({ renderSwitch }) {
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
  return (
    <section aria-label="Tips" className="ay-set-group is-butter ay-tips-set">
      <h2>Tips</h2>
      <div className="ay-set-card">
        <div className="ay-set-row ay-tips-set__row">
          <span className="ay-set-title"><b>Show tips</b><small>A short tip the first time you open each page</small></span>
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
