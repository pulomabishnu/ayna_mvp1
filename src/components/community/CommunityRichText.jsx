import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { checkCommunityText } from '../../utils/communityRules.js';
import {
  COMMUNITY_RICH_TEXT_MAX_CHARS,
  communityRichTextToPlainText,
  plainTextToCommunityRichText,
  sanitizeCommunityRichTextDoc,
  setActiveCommunityRichTextDraft,
  truncateCommunityRichText,
} from '../../utils/community/richText.js';
import { RuleNote } from './RuleNote.jsx';
import './CommunityRichText.css';

const BLOCK_TAGS = new Set(['P', 'DIV', 'LI']);

function spanText(node, bold = false, output = []) {
  if (!node) return output;
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue) output.push(bold ? { text: node.nodeValue, bold: true } : { text: node.nodeValue });
    return output;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return output;
  if (node.tagName === 'BR') {
    output.push(bold ? { text: '\n', bold: true } : { text: '\n' });
    return output;
  }
  const weight = node.style?.fontWeight || '';
  const nextBold = bold || node.tagName === 'STRONG' || node.tagName === 'B' || /^(bold|[6-9]00)$/.test(weight);
  for (const child of node.childNodes) spanText(child, nextBold, output);
  return output;
}

function cleanSpans(spans) {
  const result = [];
  for (const span of spans) {
    const text = String(span?.text || '').replace(/\n+/g, ' ');
    if (!text) continue;
    const bold = span?.bold === true;
    const previous = result[result.length - 1];
    if (previous && Boolean(previous.bold) === bold) previous.text += text;
    else result.push(bold ? { text, bold: true } : { text });
  }
  return result;
}

export function communityEditorToDoc(root, maxLength = COMMUNITY_RICH_TEXT_MAX_CHARS) {
  if (!root) return plainTextToCommunityRichText('');
  const blocks = [];
  const children = [...root.childNodes];
  const pushParagraph = (node) => blocks.push({ type: 'paragraph', spans: cleanSpans(spanText(node)) });

  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue) blocks.push({ type: 'paragraph', spans: [{ text: node.nodeValue }] });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      const items = [...node.children]
        .filter((child) => child.tagName === 'LI')
        .map((item) => ({ spans: cleanSpans(spanText(item)) }));
      if (items.length) blocks.push({ type: 'bulletList', items });
      continue;
    }
    if (node.tagName === 'BR') {
      blocks.push({ type: 'paragraph', spans: [] });
      continue;
    }
    pushParagraph(node);
  }

  return truncateCommunityRichText({ version: 1, blocks: blocks.length ? blocks : [{ type: 'paragraph', spans: [] }] }, maxLength);
}

function appendSpans(parent, spans) {
  for (const span of spans || []) {
    const text = document.createTextNode(String(span.text || ''));
    if (span.bold) {
      const strong = document.createElement('strong');
      strong.appendChild(text);
      parent.appendChild(strong);
    } else parent.appendChild(text);
  }
  if (!parent.childNodes.length) parent.appendChild(document.createElement('br'));
}

function renderDocIntoEditor(root, value) {
  if (!root) return;
  const doc = sanitizeCommunityRichTextDoc(value) || plainTextToCommunityRichText('');
  const fragment = document.createDocumentFragment();
  for (const block of doc.blocks) {
    if (block.type === 'bulletList') {
      const list = document.createElement('ul');
      for (const item of block.items) {
        const li = document.createElement('li');
        appendSpans(li, item.spans);
        list.appendChild(li);
      }
      fragment.appendChild(list);
    } else {
      const p = document.createElement('p');
      appendSpans(p, block.spans);
      fragment.appendChild(p);
    }
  }
  root.replaceChildren(fragment);
}

function placeCaretAtEnd(node) {
  const selection = window.getSelection?.();
  if (!selection || !node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function selectionBlock(root) {
  const selection = window.getSelection?.();
  if (!selection?.rangeCount || !root.contains(selection.anchorNode)) return null;
  let node = selection.anchorNode.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode.parentElement;
  while (node && node !== root) {
    if (BLOCK_TAGS.has(node.tagName)) return node;
    node = node.parentElement;
  }
  return null;
}

function selectionIsCollapsedAtStart(node) {
  const selection = window.getSelection?.();
  if (!selection?.rangeCount || !selection.isCollapsed || !node) return false;
  const probe = document.createRange();
  probe.selectNodeContents(node);
  probe.setEnd(selection.anchorNode, selection.anchorOffset);
  return probe.toString().length === 0;
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function safeCommunityPasteHtml(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const chunks = [];
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    chunks.push(`<ul>${list.map((item) => `<li>${escapeHtml(item) || '<br>'}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const bullet = line.match(/^\s*(?:[-*•])\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flushList();
    chunks.push(`<p>${escapeHtml(line) || '<br>'}</p>`);
  }
  flushList();
  return chunks.join('');
}

function renderSpans(spans, prefix) {
  return (spans || []).map((span, index) => span.bold
    ? <strong key={`${prefix}-${index}`}>{span.text}</strong>
    : <span key={`${prefix}-${index}`}>{span.text}</span>);
}

export function CommunityRichTextContent({ body = '', richBody = null }) {
  const doc = useMemo(() => sanitizeCommunityRichTextDoc(richBody), [richBody]);
  if (!doc) return body;
  return <span className="cr-rich-output">
    {doc.blocks.map((block, blockIndex) => block.type === 'bulletList'
      ? <span className="cr-rich-list" key={`list-${blockIndex}`}>{block.items.map((item, itemIndex) => <span className="cr-rich-bullet" key={`item-${blockIndex}-${itemIndex}`}><span className="cr-rich-bullet-mark" aria-hidden="true">•</span><span>{renderSpans(item.spans, `i-${blockIndex}-${itemIndex}`)}</span></span>)}</span>
      : <span className="cr-rich-paragraph" key={`p-${blockIndex}`}>{renderSpans(block.spans, `p-${blockIndex}`)}</span>)}
  </span>;
}

export function CommunityRichTextEditor({
  id,
  value = '',
  richValue = null,
  onChange,
  onRichChange,
  maxLength = COMMUNITY_RICH_TEXT_MAX_CHARS,
  placeholder = '',
  onShowRules,
  className = '',
  'aria-describedby': describedBy,
  ...rest
}) {
  const editorRef = useRef(null);
  const lastPlainRef = useRef(null);
  const noteId = useId();
  const [boldActive, setBoldActive] = useState(false);
  const check = useMemo(() => checkCommunityText(value), [value]);
  const describe = [describedBy, noteId].filter(Boolean).join(' ');

  const publishDraft = (doc) => {
    setActiveCommunityRichTextDraft(doc);
    onRichChange?.(doc);
  };

  const emit = () => {
    const root = editorRef.current;
    if (!root) return;
    let doc = communityEditorToDoc(root, maxLength);
    let plain = communityRichTextToPlainText(doc);
    if (plain.length > maxLength) {
      doc = truncateCommunityRichText(doc, maxLength);
      plain = communityRichTextToPlainText(doc);
      renderDocIntoEditor(root, doc);
      placeCaretAtEnd(root);
    }
    root.dataset.empty = plain ? 'false' : 'true';
    lastPlainRef.current = plain;
    publishDraft(doc);
    onChange?.({ target: { value: plain } });
    try { setBoldActive(Boolean(document.queryCommandState?.('bold'))); } catch { setBoldActive(false); }
  };

  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const provided = sanitizeCommunityRichTextDoc(richValue);
    const initial = provided && communityRichTextToPlainText(provided) === value
      ? provided
      : plainTextToCommunityRichText(value, maxLength);
    renderDocIntoEditor(root, initial);
    const plain = communityRichTextToPlainText(initial);
    root.dataset.empty = plain ? 'false' : 'true';
    lastPlainRef.current = plain;
    publishDraft(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = editorRef.current;
    if (!root || value === lastPlainRef.current) return;
    const provided = sanitizeCommunityRichTextDoc(richValue);
    const next = provided && communityRichTextToPlainText(provided) === value
      ? provided
      : plainTextToCommunityRichText(value, maxLength);
    renderDocIntoEditor(root, next);
    const plain = communityRichTextToPlainText(next);
    root.dataset.empty = plain ? 'false' : 'true';
    lastPlainRef.current = plain;
    publishDraft(next);
  }, [value, richValue, maxLength]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncSoon = () => window.requestAnimationFrame(emit);
  const toggleBold = () => {
    editorRef.current?.focus();
    document.execCommand?.('bold', false);
    syncSoon();
  };
  const toggleBullet = () => {
    editorRef.current?.focus();
    document.execCommand?.('insertUnorderedList', false);
    syncSoon();
  };

  const handleInput = () => {
    const root = editorRef.current;
    const block = selectionBlock(root);
    if (block && block.tagName !== 'LI' && block.textContent === '- ') {
      block.replaceChildren(document.createElement('br'));
      placeCaretAtEnd(block);
      document.execCommand?.('insertUnorderedList', false);
    }
    emit();
  };

  const handleKeyDown = (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && !event.altKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      event.stopPropagation();
      toggleBold();
      return;
    }
    // Keep the browser's native undo/redo stack. Do not intercept Cmd/Ctrl+Z.
    if (modifier && event.key.toLowerCase() === 'z') return;

    const root = editorRef.current;
    const block = selectionBlock(root);
    if (block?.tagName === 'LI' && !block.textContent.trim()) {
      if (event.key === 'Enter' || (event.key === 'Backspace' && selectionIsCollapsedAtStart(block))) {
        event.preventDefault();
        document.execCommand?.('insertUnorderedList', false);
        syncSoon();
      }
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text) return;
    const current = communityRichTextToPlainText(communityEditorToDoc(editorRef.current, maxLength));
    const selection = window.getSelection?.();
    const selectedLength = selection?.rangeCount ? selection.toString().length : 0;
    const room = Math.max(0, maxLength - (current.length - selectedLength));
    const clipped = text.slice(0, room);
    if (!clipped) return;
    if (!clipped.includes('\n') && !/^\s*(?:[-*•])\s+/.test(clipped)) document.execCommand?.('insertText', false, clipped);
    else document.execCommand?.('insertHTML', false, safeCommunityPasteHtml(clipped));
    syncSoon();
  };

  const updateToolbarState = () => {
    if (!editorRef.current?.contains(document.activeElement) && document.activeElement !== editorRef.current) return;
    try { setBoldActive(Boolean(document.queryCommandState?.('bold'))); } catch { setBoldActive(false); }
  };

  return <div className={`cr-rich-field${className ? ` ${className}` : ''}`}>
    <div className="cr-rich-toolbar" role="toolbar" aria-label="Text formatting">
      <button type="button" className={boldActive ? 'is-active' : ''} aria-pressed={boldActive} aria-label="Bold" title="Bold (Cmd/Ctrl+B)" onMouseDown={(event) => event.preventDefault()} onClick={toggleBold}><strong>B</strong></button>
      <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={toggleBullet}>•</button>
    </div>
    <div
      {...rest}
      id={id}
      ref={editorRef}
      className="cr-rich-editor"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-invalid={check.blocked || undefined}
      aria-describedby={describe || undefined}
      data-placeholder={placeholder}
      data-empty="true"
      tabIndex={0}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onKeyUp={updateToolbarState}
      onMouseUp={updateToolbarState}
      onFocus={updateToolbarState}
    />
    <RuleNote id={noteId} check={check} onShowRules={onShowRules} />
  </div>;
}
