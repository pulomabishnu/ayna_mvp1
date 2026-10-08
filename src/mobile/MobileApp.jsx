import { useEffect, useRef, useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS, getEcosystemAlternatives, getProfileMatchPercentForProduct, getRecommendationMatchesAndRest, filterPrescriptionCareGate } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { loadProductCatalog } from '../utils/productCatalog.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadEcosystemForUser, upsertProductState, upsertProductsBatch } from '../utils/ecosystemStore.js';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';
import { usePushNotifications } from './hooks/usePushNotifications.js';
import { useTextSize } from './hooks/useTextSize.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { useSupabaseAuth, MOBILE_OAUTH_PENDING_KEY } from './hooks/useSupabaseAuth.js';
import { fetchNotificationPreferences } from './utils/notificationPreferencesApi.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';
import AskAynaChip from './components/AskAynaChip.jsx';
import AskAynaModal from './components/AskAynaModal.jsx';
import BottomNav from './components/BottomNav.jsx';
import ProfileFlow from './screens/profile/ProfileFlow.jsx';

import LandingScreen from './screens/LandingScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import BrowseScreen from './screens/BrowseScreen.jsx';
import CommunityScreen from './screens/CommunityScreen.jsx';
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
import MonthlyCheckinScreen from './screens/MonthlyCheckinScreen.jsx';

function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

const SCREENS = {
  landing: LandingScreen,
  home: HomeScreen,
  browse: BrowseScreen,
  community: CommunityScreen,
  ecointro: EcosystemIntroScreen,
  quiz: IntakeScreen,
  building: BuildingScreen,
  reveal: RevealScreen,
  signin: SigninScreen,
  eco: EcosystemScreen,
  saved: SavedScreen,
  checkin: MonthlyCheckinScreen,
};

function buildBrowseProducts(discoveredProducts) {
  return [
    ...filterPrescriptionCareGate(ALL_PRODUCTS).map((p) => ({ ...p, isStartup: false })),
    ...RELEASED_STARTUPS.map((s) => ({ ...s, isStartup: false, type: 'digital', summary: s.description || s.tagline, price: s.stage || '' })),
    ...filterPrescriptionCareGate(discoveredProducts).map((p) => ({ ...p, isStartup: false })),
  ];
}

const MAX_PRODUCTS_PER_BRAND = 2;
function brandKeyForProduct(product) {
  if (product?.brand) return String(product.brand).trim().toLowerCase();
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

const MIN_ECOSYSTEM_MATCH_PERCENT = 30;
function seedEcosystemFromAnswers(quizAnswers) {
  const { matches } = getRecommendationMatchesAndRest(quizAnswers, null);
  const strongMatches = matches.filter((p) => (getProfileMatchPercentForProduct(p, quizAnswers) || 0) >= MIN_ECOSYSTEM_MATCH_PERCENT);
  const withAreas = strongMatches.map((p) => {
    const area = resolveEcosystemProductArea(p, REAL_ECOSYSTEM_AREAS);
    return { ...p, areaKey: area ? area.key : null };
  });
  return capProductsPerBrand(withAreas);
}

export default function MobileApp() {
  const { session, update: updateSession, reset: resetSession } = useEcosystemSession();
  const { hasEcosystem, myProducts, lastQuizAnswers, userName } = session;
  const [screen, setScreen] = useState(() => (session.hasEcosystem ? 'home' : 'landing'));
  const [overlay, setOverlay] = useState(null);
  const { user: authUser, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();
  const ecosystemFlagsRef = useRef({ trackedProducts: {}, omittedProducts: {} });
  const pendingQuizEcosystemRef = useRef(null);
  const { savedMap, isSaved, toggleSaved } = useSavedProducts(authUser);
  const { theme, resolvedTheme, setThemeMode } = useThemeMode();
  const [personalized, setPersonalized] = usePersonalizedFeed();
  usePushNotifications(authUser?.id);
  const { textSizeIndex, setTextSizeIndex, textScale } = useTextSize();
  const [askAynaOpen, setAskAynaOpen] = useState(false);
  const [askAynaHistory, setAskAynaHistory] = useState([]);
  const [personalizeWithData, setPersonalizeWithData] = useState(true);
  const [editingHealthProfile, setEditingHealthProfile] = useState(false);
  const resolvedName = userName || displayNameFromUser(authUser);

  useEffect(() => {
    if (!authUser?.id) return undefined;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    const userId = authUser.id;
    const firstName = displayNameFromUser(authUser);
    let cancelled = false;

    (async () => {
      const pending = pendingQuizEcosystemRef.current;
      if (Array.isArray(pending) && pending.length > 0) {
        await upsertProductsBatch(supabase, userId, pending, { inEcosystem: true, isTracked: false, isOmitted: false });
        if (cancelled) return;
        pendingQuizEcosystemRef.current = null;
      }

      const [ecosystem, rawIntake, notificationPrefs] = await Promise.all([
        loadEcosystemForUser(supabase, userId),
        loadHealthIntakeForCurrentUser(),
        fetchNotificationPreferences().catch(() => null),
      ]);
      if (cancelled) return;

      if (typeof notificationPrefs?.personalizeWithDataEnabled === 'boolean') setPersonalizeWithData(notificationPrefs.personalizeWithDataEnabled);
      if (Number.isInteger(notificationPrefs?.textSizeIndex)) setTextSizeIndex(notificationPrefs.textSizeIndex);

      ecosystemFlagsRef.current = { trackedProducts: ecosystem?.trackedProducts || {}, omittedProducts: ecosystem?.omittedProducts || {} };
      const remoteProducts = Object.values(ecosystem?.myProducts || {}).map((product) => {
        const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
        return { ...product, areaKey: product.areaKey || area?.key || null };
      });
      const restoredQuizAnswers = rawIntake ? mapIntakeToLegacyQuizProfile(rawIntake) : null;

      updateSession((prev) => ({
        userName: firstName || prev.userName,
        myProducts: remoteProducts,
        hasEcosystem: remoteProducts.length > 0,
        lastQuizAnswers: prev.lastQuizAnswers?.frustrations?.length ? prev.lastQuizAnswers : (restoredQuizAnswers || prev.lastQuizAnswers),
      }));
      if (remoteProducts.length > 0) setScreen('home');
    })().catch((error) => console.warn('[Ayna] mobile ecosystem sync failed:', error));

    return () => { cancelled = true; };
  }, [authUser, updateSession, setTextSizeIndex]);

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
  const headerInitial = (resolvedName || '').trim().charAt(0).toUpperCase() || 'A';
  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;
  const effectiveQuizAnswers = personalizeWithData ? lastQuizAnswers : null;

  useEffect(() => {
    if (!authUser) return;
    let justSignedInViaOAuth = false;
    try { justSignedInViaOAuth = localStorage.getItem(MOBILE_OAUTH_PENDING_KEY) === '1'; } catch { /* private mode */ }
    if (!justSignedInViaOAuth) return;
    try { localStorage.removeItem(MOBILE_OAUTH_PENDING_KEY); } catch { /* private mode */ }
    const firstName = displayNameFromUser(authUser);
    Promise.resolve().then(() => {
      updateSession((prev) => ({ userName: firstName || prev.userName, hasEcosystem: true }));
      setScreen('home');
    });
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = () => {
    setOverlay(null);
    resetSession();
    signOutSupabase();
    setScreen('landing');
  };

  const handleAddToEcosystem = (product) => {
    if (!product?.id) return;
    const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
    const ecosystemProduct = { ...product, areaKey: product.areaKey || area?.key || null };
    updateSession((prev) => ({
      myProducts: prev.myProducts.some((p) => p.id === ecosystemProduct.id) ? prev.myProducts : [...prev.myProducts, ecosystemProduct],
      hasEcosystem: true,
    }));

    const supabase = getSupabaseClient();
    if (authUser && supabase) {
      upsertProductState(supabase, authUser.id, ecosystemProduct, {
        inEcosystem: true,
        isTracked: true,
        isOmitted: !!ecosystemFlagsRef.current.omittedProducts?.[ecosystemProduct.id],
      }).catch((error) => console.warn('[Ayna] mobile ecosystem add sync failed:', error));
      ecosystemFlagsRef.current.trackedProducts[ecosystemProduct.id] = ecosystemProduct;
    }
  };

  const handleViewAlternative = (product) => {
    if (!product?.id) return;
    const tag = Array.isArray(product.tags) ? product.tags[0] : undefined;
    const alternatives = getEcosystemAlternatives(product.id, tag, effectiveQuizAnswers) || [];
    setOverlay({ type: 'product', item: alternatives[0] || product });
  };

  const nav = {
    onGoHome: () => setScreen(hasEcosystem ? 'home' : 'landing'),
    onGoCommunity: () => setScreen('community'),
    onStartQuiz: () => { setEditingHealthProfile(false); setScreen('quiz'); },
    onOpenMonthlyCheckin: () => setScreen('checkin'),
    onBrowse: () => setScreen('browse'),
    onGoExplore: () => setScreen('browse'),
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
      const seededProducts = seedEcosystemFromAnswers(quizAnswers);
      updateSession({ myProducts: seededProducts, lastQuizAnswers: quizAnswers, hasEcosystem: seededProducts.length > 0 });
      const supabase = getSupabaseClient();
      if (authUser && supabase) {
        upsertProductsBatch(supabase, authUser.id, seededProducts, { inEcosystem: true, isTracked: false, isOmitted: false })
          .catch((error) => console.warn('[Ayna] mobile generated ecosystem sync failed:', error));
      } else {
        pendingQuizEcosystemRef.current = seededProducts;
      }
      const rawIntake = quizAnswers?.fullHealthIntake || quizAnswers;
      saveHealthIntakeForCurrentUser(rawIntake).catch(() => {});
      setScreen('building');
    },
    onFinish: () => setScreen(authUser ? 'home' : 'reveal'),
    onContinue: () => setScreen('signin'),
    authUser,
    onSignUp: signUpWithPassword,
    onSignIn: signInWithPassword,
    onGoogleSignIn: signInWithGoogle,
    onAppleSignIn: signInWithApple,
    onResendConfirmation: resendConfirmation,
    onAuthenticated: (name) => {
      updateSession((prev) => ({ userName: name || prev.userName, hasEcosystem: true }));
      setScreen('home');
    },
    hasEcosystem,
  };

  const mainTabs = ['home', 'browse', 'community', 'eco'];
  const bottomActive = screen === 'browse' ? 'explore' : screen === 'eco' ? 'ecosystem' : screen;

  return (
    <div className="ayna-mobile" data-theme={resolvedTheme} style={{ '--ayna-text-scale': textScale }}>
      <Screen
        {...nav}
        theme={theme}
        onToggleTheme={setThemeMode}
        personalized={personalized}
        onPersonalizedChange={setPersonalized}
        products={browseProducts}
        articles={ARTICLES}
        savedProducts={savedMap}
        onToggleSaved={toggleSaved}
        onAddToEcosystem={handleAddToEcosystem}
        myProducts={myProducts}
        quizAnswers={effectiveQuizAnswers}
        lastQuizAnswers={lastQuizAnswers}
        initialSnapshot={editingHealthProfile ? lastQuizAnswers?.fullHealthIntake || null : null}
        name={resolvedName}
        headerInitial={headerInitial}
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

      {mainTabs.includes(screen) && (
        <BottomNav
          active={bottomActive}
          onHome={() => setScreen('home')}
          onExplore={() => setScreen('browse')}
          onCommunity={() => setScreen('community')}
          onEcosystem={() => setScreen(hasEcosystem ? 'eco' : 'ecointro')}
          onProfile={() => setOverlay({ type: 'profile' })}
        />
      )}

      {overlay?.type === 'product' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ProductDetailScreen
            product={overlay.item}
            onBack={() => setOverlay(null)}
            isSaved={isSaved(overlay.item?.id)}
            onToggleSaved={() => toggleSaved(overlay.item)}
            isInEcosystem={myProducts.some((p) => p.id === overlay.item?.id)}
            onAddToEcosystem={() => handleAddToEcosystem(overlay.item)}
            quizAnswers={effectiveQuizAnswers}
            ecosystemProducts={myProducts}
            theme={theme}
            onToggleTheme={setThemeMode}
          />
        </div>
      )}
      {overlay?.type === 'article' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ArticleDetailScreen article={overlay.item} onBack={() => setOverlay(null)} theme={theme} onToggleTheme={setThemeMode} />
        </div>
      )}
      {overlay?.type === 'why-match' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <WhyMatchScreen
            product={overlay.item}
            quizAnswers={effectiveQuizAnswers}
            onBack={() => setOverlay(null)}
            onUpdateHealth={() => { setOverlay(null); setEditingHealthProfile(false); setScreen('quiz'); }}
            onViewDetails={() => setOverlay({ type: 'product', item: overlay.item })}
          />
        </div>
      )}
      {overlay?.type === 'profile' && (
        <ProfileFlow
          onClose={() => setOverlay(null)}
          theme={theme}
          onToggleTheme={setThemeMode}
          onSignOut={handleSignOut}
          onSignIn={() => setScreen('signin')}
          authUser={authUser}
          name={resolvedName}
          onNameChanged={(next) => updateSession({ userName: next })}
          ecosystemCount={myProducts.length}
          savedCount={Object.keys(savedMap || {}).length}
          quizAnswers={effectiveQuizAnswers}
          myProducts={myProducts}
          savedProducts={savedMap}
          onViewAlternative={handleViewAlternative}
          onBrowse={() => setScreen('browse')}
          onGoEcosystem={() => setScreen(hasEcosystem ? 'eco' : 'ecointro')}
          onOpenSaved={() => setScreen('saved')}
          personalizeWithData={personalizeWithData}
          onPersonalizeWithDataChange={setPersonalizeWithData}
          askAynaHistoryCount={askAynaHistory.length}
          onClearAskAynaHistory={() => setAskAynaHistory([])}
          textSizeIndex={textSizeIndex}
          onTextSizeChange={setTextSizeIndex}
          onEditProfile={() => { setEditingHealthProfile(true); setScreen('quiz'); }}
          onOpenMonthlyCheckin={() => setScreen('checkin')}
        />
      )}

      {!askAynaOpen && (
        <AskAynaChip onClick={() => setAskAynaOpen(true)} viewKey={overlay ? `${overlay.type}:${overlay.item?.id || ''}` : screen} />
      )}
      <AskAynaModal
        open={askAynaOpen}
        onClose={() => setAskAynaOpen(false)}
        profile={effectiveQuizAnswers}
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
