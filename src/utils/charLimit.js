// Over a text field's limit (the char ring shows it; forms stay unsendable).
export function isOverLimit(value, max) {
  return String(value || '').length > max;
}
