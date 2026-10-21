// The catalog's light taxonomy: care areas, category labels and the helpers
// that sort a product into them. Moved here unchanged from products.js (which
// re-exports all of it) so the first paint can use it without downloading the
// catalog itself (perf: src/data/catalog.js loads products.js on demand).

// Health function categories for ecosystem tracking
export const HEALTH_FUNCTIONS = {
    // ── Core period care ─────────────────────────────────────────────────────
    'menstrual-collection': { label: 'Period Care', desc: 'Products that collect or absorb menstrual flow' },
    'cycle-tracking': { label: 'Cycle Tracking', desc: 'Apps or devices that track your menstrual cycle' },
    'cramp-relief': { label: 'Cramp & Pain Relief', desc: 'Products that help manage period cramps and pain' },
    'leak-protection': { label: 'Leak Protection', desc: 'Backup products to prevent leaks and staining' },
    // ── Hormonal & reproductive health ───────────────────────────────────────
    'pcos-management': { label: 'PMOS Management', desc: 'Supplements, apps and telehealth for PMOS' },
    'endometriosis': { label: 'Endometriosis Support', desc: 'Products and services for endometriosis management' },
    'hormone-balance': { label: 'Hormone Balance', desc: 'Products for hormonal bloating and regulation' },
    'fertility': { label: 'Fertility & Conception', desc: 'Products and services for fertility and TTC' },
    'perimenopause': { label: 'Perimenopause & Menopause', desc: 'Support for perimenopause and menopause symptoms' },
    'contraception': { label: 'Contraception', desc: 'Birth control and reproductive health' },
    // ── Vaginal & intimate health ─────────────────────────────────────────────
    'vaginal-health': { label: 'Gut & Vaginal Health', desc: 'Probiotics, pH balance and intimate wellness' },
    'uti-prevention': { label: 'UTI Support', desc: 'Products for preventing or treating UTIs' },
    'sexual-health': { label: 'Sexual Health & Comfort', desc: 'Lubricants, pelvic floor and intimate comfort' },
    // ── Whole-body wellness ───────────────────────────────────────────────────
    'mental-health': { label: 'Mental Health & Mood', desc: 'Mental wellness, therapy and mood support' },
    'sleep-energy': { label: 'Sleep & Energy', desc: 'Products to improve sleep and energy levels' },
    'skin-hair': { label: 'Skin & Hair', desc: 'Products for hormone-related skin and hair concerns' },
    'fitness-cycle': { label: 'Cycle-Synced Fitness', desc: 'Workouts and nutrition synced to your cycle' },
    // ── Access & safety ───────────────────────────────────────────────────────
    'telehealth': { label: 'Telehealth & Providers', desc: 'Online doctor consultations and specialist access' },
    'routine-building': { label: 'Health Routine Apps', desc: 'Apps and platforms to build your health routine' },
    // ── Kept for existing database products ──────────────────────────────────
    'supplement': { label: 'Supplements', desc: 'Vitamins and supplements for women\'s health' },
};

// Helper to look up category labels (MVP categories included)
export const CATEGORY_LABELS = {
    'pad': 'Pads',
    'tampon': 'Tampons',
    'cup': 'Menstrual Cups',
    'disc': 'Menstrual Discs',
    'period-underwear': 'Period Underwear',
    'period-care': 'Period Care',
    'supplement': 'Supplements',
    'supplements': 'Supplements',
    'tracker': 'Trackers & Wearables',
    'telehealth': 'Virtual care',
    'mental-health': 'Mental Wellness',
    'fitness': 'Fitness',
    'fitness-cycle': 'Cycle Fitness',
    'pelvic-floor': 'Pelvic Floor',
    // Split 2026-09-16 per Ayna's clinical correction: "Trainer" devices are
    // biofeedback-only (Elvie, Perifit, Kegel balls), not FDA-cleared to
    // activate anything, they just help you do Kegels yourself. "Exerciser"
    // devices are FDA-cleared Class II stimulation devices that contract the
    // pelvic floor FOR you (Emsella, Yarlap, Elitone, not Elitone URGE,
    // which calms rather than exercises). Generic 'pelvic-floor' remains for
    // items that are neither (garments, wands, dilators, apps, programs).
    'pelvic-floor-trainer': 'Pelvic Floor Trainer',
    'pelvic-floor-exerciser': 'Pelvic Floor Exerciser',
    'pelvic-health': 'Pelvic Health',
    'cramp-relief': 'Cramp Relief',
    'intimate-care': 'Intimate Care',
    'menopause': 'Menopause Support',
    'sex-tech': 'Sexual Wellness',
    'postpartum': 'Postpartum Recovery',
    'pregnancy': 'Pregnancy Support',
    'fertility': 'Fertility',
    'diagnostics': 'Diagnostics',
    'hormone-monitoring': 'Hormone Monitoring',
    'custom-brand': 'Your brands',
    'medication': 'Medications',
    // Real catalog category values that had no label here at all, so the
    // Product Type filter dropdown fell back to raw lowercase text for them
    // (found live, 2026-08-24 bug bash: "cup steamer", "incontinence",
    // "sleep" sitting inconsistently alongside Title Case labels elsewhere
    // in the same list).
    'cup-steamer': 'Cup Steamer',
    'incontinence': 'Incontinence',
    'sleep': 'Sleep',
    'contraception': 'Birth Control',
    'breast-care': 'Breast Care',
    'lactation': 'Lactation',
    'skin': 'Skin',
    'skincare': 'Skin',
    'body-care': 'Skin',
    'hair': 'Hair',
    'haircare': 'Hair',
    'gut-health': 'Gut',
    'pain-relief': 'Pain + Recovery',
    'recovery': 'Pain + Recovery',
};

// The site's one taxonomy of user-facing care areas, each rolling up one or more
// raw catalog `category` values. Originally lived only in Discovery.jsx (as its
// category-filter chips); moved here so it can also be the single source of
// truth for EcosystemBubbles' area grouping, it used to keep its own smaller,
// separately-hand-maintained category list that had drifted out of sync
// (missing birth-control, breast care, menopause, skin, hair, gut, pain-relief,
// tests-devices...), so any product in one of those categories silently landed
// in a generic "Other" bubble instead of a properly named one (found live,
// Aditi 2026-08-24: a sleep product added to an ecosystem should get its own
// "Sleep" bubble, not fall into "Other").
export const MACRO_GROUPS = [
    { id: 'all', label: 'All', categories: [], keywords: [] },
    // Virtual care clinics mention periods in their copy but aren't period products;
    // they have their own home under Virtual care.
    { id: 'period', label: 'Period', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief', 'cup-steamer'], keywords: ['period', 'menstrual'], excludeCategories: ['telehealth'] },
    // 'ph' used to be a bare keyword here and matched any product whose copy happened to
    // contain the substring "ph", e.g. Nature Made Iron ("#1 pharmacist recommended"), Wisp
    // ("pharmacy pickup"), and Apple Health ("built into iPhone") all satisfied it despite
    // having nothing to do with intimate care. Scoped to the actual phrasing real vaginal-pH
    // products use (see e.g. p-honeypot-wash, p-good-clean-love, p-v-wash) instead.
    { id: 'intimate', label: 'Intimate Care', categories: ['intimate-care'], keywords: ['vaginal', 'vulva', 'intimate', 'moisturizer', 'ph balance', 'ph-balanced', 'ph balanced', 'ph level', 'ph support'] },
    { id: 'sexual', label: 'Sexual Wellness', categories: ['sex-tech'], keywords: ['lubricant', 'lube', 'condom', 'sexual wellness', 'intimacy'] },
    // A bare 'barrier' keyword matched "skin barrier" and "moisture barrier" copy (kieró skincare,
    // Joylux vaginal gel) and never a real contraceptive, so only explicit barrier-contraception
    // phrasing counts (2026-10-07). 'condom' is deliberately absent: lubricant copy says
    // "condom-compatible". Skin and hair categories stay opted out of the keyword scan.
    { id: 'birth-control', label: 'Birth Control', categories: ['contraception'], keywords: ['contraception', 'contraceptive', 'emergency contraception', 'barrier method', 'barrier contraception'], excludeCategories: ['skin', 'skincare', 'body-care', 'hair', 'haircare'] },
    { id: 'fertility', label: 'Fertility', categories: ['fertility'], keywords: ['fertility', 'ovulation', 'conceive', 'conception'] },
    { id: 'pregnancy', label: 'Pregnancy', categories: ['pregnancy'], keywords: ['pregnancy', 'prenatal'] },
    { id: 'postpartum', label: 'Postpartum', categories: ['postpartum'], keywords: ['postpartum', 'lactation', 'breastfeeding', 'perineal'] },
    { id: 'breast', label: 'Breast Care', categories: ['breast-care', 'lactation'], keywords: ['breast', 'breastfeeding', 'nipple', 'pump', 'lactation'] },
    { id: 'pelvic', label: 'Pelvic', categories: ['pelvic-floor', 'pelvic-floor-trainer', 'pelvic-floor-exerciser', 'pelvic-health', 'incontinence'], keywords: ['pelvic', 'kegel', 'bladder', 'incontinence', 'bladder leak'] },
    { id: 'menopause', label: 'Menopause', categories: ['menopause'], keywords: ['menopause', 'perimenopause', 'hot flash'] },
    // 'supplement' is a product-TYPE category shared by dozens of unrelated items (iron for
    // anemia, plain vitamin D, omega-3 for cramps, etc.), it used to be listed here directly,
    // which meant EVERY supplement in the catalog satisfied the Hormones chip regardless of what
    // it actually treats. Matching is now scoped to the real concern taxonomy instead: the
    // 'hormone-monitoring' category, the 'hormone-balance' healthFunction (checked exactly via
    // healthFunctions below, not folded into the general keyword text blob, a substring scan
    // would otherwise let something like the unrelated 'fitness-cycle' healthFunction slug
    // falsely satisfy the 'cycle' keyword), and the keywords below.
    { id: 'hormones', label: 'Hormones', categories: ['hormone-monitoring'], healthFunctions: ['hormone-balance'], keywords: ['pms', 'pcos', 'pmos', 'cycle', 'hormone', 'hormonal'] },
    // Bare 'skin'/'moisturizer' catch vulvar/vulva-balm copy ("vulvar skin", "arousal
    // moisturizers") and an incontinence liner's "skin comfort formula" claim, all real
    // catalog phrasing, just not about the facial/body skincare this chip means. Those
    // product types are excluded from the keyword scan below (see excludeCategories in
    // itemMatchesMacroGroup) rather than trying to enumerate every mismatched phrase.
    { id: 'skin', label: 'Skin', categories: ['skin', 'skincare', 'body-care'], keywords: ['skin', 'cleanser', 'moisturizer', 'spf', 'acne', 'hyperpigmentation'], excludeCategories: ['intimate-care', 'sex-tech', 'incontinence'] },
    // Same class of bug as Skin above: 'thinning' and 'hair' were catching "vaginal dryness
    // and thinning" (a menopause GSM symptom, not hair thinning) and "ingrown hairs...on the
    // bikini line" (intimate-area exfoliation, not hair care). excludeCategories keeps those
    // out of the keyword scan.
    { id: 'hair', label: 'Hair', categories: ['hair', 'haircare'], keywords: ['hair', 'scalp', 'shampoo', 'conditioner', 'thinning'], excludeCategories: ['intimate-care', 'menopause'] },
    { id: 'gut', label: 'Gut', categories: ['gut-health'], keywords: ['gut', 'bloating', 'fiber', 'probiotic'] },
    // 'stress' alone matched incontinence products' clinical term "stress incontinence"/
    // "stress or urge bladder leaks" (a bladder-control classification, unrelated to mental
    // stress), stripped via NEGATED_CONCERN_PHRASES in Discovery.jsx rather than dropping the
    // keyword, since "stress" genuinely belongs here for its real (psychological) sense.
    // 'sleep' is a real distinct category value in the live catalog (e.g. Eight Sleep Pod)
    // alongside 'mental-health', both belong under this chip.
    { id: 'sleep-stress', label: 'Sleep + Stress', categories: ['mental-health', 'sleep'], keywords: ['sleep', 'stress', 'relaxation'] },
    { id: 'pain-recovery', label: 'Pain + Recovery', categories: ['pain-relief', 'cramp-relief', 'recovery'], keywords: ['pain', 'cramp', 'heat therapy', 'recovery', 'muscle'] },
    // 'test' used to be a bare keyword and matched "clinically tested" (Honey Pot wash),
    // "gynecologist-tested" (Luna wash), and even "testosterone" (spearmint PCOS tea), none
    // of which are diagnostic tests/devices. Scoped to the phrasing real test products use
    // (p-azo-test's "test strips", p-winx-uti-test-treat's "rapid test").
    { id: 'tests-devices', label: 'Tests + Devices', categories: ['tracker', 'diagnostics', 'hormone-monitoring'], keywords: ['test strip', 'test kit', 'rapid test', 'diagnostic test', 'lab test', 'tracker', 'wearable', 'monitor'] },
];

// The Browse pills: a few BROAD groups that run in order through life, from
// first period to post-menopause. They are a layer over MACRO_GROUPS (which stays
// fine-grained because EcosystemBubbles, deep links and search nudges all key off
// those ids), each pill simply covers several MACRO_GROUPS ids.
export const BROWSE_GROUPS = [
    { id: 'all', label: 'All', covers: [] },
    { id: 'life-periods', label: 'Cycle', covers: ['period', 'hormones'] },
    { id: 'life-intimate', label: 'Vaginal & Sexual', covers: ['intimate', 'sexual'] },
    { id: 'life-pregnancy', label: 'Pregnancy', covers: ['pregnancy'] },
    { id: 'life-postpartum', label: 'Postpartum', covers: ['postpartum', 'breast'] },
    { id: 'life-pelvic', label: 'Pelvic Health', covers: ['pelvic'] },
    // The catalog has no per-stage field: products are tagged/categorized 'menopause' as a
    // whole. So Perimenopause and Postmenopause match on their own tag/wording, and Menopause
    // stays the broad pill (it also covers everything general to all three stages).
    { id: 'life-perimenopause', label: 'Perimenopause', covers: [], tags: ['perimenopause'], keywords: ['perimenopause', 'perimenopausal'] },
    { id: 'life-menopause', label: 'Menopause', covers: ['menopause'] },
    { id: 'life-postmenopause', label: 'Postmenopause', covers: [], tags: ['postmenopause'], keywords: ['postmenopause', 'post-menopause', 'postmenopausal', 'post-menopausal', 'after menopause', 'osteoporosis', 'bone density', 'vaginal atrophy', 'genitourinary syndrome'] },
    { id: 'life-tests-telehealth', label: 'Tests & Telehealth', covers: ['tests-devices'], categories: ['telehealth'] },
    { id: 'life-wellness', label: 'Wellness', covers: ['skin', 'hair', 'gut', 'sleep-stress', 'pain-recovery'] },
];

/** Maps any group id (a fine MACRO_GROUPS id or a BROWSE_GROUPS id) to the Browse pill that contains it. */
export function browseGroupIdFor(groupId) {
    if (!groupId || groupId === 'all') return 'all';
    if (BROWSE_GROUPS.some((g) => g.id === groupId)) return groupId;
    return BROWSE_GROUPS.find((g) => g.covers.includes(groupId))?.id || groupId;
}

// Some product copy legitimately advertises the ABSENCE of a property, e.g. Neycher's
// intimate-care line describing itself as "hormone-free" / "non-hormonal", rather than the
// presence of it. A naive substring match on a concern keyword like "hormone" can't tell "this
// product is about hormones" apart from "this product explicitly contains none," so it was
// mis-filing hormone-free vulva balm/moisturizing gel under the Hormones chip. Strip these
// negated phrases out before keyword matching so a chip only surfaces products that are
// actually about the concern, not ones that merely deny it.
//
// Broadened beyond pure negation to the same underlying problem in a different shape: a
// keyword's word/phrase appearing in copy for an unrelated reason.
//   - "outside your period" (Neycher: usage timing, not a period product), "not menstrual
//     flow", "distinct from a menstrual panty liner", and "rather than menstrual blood"
//     (incontinence pads explicitly contrasting themselves with period products) were all
//     satisfying the Period chip's 'period'/'menstrual' keywords despite each one denying
//     the very thing the keyword is meant to detect.
//   - "stress incontinence" / "stress or urge bladder leaks" / "stress and urge incontinence"
//     are a clinical bladder-control term, not the Sleep + Stress chip's intended
//     (psychological) sense of "stress", was surfacing incontinence pads under that chip.
const NEGATED_CONCERN_PHRASES = [
    /non-?\s?hormonal/g,
    /hormone-?\s?free/g,
    /outside your period/g,
    /not\s+(?:for\s+)?menstrual/g,
    /distinct from a\s+menstrual/g,
    /rather than menstrual/g,
    /stress\s+(?:(?:or|and)\s+urge\s+)?(?:bladder\s+)?(?:incontinence|leaks?)/g,
];

export function productSearchText(item) {
    const raw = [
        item?.category, item?.name, item?.brand, item?.summary, item?.description, item?.tagline,
        ...(Array.isArray(item?.badges) ? item.badges : []),
        ...(Array.isArray(item?.tags) ? item.tags : []),
        item?.eligibility, item?.sustainability, item?.lifeStage,
    ].filter(Boolean).join(' ').toLowerCase();
    return NEGATED_CONCERN_PHRASES.reduce((t, re) => t.replace(re, ' '), raw);
}

export function itemMatchesMacroGroup(item, groupId) {
    if (!groupId || groupId === 'all') return true;
    const broad = BROWSE_GROUPS.find((g) => g.id === groupId);
    if (broad) {
        if (broad.covers.some((id) => itemMatchesMacroGroup(item, id))) return true;
        if (Array.isArray(broad.categories) && broad.categories.includes(item?.category)) return true;
        if (Array.isArray(broad.tags) && Array.isArray(item?.tags) && item.tags.some((t) => broad.tags.includes(t))) return true;
        if (Array.isArray(broad.keywords) && broad.keywords.length) {
            const text = productSearchText(item);
            return broad.keywords.some((keyword) => text.includes(keyword));
        }
        return false;
    }
    const group = MACRO_GROUPS.find((g) => g.id === groupId);
    if (!group) return true;
    if (group.categories.includes(item?.category)) return true;
    // Structured concern tags (e.g. 'hormone-balance') are checked as an exact membership test,
    // not folded into the free-text keyword scan below, that keeps a slug like the unrelated
    // 'fitness-cycle' healthFunction from accidentally satisfying a keyword such as 'cycle'.
    if (Array.isArray(group.healthFunctions) && Array.isArray(item?.healthFunctions) &&
        item.healthFunctions.some((hf) => group.healthFunctions.includes(hf))) return true;
    // Some chips' keywords are inherently ambiguous outside their own product domain (e.g.
    // "skin"/"moisturizer" legitimately describe vulvar-care copy; "thinning" legitimately
    // describes vaginal-tissue thinning), excludeCategories lets a chip opt specific
    // product-type categories out of the free-text keyword scan below (they can still match
    // via an explicit categories/healthFunctions hit above) so e.g. a vulva balm doesn't
    // surface under "Skin" just because its copy happens to say "skin."
    if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(item?.category)) return false;
    const text = productSearchText(item);
    return group.keywords.some((keyword) => text.includes(keyword));
}
