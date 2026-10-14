// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RuleField } from './RuleField.jsx';
import {
  CommunityRichTextContent,
  CommunityRichTextEditor,
  communityEditorToDoc,
  safeCommunityPasteHtml,
} from './CommunityRichText.jsx';

let host;
let root;

function render(node) {
  act(() => root.render(node));
  return host;
}

function selectText(node, start = 0, end = start) {
  const text = node.firstChild || node;
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, end);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function selectInside(node, offset = 0) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => true) });
  Object.defineProperty(document, 'queryCommandState', { configurable: true, value: vi.fn(() => false) });
  Object.defineProperty(window, 'requestAnimationFrame', { configurable: true, value: (callback) => { callback(); return 1; } });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.getSelection()?.removeAllRanges();
  vi.restoreAllMocks();
});

describe('CommunityRichTextEditor', () => {
  it('uses Cmd+B on Mac and prevents the browser shortcut', () => {
    render(<CommunityRichTextEditor value="important" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.focus();
    const p = editor.querySelector('p');
    selectInside(p, p.childNodes.length);

    const event = new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false);
  });

  it('uses Ctrl+B on Windows', () => {
    render(<CommunityRichTextEditor value="important" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.focus();
    const p = editor.querySelector('p');
    selectInside(p, p.childNodes.length);

    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false);
  });

  it('bolds an existing selection and also supports a collapsed bold typing mode', () => {
    render(<CommunityRichTextEditor value="hello world" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.focus();
    const p = editor.querySelector('p');
    selectText(p, 0, 5);
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true, cancelable: true }));

    selectInside(p, p.childNodes.length);
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true, cancelable: true }));

    expect(document.execCommand).toHaveBeenCalledTimes(2);
    expect(document.execCommand).toHaveBeenNthCalledWith(1, 'bold', false);
    expect(document.execCommand).toHaveBeenNthCalledWith(2, 'bold', false);
  });

  it('does not intercept native Cmd/Ctrl+Z undo or Shift+Z redo', () => {
    render(<CommunityRichTextEditor value="hello" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.focus();

    const undo = new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true });
    const redo = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true });
    editor.dispatchEvent(undo);
    editor.dispatchEvent(redo);

    expect(undo.defaultPrevented).toBe(false);
    expect(redo.defaultPrevented).toBe(false);
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('converts a leading dash and space into a bulleted list command', () => {
    render(<CommunityRichTextEditor value="" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.innerHTML = '<p>- </p>';
    const p = editor.querySelector('p');
    selectInside(p, p.childNodes.length);

    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false);
  });

  it('exits an empty bullet on Enter', () => {
    render(<CommunityRichTextEditor value="" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.innerHTML = '<ul><li><br></li></ul>';
    const li = editor.querySelector('li');
    selectInside(li, 0);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false);
  });

  it('exits an empty bullet on Backspace at its beginning', () => {
    render(<CommunityRichTextEditor value="" onChange={() => {}} />);
    const editor = host.querySelector('.cr-rich-editor');
    editor.innerHTML = '<ul><li><br></li></ul>';
    const li = editor.querySelector('li');
    selectInside(li, 0);

    const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false);
  });

  it('serializes mixed paragraphs, bold text and bullets into the safe structure', () => {
    const rootNode = document.createElement('div');
    rootNode.innerHTML = '<p>Intro <strong>important</strong></p><ul><li>one</li><li><strong>two</strong></li></ul><p>Done</p>';

    expect(communityEditorToDoc(rootNode)).toEqual({
      version: 1,
      blocks: [
        { type: 'paragraph', spans: [{ text: 'Intro ' }, { text: 'important', bold: true }] },
        { type: 'bulletList', items: [
          { spans: [{ text: 'one' }] },
          { spans: [{ text: 'two', bold: true }] },
        ] },
        { type: 'paragraph', spans: [{ text: 'Done' }] },
      ],
    });
  });

  it('pastes only escaped plain text while preserving paragraphs and list lines', () => {
    const html = safeCommunityPasteHtml('hello <img src=x onerror=alert(1)>\n- one\n- two\n<script>alert(1)</script>');
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});

describe('Community rich text rendering and scope', () => {
  it('renders saved bold and bullets without injecting arbitrary HTML', () => {
    const richBody = {
      version: 1,
      blocks: [
        { type: 'paragraph', spans: [{ text: 'Important', bold: true }, { text: ' note' }] },
        { type: 'bulletList', items: [{ spans: [{ text: '<script>not markup</script>' }] }] },
      ],
    };
    render(<CommunityRichTextContent body="fallback" richBody={richBody} />);

    expect(host.querySelector('strong')?.textContent).toBe('Important');
    expect(host.querySelector('.cr-rich-bullet')?.textContent).toContain('•<script>not markup</script>');
    expect(host.querySelector('script')).toBeNull();
  });

  it('keeps existing plain-text posts rendering normally', () => {
    render(<CommunityRichTextContent body="old plain-text post" richBody={null} />);
    expect(host.textContent).toBe('old plain-text post');
  });

  it('enables rich editing only on Community post composer IDs', () => {
    render(<RuleField id="wc-compose-body" value="" onChange={() => {}} placeholder="What’s on your mind?" />);
    expect(host.querySelector('[contenteditable="true"]')).not.toBeNull();
    expect(host.querySelector('.cr-rich-toolbar')).not.toBeNull();

    act(() => root.render(<RuleField id="profile-bio" value="" onChange={() => {}} placeholder="Bio" />));
    expect(host.querySelector('textarea')).not.toBeNull();
    expect(host.querySelector('[contenteditable="true"]')).toBeNull();
    expect(host.querySelector('.cr-rich-toolbar')).toBeNull();
  });

  it('keeps the Community recommendation note plain even though it shares the web composer ID', () => {
    render(<RuleField id="wc-compose-body" value="" onChange={() => {}} placeholder="Add a note (optional)" />);
    expect(host.querySelector('textarea')).not.toBeNull();
    expect(host.querySelector('[contenteditable="true"]')).toBeNull();
  });

  it('enables the same scoped editor on the mobile Community post composer', () => {
    render(<RuleField id="am-post-text" value="" onChange={() => {}} placeholder="What’s on your mind?" />);
    expect(host.querySelector('[contenteditable="true"]')).not.toBeNull();
    expect(host.querySelector('.cr-rich-toolbar')).not.toBeNull();
  });
});
