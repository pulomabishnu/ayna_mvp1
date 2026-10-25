import { useEffect, useMemo, useRef, useState } from 'react';
import { markOnboardingDone } from '../health/onboardingSignal.js';
import { trackApp, appScreenName } from './utils/appAnalytics.js';
import { navTabFor, aynaRoute, initialAppRoute } from './utils/navTab.js';
import { useRecommendationViews } from '../utils/recommendationAnalytics.js';
import './mobile.css';
import './editorial.css';
import './fresh.css';
import './figma.css';
import './cabinet.css';
import './reference-system.css';
import './tokens.css';
import './app-play.css';
import './no-focus-ring.css';
import { ALL_PRODUCTS, getProductById, getEcosystemAlternatives, getEcosystemSeedFromQuiz, filterPrescriptionCareGate, hydrateCatalogProduct, getSelectedNeeds, getProductMatchDetailsForProduct } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups.js';
import { loadProductCatalog } from '../utils/productCatalog.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadEcosystemForUser, upsertProductState, upsertProductsBatch, clearEcosystemForUser } from '../utils/ecosystemStore.js';
import { forYouPicks } from './utils/forYouPicks.js';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser, clearHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { behaviorFrom } from '../utils/matchDisplay.js';
import { ARTICLES } from '../components/Articles.jsx';
import { rankReadsForProfile, readFitsStage } from './utils/personalReads.js';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { useThemeMode } from './hooks/useThemeMode.js';
import { usePersonalizedFeed } from './hooks/usePersonalizedFeed.js';
import { usePushNotifications, usePushRoutes } from './hooks/usePushNotifications.js';
import { useHealthData, DEV_HEALTH_DEMO } from './hooks/useHealthData.js';
import { useTextSize } from './hooks/useTextSize.js';
import { useEcosystemSession } from './hooks/useEcosystemSession.js';
import { recordRoutineOutcome } from '../health/routineOutcome.js';
import { fromRoutineOutcomes, outcomesToProductHistory, readTries, saveTry, setTriesOwner } from '../health/outcomes.js';
import { syncUserData } from '../health/userDataSync.js';
import { productNotesFromRoutine, readGuide, saveGuide } from './utils/aynaGuide.js';
import { buildDashboard } from '../health/dashboard.js';
import { explainWeek, usesHormonalBC } from '../health/weekInsights.js';
import { weekSummary, NEVER_TO_LLM } from './utils/dashboardAsk.js';
import { useAskHealthPref } from '../health/askHealthPref.js';
import { LIVE_ONLY_SOURCES } from '../health/metrics.js';
import { useSupabaseAuth, MOBILE_OAUTH_PENDING_KEY } from './hooks/useSupabaseAuth.js';
import { fetchNotificationPreferences } from './utils/notificationPreferencesApi.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';
import { SOURCE_NAMES } from './data/healthConnections.js';
import { getNextArticle } from './utils/nextArticle.js';
import { INTAKE_DRAFT_KEY, getIntakeSteps, isStepAnswered, reconstructIntakeFromSnapshot } from './data/intakeModel.js';
import { clearIntakeDraft, readDraftProgress } from './data/quizDraftProgress.js';
import FinishQuizCard from '../components/FinishQuizCard.jsx';
import FeedbackPrompts from '../components/FeedbackPrompts.jsx';
import MobileTabBar from './components/MobileTabBar.jsx';
import AskAynaModal from './components/AskAynaModal.jsx';
import HomeSwitch from './components/HomeSwitch.jsx';
import './ayna-home.css';
import ProfileFlow, { AboutAynaScreen } from './screens/profile/ProfileFlow.jsx';

import LandingScreen from './screens/LandingScreen.jsx';
import AynaHomeScreen from './screens/AynaHomeScreen.jsx';
import AynaHomeChatScreen from './screens/AynaHomeChatScreen.jsx';
import { readHomeVariant } from './utils/homeVariant.js';
import { APP_TABS, APP_TABS_CHAT_FIRST } from '../components/nav/mainTabs.js';
import ExploreScreen from './screens/ExploreScreen.jsx';
import LibraryScreen from './screens/LibraryScreen.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import { ProductSheetContext } from './productSheetContext.js';
import { matchState as productMatchState } from '../utils/matchState.js';
import { useRundownCommunity } from './hooks/useRundownCommunity.js';
import ProductDetailScreen from './screens/ProductDetailScreen.jsx';
import ProductCard from './components/ProductCard.jsx';
import { readsForProduct, productsForRead, ROW_NOTES } from '../data/readLinks.js';
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
import { AskContext } from './askContext.js';
import MonthlyCheckinScreen from './screens/MonthlyCheckinScreen.jsx';
import CommunityScreen from './screens/CommunityScreen.jsx';
import QuizConnectScreen from './screens/QuizConnectScreen.jsx';
import ReadyScreen from './screens/ReadyScreen.jsx';
import PlanScreen from './screens/PlanScreen.jsx';
import CompareScreen from './screens/CompareScreen.jsx';
import SaveAuthSheet from '../components/save/SaveAuthSheet.jsx';
import { SaveFollowUpStrip } from '../components/save/SaveFollowUp.jsx';
import { savePrompt, stashPendingSave, takePendingSave } from '../utils/savePrompt.js';
import { setSavedRemindersOwner } from '../utils/savedReminders.js';
import { compareStore } from '../utils/compareStore.js';
import { addedToRoutineText, REMOVED_FROM_ROUTINE } from '../utils/routineCopy.js';
import { healthMatchContext } from '../health/matchContext.js';
import { useHealthMatchPref } from '../health/matchPref.js';
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
// Design direction (docs/design-direction.md): loaded last, outranks the layers above.
import './app-direction.css';
import './keyboardModality.js';
import { savedHaptic, addedHaptic } from '../utils/feedback.js';
import { useSheetDrag } from './hooks/useSheetDrag.js';
import PushLayer from './components/PushLayer.jsx';
import GlobalToast from '../components/v3/GlobalToast.jsx';
import { toast } from '../utils/toast.js';
// Motion moments (sheets, push, tab fade) and app-wide press states; last so it wins.
import './app-motion.css';
// Deep round 2 (Oct 21): native-feel fixes. Own file so it doesn't collide with
// the stylesheet consolidation on style/consolidate; loaded last.
import './app-polish-2.css';
// Oct 21-22 design language kit + the app pass (DESIGN_SYSTEM_OCT25); last so it wins.
import '../styles/ds.css';
import './ds-app.css';
import OfflineBanner from './components/OfflineBanner.jsx';
import TutorialLayer from './tutorial/TutorialLayer.jsx';
import { growTransition } from '../utils/viewTransition.js';

// Same real fallback chain used everywhere on desktop (App.jsx's
// accountMonogram, Hero.jsx's displayNameFromUser, EcosystemBubbles.jsx,
// ProfileChatbot.jsx), first_name is what OUR OWN email/password signup
// sets (see useSupabaseAuth.js), but Google's OAuth identity never sets
// it; Google instead populates given_name/full_name/name, which the old
// mobile-only `authUser.user_metadata?.first_name` read here ignored
// entirely, so a Google sign-in always fell through to "You" everywhere.
function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  // The name she typed (sign-up, or You > Account information) is kept as
  // typed: cutting it to its first word made an edit like "Mary Ann" turn
  // back into "Mary" on the next refresh, so the edit looked unsaved.
  const own = String(meta.first_name || meta.firstName || '').trim();
  if (own) return own;
  // Provider names (Google, Apple) are full names: use the first word.
  const raw = meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

const SCREENS = {
  landing: LandingScreen,
  // App tabs (founder, Oct 24 22:03; team sync Oct 25): Explore · Library ·
  // Home (centre) · Community · You. 'ayna' is Home: dashboard first on one
  // screen, with the chat and Products one tap away; ?home=chat shows the
  // chat-first Home for the focus group (AynaHomeChatScreen). The old 'today',
  // 'ask' and 'ayna' keys open it (navTab.js aynaRoute).
  // Explore's Products section keeps the 'browse' key, so its $screen name
  // (and the app dashboard) does not change. 'library' is a pushed screen
  // under Explore (founder, Oct 24 22:12: no Library tab), with Back.
  ayna: AynaHomeScreen,
  explore: ExploreScreen,
  browse: ExploreScreen,
  library: LibraryScreen,
  ecointro: EcosystemIntroScreen,
  quiz: IntakeScreen,
  building: BuildingScreen,
  reveal: RevealScreen,
  signin: SigninScreen,
  eco: EcosystemScreen,
  saved: SavedScreen,
  community: CommunityScreen,
  checkin: MonthlyCheckinScreen,
  connect: QuizConnectScreen,
  ready: ReadyScreen,
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
    // intakeGenerated: ayna picked it from her answers, she did not add it (QA M3; same flag as the website).
    return { ...p, areaKey: area ? area.key : null, needId: seedMeta?.[p.id]?.needId || null, intakeGenerated: true };
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

// Screens where the feedback survey may appear (never the quiz, sign-in or a sheet).
const APP_FEEDBACK_SCREENS = new Set(['landing', 'ayna', 'explore', 'eco', 'browse', 'library', 'saved']);

// What an account adds, said before asking her to sign in (team direction 56).
const AUTH_VALUE = {
  'Ask ayna': 'ayna’s AI answers this from your health profile and checked sources. A free account keeps your questions private to you. Questions about your matches, what helped before and your day already work without one.',
  'health data': 'Connecting Apple Health or Oura needs a free account, so your data stays tied to you and only you can see it.',
  playlists: 'Saving a list to Community needs a free account, so it is yours to share or keep private.',
};

// Screens that make no sense to return to after signing in.
const AUTH_NO_RETURN = new Set(['landing', 'signin', 'quiz', 'building', 'reveal', 'connect', 'checkin', 'plan']);

export default function MobileApp() {
  const { session, update: updateSession, reset: resetSession } = useEcosystemSession();
  const { hasEcosystem, myProducts: storedProducts, lastQuizAnswers, userName, omittedProducts = {} } = session;
  const myProducts = useMemo(() => storedProducts.map(hydrateCatalogProduct), [storedProducts]);
  // The welcome screen is the signed-out entry point. Returning accounts
  // move into their ecosystem once auth finishes restoring their session.
  // Returning on this phone (signed out too) with her profile or ecosystem
  // saved here, she lands on the ayna chat, never back on the first-run welcome.
  // Dashboard-first Home by default; ?home=chat (or the dev flag) shows the chat-first one.
  const [homeVariant] = useState(() => readHomeVariant());
  const chatFirst = homeVariant === 'chat';
  const [initialRoute] = useState(() => initialAppRoute({
    variant: homeVariant,
    devScreen: import.meta.env.DEV ? new URLSearchParams(window.location.search).get('screen') : null,
    pendingQuiz: Boolean(session.pendingQuiz),
    quizStep: session.pendingQuiz ? quizStepToResume() : null,
    hasProfile: Boolean(hasEcosystem || session.lastQuizAnswers),
    hasDraft: hasSavedIntakeDraft(),
  }));
  const [screen, setScreenRaw] = useState(initialRoute.screen);
  // Home's view: 'home' (one-screen dashboard), 'dashboard', 'chat', 'products'
  // (chat-first variant: 'chat', 'products', 'dashboard').
  const homeRoot = chatFirst ? 'chat' : 'home';
  const [homeView, setHomeView] = useState(initialRoute.view || homeRoot);
  // Every way in still works: 'today' and 'ayna' open Home, 'ask' the chat.
  const setScreen = (next) => {
    const r = aynaRoute(next, homeVariant);
    if (r.view) setHomeView(r.view);
    setScreenRaw(r.screen);
  };
  // Explore's section when it is not Products ('browse') or Resources ('library').
  const [exploreSection, setExploreSection] = useState('overview');
  const [planAddedGoals, setPlanAddedGoals] = useState({});
  const [hasIntakeDraft, setHasIntakeDraft] = useState(hasSavedIntakeDraft);
  // Product/article detail render as an overlay ON TOP of whichever base
  // screen (Browse, My ecosystem, Saved) is currently mounted, instead of
  // replacing it`screen` never changes when one opens. That's what makes
  // "back" free: the underlying screen was never unmounted, so its own
  // state (search text, personalized toggle, scroll position, infinite-
  // scroll pagination) is exactly as the user left it, not reset to a
  // fresh mount. Closing the overlay just reveals it again.
  const [overlay, setOverlay] = useState(() => { const t = import.meta.env.DEV && new URLSearchParams(window.location.search).get('overlay'); return t ? { type: t } : null; }); // { type: 'product' | 'article', item }
  // PostHog: one $screen per screen or overlay (the "Mobile App (TestFlight)"
  // dashboard breaks down by $screen_name), and a product open, logged the
  // same way as the website's product_card_opened. window.__aynaView lets an
  // app_error say which screen it happened on.
  const overlayType = overlay?.type || null;
  const overlayProductId = overlay?.type === 'product' ? overlay?.item?.id || null : null;
  const overlayProductCategory = overlay?.type === 'product' ? overlay?.item?.category || null : null;
  // The ayna tab's views keep the old $screen names (Ask and Today), so the
  // "Mobile App (TestFlight)" dashboard keeps counting; Products is new.
  const screenForAnalytics = screen === 'ayna' ? ({ home: 'today', chat: 'ask', dashboard: 'today', products: 'ayna_products' })[homeView] || 'today' : screen;
  useEffect(() => {
    const name = appScreenName(screenForAnalytics, overlayType);
    try { window.__aynaView = name; } catch { /* no window */ }
    // $screen_name keeps the old names where a screen moved (browse, library,
    // eco, profile), so the app dashboard keeps counting; nav_tab says which
    // of the five tabs it now sits under.
    trackApp('$screen', { $screen_name: name, nav_tab: navTabFor(screen, overlayType) || 'none', home_variant: homeVariant });
  }, [screenForAnalytics, screen, overlayType]);
  // recommendation_viewed: the products ayna matched to her needs (seeded with
  // a needId), on her Ecosystem screen, in shelf order.
  const ecoRecommended = (screen === 'eco' || (screen === 'ayna' && homeView === 'products')) && !overlayType ? myProducts.filter((p) => p?.needId) : null;
  useRecommendationViews(ecoRecommended, 'app_ecosystem');
  useEffect(() => {
    if (!overlayProductId) return;
    trackApp('product_card_opened', { productId: overlayProductId, category: overlayProductCategory });
  }, [overlayProductId, overlayProductCategory]);
  // Browser Back (the web preview, Android back): each screen or drill-in
  // she opens is one history step, so Back returns to the previous one in
  // the app instead of leaving the page. Overlay items stay in memory here
  // (not in history.state, which only holds an index).
  const navStackRef = useRef([]);
  const restoringRef = useRef(false);
  useEffect(() => {
    if (restoringRef.current) { restoringRef.current = false; return; }
    const stack = navStackRef.current;
    const last = stack[stack.length - 1];
    if (last && last.screen === screen && last.overlay === overlay && last.homeView === homeView) return;
    // Home's views are steps too: Back from the chat or Products returns to Home.
    stack.push({ screen, overlay, homeView });
    if (stack.length > 60) stack.splice(0, stack.length - 60);
    try {
      if (stack.length === 1) window.history.replaceState({ ...(window.history.state || {}), aynaNav: 0 }, '');
      else window.history.pushState({ aynaNav: stack.length - 1 }, '');
    } catch { /* history unavailable */ }
  }, [screen, overlay, homeView]);
  useEffect(() => {
    const onPop = () => {
      const stack = navStackRef.current;
      if (stack.length < 2) return;
      stack.pop();
      const prev = stack[stack.length - 1];
      restoringRef.current = true;
      setOverlay(prev.overlay);
      if (prev.homeView) setHomeView(prev.homeView);
      setScreenRaw(prev.screen);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Leaving something she opened: a history step back when that is where she
  // came from (so Back does not reopen it), else straight to `to`.
  const goBackTo = (to) => {
    const stack = navStackRef.current;
    const prev = stack[stack.length - 2];
    if (prev && prev.screen === aynaRoute(to).screen && !prev.overlay) { try { window.history.back(); return; } catch { /* fall through */ } }
    setScreen(to);
  };
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
  // 'more': the optional setup questions, opened from the reveal (ReadyScreen).
  const [intakeFlow, setIntakeFlow] = useState('auto');
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
  const closeAuthSheetNow = () => { setOverlay(null); setAuthPrompt(null); authResumeRef.current = null; };
  const authSheet = useSheetDrag(closeAuthSheetNow);
  const closeAuthSheet = () => authSheet.close();
  const authSheetOpen = overlay?.type === 'profile-auth' || !!authPrompt;
  useEffect(() => {
    if (!authSheetOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeAuthSheetNow(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  // Tab switches cross-fade in 120ms (never slide); drill-ins push (PushLayer).
  const rootRef = useRef(null);
  const prevScreenRef = useRef(screen);
  useEffect(() => {
    const TABS = ['ayna', 'explore', 'eco', 'ecointro', 'browse', 'library', 'community', 'saved'];
    const was = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (was === screen || !TABS.includes(screen) || !TABS.includes(was)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    rootRef.current?.firstElementChild?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' });
  }, [screen]);
  const swipeStart = useRef(null);
  const handleMainTouchStart = (event) => {
    // Home (its dashboard view) and Explore, the first two tabs; never on the chat.
    const onHomeRoot = screen === 'ayna' && homeView === (chatFirst ? 'dashboard' : 'home');
    if (overlay || !(onHomeRoot || ['browse', 'explore'].includes(screen)) || event.touches.length !== 1) return;
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
    // Swipe between the first two tabs, Home and Explore.
    if (screen === 'ayna' && dx < 0) { setExploreSection('overview'); setScreen('explore'); }
    if ((screen === 'explore' || screen === 'browse') && dx > 0) { setHomeView(homeRoot); setScreenRaw('ayna'); }
  };
  const { user: realAuthUser, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();
  // DEVELOPMENT ONLY: a stand-in signed-in user for the ?healthdemo=1 preview. Never in production.
  const authUser = realAuthUser || (DEV_HEALTH_DEMO ? DEV_DEMO_USER : null);
  const [guideState, setGuideState] = useState({ userId: null, value: null });
  const guide = useMemo(() => guideState.userId === authUser?.id && guideState.value ? guideState.value : readGuide(authUser?.id), [guideState, authUser?.id]);
  const updateGuide = (next) => {
    if (!authUser?.id) return;
    setGuideState({ userId: authUser.id, value: next });
    saveGuide(authUser.id, next);
  };
  const [loadedAccountId, setLoadedAccountId] = useState(null);
  useEffect(() => {
    if (authLoading || !authUser || screen !== 'landing') return;
    Promise.resolve().then(() => setScreen('ayna'));
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
    if (lastQuizAnswers && !authUser) { setRevealFrom(AUTH_NO_RETURN.has(screen) ? 'ayna' : screen); setRevealAtEnd(true); setScreen('reveal'); return; }
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
  // Signed out, Save first says what an account is for (team direction 22):
  // Continue signs in and finishes the save; she can keep it on this phone too.
  const [saveSheet, setSaveSheet] = useState(null);
  const finishSave = (product) => {
    toggleSaved(product);
    savedHaptic(); markPushMoment();
    // "Remind me later · Compare" next to what she saved (inline on its page).
    savePrompt.show(product);
  };
  const handleToggleSaved = (product) => {
    const adding = !savedMap[product?.id];
    if (adding && !authUser) { setSaveSheet(product); return; }
    if (adding) { finishSave(product); return; }
    toggleSaved(product);
    savePrompt.hide();
    toast('Removed from Saved', { label: 'Undo', onClick: () => finishSave(product) });
  };
  const openCompare = (product = null) => {
    if (product?.id) compareStore.add(product);
    compareStore.setSelecting(false);
    setOverlay({ type: 'compare' });
  };
  const openCompareRef = useRef(openCompare);
  openCompareRef.current = openCompare;
  useEffect(() => compareStore.setOpener(() => openCompareRef.current()), []);
  useEffect(() => {
    if (!saveNudge) return undefined;
    const t = setTimeout(() => setSaveNudge(false), 6000);
    return () => clearTimeout(t);
  }, [saveNudge]);
  useEffect(() => { if (authUser) Promise.resolve().then(() => setSaveNudge(false)); }, [authUser]);
  useEffect(() => { setSavedRemindersOwner(authUser?.id || null); }, [authUser?.id]);
  // A save she started signed out finishes once she is signed in.
  useEffect(() => {
    if (!authUser?.id || authLoading) return;
    const pending = takePendingSave();
    if (pending && !savedMap[pending.id]) Promise.resolve().then(() => finishSave(pending));
  }, [authUser?.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  const [browseQuery, setBrowseQuery] = useState('');
  // Behavior signals for the matching engine (saved, "Not for me", in her
  // Ecosystem). Memoized: the engine caches profiles by this object.
  const baseMatchOpts = useMemo(
    () => behaviorFrom({ saved: savedMap, omitted: omittedProducts, inEcosystem: myProducts }),
    [savedMap, omittedProducts, myProducts]
  );
  const { theme, resolvedTheme, setThemeMode } = useThemeMode();
  const [personalized, setPersonalized] = usePersonalizedFeed(authUser?.id);
  // Push permission is asked in context: after her first save or add, never
  // on launch (iOS only for now). Registration only, nothing sends a push yet.
  const [askPush, setAskPush] = useState(() => { try { return localStorage.getItem('ayna_push_asked_v1') === '1'; } catch { return false; } });
  const markPushMoment = () => { if (askPush) return; try { localStorage.setItem('ayna_push_asked_v1', '1'); } catch { /* storage blocked */ } setAskPush(true); };
  usePushNotifications(authUser?.id, askPush);
  // A tapped notification opens Today, or the product a recall alert is about.
  usePushRoutes((route) => {
    setAskAynaOpen(false);
    if (route.screen === 'today') { setOverlay(null); setScreen('today'); return; }
    if (route.screen === 'product') {
      const item = getProductById(route.productId) || ALL_PRODUCTS.find((p) => String(p.id) === route.productId);
      if (item) setOverlay({ type: 'product', item: hydrateCatalogProduct(item) });
    }
  });
  const { textSizeIndex, setTextSizeIndex, textScale } = useTextSize();
  const [askAynaOpen, setAskAynaOpen] = useState(() => !!(import.meta.env.DEV && new URLSearchParams(window.location.search).get('ask')));
  const [askAynaHistoryState, setAskAynaHistoryState] = useState({ userId: null, messages: [] });
  const [askSeed, setAskSeed] = useState(null);
  // The end-of-rundown questions, as the chat's starters for this session (founder, Oct 24 20:12).
  const [askStarters, setAskStarters] = useState([]);
  // Text for the chat box from a Siri / Shortcuts link (co.aynahealth.app://ask?q=...).
  const [askDraft, setAskDraft] = useState(null);
  // The quick product sheet over the Rundown or the chat (ProductSheet.jsx).
  const [sheetProduct, setSheetProduct] = useState(null);
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
  // "Update life stages" (Ecosystem): the quiz opens on the life stage question.
  const [intakeAtStep, setIntakeAtStep] = useState('');
  const [revealAtEnd, setRevealAtEnd] = useState(false);
  // Where a replayed story was opened from: leaving it goes back there
  // (team direction 35), never into setup. Null for the first-run story.
  const [revealFrom, setRevealFrom] = useState(null);
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
    // (Not for the reveal's optional questions: those add to the answers she just gave.)
    if (screen === 'quiz' && session.pendingQuiz && intakeFlow !== 'more') updateSession({ pendingQuiz: null });
  }, [screen, session.pendingQuiz, updateSession, intakeFlow]);
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
    if (screen !== 'quiz' && intakeAtStep) Promise.resolve().then(() => setIntakeAtStep(''));
  }, [screen, intakeAtOptional, intakeAtStep]);
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
      if (remoteProducts.length > 0 && !session.pendingQuiz) setScreen('ayna');
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

  const Screen = screen === 'ayna' && chatFirst ? AynaHomeChatScreen : SCREENS[screen] || LandingScreen;

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
  const guideRecap = useMemo(() => {
    if (!authUser?.id || !personalizeWithData) return '';
    const sections = health.insights?.sections || [];
    const ready = sections.filter((section) => section.status === 'ready');
    const today = new Date().toLocaleDateString('en-CA');
    const week = buildDashboard(health.insightRows || [], { days: 30, today });
    const estimate = sections.find((section) => section.id === 'cycle')?.estimate || null;
    const explained = explainWeek(health.insightRows || [], { today, cycle: week.cycle?.cycleDay ? week.cycle : null, estimate, hormonalBC: usesHormonalBC(effectiveQuizAnswers), max: 2 });
    return explained.insights.length ? explained.insights.map((insight) => insight.text).join(' ') : weekSummary(ready) || '';
  }, [authUser?.id, personalizeWithData, health.insights, health.insightRows, effectiveQuizAnswers]);
  const guideSources = personalizeWithData ? [...new Set((health.insights?.sections || []).filter((section) => section.status === 'ready').flatMap((section) => section.sources || []))].map((source) => SOURCE_NAMES[source] || source).join(', ') : '';
  const guideRecapExportable = !(health.insights?.sections || []).some((section) => section.status === 'ready' && (section.sources || []).some((source) => LIVE_ONLY_SOURCES.includes(source)));
  // The recap may go to Ask ayna only with her opt-in, and never when any of it
  // came from Oura or WHOOP (their terms; src/health/policy.js).
  const askHealthPref = useAskHealthPref(authUser?.id || null);
  const guideRecapAskable = askHealthPref.on && !(health.insights?.sections || []).some((section) => section.status === 'ready' && (section.sources || []).some((source) => NEVER_TO_LLM.has(source)));
  // Her own switch for health data in matches (Preferences and Health data), shared with the website.
  const healthInMatches = useHealthMatchPref(authUser?.id || null).on;
  const healthDataOn = personalizeWithData && healthInMatches;
  const healthContext = healthDataOn ? health.matchContext : null;
  // Apple Health Records she saved on this phone: allergies and medicines for
  // safety, conditions as context. Never sent anywhere.
  const healthRecords = personalizeWithData ? health.records : null;
  // What she reported trying (routine check-ins and tries, src/health/outcomes.js).
  // Only recorded outcomes count; "Worse" and "Side effect" move that product down.
  const routineOutcomesForUser = authUser?.id ? session.routineOutcomesByUser?.[authUser.id] : null;
  const outcomeHistory = useMemo(() => {
    if (!authUser?.id) return null;
    const history = outcomesToProductHistory([...fromRoutineOutcomes(routineOutcomesForUser || {}, ALL_PRODUCTS), ...readTries()], ALL_PRODUCTS);
    return history.length ? history : null;
  }, [authUser?.id, routineOutcomesForUser]);
  const matchOpts = useMemo(() => {
    if (!healthContext && !healthRecords && !outcomeHistory) return baseMatchOpts;
    return { ...baseMatchOpts, ...(healthContext ? { healthContext } : {}), ...(healthRecords ? { healthRecords } : {}), ...(outcomeHistory ? { outcomeHistory } : {}) };
  }, [baseMatchOpts, healthContext, healthRecords, outcomeHistory]);
  const suggestedEcosystemProducts = useMemo(() => {
    if (!effectiveQuizAnswers) return [];
    // Only what she added herself is left out (utils/forYouPicks.js).
    return forYouPicks(seedEcosystemFromAnswers(effectiveQuizAnswers, matchOpts), myProducts, 6);
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
    () => (healthDataOn && health.matchSignals?.length ? healthMatchContext(health.matchSignals, pendingNeedIds) : null),
    [healthDataOn, health.matchSignals, pendingNeedIds],
  );
  // Same behavior inputs the quiz always seeded with ("Not for me" only), plus health context.
  const planBaseOpts = useMemo(() => behaviorFrom({ omitted: omittedProducts }), [omittedProducts]);
  const planMatchOpts = useMemo(() => ({
    ...planBaseOpts,
    ...(planHealthContext ? { healthContext: planHealthContext } : {}),
    ...(healthRecords ? { healthRecords } : {}),
    ...(outcomeHistory ? { outcomeHistory } : {}),
  }), [planBaseOpts, planHealthContext, healthRecords, outcomeHistory]);
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
      setScreen('ayna');
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
    setAskStarters([]);
    setSheetProduct(null);
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
      toast(REMOVED_FROM_ROUTINE, { label: 'Undo', onClick: () => addToEcosystemRef.current?.(product) });
      return;
    }

    trackApp('product_added', { productId: product.id, category: product.category, type: product.type });
    const area = resolveEcosystemProductArea(product, REAL_ECOSYSTEM_AREAS);
    const ecosystemProduct = {
      ...product,
      areaKey: product.areaKey || area?.key || null,
      // She added it herself, so it is hers even if ayna suggested it first.
      intakeGenerated: false,
      userAdded: true,
    };

    addedHaptic();
    markPushMoment();
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
    } else {
      toast(addedToRoutineText());
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

  // One quiz answer changed in place (You > Your blend). Same save path as the
  // quiz; matches re-rank from the new answers. Rolls back if nothing saved.
  const handleUpdateIntake = async (nextIntake) => {
    if (!nextIntake) return false;
    const previous = lastQuizAnswers;
    updateSession({ lastQuizAnswers: mapIntakeToLegacyQuizProfile(nextIntake) });
    try {
      const r = await saveHealthIntakeForCurrentUser(nextIntake);
      if (r?.saved || r?.localSaved) return true;
    } catch { /* rolled back below */ }
    updateSession({ lastQuizAnswers: previous });
    return false;
  };

  // Undo in a toast runs after later renders, so it calls the latest handler.
  const addToEcosystemRef = useRef(null);
  addToEcosystemRef.current = handleAddToEcosystem;

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
      updateSession({ myProducts: [], lastQuizAnswers: null, hasEcosystem: false, pendingIntakeSync: false, pendingQuiz: null, routineHave: {}, routineExcluded: {}, routineOutcomesByUser: {} });
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
  // new matches for it join her ecosystem. Nothing is added without the tap.
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
    setEcosystemNotice(added.length ? `Added ${label} to your goals. ${added.length} new match${added.length === 1 ? '' : 'es'} in your ecosystem.` : `Added ${label} to your goals. No new strong matches for it yet.`);
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
    // One request for all products instead of one per product.
    const added = await communityStore.addManyToPlaylist(supabase, playlist.id, productIds);
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
    onReplayStory: () => { setRevealFrom(screen); setRevealAtEnd(false); setScreen('reveal'); },
    // Leaving a replayed story: back to where she opened it.
    onExitStory: revealFrom ? () => { const to = revealFrom; setRevealFrom(null); goBackTo(to); } : null,
    // An Ecosystem shelf's "Shop" passes its need label as the search.
    onBrowse: (query) => { setBrowseQuery(typeof query === 'string' ? query : ''); setScreen('browse'); },
    onGoCommunity: () => { setCommunitySeed(null); setScreen('community'); },
    onOpenSaved: () => setScreen('saved'),
    onOpenCompare: openCompare,
    onToggleOmit: handleToggleOmit,
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoToday: () => setScreen('today'),
    exploreSection: screen === 'browse' ? 'products' : screen === 'library' ? 'resources' : exploreSection,
    onExploreSection: (key, search = '') => {
      if (key === 'products') { setBrowseQuery(search || ''); setScreen('browse'); return; }
      if (key === 'resources') { setScreen('library'); return; }
      setExploreSection(key);
      setScreen('explore');
    },
    onOpenCommunityPost: (postId) => { setOverlay(null); setCommunitySeed({ postId, token: Date.now() }); setScreen('community'); },
    onOpenCommunitySeed: (seed) => { setOverlay(null); setCommunitySeed({ ...(seed || {}), token: Date.now() }); setScreen('community'); },
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => growTransition(() => setOverlay({ type: 'product', item: p }), { target: 'product', from: 'img' }),
    onOpenArticle: (a) => {
      setReadArticleIds((ids) => ids.includes(a.id) ? ids : [...ids, a.id]);
      setOverlay({ type: 'article', item: a });
    },
    onOpenProfile: openProfile,
    onOpenHealthData: () => { if (authUser) setOverlay({ type: 'profile', screen: health.insights.sections.length ? 'healthInsights' : 'healthData' }); else openProfile(); },
    healthSummary: authUser ? health.insights.sections.find((sec) => sec.status === 'ready') || null : null,
    healthConnectedCount: health.connected.length,
    healthSuggestions: healthDataOn && authUser ? health.matchContext?.suggestions || [] : [],
    healthInsights: healthInsightsForPlan,
    onAddGoal: handleAddGoal,
    // Today: open one quiz question, or save a quick answer she chose to keep (signed in).
    onEditIntakeStep: (step) => { setIntakeMode('add'); setIntakeAtOptional(false); setIntakeAtStep(step || 'lifeStage'); setEditingHealthProfile(true); setScreen('quiz'); },
    onUpdateIntake: authUser ? handleUpdateIntake : null,
    routineHave: session.routineHave || {},
    routineExcluded: session.routineExcluded || {},
    routineOutcomes: authUser?.id ? session.routineOutcomesByUser?.[authUser.id] || {} : {},
    onLogRoutineOutcome: authUser?.id ? (productId, rating) => {
      updateSession((prev) => ({
        routineOutcomesByUser: {
          ...(prev.routineOutcomesByUser || {}),
          [authUser.id]: recordRoutineOutcome(prev.routineOutcomesByUser?.[authUser.id] || {}, productId, rating),
        },
      }));
      // The same check-in as a try, so it reaches her account (src/health/outcomes.js).
      const next = recordRoutineOutcome(session.routineOutcomesByUser?.[authUser.id] || {}, productId, rating);
      const asTry = fromRoutineOutcomes({ [productId]: next[productId] }, ALL_PRODUCTS)[0];
      if (asTry) { setTriesOwner(authUser.id); saveTry(asTry); syncUserData({ userId: authUser.id, force: true }).catch(() => {}); }
    } : null,
    onToggleRoutineProduct: (id) => updateSession((prev) => {
      const next = { ...(prev.routineExcluded || {}) };
      if (next[id]) delete next[id]; else next[id] = true;
      return { routineExcluded: next };
    }),
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
      if (opts && typeof opts.question === 'string') setAskSeed({ id: Date.now(), question: opts.question, context: typeof opts.context === 'string' ? opts.context : '', buildContext: typeof opts.buildContext === 'function' ? opts.buildContext : null, usesHealth: opts.usesHealth === true, stats: Array.isArray(opts.stats) ? opts.stats.slice(0, 3) : null });
      // On Home the chat is one of its views: open it there instead of a sheet.
      if (screen === 'ayna' && !overlay) { setAskAynaOpen(false); setHomeView('chat'); return; }
      // Signed out too: the guided chat opens, answers what it can on this
      // phone, and asks to sign in only for questions that need the AI.
      setAskAynaOpen(true);
    },
    onBack: () => {
      // The Library is pushed from Explore (or a link): Back returns where she came from.
      if (screen === 'library') { if (navStackRef.current.length > 1) { try { window.history.back(); return; } catch { /* fall through */ } } setScreen('explore'); return; }
      if (screen === 'quiz' && intakeFlow === 'more') { setIntakeFlow('auto'); setScreen('ready'); return; }
      if (screen === 'reveal' && revealFrom) { const to = revealFrom; setRevealFrom(null); goBackTo(to); return; }
      if (['building', 'reveal', 'connect'].includes(screen)) {
        resumeQuizAtLastStep();
        return;
      }
      if (screen === 'plan') { setScreen(session.pendingQuiz?.fromCheckin ? 'today' : 'connect'); return; }
      // My ecosystem sits under You: its back goes to You.
      if (screen === 'eco' || screen === 'saved' || (screen === 'ecointro' && authUser)) { openProfile(); return; }
      setScreen(screen === 'quiz' ? (authUser || hasEcosystem ? 'ayna' : 'landing') : screen === 'ecointro' ? 'landing' : authUser || hasEcosystem ? 'ayna' : 'landing');
    },
    onRetake: () => { setIntakeMode('add'); setIntakeAtOptional(false); setEditingHealthProfile(true); setScreen('quiz'); },
    onPersonalize: () => { setIntakeMode('add'); setIntakeAtOptional(true); setEditingHealthProfile(true); setScreen('quiz'); },
    onFixLifeStages: () => { setIntakeMode('add'); setIntakeAtOptional(false); setIntakeAtStep('lifeStage'); setEditingHealthProfile(true); setScreen('quiz'); },
    onRequestEcosystemReset: () => setResetDialogOpen(true),
    onUpdateHealth: () => { setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); },
    onEditProfile: () => { setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); },
    onComplete: (quizAnswers) => {
      // The reveal's optional questions: back to the reveal with the fuller answers.
      if (intakeFlow === 'more') {
        updateSession((prev) => ({ pendingQuiz: { ...(prev.pendingQuiz || { mode: 'new' }), answers: quizAnswers } }));
        setIntakeFlow('auto');
        setScreen('ready');
        return;
      }
      // Not saved as her answers yet: first the optional health step, then her plan.
      trackApp('intake_completed', {
        concernsCount: Array.isArray(quizAnswers?.primaryConcerns) ? quizAnswers.primaryConcerns.length : 0,
        mode: intakeMode,
      });
      updateSession({ pendingQuiz: { answers: quizAnswers, mode: intakeMode } });
      setPlanAddedGoals({});
      setResumeQuizDraft(false);
      setIntakeAtOptional(false);
      setIntakeMode('new');
      // First run: health data (step 7), then the reveal. Edits keep the plan step.
      setScreen(authUser && health.connected.length ? (intakeMode === 'new' ? 'ready' : 'plan') : 'connect');
    },
    // Monthly check-in: she already has an account and an ecosystem, so it
    // goes straight to her updated plan instead of back through the
    // onboarding "Connect your health data" step (deep round 2).
    onCheckinComplete: (quizAnswers) => {
      trackApp('intake_completed', { concernsCount: Array.isArray(quizAnswers?.primaryConcerns) ? quizAnswers.primaryConcerns.length : 0, mode: 'checkin' });
      updateSession({ pendingQuiz: { answers: quizAnswers, mode: 'add', fromCheckin: true } });
      setPlanAddedGoals({});
      setResumeQuizDraft(false);
      setIntakeAtOptional(false);
      setIntakeMode('new');
      setScreen('plan');
    },
    onQuizConnectContinue: () => setScreen(session.pendingQuiz?.mode === 'new' ? 'ready' : 'plan'),
    // The reveal (ReadyScreen): "See my Today" saves her first matches the
    // same way "See my matches" does, then opens Today instead of the story.
    onSeeMyToday: () => { nav.onSeeMatches(); markOnboardingDone(); setScreen('today'); },
    onReadyCreateAccount: () => { authResumeRef.current = null; authReturnScreenRef.current = 'ready'; setAuthMode('signup'); setScreen('signin'); },
    onReadyBack: () => setScreen('connect'),
    onMakeMorePersonal: () => { setIntakeFlow('more'); setScreen('quiz'); },
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
          ? `${addedProducts.length} new product${addedProducts.length === 1 ? '' : 's'} added. Your existing ecosystem stayed in place.`
          : 'No new strong matches this time. Your existing ecosystem stayed in place.');
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
    onFinish: () => { setRevealFrom(null); setRevealAtEnd(false); setScreen('reveal'); },
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
      // Back to where she signed in from (Community invites, Saved, Today...), not always the
      // first tab: signing in should never move her away from what she was doing (team direction 55).
      else if (authReturnScreenRef.current && !AUTH_NO_RETURN.has(authReturnScreenRef.current)) setScreen(authReturnScreenRef.current);
      else setScreen('ayna');
    },
    hasEcosystem,
  };

  // The chat from Home is full screen (Back returns to Home), so no tab bar there.
  const chatFullScreen = screen === 'ayna' && !chatFirst && homeView === 'chat' && !askAynaOpen && !overlay;
  const showTabBar = !chatFullScreen && !['landing', 'quiz', 'building', 'reveal', 'signin', 'checkin', 'connect', 'plan', 'ready'].includes(screen) && (!overlay || ['profile', 'profile-auth', 'product', 'article', 'why-match'].includes(overlay.type));
  // Deep round 2: the tab bar stays on drilled-in screens (product, read, why
  // this match), as in iOS; tapping a tab pops back to that tab's root.
  // Reads ranked from her app answers (personalReads.js): matching reads
  // first, reads for another life stage (e.g. menopause at 24) last.
  const rankedEcosystemReads = rankReadsForProfile(ARTICLES, effectiveQuizAnswers);
  const ecosystemReads = rankedEcosystemReads
    .filter((article) => !readArticleIds.includes(article.id))
    .concat(rankedEcosystemReads.filter((article) => readArticleIds.includes(article.id)))
    .slice(0, 3);
  const activeTab = navTabFor(screen, overlay?.type);

  // "New in Community" for the Daily Rundown: real public posts for her topics and follows.
  const rundownCommunity = useRundownCommunity(authUser?.id || null, effectiveQuizAnswers);
  // The Daily Rundown ended (or she closed it): its questions become the chat's
  // starters; finishing it lands her in the chat (founder, Oct 24 20:12), X
  // mid-story stays on Home (QA, Oct 25: toChat is false then).
  const handleRundownFinish = ({ starters = [], toChat = false } = {}) => {
    setAskStarters(Array.isArray(starters) ? starters.slice(0, 3) : []);
    if (!toChat) return;
    setOverlay(null);
    setAskAynaOpen(false);
    setAskSeed(null);
    setHomeView('chat');
    setScreenRaw('ayna');
  };
  // Siri and Shortcuts (when the iOS App Intent lands, see the report):
  // co.aynahealth.app://ask opens the chat; ?q= puts the question in the box.
  useEffect(() => {
    let remove = null;
    let live = true;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appUrlOpen', ({ url }) => {
          const m = /^co\.aynahealth\.app:\/\/ask\/?(?:\?(.*))?$/i.exec(String(url || ''));
          if (!m) return;
          let q = '';
          try { q = new URLSearchParams(m[1] || '').get('q') || ''; } catch { q = ''; }
          setOverlay(null);
          setAskAynaOpen(false);
          setSheetProduct(null);
          setHomeView('chat');
          setScreenRaw('ayna');
          if (q) setAskDraft({ id: Date.now(), text: q });
        });
        if (live) remove = handle; else handle.remove();
      } catch { /* not native */ }
    })();
    return () => { live = false; remove?.remove?.(); };
  }, []);
  const sheetValue = {
    open: (product) => { if (product?.id) setSheetProduct(product); },
    isOpen: Boolean(sheetProduct),
    isSaved: (id) => isSaved(id),
    toggleSaved: (product) => handleToggleSaved(product),
    inRoutine: (id) => myProducts.some((p) => p.id === id),
    addToRoutine: (product) => handleAddToEcosystem(product),
    matchStateFor: (product) => productMatchState(product, effectiveQuizAnswers, matchOpts),
    // The same engine inputs as every other card, for the product card inside the Rundown.
    quizAnswers: effectiveQuizAnswers,
    matchOpts,
  };

  if (authLoading || (authUser?.id && !DEV_HEALTH_DEMO && loadedAccountId !== authUser.id)) {
    return <div className="ayna-mobile" data-theme={resolvedTheme} style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', background: 'var(--ayna-bg)' }} role="status" aria-live="polite"><div style={{ textAlign: 'center', color: 'var(--ayna-heading)' }}><div style={{ fontFamily: "var(--ayna-font-display)", fontSize: 34 }}>ayna</div><p style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>Opening your ecosystem…</p></div></div>;
  }

  return (
    <div ref={rootRef} className="ayna-mobile" data-theme={resolvedTheme} data-screen={screen} data-preview={window.location.pathname === '/mobile-preview' ? 'true' : undefined} style={{ '--ayna-text-scale': textScale }} onTouchStart={handleMainTouchStart} onTouchEnd={handleMainTouchEnd}>
      <ProductSheetContext.Provider value={sheetValue}>
      <AskContext.Provider value={nav.onAskAyna}>
      <Screen
        key={screen === 'community' ? communitySeed?.token || 'community' : screen === 'signin' ? `signin-${authMode}` : screen === 'browse' && browseQuery ? `browse-${browseQuery}` : screen}
        {...nav}
        {...(screen === 'checkin' ? { onComplete: nav.onCheckinComplete } : {})}
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
        flow={screen === 'quiz' ? intakeFlow : undefined}
        initialSnapshot={intakeFlow === 'more' ? session.pendingQuiz?.answers?.fullHealthIntake || null : editingHealthProfile && !resumeQuizDraft ? lastQuizAnswers?.fullHealthIntake || null : null}
        startAtBeginning={intakeMode === 'add' && !resumeQuizDraft && !intakeAtOptional && editingHealthProfile}
        startAtOptional={intakeAtOptional && !resumeQuizDraft}
        startAtStep={intakeAtStep && !resumeQuizDraft ? intakeAtStep : ''}
        introEnabled={!resumeQuizDraft && !intakeAtOptional && !intakeAtStep}
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
        homeView={homeView}
        onHomeView={(v) => { setAskAynaOpen(false); setHomeView(v); }}
        healthInsightRows={health.insightRows || []}
        rundownCommunity={rundownCommunity}
        onRundownFinish={handleRundownFinish}
        recentAsks={screen === 'ayna' ? askAynaHistory : undefined}
      />
      </AskContext.Provider>
      {newAccountStart && authUser && !['quiz', 'building', 'connect', 'plan', 'ready'].includes(screen) && (
        <NewAccountStart
          name={resolvedName}
          onStart={() => { setNewAccountStart(false); startEcosystemFlow(); }}
          onSignOut={() => { setNewAccountStart(false); handleSignOut(); }}
          onClose={() => setNewAccountStart(false)}
        />
      )}
      {showTabBar && <MobileTabBar
        active={activeTab}
        onExplore={() => { setAskAynaOpen(false); setOverlay(null); setBrowseQuery(''); setExploreSection('overview'); setScreen('explore'); }}
        // Home always opens on its root (the dashboard, or the chat in the chat-first variant).
        onHome={() => { setHomeView(homeRoot); setAskAynaOpen(false); setOverlay(null); setAskSeed(null); setScreenRaw('ayna'); }}
        tabList={chatFirst ? APP_TABS_CHAT_FIRST : APP_TABS}
        onCommunity={() => { setAskAynaOpen(false); setOverlay(null); setCommunitySeed(null); setScreen('community'); }}
        // You opens for everyone: signed out it says what an account keeps, and Settings still works.
        onProfile={() => { setAskAynaOpen(false); authResumeRef.current = null; setOverlay({ type: 'profile' }); }}
      />}
      {saveNudge && !authUser && (
        <div className="ay-save-nudge" role="status">
          <span>{saveNudge === 'eco' ? 'Added to your routine on this phone. Sign in to keep it on every device.' : 'Saved on this phone. Sign in to keep your saves on every device.'}</span>
          <button type="button" onClick={() => { setSaveNudge(false); openAuth('signin'); }}>Sign in</button>
          <button type="button" className="ay-save-nudge-x" aria-label="Dismiss" onClick={() => setSaveNudge(false)}><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
      )}
      {!overlay && !authPrompt && <SaveFollowUpStrip onCompare={openCompare} variant="app" />}
      {saveSheet && (
        <SaveAuthSheet
          product={saveSheet}
          onContinue={() => { stashPendingSave(saveSheet); setSaveSheet(null); openAuth('signin'); }}
          onKeepHere={() => { const p = saveSheet; setSaveSheet(null); finishSave(p); }}
          onClose={() => setSaveSheet(null)}
        />
      )}
      <EcosystemResetDialog open={resetDialogOpen} busy={resettingEcosystem} onCancel={() => setResetDialogOpen(false)} onConfirm={handleResetEcosystem} />
      {(overlay?.type === 'profile-auth' || authPrompt) && (
        <div className="ayna-profile-auth-backdrop ay-sheet-dim" style={authPrompt ? { zIndex: 100, bottom: 0 } : undefined} onClick={closeAuthSheet}>
          <section ref={authSheet.sheetRef} className="ayna-profile-auth-sheet ay-sheet-in" role="dialog" aria-modal="true" aria-labelledby="ayna-profile-auth-title" onClick={(event) => event.stopPropagation()}>
            <button {...authSheet.grabberProps} aria-label="Close sign in" />
            <button type="button" className="ayna-profile-auth-close" aria-label="Close" onClick={closeAuthSheet}><svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
            <h2 id="ayna-profile-auth-title">{authPrompt ? `Sign in for ${authPrompt.feature}` : 'Sign in to ayna'}</h2>
            {authPrompt && AUTH_VALUE[authPrompt.feature] && <p className="ayna-profile-auth-why">{AUTH_VALUE[authPrompt.feature]}</p>}
            <button type="button" className="ayna-profile-auth-primary" onClick={() => openAuth('signin', !!authPrompt)}>Sign in</button>
            {!authPrompt && quizDraft && <FinishQuizCard progress={quizDraft} onContinue={resumeQuiz} onStartOver={startQuizOver} />}
            {!(quizDraft && !authPrompt) && <button type="button" className="ayna-profile-auth-new" onClick={startEcosystemFlow}>{hasEcosystem || lastQuizAnswers ? <>New here? <b>Keep your profile and matches with a free account</b></> : <>Don’t have an account? <b>Set up my ayna</b></>}</button>}
          </section>
        </div>
      )}
      {overlay?.type === 'about' && <PushLayer zIndex={80} onBack={() => setOverlay(null)}><AboutAynaScreen onBack={() => setOverlay(null)} /></PushLayer>}
      {overlay?.type === 'product' && (
        <PushLayer key={`p-${overlay.item?.id}`} onBack={() => setOverlay(null)}>
          <ProductDetailScreen
            product={overlay.item}
            onBack={() => setOverlay(null)}
            isSaved={isSaved(overlay.item?.id)}
            onToggleSaved={() => handleToggleSaved(overlay.item)}
            isInEcosystem={myProducts.some((p) => p.id === overlay.item?.id)}
            onAddToEcosystem={() => handleAddToEcosystem(overlay.item)}
            isOmitted={!!omittedProducts[overlay.item?.id]}
            onToggleOmit={() => handleToggleOmit(overlay.item)}
            onCompare={openCompare}
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
            onFixSafety={(step) => { setOverlay(null); nav.onEditIntakeStep(step); }}
            onStartQuiz={() => { returnProductRef.current = overlay.item || null; setOverlay(null); setIntakeMode(hasEcosystem ? 'add' : 'new'); setEditingHealthProfile(hasEcosystem); setScreen('quiz'); }}
            authUser={authUser}
            onRequireAuth={(feature) => requestAuth(feature || 'Ask ayna', () => { setScreen(screen); setOverlay({ type: 'product', item: overlay.item }); })}
            quizAnswers={effectiveQuizAnswers}
            ecosystemProducts={myProducts}
            onOpenProduct={(item) => growTransition(() => setOverlay({ type: 'product', item }), { target: 'product', from: 'img' })}
            reads={readsForProduct(overlay.item, 3).map((r) => {
              const article = ARTICLES.find((x) => x.id === r.id);
              return article ? { id: r.id, title: r.title, onClick: () => { setReadArticleIds((ids) => (ids.includes(r.id) ? ids : [...ids, r.id])); setOverlay({ type: 'article', item: article }); } } : null;
            }).filter(Boolean)}
            theme={theme}
            onToggleTheme={setThemeMode}
          />
        </PushLayer>
      )}
      {overlay?.type === 'article' && (
        <PushLayer key={`a-${overlay.item?.id}`} onBack={() => setOverlay(null)}>
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
            products={productsForRead(overlay.item.id, browseProducts, 4)}
            productsNote={ROW_NOTES[overlay.item.id] || ''}
            onOpenProduct={(item) => setOverlay({ type: 'product', item })}
            renderProduct={(item) => <ProductCard product={item} quizAnswers={effectiveQuizAnswers} matchOpts={matchOpts} onClick={() => setOverlay({ type: 'product', item })} />}
            onAsk={nav.onAskAyna}
            theme={theme}
          />
        </PushLayer>
      )}
      {overlay?.type === 'compare' && (
        <PushLayer key="compare" onBack={() => setOverlay(null)}>
          <CompareScreen
            onBack={() => setOverlay(null)}
            onOpenProduct={(item) => setOverlay({ type: 'product', item })}
            savedProducts={savedMap}
            quizAnswers={effectiveQuizAnswers}
            matchOpts={matchOpts}
          />
        </PushLayer>
      )}
      {overlay?.type === 'why-match' && (
        <PushLayer key={`w-${overlay.item?.id}`} onBack={() => setOverlay(null)}>
          <WhyMatchScreen
            product={overlay.item}
            quizAnswers={effectiveQuizAnswers}
            matchOpts={matchOpts}
            onBack={() => setOverlay(null)}
            onUpdateHealth={() => { setOverlay(null); setIntakeMode('add'); setEditingHealthProfile(true); setScreen('quiz'); }}
            onFixSafety={(step) => { setOverlay(null); nav.onEditIntakeStep(step); }}
            onViewDetails={() => setOverlay({ type: 'product', item: overlay.item })}
          />
        </PushLayer>
      )}
      {overlay?.type === 'profile' && (
        <AskContext.Provider value={nav.onAskAyna}>
        <ProfileFlow
          onUpdateIntake={authUser ? handleUpdateIntake : null}
          onUpdateIntakeLocal={handleUpdateIntake}
          onEditProfileAt={nav.onEditIntakeStep}
          healthConnected={health.connected}
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
          onOpenRoutine={() => { setOverlay(null); setScreen('today'); }}
          onOpenMonthlyCheckin={() => setScreen('checkin')}
          readProgress={readProgress}
          onOpenProduct={(product) => growTransition(() => setOverlay({ type: 'product', item: product }), { target: 'product', from: 'img' })}
          onOpenArticle={(article) => { setReadArticleIds((ids) => ids.includes(article.id) ? ids : [...ids, article.id]); setOverlay({ type: 'article', item: article }); }}
          onOpenCommunity={(seed) => { setOverlay(null); setCommunitySeed({ ...seed, token: Date.now() }); setScreen('community'); }}
          recentAsks={askAynaHistory}
        />
        </AskContext.Provider>
      )}
      <AskAynaModal
        key={authUser?.id || 'anonymous'}
        open={askAynaOpen || (screen === 'ayna' && homeView === 'chat' && !overlay)}
        asTab={screen === 'ayna' && homeView === 'chat' && !askAynaOpen}
        // Home: the chat full screen with Back to Home; chat-first variant: the switch on top.
        renderHomeTop={chatFirst && screen === 'ayna' && !askAynaOpen ? (leading) => <HomeSwitch view={homeView} onChange={(v) => { setAskAynaOpen(false); setHomeView(v); }} leading={leading} /> : null}
        onBackHome={!chatFirst && screen === 'ayna' && !askAynaOpen ? () => setHomeView('home') : null}
        starters={askStarters}
        onStarter={(st) => nav.onAskAyna(st)}
        draft={askDraft}
        seed={askSeed}
        enabled
        profile={effectiveQuizAnswers}
        guide={guide}
        onGuideChange={updateGuide}
        recap={guideRecap}
        recapSources={guideSources}
        recapExportable={guideRecapExportable}
        recapAskable={guideRecapAskable}
        productNotes={productNotesFromRoutine(myProducts, authUser?.id ? session.routineOutcomesByUser?.[authUser.id] || {} : {})}
        allowGuideContext={personalizeWithData}
        onProfileUpdate={(answers) => updateSession({ lastQuizAnswers: answers })}
        chatHistory={askAynaHistory}
        onChatHistoryUpdate={setAskAynaHistory}
        name={resolvedName}
        onClose={screen === 'ayna' && homeView === 'chat' && !askAynaOpen ? null : () => setAskAynaOpen(false)}
        onNavigateToDiscovery={() => { setAskAynaOpen(false); setScreen('browse'); }}
        products={myProducts}
        matchOpts={matchOpts}
        focusProduct={overlay?.type === 'product' ? overlay.item : null}
        reads={rankedEcosystemReads}
        hasHealthData={!!authUser && health.connected.length > 0}
        resolveProduct={(id) => myProducts.find((p) => String(p.id) === String(id)) || browseProducts.find((p) => String(p.id) === String(id)) || null}
        // A product in the chat opens the quick sheet over it; the chat keeps its place.
        onOpenProduct={(product) => setSheetProduct(product)}
        onBrowse={(intent) => { setAskAynaOpen(false); setOverlay(null); setBrowseQuery(String(intent?.query || intent?.category || '').replace(/[-_]/g, ' ')); setScreen('browse'); }}
        onOpenDashboard={hasEcosystem ? () => { setAskAynaOpen(false); setOverlay(null); setScreen('today'); } : null}
        onOpenRead={(article) => { setAskAynaOpen(false); setReadArticleIds((ids) => ids.includes(article.id) ? ids : [...ids, article.id]); setOverlay({ type: 'article', item: article }); }}
        onViewRecommendations={() => { setAskAynaOpen(false); setScreen(hasEcosystem ? 'eco' : 'ecointro'); }}
        onRequireAuth={(feature) => requestAuth(feature || 'Ask ayna', () => { setScreen(screen); setAskAynaOpen(true); })}
      />
      {sheetProduct && (
        <ProductSheet
          key={sheetProduct.id}
          product={sheetProduct}
          onClose={() => setSheetProduct(null)}
          matchState={productMatchState(sheetProduct, effectiveQuizAnswers, matchOpts)}
          details={effectiveQuizAnswers ? getProductMatchDetailsForProduct(sheetProduct, effectiveQuizAnswers, null, matchOpts) : null}
          onAsk={(q) => { setSheetProduct(null); nav.onAskAyna({ question: q }); }}
          saved={isSaved(sheetProduct.id)}
          onToggleSaved={handleToggleSaved}
          inRoutine={myProducts.some((p) => p.id === sheetProduct.id)}
          onAddToRoutine={handleAddToEcosystem}
          // "Read more": the full product page fills the sheet; Back returns to the sheet.
          renderFull={(item, back) => (
            <ProductDetailScreen
              product={item}
              onBack={back}
              isSaved={isSaved(item.id)}
              onToggleSaved={() => handleToggleSaved(item)}
              isInEcosystem={myProducts.some((p) => p.id === item.id)}
              onAddToEcosystem={() => handleAddToEcosystem(item)}
              isOmitted={!!omittedProducts[item.id]}
              onToggleOmit={() => handleToggleOmit(item)}
              matchOpts={matchOpts}
              authUser={authUser}
              onRequireAuth={(feature) => requestAuth(feature || 'Ask ayna', () => {})}
              quizAnswers={effectiveQuizAnswers}
              ecosystemProducts={myProducts}
              onOpenProduct={(next) => setSheetProduct(next)}
              theme={theme}
              onToggleTheme={setThemeMode}
            />
          )}
        />
      )}
      </ProductSheetContext.Provider>
      {/* Same 14-day feedback survey as the website, only on resting screens. */}
      <FeedbackPrompts key={realAuthUser?.id || 'guest'} user={realAuthUser} authLoading={authLoading} currentView={overlayType || askAynaOpen ? 'busy' : screen} safeViews={APP_FEEDBACK_SCREENS} />
      <OfflineBanner rootRef={rootRef} />
      <GlobalToast variant="app" />
      {/* First-visit tips (src/mobile/tutorial): one overlay, reads data-tour anchors. */}
      <TutorialLayer userId={authUser?.id || null} />
    </div>
  );
}
