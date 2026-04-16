function toCurrency(value) {
  if (!Number.isFinite(value)) return '';
  return `$${value.toFixed(2)}`;
}

export function getPricePerUnitLabel(product) {
  if (!product || !['pad', 'tampon'].includes(String(product.category || '').toLowerCase())) return '';
  const priceText = String(product.price || '').trim();
  if (!priceText) return '';

  const amountMatch = priceText.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!amountMatch) return '';
  const amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return '';

  const unitMatch =
    priceText.match(/\bfor\s+(\d+(?:\.\d+)?)\b/i) ||
    priceText.match(/\/\s*(\d+(?:\.\d+)?)\b/i) ||
    priceText.match(/\b(\d+(?:\.\d+)?)\s*(?:count|ct|units?|pads?|tampons?)\b/i);
  if (!unitMatch) return '';
  const units = Number(unitMatch[1]);
  if (!Number.isFinite(units) || units <= 0) return '';

  const unitWord = product.category === 'tampon' ? 'tampon' : 'pad';
  return `${toCurrency(amount / units)} / ${unitWord}`;
}
