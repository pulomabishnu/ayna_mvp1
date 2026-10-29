import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Lazy wrappers: the engine (and the catalog it reads) loads after first paint.
import { analyzeSearch, searchSuggestions, registerSearchVocabulary, warmSearchEngine, useSearchReady } from '../../utils/search/lazy.js';
import './smart-search.css';

/**
 * Drop-in replacement for a search <input> (same props: value, onChange(e),
 * className, placeholder, aria-label, onKeyDown...). Adds, without changing
 * the surrounding layout:
 *   - a red wavy underline under words the search engine does not recognise
 *     (mirror overlay: a transparent copy of the text drawn over the input),
 *     announced via aria-describedby ("We don't recognize 'xyz'");
 *   - optional suggestions dropdown ("Products for PMS", categories, brands,
 *     products, reads), a combobox with arrow keys / Enter / Escape.
 *
 * The overlay and dropdown are absolutely positioned siblings of the input,
 * measured against the input's own offset parent, so no wrapper element is
 * added and existing CSS selectors keep working.
 *
 * Props beyond <input>:
 *   flagUnknown  (default true)  underline unknown words
 *   suggest      false | { kinds?, products?, articles?, limit?, onEmpty? }
 *                onEmpty: options shown on focus before she types ({ kind, label, query })
 *   onPick(s)    a suggestion was chosen; default: replaces the text
 *   anchor       CSS selector of the ancestor the dropdown lines up with
 *   vocabulary   extra known words for this box (e.g. the medication list)
 */
function OptIcon({ kind }) {
  const path = kind === 'need' ? <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
    : kind === 'article' ? <><path d="M5 5.5C5 4.7 5.7 4 6.5 4H11v15H6.5A1.5 1.5 0 0 1 5 17.5z" /><path d="M19 5.5c0-.8-.7-1.5-1.5-1.5H13v15h4.5c.8 0 1.5-.7 1.5-1.5z" /></>
      : kind === 'category' ? <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>
        : <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>;
  return <svg className="ays-opt__icon" viewBox="0 0 24 24" aria-hidden="true">{path}</svg>;
}

const SmartSearchInput = forwardRef(function SmartSearchInput({
  value = '',
  onChange,
  flagUnknown = true,
  suggest = false,
  onPick,
  anchor = 'form, label',
  vocabulary = null,
  onKeyDown,
  onFocus,
  onBlur,
  'aria-describedby': describedBy,
  ...inputProps
}, ref) {
  const uid = useId().replace(/:/g, '');
  const hintId = `ays-hint-${uid}`;
  const listId = `ays-list-${uid}`;
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const textRef = useRef(null);
  const listRef = useRef(null);
  // The dropdown lives in the theme root (website shell or app frame) so a
  // parent with overflow: hidden can never clip it; it stays themed there.
  const [portalHost, setPortalHost] = useState(null);
  const setInputEl = useCallback((el) => {
    inputRef.current = el;
    if (el && suggest) setPortalHost((cur) => cur || el.closest('.ayna-mobile, .app-container') || document.body);
  }, [suggest]);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [settled, setSettled] = useState(String(value || ''));
  useImperativeHandle(ref, () => inputRef.current);

  // Build the vocabulary while the browser is idle, so the first keystroke is instant.
  useEffect(() => warmSearchEngine(), []);

  // Debounced: underline after typing pauses, never mid-word.
  useEffect(() => {
    const t = setTimeout(() => setSettled(String(value || '')), 260);
    return () => clearTimeout(t);
  }, [value]);

  const text = String(value || '');
  const searchReady = useSearchReady();
  const vocabReady = useMemo(() => { if (Array.isArray(vocabulary) && vocabulary.length) registerSearchVocabulary(vocabulary); return true; }, [vocabulary]);
  const analysis = useMemo(() => (flagUnknown && settled.trim() && settled === text && vocabReady ? analyzeSearch(settled, { typing: focused }) : null), [flagUnknown, settled, text, focused, vocabReady, searchReady]);
  const unknownTokens = analysis ? analysis.tokens.filter((t) => t.status === 'unknown') : [];
  const unknownWords = [...new Set(unknownTokens.map((t) => t.raw))];

  const items = useMemo(() => {
    // Empty box, focused: show the starter options (e.g. every category) so
    // she can pick without typing (founder, Oct 29).
    if (suggest && !text.trim() && Array.isArray(suggest.onEmpty)) return suggest.onEmpty;
    if (!suggest || text.trim().length < 2) return [];
    try { return searchSuggestions(text, typeof suggest === 'object' ? suggest : {}); } catch { return []; }
  }, [suggest, text, searchReady]);
  const showList = Boolean(suggest) && open && focused && items.length > 0;

  // Position the overlay and dropdown by measuring where they actually landed
  // and nudging them onto the input / anchor. Works whatever the containing
  // block is (positioned ancestors, transforms in the app's slide views).
  const fontsHookedRef = useRef(false);
  const place = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const mirror = mirrorRef.current;
    const list = listRef.current;
    // Nothing to place: skip the measuring. Reading the input's box forces a
    // full style and layout pass, and this runs after every render (perf).
    if (!mirror && (!list || list.hidden)) return;
    const ir = input.getBoundingClientRect();
    if (mirror) {
      const cs = window.getComputedStyle(input);
      const st = mirror.style;
      st.width = `${input.offsetWidth}px`;
      st.height = `${input.offsetHeight}px`;
      st.paddingLeft = `calc(${cs.paddingLeft} + ${cs.borderLeftWidth})`;
      st.paddingRight = `calc(${cs.paddingRight} + ${cs.borderRightWidth})`;
      st.paddingTop = `calc(${cs.paddingTop} + ${cs.borderTopWidth})`;
      st.paddingBottom = `calc(${cs.paddingBottom} + ${cs.borderBottomWidth})`;
      for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'lineHeight']) st[k] = cs[k];
      st.justifyContent = cs.textAlign === 'center' ? 'center' : (cs.textAlign === 'right' || cs.textAlign === 'end') ? 'flex-end' : 'flex-start';
      const mr = mirror.getBoundingClientRect();
      st.left = `${(parseFloat(st.left) || 0) + (ir.left - mr.left)}px`;
      st.top = `${(parseFloat(st.top) || 0) + (ir.top - mr.top)}px`;
    }
    if (list && !list.hidden) {
      const anchorEl = (anchor && input.parentElement?.closest(anchor)) || input.parentElement || input;
      const ar = anchorEl.getBoundingClientRect();
      list.style.width = `${ar.width}px`;
      const lr = list.getBoundingClientRect();
      list.style.left = `${(parseFloat(list.style.left) || 0) + (ar.left - lr.left)}px`;
      list.style.top = `${(parseFloat(list.style.top) || 0) + (ar.bottom + 8 - lr.top)}px`;
    }
  }, [anchor]);

  useLayoutEffect(() => {
    place();
    // Measure again once web fonts finish loading (they change the text's width).
    // Hooked on the first real measure, not on mount: reading document.fonts.ready
    // forces a full style pass, about 400ms of a throttled phone's first Shop render (perf).
    if (!fontsHookedRef.current && (mirrorRef.current || (listRef.current && !listRef.current.hidden))) {
      fontsHookedRef.current = true;
      document.fonts?.ready?.then?.(() => place());
    }
  });
  useEffect(() => {
    if (!showList) return undefined;
    const onScroll = () => place();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [showList, place]);
  useEffect(() => {
    if (!flagUnknown && !suggest) return undefined;
    const input = inputRef.current;
    let ro = null;
    if (input && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => place()); ro.observe(input); }
    window.addEventListener('resize', place);
    return () => { ro?.disconnect(); window.removeEventListener('resize', place); };
  }, [place, flagUnknown, suggest]);

  const syncScroll = useCallback(() => {
    if (textRef.current && inputRef.current) textRef.current.style.transform = `translateX(${-inputRef.current.scrollLeft}px)`;
  }, []);
  useEffect(() => { syncScroll(); });

  const pick = (s) => {
    setOpen(false);
    setActive(-1);
    if (onPick) onPick(s);
    else onChange?.({ target: { value: s.query }, currentTarget: { value: s.query } });
  };

  const handleKeyDown = (e) => {
    if (showList) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); return; }
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); setActive(-1); return; }
      if (e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); pick(items[active]); return; }
    }
    // Enter submits the search: close the list so it doesn't cover the results.
    if (e.key === 'Enter') { setOpen(false); setActive(-1); }
    onKeyDown?.(e);
  };

  // Mirror: the same text, transparent, with unknown words wrapped.
  const segments = [];
  if (unknownTokens.length) {
    let cursor = 0;
    unknownTokens.forEach((t, i) => {
      if (t.start > cursor) segments.push(<span key={`p${i}`}>{text.slice(cursor, t.start)}</span>);
      segments.push(<span key={`u${i}`} className="ays-bad">{text.slice(t.start, t.end)}</span>);
      cursor = t.end;
    });
    if (cursor < text.length) segments.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  const describedIds = [describedBy, unknownWords.length ? hintId : null].filter(Boolean).join(' ') || undefined;
  const label = (s) => (s.kind === 'product' && s.sub ? <><span>{s.label}</span><small>{s.sub}</small></> : <span>{s.label}</span>);

  return <>
    <input
      {...inputProps}
      ref={setInputEl}
      value={value}
      onChange={(e) => { setOpen(true); setActive(-1); onChange?.(e); }}
      onKeyDown={handleKeyDown}
      onScroll={syncScroll}
      onSelect={syncScroll}
      onFocus={(e) => { setFocused(true); setOpen(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); setOpen(false); setActive(-1); onBlur?.(e); }}
      aria-describedby={describedIds}
      spellCheck={false}
      autoComplete="off"
      {...(suggest ? { role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': showList, 'aria-controls': listId, 'aria-activedescendant': showList && active >= 0 ? `${listId}-${active}` : undefined } : {})}
    />
    {segments.length > 0 && (
      <span ref={mirrorRef} className="ays-mirror" aria-hidden="true">
        <span ref={textRef} className="ays-mirror__text">{segments}</span>
      </span>
    )}
    {unknownWords.length > 0 && <span id={hintId} className="ays-sr">{`We don't recognize ${unknownWords.map((w) => `'${w}'`).join(', ')}`}</span>}
    {suggest && portalHost && createPortal(
      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        className="ays-list"
        ref={listRef}
        hidden={!showList}
      >
        {showList && items.map((s, i) => (
          <li
            key={`${s.kind}-${s.label}`}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={`ays-opt is-${s.kind}${i === active ? ' is-active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(s)}
            onMouseEnter={() => setActive(i)}
          >
            <OptIcon kind={s.kind} />
            {label(s)}
          </li>
        ))}
      </ul>,
      portalHost,
    )}
  </>;
});

export default SmartSearchInput;
