// Products that never show anywhere (page, search, shelves, chatbot), whether
// they come from the bundled catalog or the live product_catalog feed.
// Kept dependency-free so api/products.js and the client loader can share it.
//
// Before Nov 9 2026 this list only filtered the bundled copy, so the live feed
// still served these rows. adoptLiveCatalog, the client loader and
// /api/products now all apply it.
export const TEMPORARILY_HIDDEN_IDS = new Set([
    // Hidden for now (team decision, Oct 11 2026): a clinician teaching model,
    // not a consumer product. Bring back once there's a clinician-facing surface.
    'p-mypelvicbra-prolapse-chicken',
    // Removed 2026-10-13 (founder): no photo anywhere and apparently discontinued.
    // June Cup's domain now belongs to a soccer tournament; Pink Stork Bloat
    // capsules no longer exist (only gummies); Queen V "The Pop It" is not sold
    // by any retailer we could find. Re-confirmed by Ameera Nov 9 2026.
    'p-june-cup',
    'p-pink-stork-bloat',
    'p-queen-v-pop',
    // Hidden by Ameera, Nov 9 2026: no product photo anywhere.
    'p-twentyeight-health-skin-care-prescription-skincare-via-complete-care',
]);

// Ayna only does OTC health products and telehealth.
export function isRxOnlyProduct(p) {
    if (!p) return false;
    if (p.category === 'telehealth') return false;
    if (p.requiresPrescription === true) return true;
    const wtb = (p.whereToBuy || []).map((x) => String(x).toLowerCase());
    // Covers both pharmacy-dispensed prescriptions and clinician-administered
    // devices/procedures (e.g. IUD insertion), neither is something Ayna sells.
    return wtb.some((s) => s.includes('pharmacy with prescription') || s.includes('clinic insertion') || s.includes('clinic administered'));
}

/** True when a product may be shown to users. */
export function isListedProduct(p) {
    return Boolean(p?.id) && !p.hidden && !TEMPORARILY_HIDDEN_IDS.has(p.id) && !isRxOnlyProduct(p);
}
