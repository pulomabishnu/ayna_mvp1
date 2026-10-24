// The product's category as shown on the page. Split from glance.js (which
// re-exports it) so SEO titles can use it without the passport data.
// Sentence case at render (docs/terminology.md): "Intimate Care" in the data
// reads "Intimate care" on the page; the data keeps the team's casing.
import { CATEGORY_LABELS } from '../../data/catalogTaxonomy.js';
import { sentenceCase } from '../../utils/sentenceCase.js';

export function categoryLabel(product) {
  return sentenceCase(String(CATEGORY_LABELS[product?.category] || product?.category || '')
    .replace(/^[^\w]+\s*/, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase()));
}
