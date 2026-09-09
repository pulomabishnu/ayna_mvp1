import { useEffect, useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS, getEcosystemAlternatives, getProfileMatchPercentForProduct, getRecommendationMatchesAndRest, filterPrescriptionCareGate } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { loadProductCatalog } from '../utils/productCatalog.js';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { useSupabaseAuth, MOBILE_OAUTH_PENDING_KEY } from './hooks/useSupabaseAuth.js';
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

// Same real fallback chain used everywhere on desktop (App.jsx's
// accountMonogram, Hero.jsx's displayNameFromUser, EcosystemBubbles.jsx,
// ProfileChatbot.jsx) — first_name is what OUR OWN email/password signup
// sets (see useSupabaseAuth.js), but Google's OAuth identity never sets
// it; Google instead populates given_name/full_name/name, which the old
// mobile-only `authUser.user_metadata?.first_name` read here ignored
// entirely, so a Google sign-in always fell through to "You" everywhere.
function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

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

// Same catalog desktop's Discovery page browses: prescription-only items
// without a care path excluded (Ayna doesn't sell/dispense prescriptions —
// see Discovery.jsx), released startups folded in as ordinary products
// (unreleased ones stay Startups-hub-only), plus any live "discovered"
// products from /api/products that aren't in the bundled catalog yet (see
// productCatalog.js's migration-state comment — the API is meant to
// eventually replace the bundle; discoveredProducts is what's already live
// there but not yet in ALL_PRODUCTS). Kept separate from ALL_PRODUCTS
// itself since ecosystem seeding below keys off the real bundled catalog
// (via getRecommendationMatchesAndRest) only, the same as desktop.
function buildBrowseProducts(discoveredProducts) {
  return [
    ...filterPrescriptionCareGate(ALL_PRODUCTS).map((p) => ({ ...p, isStartup: false })),
    ...RELEASED_STARTUPS.map((s) => ({
      ...s,
      isStartup: false,
      type: 'digital',
      summary: s.description || s.tagline,
      price: s.stage || '',
    })),
    ...filterPrescriptionCareGate(discoveredProducts).map((p) => ({ ...p, isStartup: false })),
  ];
}

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

// Real business logic, using the same weighted relevance engine as every
// match-percent ring in the app (getProfileMatchPercentForProduct). Used to
// go through getPersonalizedProductIds, which only requires percent > 0 —
// that function's own doc comment in products.js admits this is "close to
// a no-op (nearly every product qualifies)". That's exactly why the mobile
// ecosystem was over-populating with weak, single-preference-tag matches:
// there was no real quality bar. MIN_ECOSYSTEM_MATCH_PERCENT is that bar —
// a lone preference-tag overlap scores well under it, while a genuine
// concern-tag match clears it comfortably (see getProductRelevanceStats's
// weights), so the ecosystem now reflects real relevance, not "any overlap
// at all". resolveEcosystemProductArea is the real product -> pillar-area
// matcher (keyword + category scanning) that EcosystemOrbit's contract has
// always deferred to rather than reimplementing.
//
// Capped per brand (see capProductsPerBrand) AFTER ranking so the ecosystem
// — and every per-area seat within it, since each seat's product list is a
// subset of this same array — stays a variety of brands instead of one
// brand's whole catalog crowding everything else out.
const MIN_ECOSYSTEM_MATCH_PERCENT = 30;

function seedEcosystemFromAnswers(quizAnswers) {
  const { matches } = getRecommendationMatchesAndRest(quizAnswers, null);
  const strongMatches = matches.filter(
    (p) => (getProfileMatchPercentForProduct(p, quizAnswers) || 0) >= MIN_ECOSYSTEM_MATCH_PERCENT
  );
  const withAreas = strongMatches.map((p) => {
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
  // Distinguishes "Finish your profile" (resume with prior answers, jump to
  // the first thing left blank) from every other way into the quiz screen
  // (start quiz, retake, update health), which all start fresh on purpose.
  const [editingHealthProfile, setEditingHealthProfile] = useState(false);
  const { user: authUser, signUpWithPassword, signInWithPassword, signInWithGoogle, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();
  // Falls back to the real Supabase identity whenever the locally-cached
  // session name is empty — covers a returning user whose device never
  // captured a name (e.g. signed in with Google before this fallback
  // chain existed), without needing a one-time migration.
  const resolvedName = userName || displayNameFromUser(authUser);

  // Same loadProductCatalog() call Discovery.jsx makes — a live source
  // ('api'/'cache') means the bundle no longer has the full catalog, so
  // its 'discovered'-only items get folded into Browse too; a 'bundled'
  // fallback (API unavailable) contributes nothing, since the bundle
  // already has everything BROWSE_PRODUCTS needs in that case.
  const [discoveredProducts, setDiscoveredProducts] = useState([]);
  useEffect(() => {
    let cancelled = false;
    loadProductCatalog().then(({ products, source }) => {
      if (cancelled || source === 'bundled') return;
      setDiscoveredProducts(products.filter((p) => p.source === 'discovered'));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const browseProducts = buildBrowseProducts(discoveredProducts);

  const Screen = SCREENS[screen] || LandingScreen;

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;

  // Only true right after a mobile-initiated Google sign-in completes — the
  // full-page OAuth redirect leaves this app entirely and comes back on
  // /auth/callback (rendered by desktop's App.jsx, since main.jsx picks
  // App vs MobileApp purely by URL path), which sends it on to
  // /mobile-preview per this same flag (see useSupabaseAuth.js). Checked
  // once per real sign-in event, not on every ordinary reopen with an old
  // session — a returning user's local device has no synced ecosystem data
  // to show, so forcing them into 'eco' on every mount would just be empty.
  useEffect(() => {
    if (!authUser) return;
    let justSignedInViaOAuth = false;
    try { justSignedInViaOAuth = sessionStorage.getItem(MOBILE_OAUTH_PENDING_KEY) === '1'; } catch { /* private mode */ }
    if (!justSignedInViaOAuth) return;
    try { sessionStorage.removeItem(MOBILE_OAUTH_PENDING_KEY); } catch { /* private mode */ }
    const firstName = displayNameFromUser(authUser);
    // Deferred a tick so the state updates run from a callback rather than
    // directly in the effect body — same one-time transition, just shaped
    // the way react-hooks/set-state-in-effect expects it.
    Promise.resolve().then(() => {
      updateSession((prev) => ({ userName: firstName || prev.userName, hasEcosystem: true }));
      setScreen('eco');
    });
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real Supabase sign-out, on top of the existing local reset — the app's
  // own ecosystem/quiz data (useEcosystemSession) still lives on-device
  // only, so it's cleared the same way it always was; identity is what's
  // newly real here.
  const handleSignOut = () => {
    setOverlay(null);
    resetSession();
    signOutSupabase();
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
    onStartQuiz: () => { setTheme('light'); setEditingHealthProfile(false); setScreen('quiz'); },
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
    onRetake: () => { setEditingHealthProfile(false); setScreen('quiz'); },
    onUpdateHealth: () => { setEditingHealthProfile(false); setScreen('quiz'); },
    onEditProfile: () => { setEditingHealthProfile(true); setScreen('quiz'); },
    onComplete: (quizAnswers) => {
      updateSession({ myProducts: seedEcosystemFromAnswers(quizAnswers), lastQuizAnswers: quizAnswers });
      // Same real save desktop's App.jsx makes after quiz completion — was
      // never ported to mobile (a real signed-in session didn't exist here
      // yet at the time), so a mobile-only user's intake answers lived on
      // that one device only, invisible to "Manage/Download my data" and to
      // that user on any other device. No-ops harmlessly when signed out.
      const rawIntake = quizAnswers?.fullHealthIntake || quizAnswers;
      saveHealthIntakeForCurrentUser(rawIntake).catch(() => {});
      setScreen('building');
    },
    onFinish: () => setScreen('reveal'),
    onContinue: () => setScreen('signin'),
    // Real Supabase auth (src/mobile/hooks/useSupabaseAuth.js) — the name
    // comes from whatever SigninScreen already has in its own form state
    // (the person just typed it) rather than from authUser here, since
    // authUser's own state update from onAuthStateChange can lag behind
    // this call by a render or two and there's no reason to race it when
    // the real value is sitting right there in the caller.
    authUser,
    onSignUp: signUpWithPassword,
    onSignIn: signInWithPassword,
    onGoogleSignIn: signInWithGoogle,
    onResendConfirmation: resendConfirmation,
    onAuthenticated: (name) => {
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
        products={browseProducts}
        articles={ARTICLES}
        savedProducts={savedMap}
        onToggleSaved={toggleSaved}
        onAddToEcosystem={handleAddToEcosystem}
        myProducts={myProducts}
        quizAnswers={lastQuizAnswers}
        initialSnapshot={editingHealthProfile ? lastQuizAnswers?.fullHealthIntake || null : null}
        name={resolvedName}
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
            onUpdateHealth={() => { setOverlay(null); setEditingHealthProfile(false); setScreen('quiz'); }}
          />
        </div>
      )}
      {overlay?.type === 'profile' && (
        <ProfileFlow
          onClose={() => setOverlay(null)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={handleSignOut}
          onSignIn={() => setScreen('signin')}
          authUser={authUser}
          name={resolvedName}
          onNameChanged={(next) => updateSession({ userName: next })}
          ecosystemCount={myProducts.length}
          savedCount={Object.keys(savedMap || {}).length}
          quizAnswers={lastQuizAnswers}
          myProducts={myProducts}
          savedProducts={savedMap}
          onViewAlternative={handleViewAlternative}
          onBrowse={() => setScreen('browse')}
          onEditProfile={() => { setEditingHealthProfile(true); setScreen('quiz'); }}
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
        name={resolvedName}
        onNavigateToDiscovery={() => { setAskAynaOpen(false); setScreen('browse'); }}
        onViewRecommendations={() => { setAskAynaOpen(false); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
      />
    </div>
  );
}
