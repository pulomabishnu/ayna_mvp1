import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { checkCommunityText } from '../../utils/communityRules.js';
import { RuleNote } from './RuleField.jsx';
import { CharRing } from './notesKit.jsx';
import { serializeEditor } from './richTextFormat.js';

// The announcement message box, edited like a Google Doc (Oct 16): what you
// see is the formatting, Cmd/Ctrl+B, U and I work, the buttons light up for
// the text you're in, and typing "- " or "1. " at the start of a line starts
// a list. It still saves the same plain text with light marks (**bold**,
// __underline__, *italic*, "- " and "1. " lines) that RichText shows, so
// nothing stored is HTML. Pasted text comes in plain.

const TOOLS = [
  ['bold', 'B', 'Bold (Cmd+B)', 'bold'],
  ['underline', 'U', 'Underline (Cmd+U)', 'underline'],
  ['italic', 'I', 'Italic (Cmd+I)', 'italic'],
  ['ul', '•', 'Bulleted list', 'insertUnorderedList'],
  ['ol', '1.', 'Numbered list', 'insertOrderedList'],
];

const exec = (cmd) => { try { document.execCommand('styleWithCSS', false, false); return document.execCommand(cmd, false, null); } catch { return false; } };
const isOn = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };

export default function RichEditor({ id, onChange, maxLength = 4000, placeholder = '', onShowRules, label = 'Message' }) {
  const ref = useRef(null);
  const noteId = useId();
  const [text, setText] = useState('');
  const [active, setActive] = useState({});
  const check = useMemo(() => checkCommunityText(text), [text]);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    let v = serializeEditor(el);
    if (v.length > maxLength) v = v.slice(0, maxLength);
    setText(v);
    onChange?.(v);
  }, [maxLength, onChange]);

  const readActive = useCallback(() => {
    const el = ref.current;
    const sel = document.getSelection();
    if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
    setActive(Object.fromEntries(TOOLS.map(([k, , , cmd]) => [k, isOn(cmd)])));
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', readActive);
    return () => document.removeEventListener('selectionchange', readActive);
  }, [readActive]);

  const run = (cmd) => { ref.current?.focus(); exec(cmd); sync(); readActive(); };

  const onKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); run('bold'); return; }
      if (k === 'u') { e.preventDefault(); run('underline'); return; }
      if (k === 'i') { e.preventDefault(); run('italic'); return; }
      if (e.shiftKey && (k === '8' || e.key === '*')) { e.preventDefault(); run('insertUnorderedList'); return; }
      if (e.shiftKey && (k === '7' || e.key === '&')) { e.preventDefault(); run('insertOrderedList'); return; }
    }
    if (e.key === 'Tab') {
      // Keep Tab for moving focus unless inside a list (indent like a doc).
      const sel = document.getSelection();
      const li = sel?.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement)?.closest?.('li');
      if (li && ref.current?.contains(li)) { e.preventDefault(); exec(e.shiftKey ? 'outdent' : 'indent'); sync(); }
    }
  };

  // "- ", "* " or "1. " typed at the start of a line becomes a list.
  const onInput = (e) => {
    const sel = document.getSelection();
    const node = sel?.anchorNode;
    if (e.nativeEvent?.data === ' ' && node && node.nodeType === 3) {
      const before = node.textContent.slice(0, sel.anchorOffset).replace(/\u00a0/g, ' ');
      const inList = node.parentElement?.closest('li');
      const atStart = !node.previousSibling;
      const m = before.match(/^\s*([-*•]|1[.)])\s$/);
      if (m && atStart && !inList) {
        const range = document.createRange();
        range.setStart(node, 0);
        range.setEnd(node, sel.anchorOffset);
        range.deleteContents();
        exec(/^1/.test(m[1]) ? 'insertOrderedList' : 'insertUnorderedList');
      }
    }
    sync();
    readActive();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const t = e.clipboardData?.getData('text/plain') || '';
    try { document.execCommand('insertText', false, t); } catch { /* ignore */ }
    sync();
  };

  return (
    <div className="cr-rte">
      <div className="cr-fmt" role="toolbar" aria-label="Formatting" aria-controls={id}>
        {TOOLS.map(([k, glyph, name, cmd]) => (
          <button key={k} type="button" className={`cr-fmt__btn is-${k}`} aria-label={name} title={name} aria-pressed={Boolean(active[k])}
            onMouseDown={(e) => e.preventDefault()} onClick={() => run(cmd)}>{glyph}</button>
        ))}
      </div>
      <div
        ref={ref}
        id={id}
        className={`cr-input cr-rte__box cr-rich${text ? '' : ' is-empty'}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-describedby={noteId}
        aria-invalid={check.blocked || undefined}
        data-placeholder={placeholder}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyUp={readActive}
        onMouseUp={readActive}
        onPaste={onPaste}
        onBlur={sync}
      />
      <CharRing length={text.length} max={maxLength} className="ay-ring cr-ring" />
      <RuleNote id={noteId} check={check} onShowRules={onShowRules} />
    </div>
  );
}
