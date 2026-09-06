import { useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS, getEcosystemAlternatives, getPersonalizedProductIds, getProductById } from '../data/products.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';
import AskAynaChip from './components/AskAynaChip.jsx';
import AskAynaModal from './components/AskAynaModal.jsx';
import ProfileFlow from './screens/profile/ProfileFlow.jsx';

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
import WhyMatchScreen from './screens/WhyMatchScreen.jsx';

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
  const { session, update: updateSession, reset: resetSession } = useEcosystemSession();
  const { hasEcosystem, myProducts, lastQuizAnswers, userName } = session;
  // A returning user (persisted hasEcosystem) lands back in their ecosystem
  // instead of the landing page every time the app reloads.
  const [screen, setScreen] = useState(() => (session.hasEcosystem ? 'eco' : 'landing'));
  // Product/article detail render as an overlay ON TOP of whichever base
  // screen (Browse, My Ecosystem, Saved) is currently mounted, instead of
  // replacing it — `screen` never changes when one opens. That's what makes
  // "back" free: the underlying screen was never unmounted, so its own
  // state (search text, personalized toggle, scroll position, infinite-
  // scroll pagination) is exactly as the user left it, not reset to a
  // fresh mount. Closing the overlay just reveals it again.
  const [overlay, setOverlay] = useState(null); // { type: 'product' | 'article', item }
  const { savedMap, isSaved, toggleSaved } = useSavedProducts();
  const { theme, toggleTheme, setTheme } = useThemeMode();
  const [askAynaOpen, setAskAynaOpen] = useState(false);
  const [askAynaHistory, setAskAynaHistory] = useState([]);

  const Screen = SCREENS[screen] || LandingScreen;

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;

  // No real auth session exists for the mobile mock sign-up flow yet, so
  // "sign out" just resets local state back to a fresh visit rather than
  // clearing a server session.
  const handleSignOut = () => {
    setOverlay(null);
    resetSession();
    setScreen('landing');
  };

  // "Add to ecosystem" from a product detail overlay — was previously wired
  // to nothing (ProductDetailScreen called onAddToEcosystem, but MobileApp
  // never passed it), so the button did nothing at all.
  const handleAddToEcosystem = (product) => {
    if (!product?.id) return;
    updateSession((prev) => ({
      myProducts: prev.myProducts.some((p) => p.id === product.id) ? prev.myProducts : [...prev.myProducts, product],
      hasEcosystem: true,
    }));
  };

  // "See swap" on a Shopper Profile safety alert — reuses the same real
  // alternative-finding logic as the desktop ecosystem swap flow instead of
  // just linking back to the flagged product itself.
  const handleViewAlternative = (product) => {
    if (!product?.id) return;
    const tag = Array.isArray(product.tags) ? product.tags[0] : undefined;
    const alternatives = getEcosystemAlternatives(product.id, tag, lastQuizAnswers) || [];
    setOverlay({ type: 'product', item: alternatives[0] || product });
  };

  const nav = {
    // Landing's hero gradient is a fixed brand look, unrelated to the real
    // light/dark toggle — but leaving it should still start users on light
    // mode rather than whatever dark/light state happened to be persisted
    // from a prior visit.
    onStartQuiz: () => { setTheme('light'); setScreen('quiz'); },
    onBrowse: () => { setTheme('light'); setScreen('browse'); },
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => setOverlay({ type: 'product', item: p }),
    onOpenArticle: (a) => setOverlay({ type: 'article', item: a }),
    onOpenProfile: () => setOverlay({ type: 'profile' }),
    onOpenWhyMatch: (p) => setOverlay({ type: 'why-match', item: p }),
    onAskAyna: () => setAskAynaOpen(true),
    onBack: () => setScreen('browse'),
    onRetake: () => setScreen('quiz'),
    onUpdateHealth: () => setScreen('quiz'),
    onComplete: (quizAnswers) => {
      updateSession({ myProducts: seedEcosystemFromAnswers(quizAnswers), lastQuizAnswers: quizAnswers });
      setScreen('building');
    },
    onFinish: () => setScreen('reveal'),
    onContinue: () => setScreen('signin'),
    onCreateAccount: ({ name } = {}) => {
      updateSession((prev) => ({ userName: name || prev.userName, hasEcosystem: true }));
      setScreen('eco');
    },
    onContinueWithApple: ({ name } = {}) => {
      updateSession((prev) => ({ userName: name || prev.userName, hasEcosystem: true }));
      setScreen('eco');
    },
    hasEcosystem,
  };

  return (
    <div className="ayna-mobile" data-theme={theme}>
      <Screen
        {...nav}
        theme={theme}
        onToggleTheme={toggleTheme}
        products={ALL_PRODUCTS}
        articles={ARTICLES}
        savedProducts={savedMap}
        onToggleSaved={toggleSaved}
        onAddToEcosystem={handleAddToEcosystem}
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ProductDetailScreen
            product={overlay.item}
            onBack={() => setOverlay(null)}
            isSaved={isSaved(overlay.item?.id)}
            onToggleSaved={() => toggleSaved(overlay.item)}
            isInEcosystem={myProducts.some((p) => p.id === overlay.item?.id)}
            onAddToEcosystem={() => handleAddToEcosystem(overlay.item)}
            quizAnswers={lastQuizAnswers}
            ecosystemProducts={myProducts}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      )}
      {overlay?.type === 'article' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ArticleDetailScreen article={overlay.item} onBack={() => setOverlay(null)} theme={theme} onToggleTheme={toggleTheme} />
        </div>
      )}
      {overlay?.type === 'why-match' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <WhyMatchScreen
            product={overlay.item}
            quizAnswers={lastQuizAnswers}
            onBack={() => setOverlay(null)}
            onUpdateHealth={() => { setOverlay(null); setScreen('quiz'); }}
          />
        </div>
      )}
      {overlay?.type === 'profile' && (
        <ProfileFlow
          onClose={() => setOverlay(null)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={handleSignOut}
          name={userName}
          ecosystemCount={myProducts.length}
          savedCount={Object.keys(savedMap || {}).length}
          quizAnswers={lastQuizAnswers}
          myProducts={myProducts}
          savedProducts={savedMap}
          onViewAlternative={handleViewAlternative}
          onBrowse={() => setScreen('browse')}
        />
      )}
      {!askAynaOpen && <AskAynaChip onClick={() => setAskAynaOpen(true)} />}
      <AskAynaModal
        open={askAynaOpen}
        onClose={() => setAskAynaOpen(false)}
        profile={lastQuizAnswers}
        onProfileUpdate={(answers) => updateSession({ lastQuizAnswers: answers })}
        chatHistory={askAynaHistory}
        onChatHistoryUpdate={setAskAynaHistory}
        name={userName}
        onNavigateToDiscovery={() => { setAskAynaOpen(false); setScreen('browse'); }}
        onViewRecommendations={() => { setAskAynaOpen(false); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
      />
    </div>
  );
}
