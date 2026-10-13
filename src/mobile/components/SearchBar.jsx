import SmartSearchInput from '../../components/search/SmartSearchInput.jsx';

/**
 * App search pill. Uses the shared search input: unknown words get a red
 * wavy underline, and `suggest` turns on the suggestions dropdown.
 */
export default function SearchBar({ value = '', onChange, onFilterClick, placeholder = 'Search products or reads', suggest = false, onPick, flagUnknown = true, ariaLabel = 'Search products and reads' }) {
  return (
    <div className="ayna-fresh-search-wrap">
      <label className="ayna-fresh-search">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        <SmartSearchInput type="search" aria-label={ariaLabel} placeholder={placeholder} value={value} onChange={onChange} suggest={suggest} onPick={onPick} flagUnknown={flagUnknown} anchor=".ayna-fresh-search" />
        {onFilterClick && <button type="button" aria-label="Open filters" onClick={onFilterClick}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg></button>}
      </label>
    </div>
  );
}
