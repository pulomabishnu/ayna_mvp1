// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { formatUsPhone, formatDateMDY, caretAfterDigits, maskedChange } from './inputMask.js';

describe('input masks', () => {
  it('formats a US phone as you type', () => {
    expect(formatUsPhone('3')).toBe('(3');
    expect(formatUsPhone('347')).toBe('(347');
    expect(formatUsPhone('3474')).toBe('(347) 4');
    expect(formatUsPhone('3474435696')).toBe('(347) 443-5696');
    expect(formatUsPhone('+1 347 443 5696')).toBe('+1 (347) 443-5696');
    expect(formatUsPhone('13474435696')).toBe('+1 (347) 443-5696');
    expect(formatUsPhone('347443569612345')).toBe('(347) 443-5696');
    expect(formatUsPhone('')).toBe('');
    expect(formatUsPhone('+44 20 7946')).toBe('+44 20 7946');
  });
  it('formats dates as MM/DD/YYYY', () => {
    expect(formatDateMDY('1')).toBe('1');
    expect(formatDateMDY('102')).toBe('10/2');
    expect(formatDateMDY('10212026')).toBe('10/21/2026');
    expect(formatDateMDY('10/21/2026x9')).toBe('10/21/2026');
  });
  it('puts the caret after the same digit', () => {
    expect(caretAfterDigits('(347) 443-5696', 3)).toBe(4);
    expect(caretAfterDigits('(347) 443-5696', 4)).toBe(7);
    expect(caretAfterDigits('(347) 443-5696', 0)).toBe(1);
    expect(caretAfterDigits('(347) 443-5696', 10)).toBe(14);
  });
});

// Simulates one input event the way the browser delivers it: the field
// already holds the edited text and the caret sits where the edit ended.
function type(el, value, caret, inputType = 'insertText', format = formatUsPhone) {
  el.value = value;
  el.setSelectionRange(caret, caret);
  return maskedChange({ target: el, nativeEvent: { inputType } }, format);
}

describe('maskedChange keeps the caret in place', () => {
  const field = () => {
    const el = document.createElement('input');
    el.type = 'tel';
    document.body.appendChild(el);
    el.focus();
    return el;
  };

  it('typing at the end lands after the new digit', () => {
    const el = field();
    expect(type(el, '3474', 4)).toBe('(347) 4');
    expect(el.selectionStart).toBe(7);
  });

  it('inserting in the middle keeps the caret after the inserted digit', () => {
    const el = field();
    type(el, '3474435696', 10);
    // Caret after "(34", type 9: "(349" + "7) 443-5696"
    expect(type(el, '(3497) 443-5696', 4)).toBe('(349) 744-3569');
    expect(el.selectionStart).toBe(4);
  });

  it('deleting a digit in the middle keeps the caret where it was', () => {
    const el = field();
    type(el, '3474435696', 10);
    // Backspace the "4" after "(347) ": caret was at 7, now 6.
    expect(type(el, '(347) 43-5696', 6, 'deleteContentBackward')).toBe('(347) 435-696');
    expect(el.selectionStart).toBe(6);
  });

  it('backspace over a separator deletes the digit before it', () => {
    const el = field();
    type(el, '3474', 4);
    // "(347) 4" with the caret after ") ": backspace removes the space only.
    expect(type(el, '(347)4', 5, 'deleteContentBackward')).toBe('(344');
    expect(el.selectionStart).toBe(3);
  });

  it('pasting a full number formats it and puts the caret at the end', () => {
    const el = field();
    expect(type(el, '+1 347 443 5696', 15, 'insertFromPaste')).toBe('+1 (347) 443-5696');
    expect(el.selectionStart).toBe(17);
  });

  it('works for dates too', () => {
    const el = field();
    expect(type(el, '1021', 4, 'insertText', formatDateMDY)).toBe('10/21');
    expect(el.selectionStart).toBe(5);
    // Insert "0" before the day: "10/021" -> "10/02/1", caret after the 0.
    expect(type(el, '10/021', 4, 'insertText', formatDateMDY)).toBe('10/02/1');
    expect(el.selectionStart).toBe(4);
  });
});
