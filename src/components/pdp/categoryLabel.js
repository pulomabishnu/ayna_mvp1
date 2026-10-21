// The product's category as shown on the page. Split from glance.js (which
// re-exports it) so SEO titles can use it without the passport data.
import { CATEGORY_LABELS } from '../../data/catalogTaxonomy.js';

export function categoryLabel(product) {
  return String(CATEGORY_LABELS[product?.category] || product?.category || '')
    .replace(/^[^\w]+\s*/, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
