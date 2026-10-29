import { useEffect, useRef, useState } from 'react';

/**
 * Settings search on the website (founder, Oct 27: find things without
 * digging through menus). Filters the Settings page in place: each row
 * (and its section) stays only if its words match. Nothing is hidden when
 * the box is empty. Works on whatever rows the page renders, so new
 * settings are searchable with no extra list to keep up to date.
 */
const clean = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Words people use that aren't printed on the rows.
const SYNONYMS = { theme: 'appearance', dark: 'appearance', 'dark mode': 'appearance', sms: 'text', phone: 'text', export: 'your data', delete: 'delete account', logout: 'log out', 'sign out': 'log out', tutorial: 'tips', tour: 'replay the tour', suggestions: 'ask ayna suggestions', wearables: 'health data', oura: 'health data', newsletter: 'email' };

export default function WebSettingsSearch({ scopeRef }) {
  const [q, setQ] = useState('');
  const noneRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const root = scopeRef?.current;
    if (!root) return;
    const query = clean(q);
    const terms = [query, clean(SYNONYMS[query] || '')].filter(Boolean);
    let shown = 0;
    root.querySelectorAll('.wy-sec').forEach((sec) => {
      const title = clean(sec.querySelector('.ay-group__title')?.textContent);
      const titleHit = terms.some((t) => title.includes(t));
      let any = false;
      sec.querySelectorAll('.ay-group__row, .wy-actions > *').forEach((row) => {
        const hit = !query || titleHit || terms.some((t) => clean(row.textContent).includes(t));
        row.closest('li')?.toggleAttribute('hidden', !hit);
        if (!row.closest('li')) row.toggleAttribute('hidden', !hit);
        if (hit) any = true;
      });
      sec.toggleAttribute('hidden', Boolean(query) && !any);
      if (!query || any) shown += 1;
    });
    if (noneRef.current) noneRef.current.hidden = !(query && shown === 0);
  }, [q, scopeRef]);
  return (
    <div className="wy-search">
      <label className="wy-search__field">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <span className="sr-only">Search settings</span>
        <input ref={inputRef} type="search" autoComplete="off" placeholder="Search settings" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }}>Clear</button>}
      </label>
      <p ref={noneRef} className="wy-search__none" role="status" hidden>No settings match “{q.trim()}”.</p>
    </div>
  );
}
