import { useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS, getPersonalizedProductIds, getProductById } from '../data/products.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';

import LandingScreen from './screens/LandingScreen.jsx';
import BrowseScreen from './screens/BrowseScreen.jsx';
import ProductDetailScreen from './screens/ProductDetailScreen.jsx';
import ArticleDetailScreen from './screens/ArticleDetailScreen.jsx';
import EcosystemIntroScreen from './screens/EcosystemIntroScreen.jsx';
import IntakeScreen from './screens/IntakeScreen.jsx';
import BuildingScreen from './screens/BuildingScreen.jsx';
import RevealScreen from './screens/RevealScreen.jsx';
import SigninScreen from './screens/SigninScreen.jsx';
import EcosystemScreen from './screens/EcosystemScreen.jsx';
import SavedScreen from './screens/SavedScreen.jsx';

const SCREENS = {
  landing: LandingScreen,
  browse: BrowseScreen,
  ecointro: EcosystemIntroScreen,
  quiz: IntakeScreen,
  building: BuildingScreen,
  reveal: RevealScreen,
  signin: SigninScreen,
  eco: EcosystemScreen,
  saved: SavedScreen,
};

// No single brand should crowd out the rest of the ecosystem/orbit — keeps
// at most this many products per brand, in whatever order they were ranked,
// so the highest-relevance picks for every other brand still get a seat.
const MAX_PRODUCTS_PER_BRAND = 2;

function brandKeyForProduct(product) {
  if (product?.brand) return String(product.brand).trim().toLowerCase();
  // Most entries in this catalog don't carry an explicit `brand` field, but
  // product names are consistently "Brand Product Line ..." — the first
  // word is a good enough grouping key for capping purposes even when it
  // isn't the literal brand (it's never displayed, only used to spread
  // picks across distinct product lines).
  const firstWord = String(product?.name || '').trim().split(/\s+/)[0];
  return firstWord ? firstWord.toLowerCase() : product?.id || '';
}

function capProductsPerBrand(products, maxPerBrand = MAX_PRODUCTS_PER_BRAND) {
  const counts = new Map();
  const result = [];
  for (const p of products) {
    const key = brandKeyForProduct(p);
    const count = counts.get(key) || 0;
    if (count >= maxPerBrand) continue;
    counts.set(key, count + 1);
    result.push(p);
  }
  return result;
}

// Real business logic: getPersonalizedProductIds returns every real,
// positively-scored catalog match for the quiz answers (not
// getRecommendations()'s padded fallback list, and not limited to one pick
// per frustration like getEcosystemSeedFromQuiz) — richer, so the orbit can
// naturally populate more than a handful of areas when the answers
// genuinely match more products. resolveEcosystemProductArea is the real
// product -> pillar-area matcher (keyword + category scanning) that
// EcosystemOrbit's contract has always deferred to rather than
// reimplementing. Both reused here, not duplicated.
//
// Capped per brand (see capProductsPerBrand) AFTER ranking so the ecosystem
// — and every per-area seat within it, since each seat's product list is a
// subset of this same array — stays a variety of brands instead of one
// brand's whole catalog crowding everything else out.
function seedEcosystemFromAnswers(quizAnswers) {
  const ids = getPersonalizedProductIds(quizAnswers, null);
  const products = ids.map((id) => getProductById(id)).filter(Boolean);
  const withAreas = products.map((p) => {
    const area = resolveEcosystemProductArea(p, REAL_ECOSYSTEM_AREAS);
    return { ...p, areaKey: area ? area.key : null };
  });
  return capProductsPerBrand(withAreas);
}

export default function MobileApp() {
  const [screen, setScreen] = useState('landing');
  // Product/article detail render as an overlay ON TOP of whichever base
  // screen (Browse, My Ecosystem, Saved) is currently mounted, instead of
  // replacing it — `screen` never changes when one opens. That's what makes
  // "back" free: the underlying screen was never unmounted, so its own
  // state (search text, personalized toggle, scroll position, infinite-
  // scroll pagination) is exactly as the user left it, not reset to a
  // fresh mount. Closing the overlay just reveals it again.
  const [overlay, setOverlay] = useState(null); // { type: 'product' | 'article', item }
  const { savedMap, isSaved, toggleSaved } = useSavedProducts();
  const [hasEcosystem, setHasEcosystem] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [lastQuizAnswers, setLastQuizAnswers] = useState(null);
  const [userName, setUserName] = useState('You');

  const Screen = SCREENS[screen] || LandingScreen;

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;

  const nav = {
    onStartQuiz: () => setScreen('quiz'),
    onBrowse: () => setScreen('browse'),
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => setOverlay({ type: 'product', item: p }),
    onOpenArticle: (a) => setOverlay({ type: 'article', item: a }),
    onBack: () => setScreen('browse'),
    onRetake: () => setScreen('quiz'),
    onUpdateHealth: () => setScreen('quiz'),
    onComplete: (quizAnswers) => {
      setMyProducts(seedEcosystemFromAnswers(quizAnswers));
      setLastQuizAnswers(quizAnswers);
      setScreen('building');
    },
    onFinish: () => setScreen('reveal'),
    onContinue: () => setScreen('signin'),
    onCreateAccount: ({ name } = {}) => {
      if (name) setUserName(name);
      setHasEcosystem(true);
      setScreen('eco');
    },
    onContinueWithApple: ({ name } = {}) => {
      if (name) setUserName(name);
      setHasEcosystem(true);
      setScreen('eco');
    },
    hasEcosystem,
  };

  return (
    <div className="ayna-mobile">
      {/* Temporary dev-only screen switcher for smoke testing — not final navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, fontSize: 11 }}>
        {Object.keys(SCREENS).map((key) => (
          <button key={key} onClick={() => setScreen(key)}>
            {key}
          </button>
        ))}
        <button onClick={() => nav.onOpenProduct(ALL_PRODUCTS[0])}>product</button>
        <button onClick={() => nav.onOpenArticle(ARTICLES[0])}>article</button>
      </div>
      <Screen
        {...nav}
        products={ALL_PRODUCTS}
        articles={ARTICLES}
        savedProducts={savedMap}
        myProducts={myProducts}
        quizAnswers={lastQuizAnswers}
        name={userName}
        tags={topAreaLabels.length ? `${topAreaLabels.length} area${topAreaLabels.length === 1 ? '' : 's'} covered` : ''}
        relatedReads={ARTICLES.slice(0, 3)}
        topAreas={topAreaLabels.length ? topAreaLabels : ['Period', 'Hormones', 'Sleep']}
        productCount={myProducts.length}
        readCount={ARTICLES.length}
        goalCount={goalCount}
        stats={[
          { label: 'Products', value: myProducts.length },
          { label: 'Reads', value: ARTICLES.length },
          { label: 'Pillars', value: topAreaLabels.length },
        ]}
      />
      {overlay?.type === 'product' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#FFFCF9', display: 'flex' }}>
          <ProductDetailScreen
            product={overlay.item}
            onBack={() => setOverlay(null)}
            isSaved={isSaved(overlay.item?.id)}
            onToggleSaved={() => toggleSaved(overlay.item)}
            quizAnswers={lastQuizAnswers}
            ecosystemProducts={myProducts}
          />
        </div>
      )}
      {overlay?.type === 'article' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#FFFCF9', display: 'flex' }}>
          <ArticleDetailScreen article={overlay.item} onBack={() => setOverlay(null)} />
        </div>
      )}
    </div>
  );
}
