// Price shown on a card or page. Split from content.js (which re-exports it)
// so SEO text can use it without the passport data.
import { formatPrice } from '../../utils/formatPrice.js';
import { getPricePerUnitLabel } from '../../utils/pricePerUnit.js';

export function priceParts(product) {
  const p = formatPrice(product);
  return { main: p.main, sub: p.sub, perUnit: getPricePerUnitLabel(product), known: p.main !== 'Price at retailer' };
}
