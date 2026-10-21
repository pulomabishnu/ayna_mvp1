import { describe, expect, it } from 'vitest';
import { formatUsPhone, formatDateMDY, caretAfterDigits } from './inputMask.js';

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
