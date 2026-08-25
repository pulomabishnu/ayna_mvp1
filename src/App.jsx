import React, { Suspense, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import AynaLanding from './components/AynaLanding';
import SiteFooter from './components/SiteFooter';
import SavedForLater from './components/SavedForLater';
import EcosystemGenerationBar from './components/EcosystemGenerationBar';
import HealthIntakeForm from './components/HealthIntakeForm';
import HealthProfileEditor from './components/HealthProfileEditor';
import PhoneVerification from './components/PhoneVerification';
import Recommendations from './components/Recommendations';
import TrackedItems from './components/TrackedItems';
import MonthlyCheckin from './components/MonthlyCheckin';
import OmittedProducts from './components/OmittedProducts';
import Comparison from './components/Comparison';
import DoctorPrep from './components/DoctorPrep';
import Recalls from './components/Recalls';
// Lazy: each of these pulls in src/data/startups.js (~1700 lines) — deferring
// them until the user actually navigates there keeps that out of the main
// bundle. products.js itself is still eager (App.jsx needs getRecommendations/
// getEcosystemSeedFromQuiz synchronously), so this doesn't fix everything,
// but it's the safe part of the fix available without a bigger refactor of
// how this file computes recommendations.
const BrandPartners = React.lazy(() => import('./components/BrandPartners'));
const MyEcosystem = React.lazy(() => import('./components/MyEcosystem'));
const Discovery = React.lazy(() => import('./components/Discovery'));
const Articles = React.lazy(() => import('./components/Articles'));
import { CATEGORY_LABELS, getRecommendations, getPersonalizedProductIds, getEcosystemSeedFromQuiz, getProductById } from './data/products';
import { loadAynaReviews, hydrateAynaReviews, addRating, addReview } from './data/aynaReviews';
import Screenings from './components/Screenings';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useEscapeToClose } from './utils/useEscapeToClose';
import ProductModal from './components/ProductModal';
import { enrichLlmProductForDiscovery } from './utils/enrichLlmProductForDiscovery';
import ProfileChatbot from './components/ProfileChatbot';
import { loadHealthProfile, hasHealthProfileSignals } from './utils/healthDataProfile';
import { loadHealthProfileForCurrentUser, saveHealthProfileForCurrentUser } from './utils/healthProfileStore';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from './utils/healthIntakeStore';
import { mapIntakeToLegacyQuizProfile } from './utils/healthIntake';
import AuthGate from './components/AuthGate';
import PrivacyPolicy from './components/PrivacyPolicy';
import HowWeMakeMoney from './components/HowWeMakeMoney';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import './finalAynaPolish.css';
import TermsOfUse from './components/TermsOfUse';
import AuthCallback from './components/AuthCallback';
import EmailConfirmed from './components/EmailConfirmed';
import { getSupabaseClient } from './utils/supabaseClient';
import { loadEcosystemForUser, upsertProductState, upsertProductsBatch, clearEcosystemForUser } from './utils/ecosystemStore';
import { loadSavedProducts, persistSavedProducts, clearSavedProducts, loadSavedForUser, setSavedForUser } from './utils/savedProductsStore';
import { loadLearningMemoryForUser, saveLearningMemoryForUser } from './utils/learningMemoryStore';
import { loadReviewsForUser, upsertProductReviews } from './utils/reviewsStore';
import { clearCachedLlmRecommendations, fingerprintIntake } from './utils/fetchLlmRecommendations';
import posthog from 'posthog-js';
import { tagInternalUserIfNeeded } from './utils/posthogInternal';
import { productHref, parseProductIdFromPath } from './utils/productRoute';

const ECOSYSTEM_NAV_VIEWS = ['ecosystem', 'comparison', 'omitted', 'recalls'];
/** Landing boards (1a/1c) run the nav on the hero gradient; every other board is on cream. */
const GRADIENT_NAV_VIEWS = ['welcome', 'hero', 'about'];

/** Initials for the account circle. Prefer the real profile name; never expose the email handle as a "name". */
function accountMonogram(user) {
  const meta = user?.user_metadata || {};
  const rawName = meta.full_name || meta.name || meta.first_name || meta.given_name || '';
  const parts = String(rawName).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'A';
}

const ecosystemResetKey = (userId) => `ayna_ecosystem_reset_at:${userId || 'anon'}`;

function markEcosystemResetPending(userId) {
  if (!userId) return null;
  const resetAt = Date.now();
  try { localStorage.setItem(ecosystemResetKey(userId), String(resetAt)); } catch (_) {}
  return resetAt;
}

function getPendingEcosystemResetAt(userId) {
  if (!userId) return 0;
  try { return Number(localStorage.getItem(ecosystemResetKey(userId)) || 0) || 0; } catch (_) { return 0; }
}

function clearPendingEcosystemReset(userId) {
  if (!userId) return;
  try { localStorage.removeItem(ecosystemResetKey(userId)); } catch (_) {}
}

const VIEW_TO_PATH = {
  welcome: '/', hero: '/', quiz: '/quiz', ecosystem: '/ecosystem',
  discovery: '/discovery', waitlist: '/startups',
  articles: '/library', screenings: '/screenings', omitted: '/omitted',
  comparison: '/comparison', recalls: '/recalls',
  'doctor-prep': '/appointment-prep', 'profile-edit': '/profile', 'phone-verify': '/text-ayna', tracked: '/tracked',
  'privacy-policy': '/privacy-policy',
  'terms-of-use': '/terms-of-use',
  'how-we-make-money': '/how-we-make-money',
  'how-it-works': '/how-it-works',
  about: '/about',
  'auth-callback': '/auth/callback',
  'confirmed': '/confirmed',
};
// Friendly document.title per view — 'welcome'/'hero' and any view not
// listed here fall back to the site's base title (see the title effect).
const VIEW_TITLES = {
  quiz: 'Health Quiz', ecosystem: 'My Ecosystem', discovery: 'Browse',
  waitlist: 'Startups', articles: 'Health Library', screenings: 'Screenings',
  omitted: 'Omitted Products', comparison: 'Compare Products', recalls: 'Recalls',
  'doctor-prep': 'Appointment Prep', 'profile-edit': 'Edit Profile',
  'phone-verify': 'Verify Phone', tracked: 'Tracked Products',
  'privacy-policy': 'Privacy Policy', 'terms-of-use': 'Terms of Use',
  'how-we-make-money': 'How We Make Money', 'how-it-works': 'How It Works',
  about: 'About', 'not-found': 'Page Not Found',
};

const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).filter(([, p]) => p !== '/').map(([v, p]) => [p, v])
);
PATH_TO_VIEW['/'] = 'welcome';

function getInitialView() {
  const path = window.location.pathname;
  if (parseProductIdFromPath(path)) return 'product';
  // An unrecognized path used to silently resolve to 'welcome' — a typo'd
  // or stale-bookmarked URL landed on the homepage with zero indication
  // anything was wrong (found live, 2026-08-24 bug bash). The root path
  // itself is explicitly mapped in PATH_TO_VIEW, so this only ever affects
  // a genuinely unknown path, never '/'.
  return PATH_TO_VIEW[path] || 'not-found';
}

function getInitialProductId() {
  return parseProductIdFromPath(window.location.pathname);
}

/**
 * Discovery's search query/results lived only in React state, so a browser tab
 * discard/reload (mobile tab-switch memory eviction, desktop "memory saver")
 * always came back to an empty search even when the URL correctly restored the
 * Discovery view — the app looked "reset" even though only this one query was
 * lost. Mirroring it into ?q= makes it survive a reload the same way the view
 * itself already does via VIEW_TO_PATH.
 */
function getInitialDiscoverySearch() {
  if (getInitialView() !== 'discovery') return '';
  try {
    return new URLSearchParams(window.location.search).get('q') || '';
  } catch {
    return '';
  }
}

function ViewLoadingFallback() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary, #666)' }}>
      Loading…
    </div>
  );
}

/**
 * Shared "nothing here" state — a bad product link already showed a proper,
 * on-brand empty state (centered serif heading, muted subtext, single navy
 * CTA), but a bad top-level URL (a typo, a stale bookmark) instead silently
 * redirected to the homepage with zero indication anything was wrong (found
 * live, 2026-08-24 bug bash). Same component now backs both, instead of a
 * one-off block duplicated just for products.
 */
function NotFoundState({ title, subtitle, ctaLabel, onCta }) {
  return (
    <div className="mockup-page" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', margin: '0 0 0.5rem' }}>{title}</p>
      <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.75rem' }}>{subtitle}</p>
      <button type="button" className="btn btn-navy" onClick={onCta}>{ctaLabel}</button>
    </div>
  );
}

function App() {
  const [currentView, setCurrentViewRaw] = useState(getInitialView);
  // Only meaningful when currentView === 'product' — the :id segment of
  // /product/:id. Kept separate from currentView (rather than encoded into
  // it) so VIEW_TO_PATH/PATH_TO_VIEW stay simple static maps for every other
  // route.
  const [productRouteId, setProductRouteId] = useState(getInitialProductId);
  // Ref always mirrors currentView synchronously — safe to read inside Supabase callbacks
  // that run outside React's render cycle.
  const currentViewRef = useRef(getInitialView());
  // Counts real in-app pushState navigations (not the initial replaceState
  // on mount, and not replace-style navigations). Used to tell "the user
  // clicked around inside the app to get here" apart from "this tab's only
  // entry is a direct/shared link" — window.history.length can't do this
  // reliably, since a freshly opened tab already carries its own blank
  // entry before the app even loads, making history.length > 1 true even
  // with zero in-app navigation.
  const inAppPushCountRef = useRef(0);
  const pathForView = useCallback((view, id) => {
    if (view === 'product') return id ? productHref(id) : '/';
    return VIEW_TO_PATH[view] || '/';
  }, []);
  const setCurrentView = useCallback((view, { replace = false } = {}) => {
    currentViewRef.current = view;
    setCurrentViewRaw(view);
    if (view !== 'product') setProductRouteId(null);
    const path = pathForView(view, null);
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ view }, '', path);
      else { window.history.pushState({ view }, '', path); inAppPushCountRef.current += 1; }
    }
  }, [pathForView]);
  /** Navigate to a specific product's dedicated page — a real URL, not modal state. */
  const navigateToProduct = useCallback((id, { replace = false } = {}) => {
    if (!id) return;
    currentViewRef.current = 'product';
    setCurrentViewRaw('product');
    setProductRouteId(id);
    const path = productHref(id);
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ view: 'product', productId: id }, '', path);
      else { window.history.pushState({ view: 'product', productId: id }, '', path); inAppPushCountRef.current += 1; }
    }
  }, []);
  /** Back control for the product page: real in-app back if we got here by
   * clicking around inside the app, otherwise (direct/shared link, no prior
   * in-app history) a safe landing on Discovery instead of leaving the tab. */
  const handleBackFromProduct = useCallback(() => {
    if (inAppPushCountRef.current > 0) window.history.back();
    else handleViewDiscovery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const path = pathForView(currentView, productRouteId);
    window.history.replaceState({ view: currentView, productId: productRouteId }, '', path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onPop = (e) => {
      const pathProductId = parseProductIdFromPath(window.location.pathname);
      const view = pathProductId ? 'product' : (e.state?.view || PATH_TO_VIEW[window.location.pathname] || 'not-found');
      currentViewRef.current = view;
      setCurrentViewRaw(view);
      setProductRouteId(pathProductId);
      // Discovery unmounts/remounts on every navigation away and back (it's
      // conditionally rendered on currentView), so its own search state is
      // lost each time — landing back on a product's "Back" button always
      // showed the blank default search, not what was actually searched.
      // Discovery already mirrors its submittedQuery into ?q= via
      // replaceState as the user searches, so that history entry's URL still
      // has it; this just needs to be re-read on the way back in, the same
      // way getInitialDiscoverySearch reads it on the very first page load.
      if (view === 'discovery') {
        try {
          setDiscoverySearch(new URLSearchParams(window.location.search).get('q') || '');
        } catch {
          setDiscoverySearch('');
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentView, productRouteId]);
  const [quizResults, setQuizResults] = useState(null);
  const [trackedProducts, setTrackedProducts] = useState({});
  const [joinedWaitlists, setJoinedWaitlists] = useState({});
  const [myProducts, setMyProducts] = useState({});
  // Stable insertion-order array of product IDs — prevents cards from reordering on swap/add
  const [ecosystemOrder, setEcosystemOrder] = useState([]);
  const [omittedProducts, setOmittedProducts] = useState({});
  const [compareList, setCompareList] = useState([]);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinData, setCheckinData] = useState(null);
  const [checkinUpdatedProfile, setCheckinUpdatedProfile] = useState(false);
  const [checkinCompletedAt, setCheckinCompletedAt] = useState(null);
  const [discoverySearch, setDiscoverySearch] = useState(getInitialDiscoverySearch);
  const [discoveryInitial, setDiscoveryInitial] = useState(null); // { initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase }
  const [userZipCode, setUserZipCode] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [aynaReviews, setAynaReviews] = useState({});
  const [healthProfile, setHealthProfile] = useState(() => loadHealthProfile());
  const [savedProducts, setSavedProducts] = useState(() => loadSavedProducts());
  const [ecosystemSeedMeta, setEcosystemSeedMeta] = useState({});
  const [user, setUser] = useState(null);
  const [userSession, setUserSession] = useState(null);
  // Set to true once the LLM builds the ecosystem this session — prevents
  // Supabase token-refresh reloads from overwriting in-memory LLM products.
  const llmBuiltThisSessionRef = useRef(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  // Ref mirrors pendingAction so onAuthStateChange (async callback) can read it synchronously
  const pendingActionRef = useRef(null);
  const [pendingQuizResults, setPendingQuizResults] = useState(null);
  // Requested 2026-08-24 meeting: "sign-in required to build an ecosystem,
  // accompanied by a popup warning to prevent loss of unsaved progress." The
  // sign-in requirement already existed (handleQuizComplete gates on `user`
  // below) — what didn't exist was the warning: pendingQuizResults lives only
  // in React state until she signs in, so closing the tab, hitting back, or
  // navigating away while the AuthGate modal is up silently threw away a
  // just-completed quiz with no warning at all. beforeunload is the only
  // browser mechanism that can actually intercept a tab close/refresh — an
  // in-app modal can't.
  useEffect(() => {
    if (!pendingQuizResults) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingQuizResults]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  useEscapeToClose(showDeleteModal, () => setShowDeleteModal(false));
  const [saveError, setSaveError] = useState(null);
  const reportSaveFailure = useCallback((what, err) => {
    console.error('[Ayna] save failed:', what, err);
    setSaveError(`${what}. Your changes may not be saved. Check your connection and try again.`);
  }, []);

  const resetRemoteEcosystemBestEffort = useCallback(async (supabase, userId) => {
    if (!supabase || !userId) return { synced: false, skipped: true };
    markEcosystemResetPending(userId);
    try {
      const result = await clearEcosystemForUser(supabase, userId);
      clearPendingEcosystemReset(userId);
      return { synced: true, ...result };
    } catch (error) {
      // Reset is local-first. A temporary RLS/network failure must never block
      // rebuilding the ecosystem or show a scary global error banner.
      console.warn('[Ayna] remote ecosystem reset deferred:', error);
      return { synced: false, deferred: true };
    }
  }, []);

  /** Update local state AND persist, so the imported profile survives a device change. */
  const updateHealthProfile = useCallback((next) => {
    setHealthProfile(next);
    saveHealthProfileForCurrentUser(next).catch((e) =>
      reportSaveFailure('Could not save your health data', e)
    );
  }, [reportSaveFailure]);
  const accountMenuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollY = useScrollPosition();

  const hasHealthImport = useMemo(() => hasHealthProfileSignals(healthProfile), [healthProfile]);
  const hasCompletedPersonalization = useMemo(() => {
    if (!quizResults) return false;
    if (quizResults?.personalizationCompleted === true) return true;
    if (quizResults?.fullHealthIntake?.personalizationCompleted === true) return true;
    return false;
  }, [quizResults]);
  // Same fingerprint MyEcosystem computes for its own generation effect —
  // this is what lets EcosystemGenerationBar find and observe (never start)
  // the same activeGenerations record from anywhere in the app.
  const ecosystemIntakeFingerprint = useMemo(
    () => (hasCompletedPersonalization ? fingerprintIntake(quizResults?.fullHealthIntake || null) : ''),
    [quizResults, hasCompletedPersonalization]
  );

  React.useEffect(() => {
    setAynaReviews(loadAynaReviews());
  }, []);

  // Restore quiz results saved before a Google OAuth redirect.
  React.useEffect(() => {
    try {
      const storedQuiz = sessionStorage.getItem('ayna_pending_quiz_results');
      if (storedQuiz) {
        setPendingQuizResults(JSON.parse(storedQuiz));
        setPendingAction('quiz-complete'); pendingActionRef.current = 'quiz-complete';
        sessionStorage.removeItem('ayna_pending_quiz_results');
      }
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setAuthLoading(false); return; }
    const isCallbackPage = window.location.pathname === '/auth/callback';
    if (!isCallbackPage) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          setUserSession(session ?? null);
        })
        .catch((e) => {
          console.error('[Ayna] getSession failed:', e);
          setUser(null);
          setUserSession(null);
        })
        // Must run on BOTH paths. Without it a rejected getSession left
        // authLoading true forever, the PROTECTED_VIEWS redirect never fired,
        // and the user saw an empty ecosystem with no auth prompt.
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
    // Views a signed-out visitor is allowed to stay on. Anything outside this
    // list gets sent back to the landing when the session clears, which is
    // right for the private pages but was wrong for the public ones: with
    // Supabase configured, onAuthStateChange fires with no session on every
    // cold load, so opening /discovery or /how-it-works signed out bounced
    // straight back to the landing and those pages were unreachable by URL in
    // production. (PROTECTED_VIEWS below is what actually guards private ones.)
    const STATIC_VIEWS = [
      'privacy-policy', 'terms-of-use', 'confirmed', 'auth-callback',
      'welcome', 'hero', 'quiz', 'discovery', 'waitlist', 'articles',
      'how-it-works', 'how-we-make-money',
    ];
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setUserSession(session ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
        tagInternalUserIfNeeded(posthog);
        setShowAuthModal(false);
        // Deliberately does NOT navigate here. Every in-app path that opens the
        // auth modal (nav "Log in", quiz-complete gate, browse gate, the
        // PROTECTED_VIEWS redirect) sets `pendingAction` first, and the
        // [user, pendingAction] effect below does the post-login navigation.
        // The Google OAuth return trip is handled separately by AuthCallback's
        // onAuthenticated. Supabase also fires SIGNED_IN on session restoration
        // AND on every tab-focus token check (even when nothing changed) — a
        // previous version of this handler tried to distinguish "explicit
        // login" from those via a ref snapshot of the initial session, but that
        // snapshot could be wrong (e.g. a transient getSession() failure marked
        // it "signed out" even for an already-signed-in user), which sent
        // users back to the ecosystem page — losing whatever they were doing —
        // every time they returned to the tab. Since the two real login paths
        // already navigate on their own, this handler doesn't need to.
      }
      if (event === 'SIGNED_OUT') {
        posthog.reset();
      }
      if (!session) {
        // supabase-js is known to emit a spurious SIGNED_OUT (session: null)
        // on a transient background token-refresh failure — a brief network
        // blip, not a real sign-out. This block wipes EVERY piece of local
        // state (ecosystem, quiz results, reviews, health profile, saved
        // products) and sends the user back to 'welcome', forcing a full
        // intake redo — exactly what an MVP tester reported happening to her
        // for no apparent reason while she was still genuinely signed in.
        // Debounce: wait briefly and re-check the ACTUAL current session
        // before treating this as a real sign-out, so a transient blip that
        // resolves on its own never touches any local data.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) return; // recovered — was transient, wipe nothing
        } catch (_) {
          // getSession() itself failing doesn't prove there's no session —
          // fall through to the wipe rather than loop forever on an
          // unrelated network error, same as every other best-effort check
          // in this handler.
        }
        setMyProducts({});
        setTrackedProducts({});
        setOmittedProducts({});
        setQuizResults(null);
        setAynaReviews({});
        // Held only in memory + localStorage and never cleared before, so the
        // next user on this browser inherited the previous user's imported
        // conditions and medications — which are then sent to the LLM as
        // "her" health context by ProductModal and MyEcosystem.
        setHealthProfile(null);
        setSavedProducts({});
        clearSavedProducts();
        if (!STATIC_VIEWS.includes(currentViewRef.current)) {
          setCurrentView('welcome', { replace: true });
        }
        try {
          // Keep LLM recommendations cache — it's fingerprint-keyed so a
          // different quiz will naturally miss. Clearing it caused a re-fetch
          // on every login for the same user.
          localStorage.removeItem('ayna_llm_learning_memory_v1');
          // Everything below is per-user data that used to survive sign-out:
          //  - ayna_reviews: addRating/addReview read this global blob, so the
          //    next user's first rating wrote the PREVIOUS user's ratings and
          //    free-text reviews into her own user_reviews row.
          //  - ayna_health_profile_v1: imported conditions/medications (above).
          //  - ayna_force_llm_refresh: a leftover flag made the next user's
          //    session spend her one lifetime ecosystem build unprompted.
          localStorage.removeItem('ayna_reviews');
          localStorage.removeItem('ayna_health_profile_v1');
          sessionStorage.removeItem('ayna_force_llm_refresh');
        } catch (_) {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    // Capture the id this load belongs to. Without this guard, signing out of
    // account A and into account B (a shared laptop, or just a slow connection)
    // lets A's four in-flight queries resolve AFTER B's and write A's health
    // intake, ecosystem and reviews into B's session. Any subsequent toggle
    // then persists A's products under B's user_id, making the PHI
    // cross-contamination permanent in the database.
    const loadForUserId = user.id;
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      (async () => {
        const resetAt = getPendingEcosystemResetAt(loadForUserId);
        if (resetAt) {
          try {
            await clearEcosystemForUser(supabase, loadForUserId);
            clearPendingEcosystemReset(loadForUserId);
          } catch (error) {
            // Do not block the user on a remote reset. Keep the marker so stale
            // ecosystem rows are filtered below and retry next session.
            console.warn('[Ayna] ecosystem reset is pending remote sync:', error);
          }
        }
        return loadEcosystemForUser(supabase, loadForUserId).catch(() => null);
      })(),
      loadReviewsForUser(supabase, loadForUserId).catch(() => null),
      loadLearningMemoryForUser(supabase, loadForUserId).catch(() => null),
      loadHealthIntakeForCurrentUser().catch(() => null),
      // Imported conditions/medications/allergies. Was localStorage-only, so it
      // vanished on any other device while still being fed to the LLM as health
      // context — recommendations silently degraded with no signal.
      loadHealthProfileForCurrentUser().catch(() => null),
      // null when the is_saved column isn't on the live table yet — the local
      // list stands in until the migration is applied.
      loadSavedForUser(supabase, loadForUserId).catch(() => null),
    ]).then(([ecosystem, reviews, memory, intake, healthProfileResult, saved]) => {
      if (cancelled) return;
      if (saved) {
        // Merge rather than replace: anything saved while signed out on this
        // device should survive signing in.
        setSavedProducts((prev) => {
          const merged = { ...prev, ...saved };
          persistSavedProducts(merged);
          return merged;
        });
      }
      if (ecosystem) {
        const resetAt = getPendingEcosystemResetAt(loadForUserId);
        const visibleEcosystem = resetAt
          ? {
              ...ecosystem,
              myProducts: Object.fromEntries(
                Object.entries(ecosystem.myProducts || {}).filter(([productId]) => {
                  const updatedAt = Date.parse(ecosystem.ecosystemUpdatedAt?.[productId] || '') || 0;
                  return updatedAt > resetAt;
                })
              ),
            }
          : ecosystem;
        if (!llmBuiltThisSessionRef.current) {
          // Merge, don't replace: anything the user toggled while the load was
          // in flight is already persisted, and clobbering it here made her
          // change vanish from the UI a few seconds after she made it.
          setMyProducts(prev => (Object.keys(prev).length ? { ...visibleEcosystem.myProducts, ...prev } : visibleEcosystem.myProducts));
          setEcosystemOrder(prev => {
            const merged = Object.keys(visibleEcosystem.myProducts);
            const extra = prev.filter(id => !merged.includes(id));
            return [...merged, ...extra];
          });
        } else {
          // LLM already built this session — merge only manual (non-LLM) products from Supabase
          setMyProducts(prev => {
            const manual = Object.fromEntries(
              Object.entries(visibleEcosystem.myProducts)
                .filter(([, p]) => !p?.llmGenerated && !p?.intakeGenerated)
            );
            return { ...prev, ...manual };
          });
          setEcosystemOrder(prev => {
            const newManualIds = Object.keys(visibleEcosystem.myProducts)
              .filter(id => !ecosystem.myProducts[id]?.llmGenerated && !ecosystem.myProducts[id]?.intakeGenerated && !prev.includes(id));
            return [...prev, ...newManualIds];
          });
        }
        setTrackedProducts(ecosystem.trackedProducts);
        setOmittedProducts(ecosystem.omittedProducts);
      }
      if (reviews) {
        // Mirror the server copy into localStorage. addRating/addReview read
        // from localStorage and the caller upserts the whole object, so without
        // this a second device would overwrite the server row with a single
        // rating and wipe every review written elsewhere.
        setAynaReviews(hydrateAynaReviews(reviews));
      }
      if (memory) {
        try { localStorage.setItem('ayna_llm_learning_memory_v1', JSON.stringify(memory)); } catch (_) {}
      }
      if (intake?.personalizationCompleted) {
        setQuizResults(mapIntakeToLegacyQuizProfile(intake));
      }
      if (healthProfileResult?.profile) setHealthProfile(healthProfileResult.profile);
    }).finally(() => {
      if (!cancelled) setDataLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  React.useEffect(() => {
    if (!user) return;
    if (!pendingAction) {
      // No pending action — user was already signed in (e.g. returning session).
      // Stay on welcome so they can navigate themselves.
      return;
    }
    setShowAuthModal(false);
    if (pendingAction === 'quiz-complete' && pendingQuizResults) {
      setQuizResults(pendingQuizResults);
      const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(pendingQuizResults, healthProfile);
      setEcosystemSeedMeta(seedMeta);
      const instantProducts = Object.keys(mergedProducts || {}).length
        ? mergedProducts
        : Object.fromEntries(
            getRecommendations(pendingQuizResults, healthProfile)
              .slice(0, 6)
              .map((product) => [product.id, product])
          );
      setMyProducts(instantProducts);
      setEcosystemOrder(Object.keys(instantProducts));
      clearCachedLlmRecommendations();
      try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
      const _supabase = getSupabaseClient();
      if (_supabase && user) resetRemoteEcosystemBestEffort(_supabase, user.id);
      setCurrentView('ecosystem');
      // Persist the RAW intake, not the legacy wrapper. `pendingQuizResults` is
      // already the output of mapIntakeToLegacyQuizProfile(), so saving it stored
      // the wrong shape in health_intakes.profile — and on the next load
      // mapIntakeToLegacyQuizProfile() ran over an already-mapped object, whose
      // keys it does not recognise. Conditions, symptoms, flow level and product
      // preferences all came back EMPTY for every user who signed up after
      // completing the intake (i.e. the whole OAuth signup path), and the LLM was
      // then handed a malformed intake on every subsequent build.
      const rawIntake = pendingQuizResults?.fullHealthIntake || pendingQuizResults;
      saveHealthIntakeForCurrentUser(rawIntake).catch(e => reportSaveFailure('Could not save your health profile', e));
      setPendingQuizResults(null);
    } else if (pendingAction === 'browse') {
      handleViewDiscovery('');
    } else if (pendingAction === 'login') {
      setCurrentView('welcome');
    }
    setPendingAction(null); pendingActionRef.current = null;
  }, [user, pendingAction]);

  useEffect(() => {
    if (!showAccountMenu) return;
    const close = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) setShowAccountMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showAccountMenu]);

  // Discovery's "Personalized" toggle is visible to everyone, but clicking it
  // while logged out opens the same AuthGate modal used everywhere else in
  // the app, instead of silently doing nothing or being invisible.
  const handleRequirePersonalizeAuth = useCallback(() => {
    setPendingAction('personalize'); pendingActionRef.current = 'personalize';
    setShowAuthModal(true);
  }, []);

  const PROTECTED_VIEWS = ['ecosystem', 'comparison', 'omitted', 'recalls', 'doctor-prep', 'profile-edit', 'phone-verify', 'tracked', 'screenings'];
  useEffect(() => {
    if (!authLoading && !user && PROTECTED_VIEWS.includes(currentView)) {
      setCurrentView('welcome', { replace: true });
      setPendingAction('login'); pendingActionRef.current = 'login';
      setShowAuthModal(true);
    }
  }, [user, currentView, authLoading]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      let timeoutId;
      try {
        const timeoutMs = 12_000;
        const timeoutP = new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('intake_load_timeout')), timeoutMs);
        });
        const savedIntake = await Promise.race([loadHealthIntakeForCurrentUser(), timeoutP])
          .then((v) => {
            if (timeoutId) window.clearTimeout(timeoutId);
            return v;
          })
          .catch(() => {
            if (timeoutId) window.clearTimeout(timeoutId);
            return null;
          });
        const completedIntake = savedIntake && savedIntake.personalizationCompleted === true;
        if (active && completedIntake && !quizResults) {
          setQuizResults(mapIntakeToLegacyQuizProfile(savedIntake));
        }
      } catch (_) {
        if (timeoutId) window.clearTimeout(timeoutId);
      }
    })();
    return () => {
      active = false;
    };
  }, [quizResults]);

  const recommendedProductIds = useMemo(() => {
    if (!hasCompletedPersonalization) return [];
    return getPersonalizedProductIds(quizResults || null, healthProfile);
  }, [quizResults, healthProfile, hasCompletedPersonalization]);

  // Categories this person actually matches on, in match order — the landing
  // Shop's Personalize toggle sorts by these.
  const landingProfileCategories = useMemo(() => {
    if (!hasCompletedPersonalization) return [];
    const seen = [];
    getRecommendations(quizResults || null, healthProfile).forEach((p) => {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    });
    return seen;
  }, [quizResults, healthProfile, hasCompletedPersonalization]);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('ayna_zip')) setUserZipCode(localStorage.getItem('ayna_zip') || '');
    } catch (_) {}
  }, []);

  const handleZipCodeChange = (zip) => {
    setUserZipCode(zip);
    try { if (typeof window !== 'undefined') localStorage.setItem('ayna_zip', zip || ''); } catch (_) {}
  };

  // The zip captured during intake was "capture-only, no downstream wiring"
  // when that field was added — Care near you has its own separate zip input
  // (userZipCode, above), so users had to type the same zip twice for it to
  // show up in local clinic/telehealth links. One-time carry-over, covering
  // fresh quiz completion, the post-OAuth-signup completion path, a health
  // profile edit, and a session-restore load — all of them funnel through
  // `quizResults` eventually. Never overwrites a zip the user already set
  // directly in Care near you.
  React.useEffect(() => {
    const intakeZip = quizResults?.fullHealthIntake?.zipcode;
    if (intakeZip && !userZipCode) handleZipCodeChange(intakeZip);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizResults]);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ayna_checkin_completed_at');
        if (stored) setCheckinCompletedAt(stored);
      }
    } catch (_) {}
  }, []);

  const CHECKIN_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // ~monthly
  // Only nags once someone has done a first check-in — a brand-new user with
  // nothing in their ecosystem yet has nothing to "check in" about.
  const checkinDue = !!checkinCompletedAt && (Date.now() - new Date(checkinCompletedAt).getTime() > CHECKIN_INTERVAL_MS);
  const isScrolled = scrollY > 20;
  const navOnGradient = GRADIENT_NAV_VIEWS.includes(currentView);
  const accountInitials = accountMonogram(user);


  const handleStartQuiz = () => setCurrentView('quiz');
  const handleOpenHealthProfileEditor = () => setCurrentView('profile-edit');
  const handleOpenPhoneVerification = () => setCurrentView('phone-verify');
  const handleViewWaitlist = () => setCurrentView('waitlist');
  const handleViewEcosystem = () => setCurrentView('ecosystem');
  const handleViewWishlist = () => {
    setCurrentView('ecosystem');
    window.setTimeout(() => {
      document.getElementById('ayna-wishlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  };
  const handleViewDiscovery = (queryOrOptions = '') => {
    if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
      setDiscoverySearch(queryOrOptions.query || '');
      setDiscoveryInitial({
        initialCategory: queryOrOptions.initialCategory || null,
        initialMacroGroup: queryOrOptions.initialMacroGroup || null,
        initialPadFlow: queryOrOptions.initialPadFlow || null,
        initialPadPreference: queryOrOptions.initialPadPreference || null,
        initialPadUseCase: queryOrOptions.initialPadUseCase || null,
        initialSymptom: queryOrOptions.initialSymptom || null,
      });
    } else {
      setDiscoverySearch(String(queryOrOptions || ''));
      setDiscoveryInitial(null);
    }
    setCurrentView('discovery');
  };
  const handleViewHowWeMakeMoney = () => setCurrentView('how-we-make-money');
  const handleViewHowItWorks = () => setCurrentView('how-it-works');
  const handleViewAbout = () => setCurrentView('about');
  const handleViewArticles = () => {
    setSelectedArticleId(null);
    setCurrentView('articles');
  };
  const handleViewArticle = (articleId) => {
    setSelectedArticleId(articleId);
    setCurrentView('articles');
  };
  const handleViewScreenings = () => setCurrentView('screenings');
  const handleViewOmitted = () => setCurrentView('omitted');
  const handleViewComparison = () => setCurrentView('comparison');
  const handleViewRecalls = () => setCurrentView('recalls');
  const handleViewDoctorPrep = () => setCurrentView('doctor-prep');
  const navigateHome = () => {
    setDiscoverySearch('');
    setCurrentView('welcome');
  };

  const handleQuizComplete = async (results) => {
    const completedResults = {
      ...results,
      personalizationCompleted: true,
      personalizationCompletedAt: new Date().toISOString(),
    };
    if (!user) {
      setPendingQuizResults(completedResults);
      setPendingAction('quiz-complete'); pendingActionRef.current = 'quiz-complete';
      setShowAuthModal(true);
      return;
    }
    setQuizResults(completedResults);
    const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(completedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    const instantProducts = Object.keys(mergedProducts || {}).length
      ? mergedProducts
      : Object.fromEntries(
          getRecommendations(completedResults, healthProfile)
            .slice(0, 6)
            .map((product) => [product.id, product])
        );
    setMyProducts(instantProducts);
    setEcosystemOrder(Object.keys(instantProducts));
    llmBuiltThisSessionRef.current = false;
    clearCachedLlmRecommendations();
    try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
    const supabase = getSupabaseClient();
    // Local reset is immediate; remote sync is best-effort and never blocks build.
    if (supabase && user) await resetRemoteEcosystemBestEffort(supabase, user.id);
    posthog.capture('intake_completed', {
      concernsCount: Array.isArray(completedResults.primaryConcerns) ? completedResults.primaryConcerns.length : 0,
      conditionsCount: Array.isArray(completedResults.conditions) ? completedResults.conditions.length : 0,
    });
    setCurrentView('ecosystem');
  };

  const handleHealthProfileEditorSave = async (updatedResults) => {
    if (!updatedResults) {
      setCurrentView('ecosystem');
      return;
    }
    setQuizResults(updatedResults);
    const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(updatedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    const instantProducts = Object.keys(mergedProducts || {}).length
      ? mergedProducts
      : Object.fromEntries(
          getRecommendations(updatedResults, healthProfile)
            .slice(0, 6)
            .map((product) => [product.id, product])
        );
    setMyProducts(instantProducts);
    setEcosystemOrder(Object.keys(instantProducts));
    llmBuiltThisSessionRef.current = false;
    clearCachedLlmRecommendations();
    try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
    const supabase = getSupabaseClient();
    // Local reset is immediate; remote sync is best-effort and never blocks build.
    if (supabase && user) await resetRemoteEcosystemBestEffort(supabase, user.id);
    setCurrentView('ecosystem');
  };

  const handleSwapEcosystemSeedProduct = (oldProductId, newProduct) => {
    setSaveError(null);
    const oldProduct = myProducts[oldProductId];
    const oldAlts = Array.isArray(oldProduct?._llmAlternatives) ? oldProduct._llmAlternatives : [];
    const newAlts = [
      oldProduct ? { ...oldProduct, _llmAlternatives: [], _llmConcern: '' } : null,
      ...oldAlts.filter(a => a?.id !== newProduct.id),
    ].filter(Boolean).slice(0, 3);
    const enriched = {
      ...newProduct,
      healthFunctions: newProduct.healthFunctions?.length ? newProduct.healthFunctions : (oldProduct?.healthFunctions || []),
      _llmConcern: newProduct._llmConcern || oldProduct?._llmConcern || '',
      _llmAlternatives: newAlts,
      _userSwapped: true, // survives cache reloads — never overwritten by handleBuildEcosystemFromLlm
    };
    setMyProducts((prev) => {
      const next = { ...prev };
      delete next[oldProductId];
      next[enriched.id] = enriched;
      return next;
    });
    // Replace old ID with new ID at the same position so card doesn't jump
    setEcosystemOrder(prev => prev.map(id => id === oldProductId ? enriched.id : id));
    setEcosystemSeedMeta((prev) => {
      const meta = prev[oldProductId];
      if (!meta) return prev;
      const n = { ...prev };
      delete n[oldProductId];
      n[enriched.id] = meta;
      return n;
    });
    // Persist swap to Supabase
    if (user) {
      const supabase = getSupabaseClient();
      if (oldProduct) upsertProductState(supabase, user.id, oldProduct, { inEcosystem: false, isTracked: false, isOmitted: false }).catch(e => reportSaveFailure('Could not save the swap', e));
      upsertProductState(supabase, user.id, enriched, { inEcosystem: true, isTracked: false, isOmitted: false }).catch(e => reportSaveFailure('Could not save the swap', e));
    }
  };

  const toggleCompare = (product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, product];
    });
  };

  const toggleTrackProduct = (product) => {
    setSaveError(null);
    const wasTracked = !!trackedProducts[product.id];
    setTrackedProducts(prev => {
      const next = { ...prev };
      if (wasTracked) delete next[product.id];
      else next[product.id] = product;
      return next;
    });
    if (user) {
      upsertProductState(getSupabaseClient(), user.id, product, {
        inEcosystem: !!myProducts[product.id],
        isTracked: !wasTracked,
        isOmitted: !!omittedProducts[product.id],
      }).catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  const toggleJoinWaitlist = (startup) => {
    setJoinedWaitlists(prev => {
      const next = { ...prev };
      if (next[startup.id]) delete next[startup.id];
      else next[startup.id] = startup;
      return next;
    });
  };

  const toggleMyProduct = (product) => {
    setSaveError(null);
    const wasIn = !!myProducts[product.id];
    setMyProducts(prev => {
      const next = { ...prev };
      if (wasIn) delete next[product.id];
      else next[product.id] = product;
      return next;
    });
    setEcosystemOrder(prev =>
      wasIn ? prev.filter(id => id !== product.id) : [...prev, product.id]
    );

    // Anything in your ecosystem is watched for recalls by default — that is
    // the promise the product page makes on the Add to ecosystem button, so it
    // has to be true without a second click. Removing from the ecosystem also
    // stops the monitoring, since nothing else asked for it.
    const nextTracked = !wasIn;
    setTrackedProducts(prev => {
      const next = { ...prev };
      if (nextTracked) next[product.id] = product;
      else delete next[product.id];
      return next;
    });

    if (!wasIn) {
      posthog.capture('product_added', { category: product.category, type: product.type });
    }
    if (user) {
      upsertProductState(getSupabaseClient(), user.id, product, {
        inEcosystem: !wasIn,
        isTracked: nextTracked,
        isOmitted: !!omittedProducts[product.id],
      }).catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  /** Save for later — the wishlist shown at the bottom of My Ecosystem. */
  const toggleSavedProduct = (product) => {
    setSaveError(null);
    const wasSaved = !!savedProducts[product.id];
    const next = { ...savedProducts };
    if (wasSaved) delete next[product.id];
    else next[product.id] = product;
    setSavedProducts(next);
    persistSavedProducts(next);
    if (!wasSaved) posthog.capture('product_saved_for_later', { category: product.category });
    if (user) {
      setSavedForUser(getSupabaseClient(), user.id, product, !wasSaved)
        .catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  const toggleOmitProduct = (product) => {
    setSaveError(null);
    const wasOmitted = !!omittedProducts[product.id];
    setOmittedProducts(prev => {
      const next = { ...prev };
      if (wasOmitted) delete next[product.id];
      else next[product.id] = product;
      return next;
    });
    if (!wasOmitted) {
      setTrackedProducts(curr => { const n = { ...curr }; delete n[product.id]; return n; });
      setMyProducts(curr => { const n = { ...curr }; delete n[product.id]; return n; });
    }
    if (user) {
      upsertProductState(getSupabaseClient(), user.id, product, {
        inEcosystem: wasOmitted ? !!myProducts[product.id] : false,
        isTracked: wasOmitted ? !!trackedProducts[product.id] : false,
        isOmitted: !wasOmitted,
      }).catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  const handleLlmRecommendationsLoaded = (recommendations) => {
    if (!hasCompletedPersonalization) return;
    if (!Array.isArray(recommendations) || recommendations.length === 0) return;
    if (user) {
      try {
        const memory = JSON.parse(localStorage.getItem('ayna_llm_learning_memory_v1') || 'null');
        if (memory) saveLearningMemoryForUser(getSupabaseClient(), user.id, memory).catch(console.error);
      } catch (_) {}
    }
  };

  const handleBuildEcosystemFromLlm = useCallback((products) => {
    setSaveError(null);
    if (!Array.isArray(products) || products.length === 0) return;
    llmBuiltThisSessionRef.current = true;
    const valid = products.filter(p => p?.id);
    const llmIdSet = new Set(valid.map(p => p.id));
    let manualIds = [];
    setMyProducts(prev => {
      // Preserve manually-added products (DB products without llmGenerated flag)
      // so navigating away and back doesn't wipe things like the Saalt steamer
      manualIds = Object.keys(prev).filter(id => {
        const p = prev[id];
        return p && (!p.llmGenerated && !p.intakeGenerated) || p?._userSwapped;
      });
      const manual = Object.fromEntries(manualIds.map(id => [id, prev[id]]));
      return { ...valid.reduce((acc, p) => { acc[p.id] = p; return acc; }, {}), ...manual };
    });
    setEcosystemOrder(() => [
      ...valid.map(p => p.id),
      ...manualIds.filter(id => !llmIdSet.has(id)),
    ]);
    const supabase = getSupabaseClient();
    if (supabase && user) {
      // One request per 100 products instead of one per product. The old
      // Promise.all fired up to ~50 individual POSTs, any subset of which could
      // fail independently; the .catch reported only the first rejection, so a
      // partially-saved ecosystem looked identical to a fully-saved one.
      upsertProductsBatch(supabase, user.id, valid, { inEcosystem: true, isTracked: false, isOmitted: false })
        .catch(e => reportSaveFailure('Could not save your ecosystem', e));
    }
  }, [user, reportSaveFailure]);

  // Cache of the exact product object last clicked, so the dedicated page can
  // render instantly without waiting on a lookup — a fresh LLM-generated
  // recommendation, for instance, may not be findable any other way until
  // its ecosystem write round-trips. A URL loaded directly (refresh, shared
  // link, browser back/forward) won't have this and falls back to
  // `resolvedProduct` below, which looks the id up from real state instead.
  const [lastClickedProduct, setLastClickedProduct] = useState(null);

  const omittedCount = Object.keys(omittedProducts).length;
  const ecosystemCount = Object.keys(myProducts).length;

  // The gradient nav shares one painted canvas with the hero below it, so it
  // has to know WHICH board's hero that is: 1a, 1c (returning) or 1j (About).
  // Declared here, below ecosystemCount, and not up with the other nav flags —
  // reading ecosystemCount before its `const` is a temporal dead zone error,
  // and && short-circuiting hid it from every signed-out check.
  const navGradientVariant = currentView === 'about'
    ? ' app-nav--about'
    : (user && ecosystemCount > 0) ? ' app-nav--returning' : '';
  const handleOpenProduct = (product) => {
    if (!product?.id) return;
    const p = product?.llmGenerated ? enrichLlmProductForDiscovery(product) : product;
    posthog.capture('product_card_opened', { category: p?.category });
    setLastClickedProduct(p);
    navigateToProduct(p.id);
  };

  // Resolves the product for the current /product/:id route. Checked in order:
  // the object from the click that navigated here (exact, no lookup needed);
  // the user's own ecosystem/saved/tracked/omitted state (covers LLM-generated
  // and custom products, which never live in the static catalog); then the
  // catalog itself. Returns null while state that might contain the product
  // (auth, ecosystem load) is still loading, so the page can show a loading
  // state instead of a premature "not found".
  const resolvedProduct = useMemo(() => {
    if (!productRouteId) return null;
    if (lastClickedProduct?.id === productRouteId) return lastClickedProduct;
    const raw = myProducts[productRouteId]
      || savedProducts[productRouteId]
      || trackedProducts[productRouteId]
      || omittedProducts[productRouteId]
      || getProductById(productRouteId);
    if (!raw) return null;
    return raw.llmGenerated ? enrichLlmProductForDiscovery(raw) : raw;
  }, [productRouteId, lastClickedProduct, myProducts, savedProducts, trackedProducts, omittedProducts]);
  const productStillResolving = !resolvedProduct && (authLoading || dataLoading);

  // Every route showed the identical generic <title> from index.html — no
  // way to tell tabs apart, bookmark a specific page, or get a useful link
  // preview when sharing (found live, 2026-08-24 bug bash). One page,
  // dynamic title per route/product instead.
  useEffect(() => {
    const base = "Ayna | Personalized Women's Health Product Recommendations";
    if (currentView === 'product') {
      document.title = resolvedProduct?.name
        ? `${resolvedProduct.name} | Ayna`
        : (productStillResolving ? 'Loading… | Ayna' : base);
      return;
    }
    const label = VIEW_TITLES[currentView];
    document.title = label ? `${label} | Ayna` : base;
  }, [currentView, resolvedProduct, productStillResolving]);

  const handleRateProduct = (product, rating) => {
    const next = addRating(product.id, rating);
    setAynaReviews(next);
    if (user && next[product.id]) {
      upsertProductReviews(getSupabaseClient(), user.id, product.id, next[product.id]).catch(e => reportSaveFailure('Could not save your review', e));
    }
  };

  const handleReviewProduct = (product, text) => {
    const next = addReview(product.id, text);
    setAynaReviews(next);
    if (user && next[product.id]) {
      upsertProductReviews(getSupabaseClient(), user.id, product.id, next[product.id]).catch(e => reportSaveFailure('Could not save your review', e));
    }
  };


  return (
    <div className="app-container">
      {/* Shared fixed stacking wrapper for top-of-viewport status rows, so the
          save-error banner and the ecosystem-generation bar stack instead of
          overlapping if both are showing at once — neither sets its own
          position:fixed any more. */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000 }}>
        {/* Persistence failures were previously console-only, so the UI always
            looked like the success state. A user could curate for 20 minutes on a
            flaky connection, see a perfect screen, and lose everything on reload. */}
        {saveError && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2', borderBottom: '1px solid #FECACA',
              color: '#991B1B', padding: '0.7rem 1rem', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            }}
          >
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}
            >×</button>
          </div>
        )}
        <EcosystemGenerationBar intakeFingerprint={ecosystemIntakeFingerprint} onViewEcosystem={handleViewEcosystem} hasEcosystem={ecosystemCount > 0} />
      </div>
      <main>
        <div style={{ position: 'relative', zIndex: 1001 }}>
        <nav
          className={`app-nav ${navOnGradient ? `app-nav--landing${navGradientVariant}` : 'app-nav--cream'}${isScrolled ? ' app-nav--scrolled' : ''}`}
          aria-label="Primary"
        >
          <div className="app-nav__brand">
            <div
              className="app-nav__logo"
              role="button"
              tabIndex={0}
              onClick={navigateHome}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateHome(); } }}
            >
              ayna
              <span className="app-nav__beta-badge">beta</span>
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
          </div>

          {/* Exactly three primary concepts, per spec: ayna (logo, above) · My
              Ecosystem · Browse. Brands / My Health Library / About Us are real
              routes still, just relocated to the footer's secondary nav. */}
          <div className="app-nav__links desktop-only">
            <button
              className={`app-nav__tab ${ECOSYSTEM_NAV_VIEWS.includes(currentView) ? 'app-nav__tab--active' : ''}`}
              onClick={() => handleViewEcosystem()}
            >
              My Ecosystem
              {ecosystemCount > 0 && (
                <span className="nav-ecosystem__pill" style={{ marginLeft: '0.4rem' }}>{ecosystemCount}</span>
              )}
            </button>
            <button
              className={`app-nav__tab ${(currentView === 'discovery' || currentView === 'hero') ? 'app-nav__tab--active' : ''}`}
              onClick={() => handleViewDiscovery('')}
            >
              Browse
            </button>
          </div>

          {/* Account stays a subtle utility; primary navigation is only Ayna, My Ecosystem and Browse. */}
          <div className="app-nav__actions desktop-only">
            <button
              type="button"
              className="app-nav__circle app-nav__circle--wishlist"
              onClick={handleViewWishlist}
              aria-label={`Wishlist${Object.keys(savedProducts || {}).length ? ` (${Object.keys(savedProducts || {}).length})` : ''}`}
              title="Wishlist"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="app-nav__wishlist-icon">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
              {Object.keys(savedProducts || {}).length > 0 && (
                <span className="app-nav__wishlist-count">{Object.keys(savedProducts || {}).length}</span>
              )}
            </button>
            <div ref={accountMenuRef} className="app-nav__account">
              <button
                type="button"
                className={`app-nav__circle app-nav__circle--account ${user ? 'app-nav__circle--avatar' : ''}`}
                onClick={() => setShowAccountMenu(v => !v)}
                aria-haspopup="menu"
                aria-expanded={showAccountMenu}
                aria-label="Account"
                title={user ? user.email : 'Account'}
              >
                {user ? accountInitials : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="app-nav__account-icon">
                    <circle cx="12" cy="8" r="3.25" />
                    <path d="M5.8 19c.7-3.5 3-5.3 6.2-5.3s5.5 1.8 6.2 5.3" />
                  </svg>
                )}
                {checkinDue && <span className="app-nav__circle-dot" aria-hidden />}
              </button>
              {showAccountMenu && (
                <div className="nav-account-menu">
                  {user && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                      {user.email}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowAccountMenu(false); setShowCheckin(true); }}
                    title={checkinDue ? "It's been a month — a quick check-in helps keep your recommendations current." : undefined}
                  >
                    Check-in
                  </button>
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { getSupabaseClient()?.auth.signOut(); setShowAccountMenu(false); }}
                      >
                        Log out
                      </button>
                      <button
                        type="button"
                        className="nav-account-menu__muted"
                        onClick={() => { setShowDeleteModal(true); setShowAccountMenu(false); }}
                      >
                        Delete account
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        setPendingAction('login'); pendingActionRef.current = 'login';
                        setShowAuthModal(true);
                      }}
                    >
                      Log in
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
            <button className="mobile-drawer-item" onClick={() => { handleViewEcosystem(); setMobileMenuOpen(false); }}>
              My Ecosystem {ecosystemCount > 0 && <span className="nav-ecosystem__pill">{ecosystemCount}</span>}
            </button>
            <button className="mobile-drawer-item" onClick={() => { handleViewDiscovery(''); setMobileMenuOpen(false); }}>Browse</button>
            <button className="mobile-drawer-item" onClick={() => { handleViewWishlist(); setMobileMenuOpen(false); }}>
              Wishlist {Object.keys(savedProducts || {}).length > 0 ? `(${Object.keys(savedProducts || {}).length})` : ''}
            </button>
            {user ? (
              <>
                <button className="mobile-drawer-item" onClick={() => { getSupabaseClient()?.auth.signOut(); setMobileMenuOpen(false); }}>Log out</button>
                <button className="mobile-drawer-item" onClick={() => { setShowDeleteModal(true); setMobileMenuOpen(false); }} style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Delete account</button>
              </>
            ) : (
              <button className="mobile-drawer-item" onClick={() => { setPendingAction('login'); pendingActionRef.current = 'login'; setShowAuthModal(true); setMobileMenuOpen(false); }}>Log in</button>
            )}
          </div>
        )}
        </div>

        {(currentView === 'welcome' || currentView === 'hero') && (
          <AynaLanding
            onStartQuiz={handleStartQuiz}
            onViewDiscovery={handleViewDiscovery}
            onOpenProduct={handleOpenProduct}
            onViewEcosystem={handleViewEcosystem}
            user={user}
            myProducts={myProducts}
            ecosystemCount={ecosystemCount}
            hasProfile={!!quizResults}
            profileCategories={landingProfileCategories}
            recommendedProductIds={recommendedProductIds}
          />
        )}
        {currentView === 'quiz' && (
          <HealthIntakeForm onComplete={handleQuizComplete} />
        )}
        {currentView === 'profile-edit' && (
          <HealthProfileEditor
            currentProfile={quizResults}
            onSave={handleHealthProfileEditorSave}
            onCancel={() => setCurrentView('ecosystem')}
            onOpenPhoneVerify={handleOpenPhoneVerification}
          />
        )}
        {currentView === 'phone-verify' && (
          <PhoneVerification
            userSession={userSession}
            onVerified={() => setCurrentView('ecosystem')}
            onCancel={() => setCurrentView('ecosystem')}
          />
        )}
        {currentView === 'recommendations' && (
          <Recommendations
            results={quizResults}
            onRetake={handleStartQuiz}
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            myProducts={myProducts}
            toggleMyProduct={toggleMyProduct}
            omittedProducts={omittedProducts}
            toggleOmitProduct={toggleOmitProduct}
            onOpenProduct={handleOpenProduct}
            healthProfile={healthProfile}
            userZipCode={userZipCode}
            onZipCodeChange={handleZipCodeChange}
          />
        )}
        {currentView === 'tracked' && (
          <TrackedItems
            trackedProducts={trackedProducts}
            joinedWaitlists={joinedWaitlists}
            onViewWaitlist={handleViewWaitlist}
            userZipCode={userZipCode}
            onZipCodeChange={handleZipCodeChange}
            checkinData={checkinData}
            quizResults={quizResults}
            myProducts={myProducts}
            onOpenProduct={handleOpenProduct}
            omittedProducts={omittedProducts}
            onViewOmitted={handleViewOmitted}
            onHealthProfileUpdate={updateHealthProfile}
            healthProfile={healthProfile}
            onEditHealthProfile={handleOpenHealthProfileEditor}
          />
        )}
        {currentView === 'waitlist' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <BrandPartners
              onOpenProduct={handleOpenProduct}
              myProducts={myProducts}
              onAddToEcosystem={toggleMyProduct}
            />
          </Suspense>
        )}
        {currentView === 'articles' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Articles initialArticleId={selectedArticleId} onOpenProduct={handleOpenProduct} quizResults={quizResults} healthProfile={healthProfile} />
          </Suspense>
        )}
        {currentView === 'privacy-policy' && (
          <PrivacyPolicy onBack={() => window.history.back()} />
        )}
        {currentView === 'terms-of-use' && (
          <TermsOfUse onBack={() => window.history.back()} />
        )}
        {currentView === 'how-we-make-money' && (
          <HowWeMakeMoney onBack={() => window.history.back()} />
        )}
        {currentView === 'how-it-works' && (
          <HowItWorks
            onBack={() => window.history.back()}
            onViewSources={handleViewArticles}
          />
        )}
        {currentView === 'about' && (
          <About onBack={() => window.history.back()} onViewSources={handleViewArticles} />
        )}
        {currentView === 'auth-callback' && (
          <AuthCallback onAuthenticated={(user) => {
            setUser(user);
            setCurrentView('welcome');
          }} />
        )}
        {currentView === 'confirmed' && (
          <EmailConfirmed onAuthenticated={(user) => {
            setUser(user);
            setCurrentView('welcome');
          }} />
        )}
        {currentView === 'ecosystem' && dataLoading && Object.keys(myProducts).length === 0 && (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Loading your ecosystem…
          </div>
        )}
        {/* The bubble hero + shelves used to render here as two alternate
            App.jsx-level views (an "Ecosystem / Shelves" toggle) ABOVE
            MyEcosystem's own internal overview — two separate "your
            ecosystem" headers stacked on the same page. MyEcosystem now
            renders both combined (board 2a), so this toggle is gone rather
            than becoming a third, redundant copy. */}
        {currentView === 'ecosystem' && (
          <Suspense fallback={<ViewLoadingFallback />}>
          <MyEcosystem
            myProducts={myProducts}
            ecosystemOrder={ecosystemOrder}
            onToggleProduct={toggleMyProduct}
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            toggleOmitProduct={toggleOmitProduct}
            omittedProducts={omittedProducts}
            onOpenProduct={handleOpenProduct}
            onOpenDoctorPrep={() => setCurrentView('doctor-prep')}
            onBuildEcosystem={handleStartQuiz}
            onEditHealthProfile={handleOpenHealthProfileEditor}
            onOpenPhoneVerify={handleOpenPhoneVerification}
            quizResults={quizResults}
            healthProfile={healthProfile}
            userZipCode={userZipCode}
            onZipCodeChange={handleZipCodeChange}
            ecosystemSeedMeta={ecosystemSeedMeta}
            onSwapSeedProduct={handleSwapEcosystemSeedProduct}
            onGoToSearch={(queryOrOptions) => handleViewDiscovery(queryOrOptions || '')}
            onHealthProfileUpdate={updateHealthProfile}
            onViewRecommendedArticles={handleViewArticles}
            onOpenArticle={(articleId) => {
              setSelectedArticleId(articleId);
              setCurrentView('articles');
            }}
            onLlmRecommendationsLoaded={handleLlmRecommendationsLoaded}
            onBuildEcosystemFromLlm={handleBuildEcosystemFromLlm}
            user={user}
            userSession={userSession}
            isPremium={user?.app_metadata?.is_premium === true}
          />
          </Suspense>
        )}
        {currentView === 'ecosystem' && (
          <SavedForLater
            savedProducts={savedProducts}
            onOpenProduct={handleOpenProduct}
            onToggleSaved={toggleSavedProduct}
            onAddToEcosystem={toggleMyProduct}
            myProducts={myProducts}
            onBrowse={() => handleViewDiscovery('')}
          />
        )}
        {currentView === 'discovery' && (
          <Suspense fallback={<ViewLoadingFallback />}>
          <Discovery
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            myProducts={myProducts}
            onToggleProduct={toggleMyProduct}
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
            omittedProducts={omittedProducts}
            initialCategory={discoveryInitial?.initialCategory}
            initialMacroGroup={discoveryInitial?.initialMacroGroup}
            initialPadFlow={discoveryInitial?.initialPadFlow}
            initialPadPreference={discoveryInitial?.initialPadPreference}
            initialPadUseCase={discoveryInitial?.initialPadUseCase}
            initialSymptom={discoveryInitial?.initialSymptom}
            toggleOmitProduct={toggleOmitProduct}
            setCurrentView={setCurrentView}
            onOpenProduct={handleOpenProduct}
            initialSearch={discoverySearch}
            recommendedProductIds={recommendedProductIds}
            aynaReviews={aynaReviews}
            savedProducts={savedProducts}
            onToggleSaved={toggleSavedProduct}
            hasQuizFrustrations={!!(quizResults?.frustrations?.length)}
            hasHealthImport={hasHealthImport}
            quizResults={quizResults}
            healthProfile={healthProfile}
            user={user}
            onRequirePersonalizeAuth={handleRequirePersonalizeAuth}
          />
          </Suspense>
        )}
        {currentView === 'screenings' && (
          <Screenings checkinData={checkinData} onNavigate={setCurrentView} onOpenProduct={handleOpenProduct} />
        )}
        {currentView === 'omitted' && (
          <OmittedProducts omittedProducts={omittedProducts} toggleOmitProduct={toggleOmitProduct} />
        )}
        {currentView === 'recalls' && (
          <Recalls trackedProducts={trackedProducts} myProducts={myProducts} />
        )}
        {currentView === 'comparison' && (
          <Comparison
            compareList={compareList}
            onRemove={toggleCompare}
            onClear={() => setCompareList([])}
            CATEGORY_LABELS={CATEGORY_LABELS}
            myProducts={myProducts}
            onBrowseProducts={() => handleViewDiscovery('')}
            onAddToCompare={toggleCompare}
          />
        )}
        {currentView === 'doctor-prep' && (
          <DoctorPrep
            checkinData={checkinData}
            myProducts={myProducts}
            quizResults={quizResults}
            chatHistory={chatHistory}
            onBack={() => setCurrentView('ecosystem')}
          />
        )}

        {showCheckin && (
          <MonthlyCheckin
            onComplete={(answers) => {
              setCheckinData(answers);
              const now = new Date().toISOString();
              setCheckinCompletedAt(now);
              try { if (typeof window !== 'undefined') localStorage.setItem('ayna_checkin_completed_at', now); } catch (_) {}
            }}
            onClose={() => {
              setShowCheckin(false);
              if (checkinUpdatedProfile) {
                setCurrentView('tracked');
                setCheckinUpdatedProfile(false);
              }
            }}
            currentProfile={quizResults}
            onProfileUpdate={(updated) => {
              setQuizResults(updated);
              setCheckinUpdatedProfile(true);
              // Previously this only ever updated in-memory state — a real
              // check-in change (e.g. adding "Painful cramps") showed the
              // right confirmation, then silently vanished on reload,
              // because nothing was ever sent to the backend (found live,
              // 2026-08-24 bug bash). `frustrations` on the legacy profile
              // shape is DERIVED (mapIntakeToLegacyQuizProfile computes it
              // from the raw intake's own fields, e.g. `symptoms`), so it
              // can't be persisted by writing it back directly — instead,
              // append whatever's newly added to customConcerns, the same
              // free-text path the quiz itself uses (inferFrustrationsFrom-
              // FreeTextConcerns), so it re-derives the same frustration on
              // every future load, not just this session. Every value
              // MonthlyCheckin's FOCUS_TO_FRUSTRATION can actually produce
              // ("Heavy flow," "Painful cramps," "Hormonal bloating,"
              // "Irregular cycles," "Recurrent UTIs") already contains the
              // keyword that inference looks for in its own label text.
              const rawIntake = updated?.fullHealthIntake || {};
              const priorConcerns = Array.isArray(rawIntake.customConcerns) ? rawIntake.customConcerns : [];
              const priorFrustrations = quizResults?.frustrations || [];
              const newlyAdded = (updated.frustrations || []).filter((f) => !priorFrustrations.includes(f));
              if (newlyAdded.length) {
                const nextIntake = { ...rawIntake, customConcerns: [...priorConcerns, ...newlyAdded] };
                saveHealthIntakeForCurrentUser(nextIntake).catch((e) => reportSaveFailure('Could not save your check-in', e));
              }
            }}
          />
        )}

        {quizResults && (
          <ProfileChatbot
            profile={quizResults}
            user={user}
            onProfileUpdate={setQuizResults}
            chatHistory={chatHistory}
            onChatHistoryUpdate={setChatHistory}
            disabled={!quizResults}
            onNavigateToDiscovery={handleViewDiscovery}
            onViewRecommendations={() => setCurrentView('recommendations')}
          />
        )}

        {currentView === 'product' && (
          resolvedProduct ? (
            // Keying by id forces a clean remount when navigating from one
            // product's page straight to another's — every internal tab,
            // the Summary/Evidence toggle, and the chat thread reset to that
            // product's own defaults instead of carrying the previous
            // product's state over.
            <ProductModal
              key={resolvedProduct.id}
              product={resolvedProduct}
              isTracked={!!trackedProducts[resolvedProduct.id]}
              onTrack={toggleTrackProduct}
              onOmit={toggleOmitProduct}
              isOmitted={!!omittedProducts[resolvedProduct.id]}
              onToggleCompare={toggleCompare}
              isInCompare={compareList.some(p => p.id === resolvedProduct.id)}
              onAddToEcosystem={toggleMyProduct}
              isInEcosystem={!!myProducts[resolvedProduct.id]}
              onToggleSaved={toggleSavedProduct}
              isSaved={!!savedProducts[resolvedProduct.id]}
              userZipCode={userZipCode || undefined}
              aynaReviews={aynaReviews}
              onRate={handleRateProduct}
              onReview={handleReviewProduct}
              quizResults={quizResults}
              healthProfile={healthProfile}
              ecosystemProducts={Object.values(myProducts)}
              user={user}
              userSession={userSession}
              onOpenProduct={handleOpenProduct}
              onBack={handleBackFromProduct}
            />
          ) : productStillResolving ? (
            <ViewLoadingFallback />
          ) : (
            <NotFoundState
              title="Product not found"
              subtitle="This product may have been removed, or the link may be incorrect."
              ctaLabel="Browse products"
              onCta={() => handleViewDiscovery('')}
            />
          )
        )}
        {currentView === 'not-found' && (
          <NotFoundState
            title="Page not found"
            subtitle="That link may be broken, or the page may have moved."
            ctaLabel="Go to homepage"
            onCta={() => setCurrentView('welcome')}
          />
        )}

        {showDeleteModal && (
          <div
            onClick={() => setShowDeleteModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(28,25,23,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem',
                maxWidth: '420px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.4rem', lineHeight: 1, color: 'var(--color-text-muted)',
                  padding: '0.1rem 0.3rem',
                }}
              >×</button>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Delete account
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                To request deletion of your entire account and data, email{' '}
                <a
                  href="mailto:hello@ayna.com?subject=Account%20Deletion%20Request"
                  style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '500' }}
                >
                  hello@ayna.com
                </a>
                {' '}from the email address associated with your account.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                This request will be processed within <strong style={{ color: 'var(--color-text-main)' }}>1 week</strong>.
              </p>
            </div>
          </div>
        )}

        {showAuthModal && (
          <AuthGate
            isModal
            context={pendingAction === 'quiz-complete' ? 'quiz' : pendingAction === 'browse' ? 'browse' : pendingAction === 'personalize' ? 'personalize' : pendingAction === 'login' ? 'login' : undefined}
            onBeforeOAuthRedirect={pendingAction === 'quiz-complete' && pendingQuizResults ? () => {
              try { sessionStorage.setItem('ayna_pending_quiz_results', JSON.stringify(pendingQuizResults)); } catch (_) {}
            } : undefined}
            onSkip={() => {
              setShowAuthModal(false);
              if (pendingAction === 'quiz-complete' && pendingQuizResults) {
                setQuizResults(pendingQuizResults);
                const { seedMeta } = getEcosystemSeedFromQuiz(pendingQuizResults, healthProfile);
                setEcosystemSeedMeta(seedMeta);
                setCurrentView('ecosystem');
                setPendingQuizResults(null);
              } else if (pendingAction === 'browse') {
                handleViewDiscovery('');
              }
              setPendingAction(null); pendingActionRef.current = null;
            }}
          />
        )}
      </main>
      <SiteFooter
          onViewHowItWorks={handleViewHowItWorks}
          onViewAbout={handleViewAbout}
          onViewDiscovery={handleViewDiscovery}
          onViewWaitlist={handleViewWaitlist}
          onViewArticles={handleViewArticles}
          onViewPrivacyPolicy={() => setCurrentView('privacy-policy')}
          onViewTermsOfUse={() => setCurrentView('terms-of-use')}
        onViewHowWeMakeMoney={handleViewHowWeMakeMoney}
      />
    </div>
  );
}

export default App;
