import { useEffect, useMemo, useRef, useState } from 'react';
import './mobile.css';
import './editorial.css';
import './fresh.css';
import './figma.css';
import './cabinet.css';
import './reference-system.css';
import './tokens.css';
import './app-play.css';
import './no-focus-ring.css';
import { ALL_PRODUCTS, getEcosystemAlternatives, getEcosystemSeedFromQuiz, filterPrescriptionCareGate, hydrateCatalogProduct, getSelectedNeeds } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { loadProductCatalog } from '../utils/productCatalog.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadEcosystemForUser, upsertProductState, upsertProductsBatch, clearEcosystemForUser } from '../utils/ecosystemStore.js';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser, clearHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { behaviorFrom } from '../utils/matchDisplay.js';
import { ARTICLES } from '../components/Articles.jsx';
import { rankReadsForProfile, readFitsStage } from './utils/personalReads.js';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';
import { usePushNotifications } from './hooks/usePushNotifications.js';
import { useHealthData, DEV_HEALTH_DEMO } from './hooks/useHealthData.js';
import { useTextSize } from './hooks/useTextSize.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { useSupabaseAuth, MOBILE_OAUTH_PENDING_KEY } from './hooks/useSupabaseAuth.js';
import { fetchNotificationPreferences } from './utils/notificationPreferencesApi.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';
import { getNextArticle } from './utils/nextArticle.js';
import { INTAKE_DRAFT_KEY, getIntakeSteps, isStepAnswered, reconstructIntakeFromSnapshot } from './data/intakeModel.js';
import { clearIntakeDraft, readDraftProgress } from './data/quizDraftProgress.js';
import FinishQuizCard from '../components/FinishQuizCard.jsx';
import MobileTabBar from './components/MobileTabBar.jsx';
import AskAynaModal from './components/AskAynaModal.jsx';
import ProfileFlow, { AboutAynaScreen } from './screens/profile/ProfileFlow.jsx';

import LandingScreen from './screens/LandingScreen.jsx';
import BrowseScreen from './screens/BrowseScreen.jsx';
import ProductDetailScreen from './screens/ProductDetailScreen.jsx';
import ArticleDetailScreen from './screens/ArticleDetailScreen.jsx';
import EcosystemIntroScreen from './screens/EcosystemIntroScreen.jsx';
import IntakeScreen from './screens/IntakeScreen.jsx';
import BuildingScreen from './screens/BuildingScreen.jsx';
import RevealScreen from './screens/RevealScreen.jsx';
import SigninScreen from './screens/SigninScreen.jsx';
import NewAccountStart from '../components/NewAccountStart.jsx';
import { markOAuthSource, takeOAuthSource, shouldOfferEcosystemStart } from '../utils/oauthNewAccount.js';
import EcosystemScreen from './screens/EcosystemScreen.jsx';
import EcosystemResetDialog from './components/EcosystemResetDialog.jsx';
import SavedScreen from './screens/SavedScreen.jsx';
import WhyMatchScreen from './screens/WhyMatchScreen.jsx';
import LibraryScreen from './screens/LibraryScreen.jsx';
import { AskContext } from './askContext.js';
import MonthlyCheckinScreen from './screens/MonthlyCheckinScreen.jsx';
import CommunityScreen from './screens/CommunityScreen.jsx';
import QuizConnectScreen from './screens/QuizConnectScreen.jsx';
import PlanScreen from './screens/PlanScreen.jsx';
import { healthMatchContext } from '../health/matchContext.js';
import { addNeedToAnswers } from '../matching/addNeed.js';
import * as communityStore from '../utils/community/communityStore.js';
import { uploadCommunityImage, deleteCommunityImage } from '../utils/community/imageUpload.js';
import { makePlaylistCoverFile } from './components/playlistCoverImage.js';
// Launch-audit overrides; imported last so it loads after every screen's CSS.
import './audit-app.css';
// "A tiny bit smaller" density pass; after audit-app.css so it wins ties.
import './app-density.css';
// Brand theme (Oct 17): butter, espresso, sky, rose; imported last so it wins.
import './app-theme.css';
import './app-components.css';
import './app-screens.css';
import './app-web.css';
import './app-design.css';
import './app-polish.css';
import './app-landing.css';
import './app-health.css';
import './app-ux-fixes.css';
import './app-compact.css';
import './keyboardModality.js';

// Same real fallback chain used everywhere on desktop (App.jsx's
// accountMonogram, Hero.jsx's displayNameFromUser, EcosystemBubbles.jsx,
// ProfileChatbot.jsx), first_name is what OUR OWN email/password signup
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
  community: CommunityScreen,
  checkin: MonthlyCheckinScreen,
  library: LibraryScreen,
  connect: QuizConnectScreen,
  plan: PlanScreen,
};

// Same catalog desktop's Discovery page browses: prescription-only items
// without a care path excluded (Ayna doesn't sell/dispense prescriptions
// see Discovery.jsx), released startups folded in as ordinary products
// (unreleased ones stay Startups-hub-only), plus any live "discovered"
// products from /api/products that aren't in the bundled catalog yet (see
// productCatalog.js's migration-state comment, the API is meant to
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

// No single brand should crowd out the rest of the ecosystem/orbit, keeps
// at most this many products per brand, in whatever order they were ranked,
// so the highest-relevance picks for every other brand still get a seat.
const MAX_PRODUCTS_PER_BRAND = 2;

function brandKeyForProduct(product) {
  if (product?.brand) return String(product.brand).trim().toLowerCase();
  // Most entries in this catalog don't carry an explicit `brand` field, but
  // product names are consistently "Brand Product Line ...", the first
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
// go through getPersonalizedProductIds, which only requires percent > 0
// that function's own doc comment in products.js admits this is "close to
// a no-op (nearly every product qualifies)". That's exactly why the mobile
// ecosystem was over-populating with weak, single-preference-tag matches:
// there was no real quality bar. MIN_ECOSYSTEM_MATCH_PERCENT is that bar
// a lone preference-tag overlap scores well under it, while a genuine
// concern-tag match clears it comfortably (see getProductRelevanceStats's
// weights), so the ecosystem now reflects real relevance, not "any overlap
// at all". resolveEcosystemProductArea is the real product -> pillar-area
// matcher (keyword + category scanning) that EcosystemOrbit's contract has
// always deferred to rather than reimplementing.
//
// Capped per brand (see capProductsPerBrand) AFTER ranking so the ecosystem
//, and every per-area seat within it, since each seat's product list is a
// subset of this same array, stays a variety of brands instead of one
// brand's whole catalog crowding everything else out.
function seedEcosystemFromAnswers(quizAnswers, matchOpts) {
  // One shelf per selected need from the matching engine (quantity per need,
  // never lower quality to fill a shelf). matchOpts carries "Not for me".
  const { mergedProducts, seedMeta } = getEcosystemSeedFromQuiz(quizAnswers, null, matchOpts);
  return capProductsPerBrand(Object.values(mergedProducts || {}).map((p) => {
    const area = resolveEcosystemProductArea(p, REAL_ECOSYSTEM_AREAS);
    return { ...p, areaKey: area ? area.key : null, needId: seedMeta?.[p.id]?.needId || null };
  }));
}

// Which quiz-end step (connect / plan) this tab was on, so a full-page sign-in
// redirect (Oura, WHOOP, Google, Apple) comes back to it. Tab-only storage.
const QUIZ_STEP_KEY = 'ayna_quiz_step';
const DEV_DEMO_USER = import.meta.env.DEV ? { id: 'dev-health-demo', email: 'demo@localhost', user_metadata: { full_name: 'Demo' } } : null;
function quizStepToResume() {
  try { const v = sessionStorage.getItem(QUIZ_STEP_KEY); return ['connect', 'plan'].includes(v) ? v : null; } catch { return null; }
}

function hasSavedIntakeDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('ayna_intake_draft_v1') || 'null');
    return draft?.version === 1 && !!draft.intake;
  } catch { return false; }
}

export default function MobileApp() {
  const { session, update: updateSession, reset: resetSession } = useEcosystemSession();
  const { hasEcosystem, myProducts: storedProducts, lastQuizAnswers, userName, omittedProducts = {} } = session;
  const myProducts = useMemo(() => storedProducts.map(hydrateCatalogProduct), [storedProducts]);
  // The welcome screen is the signed-out entry point. Returning accounts
  // move into their ecosystem once auth finishes restoring their session.
  const [screen, setScreen] = useState(() => (import.meta.env.DEV && new URLSearchParams(window.location.search).get('screen'))
    // Answers waiting on the quiz-end steps always come back there (after a
    // provider or Google sign-in redirect, a refresh, or the app relaunching),
    // so they are never stranded.
    || (session.pendingQuiz ? quizStepToResume() || 'connect' : null)
    || (!hasEcosystem && hasSavedIntakeDraft() ? 'ecointro' : 'landing'));
  const [ecoTab, setEcoTab] = useState('products');
  const [planAddedGoals, setPlanAddedGoals] = useState({});
  const [hasIntakeDraft, setHasIntakeDraft] = useState(hasSavedIntakeDraft);
  // Product/article detail render as an overlay ON TOP of whichever base
  // screen (Browse, My Ecosystem, Saved) is currently mounted, instead of
  // replacing it`screen` never changes when one opens. That's what makes
  // "back" free: the underlying screen was never unmounted, so its own
  // state (search text, personalized toggle, scroll position, infinite-
  // scroll pagination) is exactly as the user left it, not reset to a
  // fresh mount. Closing the overlay just reveals it again.
  const [overlay, setOverlay] = useState(() => { const t = import.meta.env.DEV && new URLSearchParams(window.location.search).get('overlay'); return t ? { type: t } : null; }); // { type: 'product' | 'article', item }
  const [readArticleIds, setReadArticleIds] = useState([]);
  // How far each read has been scrolled (0–1). Per-device convenience, so localStorage is fine.
  const [readProgress, setReadProgress] = useState(() => { try { return JSON.parse(localStorage.getItem('ayna_read_progress_v1') || '{}') || {}; } catch { return {}; } });
  const recordReadProgress = (id, value) => setReadProgress((prev) => {
    const v = Math.round(Math.min(1, value) * 20) / 20;
    if (!id || (prev[id] || 0) >= v) return prev;
    const next = { ...prev, [id]: v };
    try { localStorage.setItem('ayna_read_progress_v1', JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  });
  const [intakeMode, setIntakeMode] = useState('new');
  const [ecosystemNotice, setEcosystemNotice] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingEcosystem, setResettingEcosystem] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [authPrompt, setAuthPrompt] = useState(null);
  const authReturnScreenRef = useRef('landing');
  const authResumeRef = useRef(null);
  const [communitySeed, setCommunitySeed] = useState(null);
  // Shared playlist invite (?join-playlist=<code>): keep the code through
  // sign-in, drop it from the address bar, and open Community, which joins.
  useEffect(() => {
    let code = null;
    try { code = communityStore.parsePlaylistInviteCode(new URLSearchParams(window.location.search).get('join-playlist')); } catch { code = null; }
    if (!code) return;
    try { sessionStorage.setItem('ayna_pending_playlist_invite', code); } catch { /* storage blocked: join still runs this session */ }
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('join-playlist');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* leave the URL */ }
    setCommunitySeed({ token: Date.now() });
    setScreen('community');
  }, []);
  const swipeStart = useRef(null);
  const handleMainTouchStart = (event) => {
    if (overlay || !['browse', 'eco'].includes(screen) || event.touches.length !== 1) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable="true"], [data-no-page-swipe]')) return;
    swipeStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const handleMainTouchEnd = (event) => {
    if (!swipeStart.current || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - swipeStart.current.x;
    const dy = event.changedTouches[0].clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 85 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (screen === 'eco' && dx < 0) { setBrowseQuery(''); setScreen('browse'); }
    if (screen === 'browse' && dx > 0 && hasEcosystem) setScreen('eco');
  };
  const { user: realAuthUser, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();
  // DEVELOPMENT ONLY: a stand-in signed-in user for the ?healthdemo=1 preview. Never in production.
  const authUser = realAuthUser || (DEV_HEALTH_DEMO ? DEV_DEMO_USER : null);
  const [loadedAccountId, setLoadedAccountId] = useState(null);
  useEffect(() => {
    if (authLoading || !authUser || screen !== 'landing') return;
    Promise.resolve().then(() => setScreen(hasEcosystem ? 'eco' : 'ecointro'));
  }, [authLoading, authUser, hasEcosystem, screen]);
  const requestAuth = (feature, resume = null) => {
    authResumeRef.current = resume || (() => setScreen(screen));
    setAuthPrompt({ feature });
  };
  const openAuth = (mode, fromPrompt = false) => {
    if (!fromPrompt) authResumeRef.current = null;
    setAuthPrompt(null);
    setAskAynaOpen(false);
    setOverlay(null);
    if (mode === 'signup' && !lastQuizAnswers && !session.pendingQuiz) {
      setIntakeMode('new');
      setEditingHealthProfile(false);
      setScreen('quiz');
      return;
    }
    authReturnScreenRef.current = screen;
    setAuthMode(mode);
    setScreen('signin');
  };
  // "Don't have an account? Build your ecosystem": accounts are only made in the
  // save step after the quiz, so this starts the quiz (or, if she already built
  // one on this device while signed out, returns to its save step).
  const startEcosystemFlow = () => {
    authResumeRef.current = null;
    setAuthPrompt(null);
    setAskAynaOpen(false);
    setOverlay(null);
    if (lastQuizAnswers && !authUser) { setRevealAtEnd(true); setScreen('reveal'); return; }
    setIntakeMode('new');
    setEditingHealthProfile(false);
    setScreen('quiz');
  };
  const openProfile = () => { authResumeRef.current = null; setOverlay({ type: authUser ? 'profile' : 'profile-auth' }); };

  // Backend-only state used to keep mobile ecosystem writes consistent with
  // the same Supabase user_ecosystems rows used by the website.
  const ecosystemFlagsRef = useRef({ trackedProducts: {}, omittedProducts: {} });
  const pendingQuizEcosystemRef = useRef(null);
  const { savedMap, isSaved, toggleSaved, clearLocal: clearLocalSaves } = useSavedProducts(authUser);
  // Guests save on this phone straight away (the same local store the website
  // uses); signing in later merges these into her account. One gentle nudge
  // per visit, never a wall in front of the save.
  const [saveNudge, setSaveNudge] = useState(false);
  const saveNudgeShownRef = useRef(false);
  const handleToggleSaved = (product) => {
    const adding = !savedMap[product?.id];
    toggleSaved(product);
    if (!authUser && adding && !saveNudgeShownRef.current) {
      saveNudgeShownRef.current = true;
      setSaveNudge(true);
    }
  };
  useEffect(() => {
    if (!saveNudge) return undefined;
    const t = setTimeout(() => setSaveNudge(false), 6000);
    return () => clearTimeout(t);
  }, [saveNudge]);
  useEffect(() => { if (authUser) Promise.resolve().then(() => setSaveNudge(false)); }, [authUser]);
  const [browseQuery, setBrowseQuery] = useState('');
  // Behavior signals for the matching engine (saved, "Not for me", in her
  // Ecosystem). Memoized: the engine caches profiles by this object.
  const baseMatchOpts = useMemo(
    () => behaviorFrom({ saved: savedMap, omitted: omittedProducts, inEcosystem: myProducts }),
    [savedMap, omittedProducts, myProducts]
  );
  const { theme, resolvedTheme, setThemeMode } = useThemeMode();
  const [personalized, setPersonalized] = usePersonalizedFeed(authUser?.id);
  // Requests push permission and registers this device on launch (iOS only
  // for now); stores the token against authUser once both are available.
  // Registration only, nothing sends a push yet.
  usePushNotifications(authUser?.id);
  const { textSizeIndex, setTextSizeIndex, textScale } = useTextSize();
  const [askAynaOpen, setAskAynaOpen] = useState(() => !!(import.meta.env.DEV && new URLSearchParams(window.location.search).get('ask')));
  const [askAynaHistoryState, setAskAynaHistoryState] = useState({ userId: null, messages: [] });
  const [askSeed, setAskSeed] = useState(null);
  const askAynaHistory = askAynaHistoryState.userId === authUser?.id ? askAynaHistoryState.messages : [];
  const setAskAynaHistory = (messages) => setAskAynaHistoryState({ userId: authUser?.id, messages });
  // App-wide gate for Preferences > AI & Personalization > "Personalize with
  // my data", real, account-scoped (notification_preferences table), loaded
  // once on sign-in below. Defaults true (matches the DB column default) so
  // a signed-out or not-yet-loaded user keeps today's behavior.
  const [personalizeWithData, setPersonalizeWithData] = useState(true);
  // Distinguishes "Finish your profile" (resume with prior answers, jump to
  // the first thing left blank) from every other way into the quiz screen
  // (start quiz, retake, update health), which all start fresh on purpose.
  const [editingHealthProfile, setEditingHealthProfile] = useState(false);
  // Back from Wrapped reopens the quiz on its LAST step with every answer in
  // place (via the same draft the quiz already resumes from), and back from
  // the sign-up screen that follows Wrapped lands on Wrapped's last slide.
  const [resumeQuizDraft, setResumeQuizDraft] = useState(false);
  // "Make my matches more personal" opens the quiz at her next optional question.
  const [intakeAtOptional, setIntakeAtOptional] = useState(false);
  const [revealAtEnd, setRevealAtEnd] = useState(false);
  const lastIntakeModeRef = useRef('new');
  // "Get matched" on a product page: after the quiz, land back on that product with her match.
  const returnProductRef = useRef(null);
  useEffect(() => {
    if (screen !== 'eco' || !returnProductRef.current) return;
    const item = returnProductRef.current;
    returnProductRef.current = null;
    Promise.resolve().then(() => setOverlay({ type: 'product', item }));
  }, [screen]);
  useEffect(() => {
    // Back in the quiz: her answers live in the quiz draft again until she finishes.
    if (screen === 'quiz' && session.pendingQuiz) updateSession({ pendingQuiz: null });
  }, [screen, session.pendingQuiz, updateSession]);
  useEffect(() => {
    try {
      if (['connect', 'plan'].includes(screen)) sessionStorage.setItem(QUIZ_STEP_KEY, screen);
      else if (['quiz', 'building', 'reveal', 'eco', 'ecointro', 'browse'].includes(screen)) sessionStorage.removeItem(QUIZ_STEP_KEY);
    } catch { /* storage blocked */ }
  }, [screen]);
  useEffect(() => {
    if (screen !== 'quiz' && resumeQuizDraft) Promise.resolve().then(() => setResumeQuizDraft(false));
  }, [screen, resumeQuizDraft]);
  useEffect(() => {
    if (screen !== 'quiz' && intakeAtOptional) Promise.resolve().then(() => setIntakeAtOptional(false));
  }, [screen, intakeAtOptional]);
  const resumeQuizAtLastStep = () => {
    // From the quiz-end steps, go back into the answers she just gave (not yet saved).
    const fromPending = Boolean(session.pendingQuiz?.answers);
    const snapshot = (fromPending ? session.pendingQuiz.answers : lastQuizAnswers)?.fullHealthIntake || null;
    if (fromPending) lastIntakeModeRef.current = session.pendingQuiz.mode || 'new';
    let resumed = false;
    if (snapshot) {
      try {
        const intake = reconstructIntakeFromSnapshot(snapshot);
        const steps = getIntakeSteps(intake);
        // Only the required minimum done: back to the checkpoint (results or "more personal").
        const didMore = steps.some((s) => !s.required && isStepAnswered(s.id, intake));
        const stepId = didMore ? steps[steps.length - 1]?.id : 'checkpoint';
        if (stepId) {
          localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId }));
          resumed = true;
        }
      } catch { /* storage unavailable: fall back to the saved profile */ }
    }
    setIntakeMode(lastIntakeModeRef.current);
    setResumeQuizDraft(resumed);
    setEditingHealthProfile(!resumed);
    setScreen('quiz');
  };
  // Falls back to the real Supabase identity whenever the locally-cached
  // session name is empty, covers a returning user whose device never
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
      // happened in this app session, save those recommendations for this
      // newly authenticated user before loading the canonical merged state.
      const pending = pendingQuizEcosystemRef.current || (session.pendingIntakeSync ? storedProducts : null);
      if (session.pendingIntakeSync && lastQuizAnswers?.fullHealthIntake) {
        // A completed anonymous intake must travel with its picks through
        // OAuth redirects, including the recommendation-count preference.
        await saveHealthIntakeForCurrentUser(lastQuizAnswers.fullHealthIntake);
      }
      if (Array.isArray(pending) && pending.length > 0) {
        await upsertProductsBatch(supabase, userId, pending, {
          inEcosystem: true,
          isTracked: false,
          isOmitted: false,
        });

        if (cancelled) return;
        pendingQuizEcosystemRef.current = null;
      }

      // Loaded alongside the ecosystem itself, a synced ecosystem with no
      // synced intake behind it left `lastQuizAnswers` empty on any device
      // that didn't complete the intake locally, which silently disabled
      // every profile-gated feature (the Products/Reads "For You" toggles
      // in particular) even for a user with a complete, real profile.
      const [ecosystem, rawIntake, notificationPrefs] = await Promise.all([
        loadEcosystemForUser(supabase, userId),
        loadHealthIntakeForCurrentUser(),
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
      const remoteOmitted = Object.fromEntries(Object.keys(ecosystem?.omittedProducts || {}).map((id) => [id, true]));

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
        omittedProducts: { ...(prev.omittedProducts || {}), ...remoteOmitted },
        hasEcosystem: remoteProducts.length > 0,
        pendingIntakeSync: false,
        // Don't clobber a completion that just happened locally this same
        // session (e.g. mobile onboarding right before sign-in) with
        // possibly-older server data.
        lastQuizAnswers: restoredQuizAnswers || (Array.isArray(pending) ? prev.lastQuizAnswers : null),
      }));

      // Mid quiz-end steps: stay there so her new answers get applied.
      if (remoteProducts.length > 0 && !session.pendingQuiz) setScreen('eco');
      setLoadedAccountId(userId);
    })().catch((error) => {
      console.warn('[Ayna] mobile ecosystem sync failed:', error);
      if (!cancelled) setLoadedAccountId(userId);
    });

    return () => {
      cancelled = true;
    };
    // The current intake is captured on account transition. Including the
    // session here would restart hydration after every local product edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, updateSession, setTextSizeIndex]);

  // Same loadProductCatalog() call Discovery.jsx makes, a live source
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

  // BrowseScreen/EcosystemScreen/EcosystemIntroScreen all default this to
  // the literal letter 'A' when it's not passed, that default was always
  // being used, since nothing here ever passed the signed-in user's real
  // initial down to them.
  const headerInitial = (resolvedName || '').trim().charAt(0).toUpperCase() || 'A';

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;
  // "Personalize with my data" (Preferences > AI & Personalization), off
  // suppresses ambient personalization (match %, the For You toggles, Ask
  // Ayna's profile context, safety-alert swaps) everywhere quizAnswers would
  // otherwise be read, without touching the real stored answers themselves
  // (still saved, still shown when editing your own profile).
  const effectiveQuizAnswers = personalizeWithData ? lastQuizAnswers : null;
  // Connected health data (You -> Health data) can strengthen needs she chose,
  // only while personalization is on, and only from sources whose terms allow
  // it (src/health/policy.js). Personal matching only: Browse ranking and
  // partner placement never read it.
  const selectedNeedIds = useMemo(() => {
    try { return effectiveQuizAnswers ? getSelectedNeeds(effectiveQuizAnswers).map((n) => n.id) : []; } catch { return []; }
  }, [effectiveQuizAnswers]);
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const healthContext = personalizeWithData ? health.matchContext : null;
  // Apple Health Records she saved on this phone: allergies and medicines for
  // safety, conditions as context. Never sent anywhere.
  const healthRecords = personalizeWithData ? health.records : null;
  const matchOpts = useMemo(() => {
    if (!healthContext && !healthRecords) return baseMatchOpts;
    return { ...baseMatchOpts, ...(healthContext ? { healthContext } : {}), ...(healthRecords ? { healthRecords } : {}) };
  }, [baseMatchOpts, healthContext, healthRecords]);
  const suggestedEcosystemProducts = useMemo(() => {
    if (!effectiveQuizAnswers) return [];
    const savedIds = new Set(myProducts.map((product) => product.id));
    return seedEcosystemFromAnswers(effectiveQuizAnswers, matchOpts)
      .filter((product) => !savedIds.has(product.id))
      .slice(0, 6);
  }, [effectiveQuizAnswers, myProducts, matchOpts]);

  // End of the quiz (connect -> plan -> matches): her new answers wait in
  // session.pendingQuiz until she taps "See my matches". Health data is read
  // against the goals she just chose, so it can strengthen them, never add one.
  const pendingQuiz = session.pendingQuiz || null;
  const pendingAnswers = pendingQuiz?.answers || null;
  const pendingNeedIds = useMemo(() => {
    try { return pendingAnswers ? getSelectedNeeds(pendingAnswers).map((n) => n.id) : []; } catch { return []; }
  }, [pendingAnswers]);
  const planHealthContext = useMemo(
    () => (personalizeWithData && health.matchSignals?.length ? healthMatchContext(health.matchSignals, pendingNeedIds) : null),
    [personalizeWithData, health.matchSignals, pendingNeedIds],
  );
  // Same behavior inputs the quiz always seeded with ("Not for me" only), plus health context.
  const planBaseOpts = useMemo(() => behaviorFrom({ omitted: omittedProducts }), [omittedProducts]);
  const planMatchOpts = useMemo(() => ({
    ...planBaseOpts,
    ...(planHealthContext ? { healthContext: planHealthContext } : {}),
    ...(healthRecords ? { healthRecords } : {}),
  }), [planBaseOpts, planHealthContext, healthRecords]);
  const planSeeded = useMemo(() => {
    if (!pendingAnswers || !['connect', 'plan'].includes(screen)) return [];
    try { return seedEcosystemFromAnswers(pendingAnswers, planMatchOpts); } catch { return []; }
  }, [pendingAnswers, planMatchOpts, screen]);
  const planProducts = useMemo(() => {
    const existing = pendingQuiz?.mode === 'add' ? myProducts : [];
    const ids = new Set(existing.map((p) => p.id));
    return [...existing, ...planSeeded.filter((p) => !ids.has(p.id))];
  }, [pendingQuiz?.mode, myProducts, planSeeded]);
  const healthInsightsForPlan = personalizeWithData && authUser ? health.insights : null;

  // Only true right after a mobile-initiated Google sign-in completes, the
  // full-page OAuth redirect leaves this app entirely and comes back on
  // /auth/callback (rendered by desktop's App.jsx, since main.jsx picks
  // App vs MobileApp purely by URL path), which sends it on to
  // /mobile-preview per this same flag (see useSupabaseAuth.js). Checked
  // once per real sign-in event, not on every ordinary reopen with an old
  // session, a returning user's local device has no synced ecosystem data
  // to show, so forcing them into 'eco' on every mount would just be empty.
  useEffect(() => {
    if (!authUser) return;
    let justSignedInViaOAuth = false;
    try { justSignedInViaOAuth = localStorage.getItem(MOBILE_OAUTH_PENDING_KEY) === '1'; } catch { /* private mode */ }
    if (!justSignedInViaOAuth) return;
    try { localStorage.removeItem(MOBILE_OAUTH_PENDING_KEY); } catch { /* private mode */ }
    const firstName = displayNameFromUser(authUser);
    // Deferred a tick so the state updates run from a callback rather than
    // directly in the effect body, same one-time transition, just shaped
    // the way react-hooks/set-state-in-effect expects it.
    Promise.resolve().then(() => {
      updateSession((prev) => ({ userName: firstName || prev.userName }));
      setScreen(hasEcosystem ? 'eco' : 'ecointro');
    });
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real Supabase sign-out, on top of the existing local reset, the app's
  // own ecosystem/quiz data (useEcosystemSession) still lives on-device
  // only, so it's cleared the same way it always was; identity is what's
  // newly real here.
  // Brand-new empty account from a Google/Apple sign-in (not the save step):
  // offer the quiz first, once her saved data has loaded (oauthNewAccount.js).
  const [newAccountStart, setNewAccountStart] = useState(false);
  useEffect(() => {
    if (!authUser?.id || loadedAccountId !== authUser.id) return;
    const offer = shouldOfferEcosystemStart({ user: authUser, source: takeOAuthSource(), hasIntake: Boolean(lastQuizAnswers || session.pendingQuiz), productCount: myProducts.length });
    if (offer) Promise.resolve().then(() => setNewAccountStart(true));
  }, [loadedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = () => {
    setOverlay(null);
    setAskAynaOpen(false);
    setAskAynaHistory([]);
    pendingQuizEcosystemRef.current = null;
    resetSession();
    if (authUser) clearLocalSaves();
    signOutSupabase();
    setScreen('landing');
  };

  // "Add to ecosystem" from a product detail overlay, was previously wired
  // to nothing (ProductDetailScreen called onAddToEcosystem, but MobileApp
  // never passed it), so the button did nothing at all.
  const ecoNudgeShownRef = useRef(false);
  const handleAddToEcosystem = (product) => {
    if (!product?.id) return;

    const alreadyAdded = myProducts.some((entry) => entry.id === product.id);
    if (alreadyAdded) {
      updateSession((prev) => ({
        myProducts: prev.myProducts.filter((entry) => entry.id !== product.id),
        hasEcosystem: prev.myProducts.some((entry) => entry.id !== product.id),
      }));
      const supabase = getSupabaseClient();
      if (authUser && supabase) {
        upsertProductState(supabase, authUser.id, product, {
          inEcosystem: false,
          isTracked: false,
          isOmitted: !!ecosystemFlagsRef.current.omittedProducts?.[product.id],
        }).catch((error) => console.warn('[Ayna] mobile ecosystem remove sync failed:', error));
        delete ecosystemFlagsRef.current.trackedProducts[product.id];
      }
      return;
    }

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
      // Signed out: kept on this phone (same as guest saves) and flagged so
      // the account load on sign-in uploads it instead of replacing it.
      ...(authUser ? {} : { pendingIntakeSync: true }),
    }));
    if (!authUser && !ecoNudgeShownRef.current) {
      ecoNudgeShownRef.current = true;
      setSaveNudge('eco');
    }

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

  // "Not for me" (same as the website's toggleOmitProduct): hides the product
  // from every recommendation, seed and swap, and takes it out of the
  // Ecosystem. Undo brings it back as a candidate.
  const handleToggleOmit = (product) => {
    if (!product?.id) return;
    const wasOmitted = !!omittedProducts[product.id];
    updateSession((prev) => {
      const nextOmitted = { ...(prev.omittedProducts || {}) };
      if (wasOmitted) delete nextOmitted[product.id];
      else nextOmitted[product.id] = true;
      const nextProducts = wasOmitted ? prev.myProducts : prev.myProducts.filter((entry) => entry.id !== product.id);
      return { omittedProducts: nextOmitted, myProducts: nextProducts, hasEcosystem: nextProducts.length > 0 };
    });
    const supabase = getSupabaseClient();
    if (authUser && supabase) {
      if (wasOmitted) delete ecosystemFlagsRef.current.omittedProducts[product.id];
      else {
        ecosystemFlagsRef.current.omittedProducts[product.id] = product;
        delete ecosystemFlagsRef.current.trackedProducts[product.id];
      }
      upsertProductState(supabase, authUser.id, product, {
        inEcosystem: wasOmitted ? myProducts.some((entry) => entry.id === product.id) : false,
        isTracked: wasOmitted ? !!ecosystemFlagsRef.current.trackedProducts[product.id] : false,
        isOmitted: !wasOmitted,
      }).catch((error) => console.warn('[Ayna] mobile Not for me sync failed:', error));
    }
  };

  const handleResetEcosystem = async () => {
    if (resettingEcosystem) return;
    setResettingEcosystem(true);
    try {
      const supabase = getSupabaseClient();
      if (authUser?.id && supabase) {
        await clearEcosystemForUser(supabase, authUser.id, { includeTracking: true });
      }
      await clearHealthIntakeForCurrentUser();
      pendingQuizEcosystemRef.current = null;
      ecosystemFlagsRef.current = { trackedProducts: {}, omittedProducts: {} };
      updateSession({ myProducts: [], lastQuizAnswers: null, hasEcosystem: false, pendingIntakeSync: false, pendingQuiz: null, routineHave: {} });
      setEcosystemNotice('');
      try { localStorage.removeItem('ayna_intake_draft_v1'); } catch { /* storage unavailable */ }
      setHasIntakeDraft(false);
      setIntakeMode('new');
      setEditingHealthProfile(false);
      setResetDialogOpen(false);
      setScreen('ecointro');
    } finally {
      setResettingEcosystem(false);
    }
  };

  // "See swap" on a Shopper Profile safety alert, reuses the same real
  // alternative-finding logic as the desktop ecosystem swap flow instead of
  // just linking back to the flagged product itself.
  const handleViewAlternative = (product) => {
    if (!product?.id) return;
    const tag = Array.isArray(product.tags) ? product.tags[0] : undefined;
    const alternatives = getEcosystemAlternatives(product.id, tag, effectiveQuizAnswers) || [];
    setOverlay({ type: 'product', item: alternatives[0] || product });
  };

  // "Add to my goals" on a health-data suggestion (You -> Health, Ecosystem):
  // the goal is added exactly as if she had picked it in the quiz, and the
  // new matches for it join her Ecosystem. Nothing is added without the tap.
  const handleAddGoal = (needId) => {
    if (!lastQuizAnswers) {
      setEcosystemNotice('Take the quiz first, then you can add goals from your health data.');
      return false;
    }
    const nextAnswers = addNeedToAnswers(lastQuizAnswers, needId);
    if (nextAnswers === lastQuizAnswers) return false;
    let added = [];
    try {
      const ids = new Set(myProducts.map((p) => p.id));
      added = seedEcosystemFromAnswers(nextAnswers, behaviorFrom({ omitted: omittedProducts })).filter((p) => p.needId === needId && !ids.has(p.id));
    } catch { added = []; }
    const nextProducts = [...myProducts, ...added];
    updateSession({ lastQuizAnswers: nextAnswers, myProducts: nextProducts, hasEcosystem: nextProducts.length > 0 });
    let label = needId;
    try { label = getSelectedNeeds(nextAnswers).find((n) => n.id === needId)?.phrase || needId; } catch { /* keep id */ }
    setEcosystemNotice(added.length ? `Added ${label} to your goals. ${added.length} new match${added.length === 1 ? '' : 'es'} in your Ecosystem.` : `Added ${label} to your goals. No new strong matches for it yet.`);
    const supabase = getSupabaseClient();
    if (authUser && supabase && added.length) {
      upsertProductsBatch(supabase, authUser.id, added, { inEcosystem: true, isTracked: false, isOmitted: false })
        .catch((error) => console.warn('[Ayna] mobile goal add sync failed:', error));
    }
    saveHealthIntakeForCurrentUser(nextAnswers?.fullHealthIntake || nextAnswers).catch(() => {});
    return true;
  };

  // Ecosystem shopping list -> a Community playlist (same tables and cover
  // upload as Community's own "New playlist"). Throws a readable message.
  const handleSaveShoppingPlaylist = async ({ title, visibility, productIds, cover }) => {
    const supabase = getSupabaseClient();
    if (!authUser?.id || !supabase) throw new Error('Sign in to save playlists.');
    let uploaded = null;
    let playlist = null;
    try {
      if (cover.mode === 'photo' && !cover.photo) throw new Error('Choose a cover photo first.');
      const file = cover.mode === 'photo' ? cover.photo : await makePlaylistCoverFile(cover.text || title, cover.color);
      uploaded = await uploadCommunityImage(supabase, file, { folder: 'covers', userId: authUser.id });
      playlist = await communityStore.createPlaylist(supabase, authUser.id, { title, visibility, coverUrl: uploaded.url });
    } catch (error) {
      if (uploaded && !playlist) await deleteCommunityImage(supabase, uploaded.path).catch(() => {});
      throw new Error(error?.message && !/^\w+_\w+$/.test(error.message) ? error.message : 'The playlist could not be saved. Try again.');
    }
    let added = 0;
    for (const id of productIds) {
      try { await communityStore.addToPlaylist(supabase, playlist.id, id); added += 1; } catch { /* counted below */ }
    }
    return { playlist, added, missed: productIds.length - added };
  };

  // An unfinished quiz (draft saved, no finished answers yet): where she
  // stands, for the "Finish your quiz" card. Drafts live on this device.
  const quizDraft = hasIntakeDraft && !lastQuizAnswers?.fullHealthIntake && screen !== 'quiz' ? readDraftProgress() : null;
  const resumeQuiz = () => {
    setOverlay(null);
    setIntakeMode(hasEcosystem ? 'add' : 'new');
    setIntakeAtOptional(false);
    setEditingHealthProfile(false);
    setResumeQuizDraft(true);
    setScreen('quiz');
  };
  const startQuizOver = () => {
    clearIntakeDraft();
    setHasIntakeDraft(false);
    setOverlay(null);
    setIntakeMode(hasEcosystem ? 'add' : 'new');
    setIntakeAtOptional(false);
    setEditingHealthProfile(false);
    setResumeQuizDraft(false);
    setScreen('quiz');
  };
  const nav = {
    quizDraft,
    onResumeQuiz: resumeQuiz,
    onStartOverQuiz: startQuizOver,
    // Night mode is a persistent user preference (Preferences screen), it
    // stays on everywhere until turned off there, so navigation must never
    // force it back to light.
    onStartQuiz: () => { setIntakeMode(hasEcosystem ? 'add' : 'new'); setEditingHealthProfile(hasEcosystem); setScreen('quiz'); },
    onOpenMonthlyCheckin: () => setScreen('checkin'),
    onReplayStory: () => { setRevealAtEnd(false); setScreen('reveal'); },
    // An Ecosystem shelf's "Shop" passes its need label as the search.
    onBrowse: (query) => { setBrowseQuery(typeof query === 'string' ? query : ''); setScreen('browse'); },
    onGoCommunity: () => { setCommunitySeed(null); setScreen('community'); },
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => setOverlay({ type: 'product', item: p }),
    onOpenArticle: (a) => {
      setReadArticleIds((ids) => ids.includes(a.id) ? ids : [...ids, a.id]);
      setOverlay({ type: 'article', item: a });
    },
    onOpenProfile: openProfile,
    onOpenHealthData: () => { if (authUser) setOverlay({ type: 'profile', screen: health.insights.sections.length ? 'healthInsights' : 'healthData' }); else openProfile(); },
    healthSummary: authUser ? health.insights.sections.find((sec) => sec.status === 'ready') || null : null,
    healthConnectedCount: health.connected.length,
    healthSuggestions: personalizeWithData && authUser ? health.matchContext?.suggestions || [] : [],
    healthInsights: healthInsightsForPlan,
    onAddGoal: handleAddGoal,
    ecoTab,
    onEcoTab: setEcoTab,
    routineHave: session.routineHave || {},
    onSavePlaylist: authUser ? handleSaveShoppingPlaylist : null,
    onOpenPlaylist: (playlistId) => { setOverlay(null); setCommunitySeed({ playlistId, token: Date.now() }); setScreen('community'); },
    onConnectHealth: () => (authUser ? setOverlay({ type: 'profile', screen: 'healthData' }) : requestAuth('health data')),
    onToggleHave: (id) => updateSession((prev) => {
      const next = { ...(prev.routineHave || {}) };
      if (next[id]) delete next[id]; else next[id] = true;
      return { routineHave: next };
    }),
    onRequireAuth: (feature) => requestAuth(feature || 'this feature'),
    onAlreadyHaveAccount: () => openAuth('signin'),
    onAboutAyna: () => setOverlay({ type: 'about' }),
    onOpenWhyMatch: (p) => setOverlay({ type: 'why-match', item: p }),
    // onAskAyna() opens the drawer; onAskAyna({ question, context }) also asks
    // that question with what she's looking at (e.g. her dashboard numbers).
    onAskAyna: (opts) => {
      if (opts && typeof opts.question === 'string') setAskSeed({ id: Date.now(), question: opts.question, context: typeof opts.context === 'string' ? opts.context : '' });
      if (authUser) setAskAynaOpen(true); else requestAuth('Ask ayna', () => { setScreen(screen); setAskAynaOpen(true); });
    },
    onBack: () => {
      if (['building', 'reveal', 'connect'].includes(screen)) {
        resumeQuizAtLastStep();
        return;
      }
      if (screen === 'plan') { setScreen('connect'); return; }
      setScreen(screen === 'quiz' ? (hasEcosystem ? 'eco' : 'ecointro') : screen === 'ecointro' ? 'landing' : screen === 'eco' ? 'browse' : hasEcosystem ? 'eco' : 'landing');
    },
    onRetake: () => { setIntakeMode('add'); setIntakeAtOptional(false); setEditingHealthProfile(true); setScreen('quiz'); },
    onPersonalize: () => { setIntakeMode('add'); setIntakeAtOptional(true); setEditingHealthProfile(true); setScreen('quiz'); },
    onRequestEcosystemReset: () => setResetDialogOpen(true),
    onUpdateHealth: () => { setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); },
    onEditProfile: () => { setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); },
    onComplete: (quizAnswers) => {
      // Not saved as her answers yet: first the optional health step, then her plan.
      updateSession({ pendingQuiz: { answers: quizAnswers, mode: intakeMode } });
      setPlanAddedGoals({});
      setResumeQuizDraft(false);
      setIntakeAtOptional(false);
      setIntakeMode('new');
      setScreen(authUser && health.connected.length ? 'plan' : 'connect');
    },
    onQuizConnectContinue: () => setScreen('plan'),
    onQuizConnectSignIn: () => { authResumeRef.current = null; authReturnScreenRef.current = 'connect'; setAuthMode('signup'); setScreen('signin'); },
    planProducts,
    planAnswers: pendingAnswers,
    planInsights: healthInsightsForPlan,
    planSuggestions: planHealthContext?.suggestions || [],
    planAddedGoals,
    onAddPlanGoal: (needId) => {
      updateSession((prev) => (prev.pendingQuiz ? { pendingQuiz: { ...prev.pendingQuiz, answers: addNeedToAnswers(prev.pendingQuiz.answers, needId) } } : {}));
      setPlanAddedGoals((g) => ({ ...g, [needId]: true }));
    },
    onSeeMatches: () => {
      if (!pendingQuiz) { setScreen(hasEcosystem ? 'eco' : 'ecointro'); return; }
      const quizAnswers = pendingQuiz.answers;
      const mode = pendingQuiz.mode;
      const seededProducts = planSeeded.length ? planSeeded : seedEcosystemFromAnswers(quizAnswers, planMatchOpts);
      const existingProducts = mode === 'add' ? myProducts : [];
      const existingIds = new Set(existingProducts.map((product) => product.id));
      const addedProducts = seededProducts.filter((product) => !existingIds.has(product.id));
      const nextProducts = [...existingProducts, ...addedProducts];

      updateSession({
        myProducts: nextProducts,
        lastQuizAnswers: quizAnswers,
        hasEcosystem: nextProducts.length > 0,
        pendingIntakeSync: !authUser,
        pendingQuiz: null,
      });
      if (mode === 'add') {
        setEcosystemNotice(addedProducts.length
          ? `${addedProducts.length} new product${addedProducts.length === 1 ? '' : 's'} added. Your existing Ecosystem stayed in place.`
          : 'No new strong matches this time. Your existing Ecosystem stayed in place.');
      } else {
        setEcosystemNotice('');
      }

      const supabase = getSupabaseClient();
      if (authUser && supabase) {
        upsertProductsBatch(supabase, authUser.id, addedProducts, {
          inEcosystem: true,
          isTracked: false,
          isOmitted: false,
        }).catch((error) => {
          console.warn('[Ayna] mobile generated ecosystem sync failed:', error);
        });
      } else {
        pendingQuizEcosystemRef.current = nextProducts;
      }
      // Same real save desktop's App.jsx makes after quiz completion, was
      // never ported to mobile (a real signed-in session didn't exist here
      // yet at the time), so a mobile-only user's intake answers lived on
      // that one device only, invisible to "Manage/Download my data" and to
      // that user on any other device. No-ops harmlessly when signed out.
      const rawIntake = quizAnswers?.fullHealthIntake || quizAnswers;
      saveHealthIntakeForCurrentUser(rawIntake).catch(() => {});
      lastIntakeModeRef.current = mode;
      setScreen('building');
    },
    // The reveal->sign-in funnel is for a first-time, still-anonymous build:
    // "here's your ecosystem, sign in to save it." Someone already signed in
    // (a monthly check-in, a retaken quiz, an edited profile) already has an
    // account and this same ecosystem attached to it, routing them through
    // "sign in" again after finishing is a dead end, not a next step.
    onFinish: () => { setRevealAtEnd(false); setScreen('reveal'); },
    onContinue: () => authUser ? setScreen('eco') : openAuth('signup'),
    initialMode: authMode,
    onAuthBack: () => {
      const resume = authResumeRef.current;
      authResumeRef.current = null;
      if (resume) resume();
      else {
        setRevealAtEnd(authReturnScreenRef.current === 'reveal');
        setScreen(authReturnScreenRef.current);
      }
    },
    onStartEcosystem: startEcosystemFlow,
    // Real Supabase auth (src/mobile/hooks/useSupabaseAuth.js), the name
    // comes from whatever SigninScreen already has in its own form state
    // (the person just typed it) rather than from authUser here, since
    // authUser's own state update from onAuthStateChange can lag behind
    // this call by a render or two and there's no reason to race it when
    // the real value is sitting right there in the caller.
    authUser,
    onSignUp: signUpWithPassword,
    onSignIn: signInWithPassword,
    // Remember where Google/Apple started: the post-quiz save may create an
    // account; a plain sign-in that does gets the "build it first" step.
    onGoogleSignIn: () => { const mode = authMode === 'signup' || lastQuizAnswers || session.pendingQuiz ? 'save' : 'signin'; markOAuthSource(mode); return signInWithGoogle({ mode }); },
    onAppleSignIn: () => { const mode = authMode === 'signup' || lastQuizAnswers || session.pendingQuiz ? 'save' : 'signin'; markOAuthSource(mode); return signInWithApple({ mode }); },
    onResendConfirmation: resendConfirmation,
    onAuthenticated: (name) => {
      updateSession((prev) => ({ userName: name || prev.userName }));
      const resume = authMode === 'signin' ? authResumeRef.current : null;
      authResumeRef.current = null;
      if (resume) resume();
      else if (session.pendingQuiz && authReturnScreenRef.current === 'connect') setScreen('connect');
      else setScreen(hasEcosystem ? 'eco' : 'ecointro');
    },
    hasEcosystem,
  };

  const showTabBar = !['landing', 'quiz', 'building', 'reveal', 'signin', 'checkin', 'connect', 'plan'].includes(screen) && (!overlay || ['profile', 'profile-auth'].includes(overlay.type));
  // Reads ranked from her app answers (personalReads.js): matching reads
  // first, reads for another life stage (e.g. menopause at 24) last.
  const rankedEcosystemReads = rankReadsForProfile(ARTICLES, effectiveQuizAnswers);
  const ecosystemReads = rankedEcosystemReads
    .filter((article) => !readArticleIds.includes(article.id))
    .concat(rankedEcosystemReads.filter((article) => readArticleIds.includes(article.id)))
    .slice(0, 3);
  const activeTab = ['profile', 'profile-auth'].includes(overlay?.type) ? 'profile'
    : screen === 'browse' ? 'browse'
      : screen === 'library' ? 'library'
      : screen === 'community' ? 'community'
        : ['eco', 'ecointro'].includes(screen) ? 'home' : null;

  if (authLoading || (authUser?.id && !DEV_HEALTH_DEMO && loadedAccountId !== authUser.id)) {
    return <div className="ayna-mobile" data-theme={resolvedTheme} style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', background: 'var(--ayna-bg)' }} role="status" aria-live="polite"><div style={{ textAlign: 'center', color: 'var(--ayna-heading)' }}><div style={{ fontFamily: "var(--ayna-font-display)", fontSize: 34 }}>ayna</div><p style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>Opening your Ecosystem…</p></div></div>;
  }

  return (
    <div className="ayna-mobile" data-theme={resolvedTheme} data-screen={screen} data-preview={window.location.pathname === '/mobile-preview' ? 'true' : undefined} style={{ '--ayna-text-scale': textScale }} onTouchStart={handleMainTouchStart} onTouchEnd={handleMainTouchEnd}>
      <AskContext.Provider value={nav.onAskAyna}>
      <Screen
        key={screen === 'community' ? communitySeed?.token || 'community' : screen === 'signin' ? `signin-${authMode}` : screen}
        {...nav}
        seedKind={communitySeed?.kind}
        seedProductId={communitySeed?.productId}
        seedPlaylistId={communitySeed?.playlistId}
        seedPostId={communitySeed?.postId}
        seedUsername={communitySeed?.username}
        onGoBrowse={() => { setBrowseQuery(''); setScreen('browse'); }}
        initialSearch={screen === 'browse' ? browseQuery : ''}
        onGoLibrary={() => setScreen('library')}
        onGoEco={() => setScreen(hasEcosystem ? 'eco' : 'ecointro')}
        authUser={authUser}
        theme={theme}
        onToggleTheme={setThemeMode}
        personalized={personalized}
        onPersonalizedChange={setPersonalized}
        products={browseProducts}
        articles={ARTICLES}
        readArticleIds={readArticleIds}
        readProgress={readProgress}
        savedProducts={savedMap}
        onToggleSaved={handleToggleSaved}
        onAddToEcosystem={handleAddToEcosystem}
        myProducts={myProducts}
        omittedProducts={omittedProducts}
        matchOpts={matchOpts}
        suggestedEcosystemProducts={suggestedEcosystemProducts}
        quizAnswers={effectiveQuizAnswers}
        lastQuizAnswers={lastQuizAnswers}
        hasIntakeDraft={hasIntakeDraft && !hasEcosystem}
        onDraftChange={setHasIntakeDraft}
        initialSnapshot={editingHealthProfile && !resumeQuizDraft ? lastQuizAnswers?.fullHealthIntake || null : null}
        startAtBeginning={intakeMode === 'add' && !resumeQuizDraft && !intakeAtOptional && editingHealthProfile}
        startAtOptional={intakeAtOptional && !resumeQuizDraft}
        introEnabled={!resumeQuizDraft && !intakeAtOptional}
        revealStartAtEnd={revealAtEnd}
        ecosystemNotice={ecosystemNotice}
        name={resolvedName}
        headerInitial={headerInitial}
        tags={topAreaLabels.length ? `${topAreaLabels.length} area${topAreaLabels.length === 1 ? '' : 's'} covered` : ''}
        relatedReads={ecosystemReads}
        topAreas={screen === 'reveal' ? topAreaLabels : topAreaLabels.length ? topAreaLabels : ['Period', 'Hormones', 'Sleep']}
        productCount={myProducts.length}
        readCount={ARTICLES.length}
        goalCount={goalCount}
        stats={[
          { label: 'Products', value: myProducts.length },
          { label: 'Reads', value: ARTICLES.length },
          { label: 'Pillars', value: topAreaLabels.length },
        ]}
      />
      </AskContext.Provider>
      {newAccountStart && authUser && !['quiz', 'building', 'connect', 'plan'].includes(screen) && (
        <NewAccountStart
          name={resolvedName}
          onStart={() => { setNewAccountStart(false); startEcosystemFlow(); }}
          onSignOut={() => { setNewAccountStart(false); handleSignOut(); }}
          onClose={() => setNewAccountStart(false)}
        />
      )}
      {showTabBar && <MobileTabBar
        active={activeTab}
        onHome={() => { setAskAynaOpen(false); setOverlay(null); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
        onBrowse={() => { setAskAynaOpen(false); setOverlay(null); setBrowseQuery(''); setScreen('browse'); }}
        onCommunity={() => { setAskAynaOpen(false); setOverlay(null); setCommunitySeed(null); setScreen('community'); }}
        onLibrary={() => { setAskAynaOpen(false); setOverlay(null); setScreen('library'); }}
        onProfile={() => { setAskAynaOpen(false); openProfile(); }}
      />}
      {saveNudge && !authUser && (
        <div className="ay-save-nudge" role="status">
          <span>{saveNudge === 'eco' ? 'Added to your Ecosystem on this phone. Sign in to keep it on every device.' : 'Saved on this phone. Sign in to keep your saves on every device.'}</span>
          <button type="button" onClick={() => { setSaveNudge(false); openAuth('signin'); }}>Sign in</button>
          <button type="button" className="ay-save-nudge-x" aria-label="Dismiss" onClick={() => setSaveNudge(false)}>×</button>
        </div>
      )}
      <EcosystemResetDialog open={resetDialogOpen} busy={resettingEcosystem} onCancel={() => setResetDialogOpen(false)} onConfirm={handleResetEcosystem} />
      {(overlay?.type === 'profile-auth' || authPrompt) && (
        <div className="ayna-profile-auth-backdrop" style={authPrompt ? { zIndex: 100, bottom: 0 } : undefined} onClick={() => { setOverlay(null); setAuthPrompt(null); authResumeRef.current = null; }}>
          <section className="ayna-profile-auth-sheet" role="dialog" aria-modal="true" aria-labelledby="ayna-profile-auth-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ayna-profile-auth-close" aria-label="Close" onClick={() => { setOverlay(null); setAuthPrompt(null); authResumeRef.current = null; }}>×</button>
            <h2 id="ayna-profile-auth-title">{authPrompt ? `Sign in for ${authPrompt.feature}` : 'Sign in to ayna'}</h2>
            <button type="button" className="ayna-profile-auth-primary" onClick={() => openAuth('signin', !!authPrompt)}>Sign in</button>
            {!authPrompt && quizDraft && <FinishQuizCard progress={quizDraft} onContinue={resumeQuiz} onStartOver={startQuizOver} />}
            {!(quizDraft && !authPrompt) && <button type="button" className="ayna-profile-auth-new" onClick={startEcosystemFlow}>{hasEcosystem ? <>New here? <b>Save your Ecosystem to an account</b></> : <>Don’t have an account? <b>Build your Ecosystem</b></>}</button>}
          </section>
        </div>
      )}
      {overlay?.type === 'about' && <div className="ayna-fresh-detail-overlay" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--ayna-surface)', display: 'flex' }}><AboutAynaScreen onBack={() => setOverlay(null)} /></div>}
      {overlay?.type === 'product' && (
        <div className="ayna-fresh-detail-overlay" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ProductDetailScreen
            product={overlay.item}
            onBack={() => setOverlay(null)}
            isSaved={isSaved(overlay.item?.id)}
            onToggleSaved={() => handleToggleSaved(overlay.item)}
            isInEcosystem={myProducts.some((p) => p.id === overlay.item?.id)}
            onAddToEcosystem={() => handleAddToEcosystem(overlay.item)}
            isOmitted={!!omittedProducts[overlay.item?.id]}
            onToggleOmit={() => handleToggleOmit(overlay.item)}
            onOpenHealthData={() => { if (authUser) setOverlay({ type: 'profile', screen: 'healthData' }); else requestAuth('health data', () => setOverlay({ type: 'profile', screen: 'healthData' })); }}
            matchOpts={matchOpts}
            onOpenReview={(postId) => { setCommunitySeed({ postId, token: Date.now() }); setOverlay(null); setScreen('community'); }}
            onCommunityAction={(kind) => {
              if (!authUser && ['review', 'playlist', 'recommend'].includes(kind)) {
                const productId = overlay.item?.id;
                requestAuth(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : 'friend recommendations', () => {
                  setCommunitySeed({ kind, productId, token: Date.now() });
                  setScreen('community');
                });
                return;
              }
              setCommunitySeed({ kind, productId: overlay.item?.id, token: Date.now() });
              setOverlay(null);
              setScreen('community');
            }}
            onStartQuiz={() => { returnProductRef.current = overlay.item || null; setOverlay(null); setIntakeMode(hasEcosystem ? 'add' : 'new'); setEditingHealthProfile(hasEcosystem); setScreen('quiz'); }}
            authUser={authUser}
            onRequireAuth={(feature) => requestAuth(feature || 'Ask ayna', () => { setScreen(screen); setOverlay({ type: 'product', item: overlay.item }); })}
            quizAnswers={authUser ? effectiveQuizAnswers : null}
            ecosystemProducts={myProducts}
            onOpenProduct={(item) => setOverlay({ type: 'product', item })}
            theme={theme}
            onToggleTheme={setThemeMode}
          />
        </div>
      )}
      {overlay?.type === 'article' && (
        <div className="ayna-fresh-detail-overlay" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <ArticleDetailScreen
            key={overlay.item.id}
            article={overlay.item}
            onBack={() => setOverlay(null)}
            savedProgress={readProgress[overlay.item.id] || 0}
            onProgress={(value) => recordReadProgress(overlay.item.id, value)}
            nextRead={getNextArticle(overlay.item, ARTICLES, readArticleIds, rankReadsForProfile(ARTICLES, effectiveQuizAnswers), (article) => readFitsStage(article, effectiveQuizAnswers))}
            onNext={(article) => {
              setReadArticleIds((ids) => ids.includes(article.id) ? ids : [...ids, article.id]);
              setOverlay({ type: 'article', item: article });
            }}
            theme={theme}
          />
        </div>
      )}
      {overlay?.type === 'why-match' && (
        <div className="ayna-fresh-detail-overlay" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--ayna-surface)', display: 'flex' }}>
          <WhyMatchScreen
            product={overlay.item}
            quizAnswers={effectiveQuizAnswers}
            matchOpts={matchOpts}
            onBack={() => setOverlay(null)}
            onUpdateHealth={() => { setOverlay(null); setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); }}
            onViewDetails={() => setOverlay({ type: 'product', item: overlay.item })}
          />
        </div>
      )}
      {overlay?.type === 'profile' && (
        <AskContext.Provider value={nav.onAskAyna}>
        <ProfileFlow
          key={overlay.screen || 'hub'}
          initialScreen={overlay.screen || null}
          onClose={() => setOverlay(null)}
          theme={theme}
          onToggleTheme={setThemeMode}
          onSignOut={handleSignOut}
          onSignIn={() => openAuth('signin')}
          authUser={authUser}
          name={resolvedName}
          onNameChanged={(next) => updateSession({ userName: next })}
          ecosystemCount={myProducts.length}
          savedCount={Object.keys(savedMap || {}).length}
          quizAnswers={effectiveQuizAnswers}
          myProducts={myProducts}
          matchProducts={suggestedEcosystemProducts}
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
          onEditProfile={() => { setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); }}
          quizDraft={quizDraft}
          onResumeQuiz={resumeQuiz}
          onStartOverQuiz={startQuizOver}
          onAddGoal={handleAddGoal}
          onOpenRoutine={() => { setEcoTab('dashboard'); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
          onOpenMonthlyCheckin={() => setScreen('checkin')}
          readProgress={readProgress}
          onOpenProduct={(product) => setOverlay({ type: 'product', item: product })}
          onOpenArticle={(article) => { setReadArticleIds((ids) => ids.includes(article.id) ? ids : [...ids, article.id]); setOverlay({ type: 'article', item: article }); }}
          onOpenCommunity={(seed) => { setOverlay(null); setCommunitySeed({ ...seed, token: Date.now() }); setScreen('community'); }}
        />
        </AskContext.Provider>
      )}
      <AskAynaModal
        key={authUser?.id || 'anonymous'}
        open={askAynaOpen}
        seed={askSeed}
        enabled={!!authUser || !!(import.meta.env.DEV && new URLSearchParams(window.location.search).get('ask'))}
        profile={effectiveQuizAnswers}
        onProfileUpdate={(answers) => updateSession({ lastQuizAnswers: answers })}
        chatHistory={askAynaHistory}
        onChatHistoryUpdate={setAskAynaHistory}
        name={resolvedName}
        onNavigateToDiscovery={() => { setAskAynaOpen(false); setScreen('browse'); }}
        onViewRecommendations={() => { setAskAynaOpen(false); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
        onRequireAuth={(feature) => requestAuth(feature || 'Ask ayna', () => { setScreen(screen); setAskAynaOpen(true); })}
      />
    </div>
  );
}
