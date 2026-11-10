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

// Duplicate listings in the live catalog (founder, Nov 10 2026: "if it shows up twice and is the
// same exact product, delete it; a different size or flavor, merge it"). The duplicate never
// shows; links and saved items that use its id open the product it duplicates. Rows stay in
// product_catalog (never deleted). Checked against /api/products on Nov 10.
export const DUPLICATE_OF = Object.freeze({
    // Same product listed twice (same name, price and copy).
    'p-vella-pleasurewave-arousal-lotion-with-lptv1-2': 'p-vella-pleasurewave-arousal-lotion-with-lptv1',
    'p-wevana-wevana-tabs-wireless-bilateral-stimulation-tabs-emdr-tappers': 'p-wevana-tabs-wireless-emdr-tappers-for-calm-focus-and-sleep',
    // Imported copy of the team's Winx entry (src/data/brands.js), which keeps its research.
    'p-winx-health-vaginal-health-test-treat': 'p-winx-vaginal-health-test-treat',
    'p-le-jardin-switzerland-the-hair-multiplier-lightweight-growth-serum-3': 'p-le-jardin-switzerland-the-hair-multiplier-hair-growth-serum',
    // Same product in another flavor or pack size: one listing.
    'p-magna-magnesium-powered-electrolytes-core-hydration': 'p-magna-magna-magnesium-powered-electrolytes',
});

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
    return Boolean(p?.id) && !p.hidden && !TEMPORARILY_HIDDEN_IDS.has(p.id) && !DUPLICATE_OF[p.id] && !isRxOnlyProduct(p);
}
