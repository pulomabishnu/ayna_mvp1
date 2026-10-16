// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { serializeEditor } from './richTextFormat.js';

const ser = (html) => { const d = document.createElement('div'); d.innerHTML = html; return serializeEditor(d); };

describe('serializeEditor (doc-style announcement box)', () => {
  it('keeps bold, underline and italic as light marks', () => {
    expect(ser('Join <b>Thursday</b> at <u>6pm</u>, <i>bring a friend</i>')).toBe('Join **Thursday** at __6pm__, *bring a friend*');
  });
  it('turns lists into "- " and numbered lines', () => {
    expect(ser('<div>What to bring:</div><ul><li>Water</li><li><b>Questions</b></li></ul><ol><li>Sign up</li><li>Show up</li></ol>'))
      .toBe('What to bring:\n- Water\n- **Questions**\n1. Sign up\n2. Show up');
  });
  it('keeps lines and blank lines, drops HTML', () => {
    expect(ser('Hi<div><br></div><div>Second <script>x</script>line</div>')).toBe('Hi\n\nSecond xline');
  });
  it('treats non-breaking spaces as spaces', () => {
    expect(ser('a\u00a0b')).toBe('a b');
  });
});
