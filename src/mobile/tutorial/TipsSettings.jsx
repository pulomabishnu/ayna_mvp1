import { useEffect, useState } from 'react';
import { readTour, replayTour, setTipsEnabled, TOUR_EVENT } from './tourStore.js';
import { ASK_SUGGEST_EVENT, readSuggestHidden, writeSuggestHidden } from '../../components/nav/askSuggestions.js';

/**
 * Settings > Tips: the "Show tips" switch, Ask suggestion preference and
 * "Replay the tour". The switch renderer comes from Settings so this keeps
 * the app's existing visual language instead of introducing new controls.
 */
export default function TipsSettings({ renderSwitch, variant = 'app' }) {
  const [prefs, setPrefs] = useState(readTour);
  const [suggestionsOn, setSuggestionsOn] = useState(() => !readSuggestHidden());
  const [status, setStatus] = useState('');
  useEffect(() => {
    const on = () => setPrefs(readTour());
    window.addEventListener(TOUR_EVENT, on);
    return () => window.removeEventListener(TOUR_EVENT, on);
  }, []);
  useEffect(() => {
    const sync = () => setSuggestionsOn(!readSuggestHidden());
    window.addEventListener(ASK_SUGGEST_EVENT, sync);
    return () => window.removeEventListener(ASK_SUGGEST_EVENT, sync);
  }, []);
  const on = prefs.enabled === true;
  const toggle = () => { setTipsEnabled(!on); setStatus(on ? 'Tips are off.' : 'Tips are on for pages you haven’t opened yet.'); };
  const toggleSuggestions = () => {
    const next = !suggestionsOn;
    writeSuggestHidden(!next);
    setSuggestionsOn(next);
    setStatus(next ? 'Ask ayna suggestions are back.' : 'Ask ayna suggestions are hidden.');
  };
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
          <li className="ay-group__row wy-row">
            <span className="ay-group__text">
              <span className="ay-group__value" id="wy-ask-suggestions-show">Ask ayna suggestions</span>
              <span className="ay-group__note">Helpful questions for the page you’re on</span>
            </span>
            <span className="ay-group__end">
              <button type="button" role="switch" aria-checked={suggestionsOn} aria-labelledby="wy-ask-suggestions-show" className="wy-switch" onClick={toggleSuggestions}><span aria-hidden="true" /></button>
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
        <div className="ay-set-row ay-tips-set__row">
          <span className="ay-set-title"><b>Ask ayna suggestions</b><small>Helpful questions for the page you’re on</small></span>
          {renderSwitch({ on: suggestionsOn, onClick: toggleSuggestions, label: 'Show Ask ayna suggestions' })}
        </div>
        <button type="button" className="ay-set-row ay-tips-set__replay" onClick={replay}>
          <span className="ay-set-title">Replay the tour</span>
        </button>
      </div>
      <p className="ay-tips-set__status" role="status">{status}</p>
    </section>
  );
}
