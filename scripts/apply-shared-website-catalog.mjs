import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function replaceOnce(text, before, after, label) {
  if (text.includes(after)) return text;
  if (!text.includes(before)) throw new Error(`Missing shared-catalog anchor: ${label}`);
  return text.replace(before, after);
}

// App owns one live catalog snapshot so Browse, landing-shop cards, and direct
// /product/:id routes all resolve against the same /api/products feed that the
// native app uses. The bundled getProductById path remains the outage fallback.
{
  const path = 'src/App.jsx';
  let text = read(path);
  if (!text.includes("import { loadProductCatalog } from './utils/productCatalog.js';")) {
    text = text.replace(
      "import { getSupabaseClient } from './utils/supabaseClient';",
      "import { getSupabaseClient } from './utils/supabaseClient';\nimport { loadProductCatalog } from './utils/productCatalog.js';"
    );
  }

  const appStart = `function App() {
  const [currentView, setCurrentViewRaw] = useState(getInitialView);`;
  const appStartShared = `function App() {
  const [liveCatalogProducts, setLiveCatalogProducts] = useState([]);
  const [liveCatalogLoading, setLiveCatalogLoading] = useState(true);

  // Website and iPhone consume the same product_catalog feed. Keep the bundle
  // as an outage fallback inside loadProductCatalog(), but refresh the shared
  // feed while the tab stays open so catalog edits do not require a deploy.
  useEffect(() => {
    let cancelled = false;
    const refresh = async (force = false) => {
      try {
        const { products } = await loadProductCatalog({ force });
        if (!cancelled && Array.isArray(products) && products.length) {
          setLiveCatalogProducts(products);
        }
      } catch {
        // loadProductCatalog already provides the bundled fallback; keep the
        // last good snapshot if an unexpected fetch failure still bubbles up.
      } finally {
        if (!cancelled) setLiveCatalogLoading(false);
      }
    };
    refresh(false);
    const timer = window.setInterval(() => refresh(true), 5 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const liveCatalogById = useMemo(
    () => new Map((liveCatalogProducts || []).filter((p) => p?.id).map((p) => [String(p.id), p])),
    [liveCatalogProducts],
  );

  const [currentView, setCurrentViewRaw] = useState(getInitialView);`;
  text = replaceOnce(text, appStart, appStartShared, 'App shared catalog state');

  text = replaceOnce(
    text,
    `      || omittedProducts[productRouteId]
      || getProductById(productRouteId);`,
    `      || omittedProducts[productRouteId]
      || liveCatalogById.get(String(productRouteId))
      || getProductById(productRouteId);`,
    'App direct live product resolution'
  );
  text = replaceOnce(
    text,
    `  }, [productRouteId, lastClickedProduct, myProducts, savedProducts, trackedProducts, omittedProducts]);
  const productStillResolving = !resolvedProduct && (authLoading || dataLoading);`,
    `  }, [productRouteId, lastClickedProduct, myProducts, savedProducts, trackedProducts, omittedProducts, liveCatalogById]);
  const productStillResolving = !resolvedProduct && (authLoading || dataLoading || liveCatalogLoading);`,
    'App live product loading state'
  );

  text = replaceOnce(
    text,
    `            recommendedProductIds={recommendedProductIds}
            initialCategory={homeCategory}`,
    `            recommendedProductIds={recommendedProductIds}
            catalogProducts={liveCatalogProducts}
            initialCategory={homeCategory}`,
    'AynaLanding shared catalog prop'
  );
  text = replaceOnce(
    text,
    `            recommendedProductIds={recommendedProductIds}
            aynaReviews={aynaReviews}`,
    `            recommendedProductIds={recommendedProductIds}
            catalogProducts={liveCatalogProducts}
            aynaReviews={aynaReviews}`,
    'Discovery shared catalog prop'
  );
  write(path, text);
}

// Browse uses the complete live catalog rather than static curated rows plus
// only source=discovered deltas. Released startups remain additive and are
// de-duplicated by id if/when they also become normal catalog rows.
{
  const path = 'src/components/Discovery.jsx';
  let text = read(path);
  text = text.replace("import { loadProductCatalog } from '../utils/productCatalog';\n", '');
  text = text.replace(
    'export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, initialSearch, recommendedProductIds, aynaReviews = {}, initialCategory, initialMacroGroup, initialPadFlow, initialPadPreference, initialPadUseCase, initialSymptom, hasQuizFrustrations = false, hasHealthImport = false, quizResults = null, healthProfile = null, savedProducts = {}, onToggleSaved, user = null, onRequirePersonalizeAuth = null }) {',
    'export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, initialSearch, recommendedProductIds, catalogProducts = null, aynaReviews = {}, initialCategory, initialMacroGroup, initialPadFlow, initialPadPreference, initialPadUseCase, initialSymptom, hasQuizFrustrations = false, hasHealthImport = false, quizResults = null, healthProfile = null, savedProducts = {}, onToggleSaved, user = null, onRequirePersonalizeAuth = null }) {'
  );

  const oldLoader = `    // AI-discovered products (api/discover-products.js), human-approved only —
    // /api/products already filters to is_active=true, and a discovered row is
    // never is_active until scripts/review-discovered-products.mjs approves it
    // (see supabase/product_catalog_discovery.sql). This is additive on top of
    // the bundled catalog, not a replacement for it: loadProductCatalog() falls
    // back to the bundled copy on any failure, so filtering to source==='discovered'
    // here means a fallback response (source:'bundled') just contributes nothing,
    // never duplicates the bundled products it already contains.
    const [discoveredProducts, setDiscoveredProducts] = useState([]);
    React.useEffect(() => {
        let cancelled = false;
        loadProductCatalog().then(({ products, source }) => {
            if (cancelled || source === 'bundled') return;
            setDiscoveredProducts(products.filter((p) => p.source === 'discovered'));
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

`;
  const newLoader = `    // App.jsx supplies the same live /api/products snapshot used by native iOS.
    // Keep ALL_PRODUCTS only as an outage/standalone fallback for this component.
    const liveProducts = Array.isArray(catalogProducts) && catalogProducts.length
        ? catalogProducts
        : ALL_PRODUCTS;

`;
  text = replaceOnce(text, oldLoader, newLoader, 'Discovery live catalog source');

  const oldCombined = `    const combined = useMemo(() => {
        // Ayna doesn't sell or dispense prescriptions, so prescription-only items
        // (birth control requiring an Rx, HRT patches/inserts, etc.) never show as
        // shoppable products here — searching what they treat (e.g. "hormone
        // replacement therapy") surfaces telehealth providers that prescribe it instead.
        const products = filterPrescriptionCareGate(ALL_PRODUCTS).map(p => ({ ...p, isStartup: false }));
        // Released startups appear as normal products (no startup badge); unreleased are only on Startups page
        const releasedAsProducts = RELEASED_STARTUPS.map(s => ({
            ...s,
            isStartup: false,
            type: 'digital',
            summary: s.description || s.tagline,
            price: s.stage || ''
        }));
        // discoveredProducts are already the client-ready shape /api/products
        // returns (toClientProduct in api/products.js), so no mapping needed —
        // just stamp isStartup like the other two sources for consistent shape.
        const discovered = filterPrescriptionCareGate(discoveredProducts).map(p => ({ ...p, isStartup: false }));
        return [...products, ...releasedAsProducts, ...discovered];
    }, [discoveredProducts]);`;
  const newCombined = `    const combined = useMemo(() => {
        // Ayna doesn't sell or dispense prescriptions, so prescription-only items
        // never show as shoppable products. The live API catalog is canonical.
        const products = filterPrescriptionCareGate(liveProducts).map(p => ({ ...p, isStartup: false }));
        const seen = new Set(products.map((p) => String(p?.id || '')));
        // Released startups stay additive until they graduate into product_catalog.
        const releasedAsProducts = RELEASED_STARTUPS
            .filter((s) => !seen.has(String(s?.id || '')))
            .map(s => ({
                ...s,
                isStartup: false,
                type: 'digital',
                summary: s.description || s.tagline,
                price: s.stage || ''
            }));
        return [...products, ...releasedAsProducts];
    }, [liveProducts]);`;
  text = replaceOnce(text, oldCombined, newCombined, 'Discovery combined live catalog');
  write(path, text);
}

// Landing shop reads the same live snapshot for filters, edited product data,
// and returning-user trending cards. The first-visit curated eight remains a
// deliberate layout choice but resolves each chosen id from the live row first.
{
  const path = 'src/components/AynaLanding.jsx';
  let text = read(path);
  text = replaceOnce(
    text,
    `function productTypeOptions() {
  const set = new Set();
  ALL_PRODUCTS.forEach((product) => { if (product?.category) set.add(product.category); });`,
    `function productTypeOptions(products = ALL_PRODUCTS) {
  const set = new Set();
  products.forEach((product) => { if (product?.category) set.add(product.category); });`,
    'Landing product type options'
  );
  text = replaceOnce(
    text,
    `function productById(id) {
  return ALL_PRODUCTS.find((p) => p.id === id) || null;
}`,
    `function productById(id, products = ALL_PRODUCTS) {
  return products.find((p) => p.id === id) || ALL_PRODUCTS.find((p) => p.id === id) || null;
}`,
    'Landing live product lookup'
  );
  text = replaceOnce(
    text,
    'function WelcomeBack({ user, myProducts, ecosystemCount, recommendedProductIds = [], onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct, initialCategory = null }) {',
    'function WelcomeBack({ user, myProducts, ecosystemCount, recommendedProductIds = [], catalogProducts = ALL_PRODUCTS, onStartQuiz, onViewDiscovery, onViewEcosystem, onOpenProduct, initialCategory = null }) {'
  );
  text = replaceOnce(
    text,
    `    () => SHOP_FILTERS.filter((item) => item.key === 'all' || ALL_PRODUCTS.some((product) => matchesShopFilter(product, item.key))),
    [],`,
    `    () => SHOP_FILTERS.filter((item) => item.key === 'all' || catalogProducts.some((product) => matchesShopFilter(product, item.key))),
    [catalogProducts],`,
    'Landing available filters'
  );
  text = replaceOnce(text, '  const availableProductTypes = useMemo(() => productTypeOptions(), []);', '  const availableProductTypes = useMemo(() => productTypeOptions(catalogProducts), [catalogProducts]);', 'Landing product types');
  text = replaceOnce(text, '    let list = ALL_PRODUCTS.filter((product) => product?.id && product?.name && matchesShopFilter(product, filter));', '    let list = catalogProducts.filter((product) => product?.id && product?.name && matchesShopFilter(product, filter));', 'Landing live shown products');
  text = replaceOnce(
    text,
    '  }, [filter, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter, productTypeFilter, aynaFilter, personalize, ownedIds, recommendedIds, areas]);',
    '  }, [catalogProducts, filter, priceFilter, eligibilityFilter, preferenceFilter, sustainabilityFilter, lifeStageFilter, ratingFilter, productTypeFilter, aynaFilter, personalize, ownedIds, recommendedIds, areas]);',
    'Landing shown product dependencies'
  );
  text = replaceOnce(
    text,
    'function FirstVisitLanding({ onStartQuiz, onViewDiscovery, onOpenProduct, hasProfile, profileCategories, initialCategory = null }) {',
    'function FirstVisitLanding({ onStartQuiz, onViewDiscovery, onOpenProduct, hasProfile, profileCategories, catalogProducts = ALL_PRODUCTS, initialCategory = null }) {'
  );
  text = replaceOnce(
    text,
    `.map(({ id, label }) => ({ product: productById(id), label }))
      .filter((x) => x.product),
    [],`,
    `.map(({ id, label }) => ({ product: productById(id, catalogProducts), label }))
      .filter((x) => x.product),
    [catalogProducts],`,
    'First visit live lineup'
  );
  text = replaceOnce(
    text,
    `  recommendedProductIds = [],
  initialCategory = null,`,
    `  recommendedProductIds = [],
  catalogProducts = ALL_PRODUCTS,
  initialCategory = null,`,
    'Landing catalog prop'
  );
  text = replaceOnce(
    text,
    `        recommendedProductIds={recommendedProductIds}
        onStartQuiz={onStartQuiz}`,
    `        recommendedProductIds={recommendedProductIds}
        catalogProducts={catalogProducts}
        onStartQuiz={onStartQuiz}`,
    'WelcomeBack catalog pass'
  );
  text = replaceOnce(
    text,
    `      profileCategories={profileCategories}
      initialCategory={initialCategory}`,
    `      profileCategories={profileCategories}
      catalogProducts={catalogProducts}
      initialCategory={initialCategory}`,
    'FirstVisit catalog pass'
  );
  write(path, text);
}
