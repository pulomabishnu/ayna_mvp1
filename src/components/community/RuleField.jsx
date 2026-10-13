import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { checkCommunityText, segmentCommunityText, COMMUNITY_RULES, CRISIS_LINE } from '../../utils/communityRules.js';
import './community-shared.css';

// Textarea / input that marks text breaking the community rules as you type.
// Mirror technique: a copy of the text sits exactly on top of the field
// (pointer-events: none) with flagged spans in red with a wavy underline. The
// real field keeps the caret, selection and keyboard; only its glyphs go
// transparent while something is flagged, so nothing can drift out of place
// when the text is clean. One short line below says which rule, and is wired
// to the field with aria-describedby + aria-invalid.

const COPY_STYLES = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'textAlign', 'tabSize',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'boxSizing'];

export function RuleNote({ id, check, onShowRules }) {
  return <div id={id} className="cr-note-slot" aria-live="polite">
    {check.blocked ? <p className="cr-note is-error">
      <span className="cr-note-dot" aria-hidden="true" />
      <span>{check.message}{onShowRules && <> <button type="button" className="cr-note-link" onClick={onShowRules}>See rules</button></>}</span>
    </p> : check.crisis ? <p className="cr-note is-care">
      <span className="cr-note-dot" aria-hidden="true" />
      <span>{CRISIS_LINE}</span>
    </p> : null}
  </div>;
}

export function RuleField({ as = 'textarea', value = '', onChange, autoGrow = false, minRows = 3, maxGrowPx = null, className = '', wrapClassName = '', onShowRules, 'aria-describedby': describedBy, ...rest }) {
  const ref = useRef(null);
  const mirrorRef = useRef(null);
  const colorRef = useRef('');
  const noteId = useId();
  const check = useMemo(() => checkCommunityText(value), [value]);
  const flagged = check.blocked;
  const segments = useMemo(() => (flagged ? segmentCommunityText(value, check.issues) : null), [flagged, value, check.issues]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (autoGrow && as === 'textarea') {
      el.style.height = 'auto';
      const next = el.scrollHeight + 4;
      el.style.height = `${maxGrowPx ? Math.min(next, maxGrowPx) : next}px`;
    }
    if (!flagged) { colorRef.current = getComputedStyle(el).color; return; }
    const m = mirrorRef.current;
    if (!m) return;
    const cs = getComputedStyle(el);
    for (const k of COPY_STYLES) m.style[k] = cs[k];
    const bl = parseFloat(cs.borderLeftWidth) || 0;
    const br = parseFloat(cs.borderRightWidth) || 0;
    const scrollbar = Math.max(0, el.offsetWidth - el.clientWidth - bl - br);
    m.style.paddingRight = `${(parseFloat(cs.paddingRight) || 0) + scrollbar}px`;
    m.style.top = `${el.offsetTop}px`;
    m.style.left = `${el.offsetLeft}px`;
    m.style.width = `${el.offsetWidth}px`;
    m.style.height = `${el.offsetHeight}px`;
    if (colorRef.current && !/rgba\(0, 0, 0, 0\)|transparent/.test(colorRef.current)) m.style.color = colorRef.current;
    m.scrollTop = el.scrollTop;
    m.scrollLeft = el.scrollLeft;
  });

  const syncScroll = () => {
    if (mirrorRef.current && ref.current) { mirrorRef.current.scrollTop = ref.current.scrollTop; mirrorRef.current.scrollLeft = ref.current.scrollLeft; }
  };
  const Tag = as === 'input' ? 'input' : 'textarea';
  const describe = [describedBy, noteId].filter(Boolean).join(' ');
  return <div className={`cr-field${flagged ? ' is-flagged' : ''}${as === 'input' ? ' is-input' : ''}${wrapClassName ? ` ${wrapClassName}` : ''}`}>
    <Tag
      ref={ref}
      value={value}
      onChange={onChange}
      onScroll={syncScroll}
      onSelect={syncScroll}
      rows={Tag === 'textarea' ? minRows : undefined}
      className={className || undefined}
      aria-invalid={flagged || undefined}
      aria-describedby={describe}
      {...rest}
    />
    {flagged && <div ref={mirrorRef} className="cr-mirror" aria-hidden="true">
      {segments.map((s, i) => (s.flagged ? <mark key={i} className="cr-flag">{s.text}</mark> : <span key={i}>{s.text}</span>))}
      {Tag === 'textarea' && '​'}
    </div>}
    <RuleNote id={noteId} check={check} onShowRules={onShowRules} />
  </div>;
}

export function CommunityRulesList() {
  return <div className="cr-rules-wrap">
    <p className="cr-rules-lead">ayna Community is for honest, kind talk about women&rsquo;s health. Body and health words are always welcome.</p>
    <ol className="cr-rules">
      {COMMUNITY_RULES.map((r, i) => <li key={r.id}><span className="cr-rules-n" aria-hidden="true">{i + 1}</span><span><strong>{r.title}</strong><small>{r.detail}</small></span></li>)}
    </ol>
    <p className="cr-rules-foot">Text that breaks a rule turns red as you type, and you can post once it&rsquo;s fixed. Struggling? Call or text 988 (US) any time.</p>
  </div>;
}
