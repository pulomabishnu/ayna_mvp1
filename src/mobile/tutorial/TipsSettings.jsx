import { useEffect, useState } from 'react';
import { readTour, replayTour, setTipsEnabled, TOUR_EVENT } from './tourStore.js';
import { ASK_SUGGEST_EVENT, readSuggestHidden, writeSuggestHidden } from '../../components/nav/askSuggestions.js';
import './settings-search.css';

const SETTINGS_SEARCH_ITEMS = [
  { label: 'Appearance & preferences', hint: 'Theme, text size, notifications, personalization and newsletter', terms: 'appearance preferences theme dark light text size font notifications personalization ai ask ayna history newsletter health data matches' },
  { label: 'Text messages', hint: 'Phone, SMS, reminders and text preferences', terms: 'text messages sms phone reminders alerts verification' },
  { label: 'How it works', hint: 'How ayna matches and checks products', terms: 'how it works matching evidence recommendations' },
  { label: 'About ayna', hint: 'About the product and team', terms: 'about ayna team founders advisors' },
  { label: 'Brand partnerships', hint: 'ayna partner brands', terms: 'brand partnerships partners companies' },
  { label: 'Campus resources', hint: 'Campus and student resources', terms: 'campus resources student university college' },
  { label: 'Account information', hint: 'Email, phone, password, name and intake details', terms: 'account information email phone password name age zip fsa hsa login google' },
  { label: 'Privacy & data', hint: 'Analytics, connected data and deletion controls', terms: 'privacy data analytics health data delete account export connected' },
  { label: 'Legal', hint: 'Policies, terms, sources and licences', terms: 'legal privacy policy terms sources licenses licences typefaces medical advice' },
  { label: 'Contact', hint: 'Help, feedback, press and partnerships', terms: 'contact help support feedback press media partnership' },
  { label: 'Ask ayna suggestions', hint: 'Show or hide page-specific suggested questions', terms: 'ask ayna suggestions prompts questions hide show tips', localId: 'ay-settings-ask-suggestions' },
  { label: 'Show tips', hint: 'Turn in-app tips on or off', terms: 'show tips tutorial help hints walkthrough', localId: 'ay-settings-show-tips' },
  { label: 'Replay the tour', hint: 'See the app walkthrough again', terms: 'replay tour tutorial walkthrough tips', localId: 'ay-settings-replay-tour' },
];

const clean = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function openTopLevelSetting(label) {
  const root = document.querySelector('.ayna-settings-index');
  if (!root) return false;
  const target = clean(label);
  const row = [...root.querySelectorAll('.ay-set-row')]
    .find((node) => clean(node.textContent).startsWith(target));
  if (!row) return false;
  row.click();
  return true;
}

function SettingsSearch() {
  const [query, setQuery] = useState('');
  const q = clean(query);
  const matches = q
    ? SETTINGS_SEARCH_ITEMS
      .map((item) => {
        const label = clean(item.label);
        const haystack = clean(`${item.label} ${item.hint} ${item.terms}`);
        const score = label === q ? 0 : label.startsWith(q) ? 1 : haystack.includes(q) ? 2 : 99;
        return { ...item, score };
      })
      .filter((item) => item.score < 99)
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
      .slice(0, 6)
    : [];

  const choose = (item) => {
    if (item.localId) {
      const node = document.getElementById(item.localId);
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = node?.matches('button,input,a') ? node : node?.querySelector('button,input,a');
      window.setTimeout(() => focusable?.focus?.({ preventScroll: true }), 250);
    } else {
      openTopLevelSetting(item.label);
    }
    setQuery('');
  };

  return (
    <section className="ay-settings-search" aria-label="Search settings">
      <label className="ay-settings-search__field">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <span className="sr-only">Search settings</span>
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search settings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && <button type="button" aria-label="Clear settings search" onClick={() => setQuery('')}>Clear</button>}
      </label>
      {q && (
        <div className="ay-settings-search__results" role="region" aria-label="Settings search results">
          {matches.length ? matches.map((item) => (
            <button key={`${item.label}-${item.localId || 'page'}`} type="button" onClick={() => choose(item)}>
              <span><b>{item.label}</b><small>{item.hint}</small></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
          )) : <p role="status">No settings found.</p>}
        </div>
      )}
    </section>
  );
}

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
    <>
      <SettingsSearch />
      <section aria-label="Tips" className="ay-set-group is-butter ay-tips-set">
        <h2>Tips</h2>
        <div className="ay-set-card">
          <div id="ay-settings-show-tips" className="ay-set-row ay-tips-set__row">
            <span className="ay-set-title"><b>Show tips</b><small>Once on each page</small></span>
            {renderSwitch({ on, onClick: toggle, label: 'Show tips' })}
          </div>
          <div id="ay-settings-ask-suggestions" className="ay-set-row ay-tips-set__row">
            <span className="ay-set-title"><b>Ask ayna suggestions</b><small>Helpful questions for the page you’re on</small></span>
            {renderSwitch({ on: suggestionsOn, onClick: toggleSuggestions, label: 'Show Ask ayna suggestions' })}
          </div>
          <button id="ay-settings-replay-tour" type="button" className="ay-set-row ay-tips-set__replay" onClick={replay}>
            <span className="ay-set-title">Replay the tour</span>
          </button>
        </div>
        <p className="ay-tips-set__status" role="status">{status}</p>
      </section>
    </>
  );
}