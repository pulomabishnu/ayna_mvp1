// Suggestion lists built from the catalog, for the quiz's product and brand
// fields. Kept apart from intakeModel.js (which the site shell needs at first
// paint) because they read the whole catalog (src/data/products.js).
import { ALL_PRODUCTS } from '../../data/products.js';
import { COMMON_BRAND_SUGGESTIONS } from './intakeModel.js';

export const CATALOG_PRODUCT_NAMES = [...new Set((ALL_PRODUCTS || []).map((p) => p?.name).filter(Boolean))];
export const CATALOG_BRANDS = [...new Set((ALL_PRODUCTS || []).flatMap((p) => [p?.brand, p?.brandName, p?.manufacturer, p?.company]).filter(Boolean))];
export const BRAND_SUGGESTIONS = [...new Set([...CATALOG_BRANDS, ...COMMON_BRAND_SUGGESTIONS])];
export const PRODUCT_OR_BRAND_SUGGESTIONS = [...new Set([...CATALOG_PRODUCT_NAMES, ...BRAND_SUGGESTIONS])];
