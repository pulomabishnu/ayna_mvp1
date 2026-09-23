import { useEffect, useRef, useState } from 'react';
import { generateTieredRecommendations } from '../utils/recommendationEngine.js';
import { useRoutine } from './hooks/useRoutine.js';
import { Capacitor } from '@capacitor/core';
import './mobile.css';
import { ALL_PRODUCTS, getEcosystemAlternatives, getEcosystemSeedFromQuiz, filterPrescriptionCareGate } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { loadProductCatalog } from '../utils/productCatalog.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { clearEcosystemForUser, loadEcosystemForUser, upsertProductState, upsertProductsBatch } from '../utils/ecosystemStore.js';
import { limitEcosystemProductsByCategory, MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY } from '../utils/ecosystemLimits.js';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { loadHealthProfile } from '../utils/healthDataProfile.js';
import { loadHealthProfileForCurrentUser } from '../utils/healthProfileStore.js';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';
import { usePushNotifications, unlinkPushToken } from './hooks/usePushNotifications.js';
import { useTextSize } from './hooks/useTextSize.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { useSupabaseAuth, MOBILE_OAUTH_PENDING_KEY } from './hooks/useSupabaseAuth.js';
import { fetchNotificationPreferences } from './utils/notificationPreferencesApi.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';
import AskAynaChip from './components/AskAynaChip.jsx';
import AskAynaModal from './components/AskAynaModal.jsx';
import AnalyticsConsentPrompt from './components/AnalyticsConsentPrompt.jsx';
import AiConsentPrompt from './components/AiConsentPrompt.jsx';
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
import MonthlyCheckinScreen from './screens/MonthlyCheckinScreen.jsx';

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
  checkin: MonthlyCheckinScreen,
};

// Same catalog desktop's Discovery page browses: prescription-only items
// without a care path excluded (Ayna doesn't sell/dispense prescriptions —
// see Discovery.jsx), released startups folded in as ordinary products
// (unreleased ones stay Startups-hub-only), plus any live "discovered"
// products from /api/products that aren't in the bundled catalog yet (see
// productCatalog.js's migration-state comment — the API is meant to
// eventually replace the bundle; discoveredProducts is what's already live
// there but not yet in ALL_PRODUCTS).
function buildBrowseProducts(catalogProducts) {
  const source = Array.isArray(catalogProducts) && catalogProducts.length ? catalogProducts : ALL_PRODUCTS;
  const liveProducts = filterPrescriptionCareGate(source).map((p) => ({ ...p, isStartup: false }));
  const seen = new Set(liveProducts.map((p) => String(p?.id || '')));
  const releasedStartups = RELEASED_STARTUPS
    .filter((s) => !seen.has(String(s?.id || '')))
    .map((s) => ({
      ...s,
      isStartup: false,
      type: 'digital',
      summary: s.description || s.tagline,
      price: s.stage || '',
    }));
  return [...liveProducts, ...releasedStartups];
}

// Mobile and desktop must build the same initial ecosystem. Keep the actual
// selection logic in products.js so there is one recommendation algorithm,
// then add only mobile's display-only areaKey after the shared picks exist.
function seedEcosystemFromAnswers(quizAnswers, healthProfile = null) {
  const { mergedProducts } = getEcosystemSeedFromQuiz(quizAnswers, healthProfile);
  // The seed picks ONE product per concern, so a mobile-only build ended up
  // with 1-2 products total (desktop tops it up with the catalog-grounded
  // LLM build; mobile never did). Add the catalog engine's 3-5 diverse picks
  // per selected concern — still catalog-only, deterministic, and capped per
  // category below (2026-09-22 audit).
  const byId = new Map(Object.values(mergedProducts || {}).filter((p) => p?.id).map((p) => [p.id, p]));
  try {
    for (const entry of generateTieredRecommendations(quizAnswers || {})) {
      for (const tier of entry?.tiers || []) {
        const product = tier?.product;
        if (product?.id && !byId.has(product.id)) byId.set(product.id, product);
      }
    }
  } catch (error) {
    console.warn('[Ayna] tiered ecosystem picks failed; using seed only:', error?.message);
  }
  const seeded = [...byId.values()].map((product) => {
    const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
    return {
      ...product,
      intakeGenerated: true,
      areaKey: product.areaKey || area?.key || null,
    };
  });
  return limitEcosystemProductsByCategory(
    seeded,
    MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY
  );
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
  // Which tab the sign-in screen opens on: returning users ("Sign in" links)
  // land on the sign-in form, the post-intake funnel lands on sign-up.
  const [signinMode, setSigninMode] = useState('signup');
  const { user: authUser, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut: signOutSupabase, resendConfirmation, verifyEmailOtp } = useSupabaseAuth();

  // Backend-only state used to keep mobile ecosystem writes consistent with
  // the same Supabase user_ecosystems rows used by the website.
  const ecosystemFlagsRef = useRef({ trackedProducts: {}, omittedProducts: {} });
  const pendingQuizEcosystemRef = useRef(null);
  const { savedMap, isSaved, toggleSaved, resetSaved } = useSavedProducts(authUser);
  const { theme, resolvedTheme, setThemeMode } = useThemeMode();
  const [personalized, setPersonalized] = usePersonalizedFeed();
  // Re-registers this phone for push when permission was already granted and
  // stores the token against authUser. Tapping a recall notification opens
  // that product.
  usePushNotifications(authUser?.id, (data) => {
    if (data?.type !== 'recall' || !data.productId) return;
    const product = ALL_PRODUCTS.find((p) => p.id === data.productId);
    if (product) setOverlay({ type: 'product', item: product });
  });
  const { textSizeIndex, setTextSizeIndex, textScale } = useTextSize();
  const routine = useRoutine();
  const [askAynaOpen, setAskAynaOpen] = useState(false);
  const [askAynaHistory, setAskAynaHistory] = useState([]);
  // App-wide gate for Preferences > AI & Personalization > "Personalize with
  // my data" — real, account-scoped (notification_preferences table), loaded
  // once on sign-in below. Defaults true (matches the DB column default) so
  // a signed-out or not-yet-loaded user keeps today's behavior.
  const [personalizeWithData, setPersonalizeWithData] = useState(true);
  // Distinguishes "Finish your profile" (resume with prior answers, jump to
  // the first thing left blank) from every other way into the quiz screen
  // (start quiz, retake, update health), which all start fresh on purpose.
  const [editingHealthProfile, setEditingHealthProfile] = useState(false);
  // Falls back to the real Supabase identity whenever the locally-cached
  // session name is empty — covers a returning user whose device never
  // captured a name (e.g. signed in with Google before this fallback
  // chain existed), without needing a one-time migration.
  const resolvedName = userName || displayNameFromUser(authUser);

  // Load the signed-in user's existing website ecosystem into mobile.
  // Mobile still keeps its local session cache for instant rendering, but
  // Supabase is the shared cross-device source when a real user is signed in.
  useEffect(() => {
    if (!authUser?.id) return undefined;

    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    const userId = authUser.id;
    const firstName = displayNameFromUser(authUser);
    let cancelled = false;

    (async () => {
      // Mobile onboarding builds recommendations before sign-in. If that just
      // happened in this app session, it represents a replacement ecosystem,
      // not additions to whatever this account previously had. Desktop follows
      // the same reset-then-save semantics after quiz completion.
      const pending = pendingQuizEcosystemRef.current;
      if (Array.isArray(pending) && pending.length > 0) {
        await clearEcosystemForUser(supabase, userId);
        await upsertProductsBatch(supabase, userId, pending, {
          inEcosystem: true,
          isTracked: false,
          isOmitted: false,
        });

        if (cancelled) return;
        pendingQuizEcosystemRef.current = null;
      }

      // Loaded alongside the ecosystem itself — a synced ecosystem with no
      // synced intake behind it left `lastQuizAnswers` empty on any device
      // that didn't complete the intake locally, which silently disabled
      // every profile-gated feature (the Products/Reads "For You" toggles
      // in particular) even for a user with a complete, real profile.
      // Loading the imported health profile here also mirrors the server copy
      // into local storage, so a later mobile rebuild uses the same health
      // context that desktop passes to getEcosystemSeedFromQuiz().
      const [ecosystem, rawIntake, _healthProfileResult, notificationPrefs] = await Promise.all([
        loadEcosystemForUser(supabase, userId),
        loadHealthIntakeForCurrentUser(),
        loadHealthProfileForCurrentUser().catch(() => null),
        fetchNotificationPreferences().catch(() => null),
      ]);
      if (cancelled) return;

      if (typeof notificationPrefs?.personalizeWithDataEnabled === 'boolean') {
        setPersonalizeWithData(notificationPrefs.personalizeWithDataEnabled);
      }
      if (Number.isInteger(notificationPrefs?.textSizeIndex)) {
        setTextSizeIndex(notificationPrefs.textSizeIndex);
      }

      ecosystemFlagsRef.current = {
        trackedProducts: ecosystem?.trackedProducts || {},
        omittedProducts: ecosystem?.omittedProducts || {},
      };

      const remoteProducts = Object.values(ecosystem?.myProducts || {}).map((product) => {
        const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
        return {
          ...product,
          areaKey: product.areaKey || area?.key || null,
        };
      });

      const restoredQuizAnswers = rawIntake ? mapIntakeToLegacyQuizProfile(rawIntake) : null;

      updateSession((prev) => ({
        userName: firstName || prev.userName,
        myProducts: remoteProducts,
        hasEcosystem: remoteProducts.length > 0,
        // Don't clobber a completion that just happened locally this same
        // session (e.g. mobile onboarding right before sign-in) with
        // possibly-older server data.
        lastQuizAnswers: prev.lastQuizAnswers?.frustrations?.length
          ? prev.lastQuizAnswers
          : (restoredQuizAnswers || prev.lastQuizAnswers),
      }));

      if (remoteProducts.length > 0) setScreen('eco');
    })().catch((error) => {
      console.warn('[Ayna] mobile ecosystem sync failed:', error);
    });

    return () => {
      cancelled = true;
    };
    // Keyed on the user id, not the authUser object: Supabase emits several
    // auth events on launch (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED),
    // each a new object, which re-ran this whole sync 3x — including the
    // clear-then-upsert of a just-built ecosystem (2026-09-22 audit).
  }, [authUser?.id, updateSession, setTextSizeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Website and iPhone now consume the exact same live product_catalog feed.
  // Start with the bundled copy so Browse is never empty, then replace it with
  // the complete API catalog. Force-refresh while the app stays open and when
  // it returns to the foreground so a newly added/edited/deactivated product
  // propagates without shipping a new iOS build.
  const [catalogProducts, setCatalogProducts] = useState(ALL_PRODUCTS);
  useEffect(() => {
    let cancelled = false;
    const applyCatalog = ({ products }) => {
      if (cancelled || !Array.isArray(products) || !products.length) return;
      setCatalogProducts(products);
    };
    const refresh = () => loadProductCatalog({ force: true }).then(applyCatalog).catch(() => {});

    loadProductCatalog().then(applyCatalog).catch(() => {});
    const timer = setInterval(refresh, 5 * 60 * 1000);
    const onVisibility = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  const browseProducts = buildBrowseProducts(catalogProducts);

  const Screen = SCREENS[screen] || LandingScreen;

  // BrowseScreen/EcosystemScreen/EcosystemIntroScreen all default this to
  // the literal letter 'A' when it's not passed — that default was always
  // being used, since nothing here ever passed the signed-in user's real
  // initial down to them.
  const headerInitial = (resolvedName || '').trim().charAt(0).toUpperCase() || 'A';

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;
  // "Personalize with my data" (Preferences > AI & Personalization) — off
  // suppresses ambient personalization (match %, the For You toggles, Ask
  // Ayna's profile context, safety-alert swaps) everywhere quizAnswers would
  // otherwise be read, without touching the real stored answers themselves
  // (still saved, still shown when editing your own profile).
  const effectiveQuizAnswers = personalizeWithData ? lastQuizAnswers : null;

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
    try { justSignedInViaOAuth = localStorage.getItem(MOBILE_OAUTH_PENDING_KEY) === '1'; } catch { /* private mode */ }
    if (!justSignedInViaOAuth) return;
    try { localStorage.removeItem(MOBILE_OAUTH_PENDING_KEY); } catch { /* private mode */ }
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
    setAskAynaOpen(false);
    setAskAynaHistory([]);
    pendingQuizEcosystemRef.current = null;
    ecosystemFlagsRef.current = { trackedProducts: {}, omittedProducts: {} };
    resetSaved();
    routine.resetRoutine();
    resetSession();
    // Unlink this phone first (needs the session) so it stops getting the
    // signed-out account's alerts, then sign out either way.
    Promise.race([unlinkPushToken(), new Promise((r) => setTimeout(r, 2500))]).finally(() => signOutSupabase());
    setScreen('landing');
  };

  // "Add to ecosystem" from a product detail overlay — was previously wired
  // to nothing (ProductDetailScreen called onAddToEcosystem, but MobileApp
  // never passed it), so the button did nothing at all.
  const handleAddToEcosystem = (product) => {
    if (!product?.id) return;

    const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
    const ecosystemProduct = {
      ...product,
      areaKey: product.areaKey || area?.key || null,
    };

    updateSession((prev) => ({
      myProducts: prev.myProducts.some((p) => p.id === ecosystemProduct.id)
        ? prev.myProducts
        : [...prev.myProducts, ecosystemProduct],
      hasEcosystem: true,
    }));

    const supabase = getSupabaseClient();
    if (authUser && supabase) {
      upsertProductState(supabase, authUser.id, ecosystemProduct, {
        inEcosystem: true,
        isTracked: true,
        isOmitted: !!ecosystemFlagsRef.current.omittedProducts?.[ecosystemProduct.id],
      }).catch((error) => {
        console.warn('[Ayna] mobile ecosystem add sync failed:', error);
      });

      ecosystemFlagsRef.current.trackedProducts[ecosystemProduct.id] = ecosystemProduct;
    }
  };

  // "See swap" on a Shopper Profile safety alert — reuses the same real
  // alternative-finding logic as the desktop ecosystem swap flow instead of
  // just linking back to the flagged product itself.
  const handleViewAlternative = (product) => {
    if (!product?.id) return;
    const tag = Array.isArray(product.tags) ? product.tags[0] : undefined;
    const alternatives = getEcosystemAlternatives(product.id, tag, effectiveQuizAnswers) || [];
    setOverlay({ type: 'product', item: alternatives[0] || product });
  };

  const nav = {
    // Night mode is a persistent user preference (Preferences screen) — it
    // stays on everywhere until turned off there, so navigation must never
    // force it back to light.
    onStartQuiz: () => { setEditingHealthProfile(false); setScreen('quiz'); },
    onOpenMonthlyCheckin: () => setScreen('checkin'),
    onBrowse: () => setScreen('browse'),
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoLanding: () => setScreen('landing'),
    onGoSignIn: () => { setSigninMode('signin'); setScreen('signin'); },
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
      const seededProducts = seedEcosystemFromAnswers(quizAnswers, loadHealthProfile());

      updateSession({
        myProducts: seededProducts,
        lastQuizAnswers: quizAnswers,
        hasEcosystem: seededProducts.length > 0,
      });

      const supabase = getSupabaseClient();
      if (authUser && supabase) {
        // A retake/update replaces the ecosystem. Without clearing first, rows
        // from the previous website/mobile build stayed active in Supabase and
        // were merged back on the next login, making the two clients diverge.
        (async () => {
          await clearEcosystemForUser(supabase, authUser.id);
          await upsertProductsBatch(supabase, authUser.id, seededProducts, {
            inEcosystem: true,
            isTracked: false,
            isOmitted: false,
          });
        })().catch((error) => {
          console.warn('[Ayna] mobile generated ecosystem sync failed:', error);
        });
      } else {
        pendingQuizEcosystemRef.current = seededProducts;
      }
      // Same real save desktop's App.jsx makes after quiz completion — was
      // never ported to mobile (a real signed-in session didn't exist here
      // yet at the time), so a mobile-only user's intake answers lived on
      // that one device only, invisible to that user on any other device. No-ops harmlessly when signed out.
      const rawIntake = quizAnswers?.fullHealthIntake || quizAnswers;
      saveHealthIntakeForCurrentUser(rawIntake).catch(() => {});
      setScreen('building');
    },
    // The reveal->sign-in funnel is for a first-time, still-anonymous build:
    // "here's your ecosystem, sign in to save it." Someone already signed in
    // (a monthly check-in, a retaken quiz, an edited profile) already has an
    // account and this same ecosystem attached to it — routing them through
    // "sign in" again after finishing is a dead end, not a next step.
    onFinish: () => setScreen(authUser ? 'eco' : 'reveal'),
    onContinue: () => { setSigninMode('signup'); setScreen('signin'); },
    initialMode: signinMode,
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
    onAppleSignIn: Capacitor.getPlatform() === 'ios' ? signInWithApple : undefined,
    onResendConfirmation: resendConfirmation,
    onVerifyEmailOtp: verifyEmailOtp,
    onAuthenticated: (name) => {
      updateSession((prev) => ({ userName: name || prev.userName, hasEcosystem: true }));
      setScreen('eco');
    },
    hasEcosystem,
  };

  return (
    <div className="ayna-mobile" data-theme={resolvedTheme} style={{ '--ayna-text-scale': textScale }}>
      <AnalyticsConsentPrompt />
      <AiConsentPrompt user={authUser} />
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
          onSignIn={() => { setOverlay(null); setSigninMode('signin'); setScreen('signin'); }}
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
          routine={routine}
        />
      )}
      {!askAynaOpen && (
        <AskAynaChip
          onClick={() => setAskAynaOpen(true)}
          viewKey={overlay ? `${overlay.type}:${overlay.item?.id || ''}` : screen}
        />
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
