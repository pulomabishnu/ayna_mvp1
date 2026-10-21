// Phone and date inputs that format as you type without moving the caret.
//
// How the caret stays put (the approach most mask libraries use): before
// formatting, count the digits to the left of the caret; after formatting,
// put the caret just after that same digit in the new string. Typing,
// deleting and pasting in the middle all keep their place, and a deleted
// separator never "sticks" because we work on digits only.

export const digitsOf = (s) => String(s ?? '').replace(/\D/g, '');

/** US phone: (347) 443-5696. A leading +1 or 1 is kept as "+1 ". */
export function formatUsPhone(raw) {
  const s = String(raw ?? '');
  // Another country code: leave it exactly as typed.
  if (/^\s*\+(?!1)/.test(s)) return s;
  let d = digitsOf(s);
  let lead = '';
  if (d.length > 10 && d[0] === '1') { lead = '+1 '; d = d.slice(1); }
  else if (/^\s*\+1/.test(s)) { lead = '+1 '; d = d.slice(1); }
  d = d.slice(0, 10);
  if (!d) return lead.trim();
  if (d.length < 4) return `${lead}(${d}`;
  if (d.length < 7) return `${lead}(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `${lead}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Dates as MM/DD/YYYY. */
export function formatDateMDY(raw) {
  const d = digitsOf(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Index in `formatted` just after its nth digit (n = digits left of the old caret). */
export function caretAfterDigits(formatted, n) {
  if (n <= 0) {
    const first = formatted.search(/\d/);
    return first === -1 ? formatted.length : first;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) { seen += 1; if (seen === n) return i + 1; }
  }
  return formatted.length;
}

/**
 * onChange helper: formats the input's value and restores the caret.
 * Returns the formatted value so the caller can store it in state.
 *   onChange={(e) => setPhone(maskedChange(e, formatUsPhone))}
 */
export function maskedChange(event, format) {
  const el = event.target;
  let raw = el.value;
  let caret = el.selectionStart ?? raw.length;
  // Backspace that only removed a separator ("(", ")", " ", "-") would be put
  // straight back by the formatter and feel stuck: delete the digit before it.
  const deleting = event.nativeEvent?.inputType === 'deleteContentBackward';
  const prev = el.dataset.maskPrev;
  if (deleting && prev != null && digitsOf(prev) === digitsOf(raw)) {
    let i = caret - 1;
    while (i >= 0 && !/\d/.test(raw[i])) i -= 1;
    if (i >= 0) { raw = raw.slice(0, i) + raw.slice(i + 1); caret = i; }
  }
  // A leading "+1" counts its 1 as a digit in both strings, so it lines up.
  const before = digitsOf(raw.slice(0, caret)).length;
  const next = format(raw);
  if (next !== el.value) {
    el.value = next;
    if (document.activeElement === el) {
      const pos = caretAfterDigits(next, before);
      try { el.setSelectionRange(pos, pos); } catch { /* type=tel supports it; ignore others */ }
    }
  }
  el.dataset.maskPrev = next;
  return next;
}
