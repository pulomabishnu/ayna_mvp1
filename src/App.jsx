import FeedbackPrompts from './components/FeedbackPrompts';
import { markOnboardingDone } from './health/onboardingSignal.js';
import React, { Suspense, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AynaLanding from './components/AynaLanding';
import SiteFooter from './components/SiteFooter';
import ConsentBanner from './components/ConsentBanner';
import SavedForLater from './components/SavedForLater';
import EcosystemGenerationBar from './components/EcosystemGenerationBar';
import { useWebTheme } from './utils/useWebTheme';
import OmittedProducts from './components/OmittedProducts';
import ViewSkeleton from './components/skeletons/ViewSkeleton';
import { markPerf } from './utils/perfTimings';
import ProductHeroPreview from './components/pdp/ProductHeroPreview';
import { productSeedFor } from './utils/productSeed';

// React.lazy that renders without a placeholder once its chunk has loaded.
// The page being opened starts its chunk at once (its prerendered HTML already
// preloads it), so the first render can show the page itself instead of a
// placeholder and then a second style and layout pass (perf). React.lazy
// accepts any thenable, and one that resolves synchronously never suspends.
const START_PATH = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '';
function routeLazy(loader, startNow = false) {
  let mod = null;
  let pending = null;
  const load = () => (pending ||= loader().then((m) => { mod = m; return m; }, (err) => { pending = null; throw err; }));
  if (startNow) load().catch(() => {});
  return React.lazy(() => (mod ? { then: (resolve) => resolve(mod) } : load()));
}

// lazyView: React.lazy plus a built-in Suspense boundary, so converting an
// eager view to a lazy one does not require touching its render site. Each
// of these is a whole screen gated behind currentView; keeping them out of
// the entry chunk means first paint does not pay for the quiz, Community,
// admin tools or the post-quiz reveal.
const lazyView = (loader, fallback, startNow = false) => {
  const Lazy = routeLazy(loader, startNow);
  const fb = fallback === undefined ? <ViewSkeleton /> : fallback;
  return function LazyViewBoundary(props) {
    return <Suspense fallback={fb}><Lazy {...props} /></Suspense>;
  };
};
const WebIntake = lazyView(() => import('./components/WebIntake'));
const WebCommunity = lazyView(() => import('./components/WebCommunity'), <ViewSkeleton label="Loading community" cards={3} />);
// Full-screen overlay after the quiz: keep the page behind it visible rather
// than flashing a page skeleton under the overlay while the chunk loads.
const WebWrapped = lazyView(() => import('./components/WebWrapped'), null);
const DeleteAccountPage = lazyView(() => import('./components/DeleteAccountPage'));
const WebHealth = lazyView(() => import('./components/WebHealth'));
const WebExplore = lazyView(() => import('./components/explore/WebExplore'));
const AdminReviewsPage = lazyView(() => import('./components/AdminReviewsPage'));
const AdminResearchPage = lazyView(() => import('./components/AdminResearchPage'));
const AdminTopicsPage = lazyView(() => import('./components/AdminTopicsPage'));
const FreeProductPage = lazyView(() => import('./components/freeProduct/FreeProductPage'));
const CampaignAdminPage = lazyView(() => import('./components/CampaignAdminPage'));
const PhoneVerification = lazyView(() => import('./components/PhoneVerification'));
const Recommendations = lazyView(() => import('./components/Recommendations'));
const TrackedItems = lazyView(() => import('./components/TrackedItems'));
const Comparison = lazyView(() => import('./components/Comparison'));
const DoctorPrep = lazyView(() => import('./components/DoctorPrep'));
const Recalls = lazyView(() => import('./components/Recalls'));
// Pass 2 (perf): pages that Home, Shop and first paint never need. The
// product page chunk is preloaded on /product/* pages (scripts/prerender.mjs).
const WebYou = lazyView(() => import('./components/WebYou'));
const MonthlyCheckin = lazyView(() => import('./components/MonthlyCheckin'));
const WebHealthData = lazyView(() => import('./components/WebHealthData'));
const ProductModal = lazyView(() => import('./components/ProductModal'), <ProductLoading fallback={<ViewSkeleton label="Loading the product" />} />, START_PATH.startsWith('/product/'));
const PrivacyPolicy = lazyView(() => import('./components/PrivacyPolicy'));
const ConsumerHealthData = lazyView(() => import('./components/ConsumerHealthData'));
const HowWeMakeMoney = lazyView(() => import('./components/HowWeMakeMoney'));
const HowItWorks = lazyView(() => import('./components/HowItWorks'));
const About = lazyView(() => import('./components/About'));
const Contact = lazyView(() => import('./components/Contact'));
const TermsOfUse = lazyView(() => import('./components/TermsOfUse'));
const AuthConfirm = lazyView(() => import('./components/AuthConfirm'));
const EmailConfirmed = lazyView(() => import('./components/EmailConfirmed'));
// Lazy: each of these pulls in src/data/startups.js (~1700 lines), deferring
// them until the user actually navigates there keeps that out of the main
// bundle. products.js itself now loads after first paint too (data/catalog.js).
const BrandPartners = React.lazy(() => import('./components/BrandPartners'));
const MyEcosystem = routeLazy(() => import('./components/MyEcosystem'), /^\/(my-)?ecosystem$/.test(START_PATH));
const Discovery = routeLazy(() => import('./components/Discovery'), /^\/(shop|discovery)$/.test(START_PATH));
const Articles = routeLazy(() => import('./components/Articles'), /^\/library(\/|$)/.test(START_PATH));
// Internal, read-only product passport audit (dev, or ?internal=1 opt-in).
const ProductAudit = React.lazy(() => import('./components/ProductAudit'));
const CampusResources = React.lazy(() => import('./components/CampusResources'));
// Public page for a shared Ask ayna answer: /a/<slug>.
const SharedAnswerPage = React.lazy(() => import('./components/SharedAnswerPage'));
// The catalog (products, research, matching) loads after first paint as its
// own chunk; App re-renders when it lands (data/catalog.js, catalogReady below).
import { ALL_PRODUCTS, CATEGORY_LABELS, getRecommendations, getPersonalizedProductIds, getEcosystemSeedFromQuiz, getProductById, getProductMatchDetailsForProduct, getProfileMatchPercentForProduct, hasStatedLifeStage, matchEngine, getSelectedNeeds, useCatalogReady, isCatalogReady, loadCatalog } from './data/catalog.js';
import { behaviorFrom } from './utils/matchDisplay';
import { useHealthData } from './mobile/hooks/useHealthData.js';
import { useHealthMatchPref } from './health/matchPref.js';
import { usesHormonalBC } from './health/weekInsights.js';
import { captureReferralFromUrl } from './utils/badges';
import { slugFromPath } from './utils/sharedAnswer.js';
import { readPendingFriend } from './utils/shareAnswerClient.js';
import { loadAynaReviews, hydrateAynaReviews, addRating, addReview } from './data/aynaReviews';
const Screenings = lazyView(() => import('./components/Screenings'));
import { useScrollPosition } from './hooks/useScrollPosition';
import { useHeaderScroll } from './hooks/useHeaderScroll';
import { enrichLlmProductForDiscovery } from './utils/enrichLlmProductForDiscovery';
import ProfileChatbot from './components/ProfileChatbot';
import { loadHealthProfile, hasHealthProfileSignals } from './utils/healthDataProfile.js';
import { loadHealthProfileForCurrentUser, saveHealthProfileForCurrentUser } from './utils/healthProfileStore';
import { forgetSharedIntake, loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser, clearHealthIntakeForCurrentUser } from './utils/healthIntakeStore';
import { mapIntakeToLegacyQuizProfile } from './utils/healthIntake';
import AuthGate, { ConsentGate } from './components/AuthGate';
import './finalAynaPolish.css';
import './brand-v2.css';
import './web-play.css';
import './styles/verify-core.css';
import { installScrollMemory, isRestoringScroll } from './utils/scrollMemory';
import { avatarInitials } from './utils/avatarInitials';
import AuthCallback from './components/AuthCallback';
import './styles/editorial.css';
import { getSupabaseClient } from './utils/supabaseClient';
import { clearGeneratedPicksForUser, isGeneratedPick, loadEcosystemForUser, upsertProductState, upsertProductsBatch, removeGeneratedProductsFromEcosystem, clearEcosystemForUser } from './utils/ecosystemStore';
import { loadSavedProducts, persistSavedProducts, clearSavedProducts, loadSavedForUser, setSavedForUser } from './utils/savedProductsStore';
import { loadLearningMemoryForUser, saveLearningMemoryForUser } from './utils/learningMemoryStore';
import { loadReviewsForUser, upsertProductReviews } from './utils/reviewsStore';
import { growTransition } from './utils/viewTransition.js';
import { clearCachedLlmRecommendations, fingerprintIntake } from './utils/fetchLlmRecommendations';
import posthog from 'posthog-js';
import { identifyAccount } from './utils/analyticsIdentity';
import { tagInternalUserIfNeeded } from './utils/posthogInternal';
import { productHref, productRouteKey, parseProductIdFromPath } from './utils/productRoute';
import { productSeoTitle, productSeoDescription } from './utils/seoMeta';
import { SEO_PAGES, HOME_TITLE, HOME_DESCRIPTION, isNoindexPath } from './utils/seoPages.js';
import { INTAKE_DRAFT_KEY, getIntakeSteps, optionalProgress, reconstructIntakeFromSnapshot } from './mobile/data/intakeModel';
import { clearIntakeDraft, readDraftProgress } from './mobile/data/quizDraftProgress';
import FinishQuizCard, { MorePersonalCard } from './components/FinishQuizCard';
import './styles/flow.css';
import './styles/web-neon-dark.css';
import './styles/web-density.css';
import './styles/theme-v3.css';
import './styles/site-polish.css';
import './styles/ayna-system.css';
import './styles/content.css';
import './styles/chrome.css';
import NewAccountStart from './components/NewAccountStart';
import { markOAuthSource, takeOAuthSource, shouldOfferEcosystemStart } from './utils/oauthNewAccount';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './components/EcosystemBubbles';
import EcosystemPreview from './components/v3/EcosystemPreview';
import EcosystemViewTabs from './components/EcosystemViewTabs';
import { clearPersonalStorage } from './utils/clearPersonalStorage';
import { toast } from './utils/toast';
import { setDarkAccentSwap } from './utils/darkAccentSwap.js';
import { recordProductView } from './utils/recentActivity';
import GlobalToast from './components/v3/GlobalToast';
import { MAIN_TABS, TabIcon, AskMark } from './components/nav/tabs.jsx';
import { YOU_SECTIONS } from './components/nav/mainTabs.js';
import { ExploreHeader, YouNav } from './components/explore/ExploreNav.jsx';
import { loadProductReviewStats, mergeReviewBuckets, REVIEWS_CHANGED_EVENT } from './utils/community/reviewRatings.js';
import SaveAuthSheet from './components/save/SaveAuthSheet.jsx';
import RoutineSummary from './components/routine/RoutineSummary.jsx';
import { SaveFollowUpStrip } from './components/save/SaveFollowUp.jsx';
import { savePrompt, stashPendingSave, takePendingSave } from './utils/savePrompt.js';
import { setSavedRemindersOwner } from './utils/savedReminders.js';
import { compareStore, useCompare } from './utils/compareStore.js';
import { addedToRoutineText, REMOVED_FROM_ROUTINE } from './utils/routineCopy.js';
import { openTodayLog } from './components/today/openLog.js';

/** Which views light up each main tab (MAIN_TABS keys), in the top nav and the phone tab bar. */
const WEB_TAB_VIEWS = {
  today: ['today'],
  explore: ['explore', 'explore-topics', 'explore-services', 'discovery', 'product', 'articles', 'screenings'],
  ask: ['ask'],
  community: ['community'],
  // My ecosystem and everything reached from it live under You.
  profile: ['you', 'ecosystem', 'comparison', 'omitted', 'recalls', 'health-data', 'delete-account', 'phone-verify', 'tracked', 'doctor-prep', 'recommendations'],
};
/** Explore's sections as views (Products is the Shop, Resources the Library). */
const EXPLORE_VIEW = { overview: 'explore', topics: 'explore-topics', services: 'explore-services', products: 'discovery', resources: 'articles' };
const EXPLORE_SECTION_OF = Object.fromEntries(Object.entries(EXPLORE_VIEW).map(([k, v]) => [v, k]));
/** Focused flows: a minimal header (logo · Exit), no tab bar, no footer (P1-28). */
const FOCUSED_FLOW_VIEWS = ['quiz', 'profile-edit'];
/** Landing boards (1a/1c) run the nav on the hero gradient; every other board is on cream. */
const GRADIENT_NAV_VIEWS = ['welcome', 'hero', 'about', 'how-it-works'];

const HEALTH_PROFILE_UPDATE_CUTOFF = Date.parse('2026-09-05T02:56:40.000Z');
const HEALTH_PROFILE_UPDATE_NOTICE_KEY = 'ayna_health_profile_update_2026_09_05_seen';

function accountFirstName(user) {
  const meta = user?.user_metadata || {};
  const rawName = meta.full_name || meta.name || meta.first_name || meta.given_name || '';
  return String(rawName).trim().split(/\s+/).filter(Boolean)[0] || '';
}

const ecosystemResetKey = (userId) => `ayna_ecosystem_reset_at:${userId || 'anon'}`;

function getPendingEcosystemResetAt(userId) {
  if (!userId) return 0;
  try { return Number(localStorage.getItem(ecosystemResetKey(userId)) || 0) || 0; } catch { return 0; }
}

function clearPendingEcosystemReset(userId) {
  if (!userId) return;
  try { localStorage.removeItem(ecosystemResetKey(userId)); } catch { /* ignore */ }
}

// Main tabs (founder, Oct 24 2026): /today, /explore, /ask, /community, /you.
// Shop is Explore > Products, Library is Explore > Resources, Ecosystem is
// You > My ecosystem. The old addresses still work (PATH_TO_VIEW below and
// the permanent redirects in vercel.json).
const VIEW_TO_PATH = {
  welcome: '/', hero: '/', quiz: '/quiz', ecosystem: '/you/ecosystem', you: '/you', community: '/community',
  today: '/today', explore: '/explore', 'explore-topics': '/explore/topics', 'explore-services': '/explore/services', ask: '/ask',
  discovery: '/explore/products', waitlist: '/partners', recommendations: '/recommendations',
  articles: '/explore/resources', screenings: '/screenings', omitted: '/omitted',
  comparison: '/comparison', recalls: '/recalls',
  'doctor-prep': '/appointment-prep', 'profile-edit': '/profile', 'phone-verify': '/text-ayna', tracked: '/tracked',
  'delete-account': '/delete-account', 'health-data': '/health-data',
  'privacy-policy': '/privacy-policy',
  'consumer-health-data': '/consumer-health-data',
  'terms-of-use': '/terms-of-use',
  'how-we-make-money': '/how-we-make-money',
  'how-it-works': '/how-it-works',
  about: '/about',
  contact: '/contact',
  'campus-resources': '/campus-resources',
  'auth-callback': '/auth/callback',
  'auth-confirm': '/auth/confirm',
  'confirmed': '/confirmed',
  'product-audit': '/internal/product-audit',
  // Not linked from any nav: internal, reached by typing the URL directly.
  // Real access control is server-side (api/reviews-admin checks ADMIN_EMAILS).
  'admin-reviews': '/admin/reviews',
  // Same: api/research-product checks ADMIN_EMAILS.
  'admin-research': '/admin/research',
  // Same: api/community-topics-admin checks ADMIN_EMAILS.
  'admin-topics': '/admin/topics',
  // Free product campaign (feedback + 3 verified friends). Server decides everything: api/campaign.js.
  'free-product': '/free-product',
  'free-product-reward': '/free-product/reward',
  'admin-campaign': '/admin/campaign',
};
// Friendly document.title per view'welcome'/'hero' and any view not
// listed here fall back to the site's base title (see the title effect).
const VIEW_TITLES = {
  quiz: 'Get matched', ecosystem: 'My ecosystem', discovery: 'Products', you: 'You', community: 'Community',
  today: 'Today', explore: 'Explore', 'explore-topics': 'Health topics', 'explore-services': 'Services', ask: 'Ask ayna',
  waitlist: 'Partner brands', recommendations: 'Your recommendations', articles: 'Resources', screenings: 'Screenings',
  omitted: 'Omitted products', comparison: 'Compare products', recalls: 'Recalls',
  'doctor-prep': 'Appointment prep', 'profile-edit': 'Edit my answers',
  'phone-verify': 'Verify phone', tracked: 'Tracked products', 'delete-account': 'Delete account', 'health-data': 'Health data',
  'privacy-policy': 'Privacy policy', 'consumer-health-data': 'Consumer health data privacy notice', 'terms-of-use': 'Terms of use',
  'how-we-make-money': 'How we make money', 'how-it-works': 'How it works',
  about: 'About', contact: 'Contact', 'not-found': 'Page not found',
  'campus-resources': 'Campus resources',
  'admin-reviews': 'All reviews',
  'admin-research': 'Product research',
  'admin-topics': 'Community topics',
  'free-product': 'Your free product',
  'free-product-reward': 'Your free product',
  'admin-campaign': 'Free product campaign',
};

// The home page's words, the same as index.html (src/utils/seoPages.js).
const DEFAULT_DESCRIPTION = HOME_DESCRIPTION;
const VIEW_DESCRIPTIONS = {
  explore: "Explore women's health: search products, symptoms, topics, services and plain-language reads.",
  today: 'Today with ayna: what matters for you today, and your daily log.',
  ask: 'Ask ayna about your health and the products you use.',
  you: 'Your profile, saved products, ecosystem and settings on ayna.',
  discovery: "Shop women's health products ranked by how well they fit you: period care, intimate care, fertility, menopause and more.",
  articles: "Plain-language guides to women's health topics, with sources, from the ayna Library.",
  ecosystem: 'Your ecosystem: the products and care you use, what each one is for and what fits next.',
  community: 'Real experiences with women\'s health products from the ayna community.',
  'how-it-works': 'How ayna matches products to you: your profile, the market, the evidence and your shop.',
  'not-found': "This page doesn't exist on ayna.",
  'campus-resources': 'Find verified sexual assault support, advocacy, reporting, medical, and campus resources for your college or university.',
};
// One canonical address per page (preview and production domains must not compete in search).
function setCanonical(path) {
  try {
    let el = document.querySelector('link[rel="canonical"]');
    // A missing page has no canonical address.
    if (path == null) { el?.remove(); return; }
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
    el.setAttribute('href', `https://www.aynahealth.co${String(path || '/').replace(/\/+$/, '') || '/'}`);
  } catch { /* no document */ }
}

// Personal pages (Today, Ask, You, account pages, Community member pages) and
// missing pages are never indexed. The server sends the same rule as an
// X-Robots-Tag header (vercel.json); this keeps the tag right as she moves around.
function setRobots(noindex) {
  try {
    let el = document.querySelector('meta[name="robots"]');
    if (!noindex) { el?.remove(); return; }
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el); }
    el.setAttribute('content', 'noindex');
  } catch { /* no document */ }
}

function setMetaDescription(text) {
  let el = document.querySelector('meta[name="description"]');
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'description'); document.head.appendChild(el); }
  el.setAttribute('content', text);
  setOg('og:description', text);
}
// Share previews follow the page (they were the homepage card everywhere).
function setOg(property, value) {
  try {
    if (!value) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', value);
  } catch { /* no document */ }
}
function setShareCard({ title, image } = {}) {
  setOg('og:title', title || HOME_TITLE);
  const abs = image ? (/^https?:/i.test(image) ? image : `https://www.aynahealth.co${image.startsWith('/') ? '' : '/'}${image}`) : 'https://www.aynahealth.co/og/wrapped.png';
  setOg('og:image', abs);
}

const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).filter(([, p]) => p !== '/').map(([v, p]) => [p, v])
);
// Old addresses keep working (bookmarks, texts, emails, shared links). Each
// is replaced with its new address on load (the initial replaceState below).
PATH_TO_VIEW['/my-ecosystem'] = 'ecosystem';
PATH_TO_VIEW['/ecosystem'] = 'ecosystem';
PATH_TO_VIEW['/shop'] = 'discovery';
PATH_TO_VIEW['/library'] = 'articles';
PATH_TO_VIEW['/health'] = 'today';
PATH_TO_VIEW['/terms'] = 'terms-of-use';
PATH_TO_VIEW['/privacy'] = 'privacy-policy';
PATH_TO_VIEW['/startups'] = 'waitlist'; // old address keeps working
PATH_TO_VIEW['/partner-brands'] = 'waitlist';

PATH_TO_VIEW['/'] = 'welcome';
// Old Shop URL keeps working (bookmarks, shared links); it is replaced on load.
PATH_TO_VIEW['/discovery'] = 'discovery';
// Campaign invite links: /join?ref=<code>. The code is stored first-touch
// (badges.js) before the URL is tidied to '/', then the visitor lands on home.
PATH_TO_VIEW['/join'] = 'welcome';
if (typeof window !== 'undefined') captureReferralFromUrl();

// Deep links inside a view: /library/:articleId and /community/@handle.
function articleIdFromPath(path) {
  const m = String(path || '').match(/^\/library\/([a-z0-9-]+)\/?$/i);
  return m ? m[1].toLowerCase() : null;
}
function communityHandleFromPath(path) {
  const m = String(path || '').match(/^\/community\/@([^/?#]{1,40})\/?$/i);
  return m ? m[1].toLowerCase() : null;
}
function communityPostFromPath(path) {
  const m = String(path || '').match(/^\/community\/p\/([a-z0-9-]+)\/?$/i);
  return m ? m[1] : null;
}
// You's sections: /you/saved, /you/health, ... (/you/ecosystem is the ecosystem view).
const YOU_SECTION_KEYS = YOU_SECTIONS.map((x) => x.key).filter((k) => k !== 'ecosystem');
function youSectionFromPath(path) {
  const m = String(path || '').match(/^\/you\/([a-z]+)\/?$/i);
  return m && YOU_SECTION_KEYS.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : null;
}
function viewFromSubPath(path) {
  if (slugFromPath(path)) return 'shared-answer';
  if (articleIdFromPath(path)) return 'articles';
  if (communityHandleFromPath(path) || communityPostFromPath(path)) return 'community';
  if (youSectionFromPath(path)) return 'you';
  return null;
}

function getInitialView() {
  const path = window.location.pathname;
  if (parseProductIdFromPath(path)) return 'product';
  // The old Ecosystem "Dashboard" tab is Today now.
  try { if (/^\/(ecosystem|my-ecosystem)\/?$/.test(path) && new URLSearchParams(window.location.search).get('view') === 'dashboard') return 'today'; } catch { /* no URL */ }
  const sub = viewFromSubPath(path);
  if (sub) return sub;
  // An unrecognized path used to silently resolve to 'welcome', a typo'd
  // or stale-bookmarked URL landed on the homepage with zero indication
  // anything was wrong (found live, 2026-08-24 bug bash). The root path
  // itself is explicitly mapped in PATH_TO_VIEW, so this only ever affects
  // a genuinely unknown path, never '/'.
  // Tolerate a trailing slash (e.g. /campus-resources/ from a shared link).
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return PATH_TO_VIEW[path] || PATH_TO_VIEW[trimmed] || 'not-found';
}

function getInitialProductId() {
  return parseProductIdFromPath(window.location.pathname);
}

/**
 * Discovery's search query/results lived only in React state, so a browser tab
 * discard/reload (mobile tab-switch memory eviction, desktop "memory saver")
 * always came back to an empty search even when the URL correctly restored the
 * Discovery view, the app looked "reset" even though only this one query was
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

/**
 * Same problem as getInitialDiscoverySearch, one level up: the homepage's
 * "Shop" category pill (All/Period/Intimate Care/...) was pure local state
 * in AynaLanding, with no URL round-trip, clicking a product from a
 * filtered Shop view and hitting Back always landed on "All", the filter
 * silently lost. Flagged live 2026-08-25: "when we go back from the product
 * page, it must go back to the previous query."
 */
function getInitialHomeCategory() {
  const view = getInitialView();
  if (view !== 'welcome' && view !== 'hero') return null;
  try {
    return new URLSearchParams(window.location.search).get('category') || null;
  } catch {
    return null;
  }
}

function ViewLoadingFallback() {
  return <ViewSkeleton label="Loading" cards={3} lines={2} />;
}

// First visit to a product page: its hero (from the prerendered page's seed)
// paints while the catalog and the product page code load; anywhere else, the
// usual placeholder.
function ProductLoading({ fallback, onPainted = null }) {
  const seed = productSeedFor(typeof window !== 'undefined' ? window.location.pathname : '');
  return seed ? <ProductHeroPreview seed={seed} onPainted={onPainted} /> : fallback;
}

/**
 * Shared "nothing here" state, a bad product link already showed a proper,
 * on-brand empty state (centered serif heading, muted subtext, single navy
 * CTA), but a bad top-level URL (a typo, a stale bookmark) instead silently
 * redirected to the homepage with zero indication anything was wrong (found
 * live, 2026-08-24 bug bash). Same component now backs both, instead of a
 * one-off block duplicated just for products.
 */
function NotFoundState({ title, subtitle, ctaLabel, onCta, onSearch, searchPlaceholder = 'Search products', links = null }) {
  return (
    <div className="ed">
      <div className="ed-wrap">
        <div className="ed-state">
          <p className="ed-state__mark">Error 404</p>
          <h1 className="ed-h1">{title}</h1>
          <p className="ed-lead">{subtitle}</p>
          {onSearch && (
            <form className="ed-search" role="search" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get('q') || '').trim(); onSearch(q); }}>
              <label>
                <span className="ed-sr">{searchPlaceholder}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                <input id="ay-404-q" name="q" type="search" placeholder={searchPlaceholder} autoComplete="off" />
              </label>
              <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
            </form>
          )}
          {links && links.length > 0 && (
            <nav className="ed-state__links" aria-label="Popular pages">
              <p>Popular pages</p>
              <ul>{links.map((l) => <li key={l.href}><a href={l.href} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); l.go(); }}>{l.label}</a></li>)}</ul>
            </nav>
          )}
          <div className="ed-state__actions">
            <button type="button" className={onSearch ? 'ay-btn ay-btn--text' : 'ay-btn ay-btn--primary'} onClick={onCta}>{ctaLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// G09: push = top of page, Back/Forward = where she was. Installed before the
// first render so the initial history entry gets its key.
installScrollMemory();

function App() {
  const [currentView, setCurrentViewRaw] = useState(getInitialView);
  // app_error reports which screen it happened on (production builds minify component names).
  useEffect(() => { try { window.__aynaView = currentView; } catch { /* no window */ } }, [currentView]);
  // Only meaningful when currentView === 'product', the :id segment of
  // /product/:id. Kept separate from currentView (rather than encoded into
  // it) so VIEW_TO_PATH/PATH_TO_VIEW stay simple static maps for every other
  // route.
  const [productRouteId, setProductRouteId] = useState(getInitialProductId);
  // You's open section (/you/saved, /you/health, ...); null is the You overview.
  const [youSection, setYouSection] = useState(() => youSectionFromPath(window.location.pathname));
  const [publicRouteProduct, setPublicRouteProduct] = useState(null);
  const [publicRouteProductLoading, setPublicRouteProductLoading] = useState(false);
  // Ref always mirrors currentView synchronously, safe to read inside Supabase callbacks
  // that run outside React's render cycle.
  const currentViewRef = useRef(getInitialView());
  // Where "Update profile" was opened from, so its Back returns there.
  const profileEditFromRef = useRef('ecosystem');
  // Counts real in-app pushState navigations (not the initial replaceState
  // on mount, and not replace-style navigations). Used to tell "the user
  // clicked around inside the app to get here" apart from "this tab's only
  // entry is a direct/shared link", window.history.length can't do this
  // reliably, since a freshly opened tab already carries its own blank
  // entry before the app even loads, making history.length > 1 true even
  // with zero in-app navigation.
  const inAppPushCountRef = useRef(0);
  const viewOriginRef = useRef({});
  // Lets a product opened from Browse keep Browse mounted (hidden) behind it,
  // so clicking a card then going back doesn't blow away the personalization
  // toggle, filters, sort, or scroll position — see the Discovery render
  // block and the scroll-restore effect below. Reset on every genuine
  // navigation in setCurrentView, so leaving to a different tab and coming
  // back still gives Browse a clean, freshly-initialized mount.
  const discoveryKeepAliveRef = useRef(false);
  const discoveryScrollYRef = useRef(0);
  const pathForView = useCallback((view, id) => {
    if (view === 'product') return id ? productHref(id) : '/';
    return VIEW_TO_PATH[view] || '/';
  }, []);
  const setCurrentView = useCallback((view, { replace = false, path: pathOverride = null } = {}) => {
    if (view === 'profile-edit' && currentViewRef.current !== 'profile-edit') profileEditFromRef.current = currentViewRef.current || 'ecosystem';
    // Any explicit navigation (nav tab, "browse products" button, etc.) is a
    // genuine departure from wherever Shop's kept-alive state came from, so
    // the next time Shop mounts it's a clean, fresh instance.
    discoveryKeepAliveRef.current = false;
    // P1-8: remember where each page was opened from, so its back link can
    // name that page ("Shop", "Home") instead of a bare "Back".
    if (!replace && currentViewRef.current && currentViewRef.current !== view) viewOriginRef.current[view] = currentViewRef.current;
    currentViewRef.current = view;
    setCurrentViewRaw(view);
    if (view !== 'product') setProductRouteId(null);
    if (view === 'you') setYouSection(youSectionFromPath(pathOverride));
    const path = pathOverride || pathForView(view, null);
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ view }, '', path);
      else { window.history.pushState({ view }, '', path); inAppPushCountRef.current += 1; window.scrollTo(0, 0); }
    }
  }, [pathForView]);
  /** Navigate to a specific product's dedicated page, a real URL, not modal state. */
  const navigateToProduct = useCallback((productOrId, { replace = false } = {}) => {
    const routeKey = productRouteKey(productOrId);
    if (!routeKey) return;

    const internalId = productOrId && typeof productOrId === 'object'
      ? productOrId.id
      : productOrId;

    // Opened straight from Shop: keep it mounted (hidden) behind the
    // product page so browser-back restores it exactly as it was, instead
    // of remounting a fresh one. A product-to-product hop (e.g. a "related
    // products" link) leaves this alone, so the chain still traces back to
    // the original Browse session rather than clearing it.
    if (currentViewRef.current === 'discovery') {
      discoveryKeepAliveRef.current = true;
      discoveryScrollYRef.current = window.scrollY;
    }

    currentViewRef.current = 'product';
    setCurrentViewRaw('product');
    setProductRouteId(routeKey);

    const path = productHref(productOrId);

    if (window.location.pathname !== path) {
      const state = { view: 'product', productId: internalId, productRouteKey: routeKey };
      if (replace) window.history.replaceState(state, '', path);
      else { window.history.pushState(state, '', path); inAppPushCountRef.current += 1; window.scrollTo(0, 0); }
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

  const openSharedAnswer = useCallback((slug) => {
    const path = `/a/${slug}`;
    currentViewRef.current = 'shared-answer';
    setCurrentViewRaw('shared-answer');
    if (window.location.pathname !== path) window.history.replaceState({ view: 'shared-answer' }, '', path);
  }, []);
  const handleBackFromStandalonePage = useCallback(() => {
    if (inAppPushCountRef.current > 0) window.history.back();
    else setCurrentView('welcome', { replace: true });
  }, [setCurrentView]);
  // The back link on a standalone page (legal, About, How it works…) names the
  // page it returns to: the one it was opened from, or Home on a direct visit.
  const standaloneBackLabel = (() => {
    const from = inAppPushCountRef.current > 0 ? viewOriginRef.current[currentView] : 'welcome';
    if (!from) return 'Back';
    if (from === 'welcome' || from === 'hero') return 'Home';
    if (from === 'product') return 'Product';
    return VIEW_TITLES[from] || 'Back';
  })();
  useEffect(() => {
    // A 404 keeps the URL she typed (it used to be rewritten to '/').
    const keepPath = currentView === 'not-found' || viewFromSubPath(window.location.pathname) === currentView;
    const path = keepPath ? window.location.pathname : pathForView(currentView, productRouteId);
    // Community search lives in ?q= (shareable, survives a refresh); keep only that.
    const communityQ = currentView === 'community' ? new URLSearchParams(window.location.search).get('q') : null;
    const exploreQ = ['explore', 'explore-topics', 'explore-services'].includes(currentView) ? new URLSearchParams(window.location.search).get('q') : null;
    // Partners keeps its #brand-… hash so a link can open one brand's card.
    const initialUrl = (currentView === 'auth-callback' || currentView === 'campus-resources' || currentView === 'free-product' || currentView === 'free-product-reward')
      ? `${path}${window.location.search}${window.location.hash}`
      : currentView === 'waitlist' && /^#brand-[a-z0-9-]+$/.test(window.location.hash) ? `${path}${window.location.hash}`
      // A product link can open one of its tabs (#reviews, #literature, #safety).
      : currentView === 'product' && /^#[a-z-]{2,20}$/.test(window.location.hash) ? `${path}${window.location.hash}`
      : communityQ ? `${path}?q=${encodeURIComponent(communityQ)}`
      // Explore keeps its search (?q=) so a shared search opens with it.
      : exploreQ ? `${path}?q=${encodeURIComponent(exploreQ)}` : path;
    window.history.replaceState({ view: currentView, productId: productRouteId }, '', initialUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onPop = (e) => {
      const pathProductId = parseProductIdFromPath(window.location.pathname);
      const view = pathProductId ? 'product' : (viewFromSubPath(window.location.pathname) || e.state?.view || PATH_TO_VIEW[window.location.pathname] || PATH_TO_VIEW[window.location.pathname.replace(/\/+$/, '')] || 'not-found');
      setSelectedArticleId(articleIdFromPath(window.location.pathname));
      setCommunityHandle(communityHandleFromPath(window.location.pathname));
      setYouSection(youSectionFromPath(window.location.pathname));
      currentViewRef.current = view;
      setCurrentViewRaw(view);
      setProductRouteId(pathProductId);
      // Discovery unmounts/remounts on every navigation away and back (it's
      // conditionally rendered on currentView), so its own search state is
      // lost each time, landing back on a product's "Back" button always
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
      // Same fix, for the homepage Shop category pill, see getInitialHomeCategory.
      if (view === 'welcome' || view === 'hero') {
        try {
          setHomeCategory(new URLSearchParams(window.location.search).get('category') || null);
        } catch {
          setHomeCategory(null);
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Scroll memory (utils/scrollMemory.js) owns history.scrollRestoration and
  // the Back/Forward restore; a view change only resets to the top when it
  // is not a Back/Forward restore in progress.
  useEffect(() => {
    if (isRestoringScroll()) return;
    // Returning to a kept-alive Shop (product card -> back) restores the
    // exact scroll spot instead of jumping to top.
    if (currentView === 'discovery' && discoveryKeepAliveRef.current) {
      window.scrollTo({ top: discoveryScrollYRef.current, left: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentView, productRouteId]);
  const [quizResults, setQuizResults] = useState(null);
  const [trackedProducts, setTrackedProducts] = useState({});
  const [joinedWaitlists, setJoinedWaitlists] = useState({});
  const [myProducts, setMyProducts] = useState({});
  // Stable insertion-order array of product IDs, prevents cards from reordering on swap/add
  const [ecosystemOrder, setEcosystemOrder] = useState([]);
  const [omittedProducts, setOmittedProducts] = useState({});
  // Seeding her ecosystem from the quiz honors "Not for me" (same as the app's
  // planBaseOpts): a product she hid never comes back when she retakes the quiz.
  const seedOpts = useMemo(() => behaviorFrom({ omitted: omittedProducts }), [omittedProducts]);
  // Signed-out "Add to ecosystem" survives a refresh (focus group Oct 19): the
  // guest shelf is mirrored to this browser and merged into the account at
  // sign-in, then cleared. Best effort: storage can be blocked.
  const GUEST_ECO_KEY = 'ayna_guest_ecosystem_v1';
  const guestEcoRestoredRef = useRef(false);
  // Product page → Community: which composer to open and for which product.
  const [communitySeed, setCommunitySeed] = useState(null);
  useEffect(() => {
    if (currentView !== 'community' && communitySeed) setCommunitySeed(null);
  }, [currentView, communitySeed]);
  // Compare 2 to 4 (src/utils/compareStore.js): the same list from Saved, cards and the save prompt.
  const compare = useCompare((id) => (isCatalogReady() ? getProductById(id) : null));
  const compareList = compare.products;
  // Signed out, Save first explains the account (team direction 22).
  const [saveSheet, setSaveSheet] = useState(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinData, setCheckinData] = useState(null);
  const [checkinUpdatedProfile, setCheckinUpdatedProfile] = useState(false);
  const [checkinCompletedAt, setCheckinCompletedAt] = useState(null);
  const [discoverySearch, setDiscoverySearch] = useState(getInitialDiscoverySearch);
  const [homeCategory, setHomeCategory] = useState(getInitialHomeCategory);
  const [discoveryInitial, setDiscoveryInitial] = useState(null); // { initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase }
  const [userZipCode, setUserZipCode] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState(() => articleIdFromPath(window.location.pathname));
  const [communityHandle, setCommunityHandle] = useState(() => communityHandleFromPath(window.location.pathname));
  // Posts have their own address: /community/p/:id (shareable, linkable from updates).
  const [communityPostId] = useState(() => communityPostFromPath(window.location.pathname));
  // Product page: the post/review composer opens over the page (P07).
  const [composerSeed, setComposerSeed] = useState(null);
  // Signed-out quiz finish: her matches, shown before the sign-up ask.
  const [guestPreview, setGuestPreview] = useState(null);
  useEffect(() => { if (currentView !== 'product') setComposerSeed(null); }, [currentView]);
  useEffect(() => { if (currentView !== 'quiz') setQuizResume(false); }, [currentView]);

  const [aynaReviews, setAynaReviews] = useState({});
  const [healthProfile, setHealthProfile] = useState(() => loadHealthProfile());
  // Saved products are checked against the catalog, which loads after first
  // paint: until it has, start empty and restore them the moment it lands.
  const catalogReady = useCatalogReady();
  const [savedProducts, setSavedProducts] = useState(() => (isCatalogReady() ? loadSavedProducts() : {}));
  const savedRestoredRef = useRef(isCatalogReady());
  useEffect(() => {
    if (!catalogReady || savedRestoredRef.current) return;
    savedRestoredRef.current = true;
    setSavedProducts((prev) => ({ ...loadSavedProducts(), ...prev }));
  }, [catalogReady]);
  const [ecosystemSeedMeta, setEcosystemSeedMeta] = useState({});
  const [user, setUser] = useState(null);
  const [userSession, setUserSession] = useState(null);
  // Star averages on product cards and pages come from live community reviews
  // (re-read whenever a review is posted, edited or deleted), never from a
  // stored copy, so an edited or deleted review never leaves old stars behind.
  const [communityReviewStats, setCommunityReviewStats] = useState({});
  useEffect(() => {
    let active = true;
    const load = () => {
      loadProductReviewStats(getSupabaseClient())
        .then((stats) => { if (active) setCommunityReviewStats(stats); })
        .catch(() => { if (active) setCommunityReviewStats({}); });
    };
    load();
    window.addEventListener(REVIEWS_CHANGED_EVENT, load);
    return () => { active = false; window.removeEventListener(REVIEWS_CHANGED_EVENT, load); };
  }, [user?.id]);
  const productReviewBuckets = useMemo(() => mergeReviewBuckets(aynaReviews, communityReviewStats), [aynaReviews, communityReviewStats]);
  // Set to true once the LLM builds the ecosystem this session, prevents
  // Supabase token-refresh reloads from overwriting in-memory LLM products.
  const llmBuiltThisSessionRef = useRef(false);
  const myProductsRef = useRef({});
  const seedSavePromiseRef = useRef(Promise.resolve());
  useEffect(() => { myProductsRef.current = myProducts; }, [myProducts]);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    if (authLoading || user || guestEcoRestoredRef.current) return;
    guestEcoRestoredRef.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(GUEST_ECO_KEY) || 'null');
      if (saved && saved.myProducts && typeof saved.myProducts === 'object' && Object.keys(saved.myProducts).length) {
        setMyProducts((prev) => ({ ...saved.myProducts, ...prev }));
        setEcosystemOrder((prev) => [...(Array.isArray(saved.order) ? saved.order : Object.keys(saved.myProducts)).filter((id) => !prev.includes(id)), ...prev]);
      }
    } catch { /* storage blocked or bad JSON */ }
  }, [authLoading, user]);
  useEffect(() => {
    if (authLoading || user || !guestEcoRestoredRef.current) return;
    try {
      if (Object.keys(myProducts).length) localStorage.setItem(GUEST_ECO_KEY, JSON.stringify({ myProducts, order: ecosystemOrder, at: Date.now() }));
      else localStorage.removeItem(GUEST_ECO_KEY);
    } catch { /* storage blocked or full */ }
  }, [authLoading, user, myProducts, ecosystemOrder]);
  const [dataLoading, setDataLoading] = useState(false);
  // Bumped by the ecosystem skeleton's Retry button: re-runs the per-user data
  // load effect without touching any state that is already on screen.
  const [dataLoadNonce, setDataLoadNonce] = useState(0);
  // Google account with no recorded consent (created straight from Log in): gate until agreed.
  const [consentGateOpen, setConsentGateOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFeature, setAuthFeature] = useState('');
  // Shared answer page (/a/<slug>): Sign up or Sign in, from its Add friend prompt.
  const [shareAuthMode, setShareAuthMode] = useState('signup');
  const [pendingAction, setPendingAction] = useState(null);
  // Ref mirrors pendingAction so onAuthStateChange (async callback) can read it synchronously
  const pendingActionRef = useRef(null);
  const [pendingQuizResults, setPendingQuizResults] = useState(null);
  const [showHealthProfileUpdateNotice, setShowHealthProfileUpdateNotice] = useState(false);

  // Requested 2026-08-24 meeting: "sign-in required to build an ecosystem,
  // accompanied by a popup warning to prevent loss of unsaved progress." The
  // sign-in requirement already existed (handleQuizComplete gates on `user`
  // below), what didn't exist was the warning: pendingQuizResults lives only
  // in React state until she signs in, so closing the tab, hitting back, or
  // navigating away while the AuthGate modal is up silently threw away a
  // just-completed quiz with no warning at all. beforeunload is the only
  // browser mechanism that can actually intercept a tab close/refresh, an
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
  // From the app: Wrapped story after the quiz, and an Ask ayna button in the header.
  const [showWrapped, setShowWrapped] = useState(false);
  // Back from the first Wrapped slide (signed in) reopens the quiz from its
  // draft, on the last step, instead of the saved profile's first gap.
  const [quizResume, setQuizResume] = useState(false);
  // Bumped by "Build your ecosystem" in the sign-in modal so the quiz restarts
  // (with its intro) even when the modal opened on top of the quiz itself.
  const [quizRun, setQuizRun] = useState(0);
  // "Make my matches more personal": the profile editor opens at the first open optional question.
  const [editAtOptional, setEditAtOptional] = useState(false);
  // "Update life stages" (Ecosystem): the profile editor opens on the life stage question.
  const [editAtStep, setEditAtStep] = useState('');
  useEffect(() => { if (currentView !== 'profile-edit') { setEditAtOptional(false); setEditAtStep(''); } }, [currentView]);
  const [askOpenSignal, setAskOpenSignal] = useState(0);
  const [askPrefillStats, setAskPrefillStats] = useState(null);
  const [askPrefill, setAskPrefill] = useState('');
  // Opens Ask ayna, optionally with a question typed in (Shop's empty state).
  const openAsk = useCallback((text = '', stats = null) => {
    if (!user) { setAuthFeature('Ask ayna'); setPendingAction('feature'); pendingActionRef.current = 'feature'; setShowAuthModal(true); return; }
    if (!quizResults) { setCurrentView('quiz'); return; }
    setAskPrefill(text);
    setAskPrefillStats(Array.isArray(stats) ? stats.slice(0, 3) : null);
    setAskOpenSignal((n) => n + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, quizResults]);
  // Light / dark, shared with the app's own setting on this browser.
  const { theme, mode: themeMode, setThemeMode } = useWebTheme();
  // Dark mode is "brand dark": the light design (same type and components)
  // on an espresso page. The old neon dark rules are keyed to 'dark' and no
  // longer apply.
  const themeAttr = theme === 'dark' ? 'brand-dark' : theme;
  useEffect(() => { document.documentElement.dataset.ayTheme = themeAttr; }, [themeAttr]);
  // Brand dark also swaps the accents: sky blue <-> rose pink (see darkAccentSwap).
  useEffect(() => { setDarkAccentSwap(themeAttr === 'brand-dark'); }, [themeAttr]);
  // Every analytics event says which matching engine served it, so v1 and v2 can be compared.
  useEffect(() => { try { posthog.register?.({ match_engine: matchEngine() }); } catch { /* analytics off */ } }, []);
  // Tab icon follows the site's theme: butter tile in light, espresso tile in dark.
  useEffect(() => {
    const dark = themeAttr === 'brand-dark';
    document.querySelectorAll('link[rel="icon"][data-ay-icon]').forEach((l) => {
      l.removeAttribute('media');
      l.href = dark ? '/ayna-favicon-v5-dark-64.png' : '/ayna-favicon-v5-64.png';
    });
  }, [themeAttr]);
  const [saveError, setSaveError] = useState(null);
  const reportSaveFailure = useCallback((what, err) => {
    console.error('[Ayna] save failed:', what, err);
    setSaveError(`${what}. Your changes may not be saved. Check your connection and try again.`);
  }, []);


  /** Update local state AND persist, so the imported profile survives a device change. */
  const updateHealthProfile = useCallback((next) => {
    setHealthProfile(next);
    saveHealthProfileForCurrentUser(next).catch((e) =>
      reportSaveFailure('Could not save your health data', e)
    );
  }, [reportSaveFailure]);
  const accountMenuRef = useRef(null);
  const scrollY = useScrollPosition();
  const headerScroll = useHeaderScroll();

  const hasHealthImport = useMemo(() => hasHealthProfileSignals(healthProfile), [healthProfile]);
  const hasStatedQuizLifeStage = useMemo(() => hasStatedLifeStage(quizResults), [quizResults]);
  const hasCompletedPersonalization = useMemo(() => {
    if (!quizResults) return false;
    if (quizResults?.personalizationCompleted === true) return true;
    if (quizResults?.fullHealthIntake?.personalizationCompleted === true) return true;
    return false;
  }, [quizResults]);
  // Same fingerprint MyEcosystem computes for its own generation effect
  // this is what lets EcosystemGenerationBar find and observe (never start)
  // the same activeGenerations record from anywhere in the app.
  const ecosystemIntakeFingerprint = useMemo(
    () => (hasCompletedPersonalization ? fingerprintIntake(quizResults?.fullHealthIntake || null) : ''),
    [quizResults, hasCompletedPersonalization]
  );

  React.useEffect(() => {
    setAynaReviews(loadAynaReviews());
  }, []);

  // Restore the action that was in progress before a Google OAuth redirect.
  // Quiz results are stored separately because they contain the unsaved intake.
  React.useEffect(() => {
    try {
      const storedQuiz = sessionStorage.getItem('ayna_pending_quiz_results');
      const storedAction = sessionStorage.getItem('ayna_pending_auth_action');

      if (storedQuiz) {
        setPendingQuizResults(JSON.parse(storedQuiz));
        setPendingAction('quiz-complete');
        pendingActionRef.current = 'quiz-complete';
        sessionStorage.removeItem('ayna_pending_quiz_results');
      } else if (storedAction) {
        setPendingAction(storedAction);
        pendingActionRef.current = storedAction;
      }

      sessionStorage.removeItem('ayna_pending_auth_action');
    } catch { /* ignore */ }
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

          if (session?.user) {
            // One analytics id per account on every device; sign-up and session events (analyticsIdentity.js).
            identifyAccount(posthog, supabase, session.user).catch(() => {}).finally(() => tagInternalUserIfNeeded(posthog));
          }
        })
        .catch((e) => {
          console.error('[Ayna] getSession failed:', e);
          setUser(null);
          setUserSession(null);
        })
        // Must run on BOTH paths. Without it a rejected getSession left
        // authLoading true forever, the PROTECTED_VIEWS redirect never fired,
        // and the user saw an empty ecosystem with no auth prompt.
        // "page opened → auth resolved", success or failure, same moment the
        // UI stops gating on authLoading.
        .finally(() => { setAuthLoading(false); markPerf('auth_resolved'); });
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
      'privacy-policy', 'consumer-health-data', 'terms-of-use', 'confirmed', 'auth-callback', 'auth-confirm',
      'welcome', 'hero', 'quiz', 'discovery', 'product', 'waitlist', 'articles', 'you', 'community',
      'how-it-works', 'how-we-make-money', 'campus-resources', 'about', 'contact', 'waitlist', 'not-found', 'ecosystem',
      'free-product', 'free-product-reward', 'health', 'shared-answer',
      'today', 'explore', 'explore-topics', 'explore-services', 'ask',
    ];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // A different account (or none) must never reuse the previous account's cached intake.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') forgetSharedIntake();
      if (session) {
        setUser(session.user);
        setUserSession(session);
      }
      if (event === 'SIGNED_IN' && session?.user) {
        identifyAccount(posthog, supabase, session.user).catch(() => {}).finally(() => tagInternalUserIfNeeded(posthog));
        setShowAuthModal(false);
        // Deliberately does NOT navigate here. Every in-app path that opens the
        // auth modal (nav "Log in", quiz-complete gate, browse gate, the
        // PROTECTED_VIEWS redirect) sets `pendingAction` first, and the
        // [user, pendingAction] effect below does the post-login navigation.
        // The Google OAuth return trip is handled separately by AuthCallback's
        // onAuthenticated. Supabase also fires SIGNED_IN on session restoration
        // AND on every tab-focus token check (even when nothing changed), a
        // previous version of this handler tried to distinguish "explicit
        // login" from those via a ref snapshot of the initial session, but that
        // snapshot could be wrong (e.g. a transient getSession() failure marked
        // it "signed out" even for an already-signed-in user), which sent
        // users back to the ecosystem page, losing whatever they were doing
        // every time they returned to the tab. Since the two real login paths
        // already navigate on their own, this handler doesn't need to.
      }
      if (event === 'SIGNED_OUT') {
        posthog.reset();
      }
      if (!session) {
        // Leave Supabase's auth callback before checking the session again.
        // Awaiting an auth method here can block the sign-in event itself.
        setTimeout(async () => {
        // supabase-js is known to emit a spurious SIGNED_OUT (session: null)
        // on a transient background token-refresh failure, a brief network
        // blip, not a real sign-out. This block wipes EVERY piece of local
        // state (ecosystem, quiz results, reviews, health profile, saved
        // products) and sends the user back to 'welcome', forcing a full
        // intake redo, exactly what an MVP tester reported happening to her
        // for no apparent reason while she was still genuinely signed in.
        // Debounce: wait briefly and re-check the ACTUAL current session
        // before treating this as a real sign-out, so a transient blip that
        // resolves on its own never touches any local data.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) return; // recovered, was transient, wipe nothing
        } catch {
          // getSession() itself failing doesn't prove there's no session
          // fall through to the wipe rather than loop forever on an
          // unrelated network error, same as every other best-effort check
          // in this handler.
        }
        setUser(null);
        setUserSession(null);
        setMyProducts({});
        setTrackedProducts({});
        setOmittedProducts({});
        setQuizResults(null);
        setAynaReviews({});
        // Held only in memory + localStorage and never cleared before, so the
        // next user on this browser inherited the previous user's imported
        // conditions and medications, which are then sent to the LLM as
        // "her" health context by ProductModal and MyEcosystem.
        setHealthProfile(null);
        setSavedProducts({});
        clearSavedProducts();
        if (!STATIC_VIEWS.includes(currentViewRef.current)) {
          setCurrentView('welcome', { replace: true });
        }
        try {
          // Keep LLM recommendations cache, it's fingerprint-keyed so a
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
        } catch { /* ignore */ }
        }, 0);
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
    // Hung-request guard: every branch below already has catch/finally, but a
    // fetch that never settles (dead network mid-request) would otherwise keep
    // the ecosystem skeleton up forever. After 15s stop CLAIMING to load:
    // whatever is already on screen stays (never overwritten with empty
    // state), and late results still merge in through the same
    // merge-don't-replace handlers below, so nothing is lost either way.
    const dataLoadWatchdog = setTimeout(() => {
      if (!cancelled) setDataLoading(false);
    }, 15000);
    Promise.all([
      (async () => {
        const resetAt = getPendingEcosystemResetAt(loadForUserId);
        if (resetAt) {
          // A marker left by an older build (pre Oct 16). It used to run the
          // full wipe (un-shelving and deleting her own products). Now it only
          // switches off ayna's generated picks, never deletes, and is cleared
          // either way so it can't hide anything later.
          try {
            await clearGeneratedPicksForUser(supabase, loadForUserId);
          } catch (error) {
            console.warn('[Ayna] leftover ecosystem reset marker:', error);
          }
          clearPendingEcosystemReset(loadForUserId);
        }
        return loadEcosystemForUser(supabase, loadForUserId).catch(() => null);
      })(),
      loadReviewsForUser(supabase, loadForUserId).catch(() => null),
      loadLearningMemoryForUser(supabase, loadForUserId).catch(() => null),
      loadHealthIntakeForCurrentUser().catch(() => null),
      // Imported conditions/medications/allergies. Was localStorage-only, so it
      // vanished on any other device while still being fed to the LLM as health
      // context, recommendations silently degraded with no signal.
      loadHealthProfileForCurrentUser().catch(() => null),
      // null when the is_saved column isn't on the live table yet, the local
      // list stands in until the migration is applied.
      loadSavedForUser(supabase, loadForUserId).catch(() => null),
    ]).then(([ecosystem, reviews, memory, intake, healthProfileResult, saved]) => {
      if (cancelled) return;
      if (!ecosystem) {
        // B3: an expired sign-in used to leave her avatar up over an EMPTY
        // ecosystem, which reads like her products are gone. If the session is
        // no longer valid, say so and sign out locally (nothing on the server
        // is touched; signing back in loads everything).
        supabase.auth.getUser().then(({ data, error }) => {
          if (cancelled || (!error && data?.user)) return;
          // Offline or a server hiccup is not a sign-out: only a real auth answer is.
          const authFailure = !error || error.status === 401 || error.status === 403 || /jwt|session|not authenticated/i.test(String(error.message || ''));
          if (!authFailure || error?.name === 'AuthRetryableFetchError') return;
          toast('You’ve been signed out. Sign in again to see your ecosystem.');
          supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        }).catch(() => {});
      }
      if (saved) {
        // Merge rather than replace: anything saved while signed out on this
        // device should survive signing in.
        // The device's list, if the catalog-load restore above hasn't run yet.
        let local = {};
        if (!savedRestoredRef.current) { savedRestoredRef.current = true; local = loadSavedProducts(); }
        setSavedProducts((prev) => {
          const merged = { ...local, ...prev, ...saved };
          persistSavedProducts(merged);
          return merged;
        });
      }
      if (ecosystem) {
        // Everything she has on a shelf shows; nothing is hidden by an old reset marker.
        const visibleEcosystem = ecosystem;
        if (!llmBuiltThisSessionRef.current) {
          // Merge, don't replace: anything the user toggled while the load was
          // in flight is already persisted, and clobbering it here made her
          // change vanish from the UI a few seconds after she made it.
          setMyProducts(prev => (Object.keys(prev).length ? { ...visibleEcosystem.myProducts, ...prev } : visibleEcosystem.myProducts));
          try { localStorage.removeItem(GUEST_ECO_KEY); } catch { /* ignore */ }
          setEcosystemOrder(prev => {
            const merged = Object.keys(visibleEcosystem.myProducts);
            const extra = prev.filter(id => !merged.includes(id));
            return [...merged, ...extra];
          });
        } else {
          // LLM already built this session, merge only manual (non-LLM) products from Supabase
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
        try { localStorage.setItem('ayna_llm_learning_memory_v1', JSON.stringify(memory)); } catch { /* ignore */ }
      }
      if (intake?.personalizationCompleted) {
        setQuizResults(mapIntakeToLegacyQuizProfile(intake));
      }
      if (healthProfileResult?.profile) setHealthProfile(healthProfileResult.profile);
    }).finally(() => {
      clearTimeout(dataLoadWatchdog);
      if (!cancelled) {
        setDataLoading(false);
        // "page opened → ecosystem data loaded" (first settle only; markPerf
        // dedupes retries and account switches).
        markPerf('ecosystem_data_loaded');
      }
    });
    return () => { cancelled = true; clearTimeout(dataLoadWatchdog); };
    // dataLoadNonce: the ecosystem skeleton's Retry re-runs this load.
  }, [user?.id, dataLoadNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // PostHog perf marks: first time each major surface comes on screen this
  // page load. Names and milliseconds only; markPerf never sends content.
  React.useEffect(() => {
    if (currentView === 'ecosystem') markPerf('ecosystem_first_render');
    if (currentView === 'community') markPerf('community_first_render');
  }, [currentView]);

  React.useEffect(() => {
    if (!user) return;
    if (!pendingAction) {
      // No pending action, user was already signed in (e.g. returning session).
      // Stay on welcome so they can navigate themselves.
      return;
    }
    // Her matches come from the catalog: on a fresh page load wait for it.
    if (pendingAction === 'quiz-complete' && pendingQuizResults && !catalogReady) return;
    setShowAuthModal(false);
    if (pendingAction === 'quiz-complete' && pendingQuizResults) {
      setQuizResults(pendingQuizResults);
      const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(pendingQuizResults, healthProfile, seedOpts);
      setEcosystemSeedMeta(seedMeta);
      // Tagged so a later AI rebuild can tell these generated picks apart from
      // products she added herself (handleBuildEcosystemFromLlm).
      const instantProducts = Object.fromEntries(Object.entries(mergedProducts || {}).map(([id, product]) => [id, { ...product, intakeGenerated: true }]));
      setMyProducts(prev => ({ ...instantProducts, ...Object.fromEntries(Object.entries(prev || {}).filter(([, p]) => p && !isGeneratedPick(p))) }));
      setEcosystemOrder(prev => [...Object.keys(instantProducts), ...prev.filter(id => !instantProducts[id] && myProductsRef.current[id] && !isGeneratedPick(myProductsRef.current[id]))]);
      clearCachedLlmRecommendations();
      try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch { /* ignore */ }
      const _supabase = getSupabaseClient();
      if (_supabase && user) {
        // Persist the instant seed right away rather than waiting on the async
        // LLM build (handleBuildEcosystemFromLlm) to be the only thing that
        // ever writes to user_ecosystems. That build can fail (provider error,
        // 502, the tab closing mid-fetch) and previously left NOTHING saved —
        // the seed only ever lived in React state + a sessionStorage shadow,
        // so it silently evaporated the moment the session ended, even though
        // it was visibly "in" her ecosystem the whole time. Chained after the
        // reset (not fired in parallel) so the clear-then-seed writes can't
        // race and have the seed's `in_ecosystem: true` lost to the reset's
        // `in_ecosystem: false` landing second.
        // Additive, never a reset: she may be signing in to an account that already
        // has products (guest quiz on a new device, then "Save my matches"). The
        // old clear-then-seed wiped everything she had added herself. The saved
        // rows load back in and merge with these picks (see the data load above).
        seedSavePromiseRef.current = seedSavePromiseRef.current.then(() => clearGeneratedPicksForUser(_supabase, user.id)).then(() => {
          const seeded = Object.values(instantProducts);
          if (seeded.length) {
            return upsertProductsBatch(_supabase, user.id, seeded, { inEcosystem: true, isTracked: false, isOmitted: false });
          }
        }).then(result => {
          if (result?.synced === false) reportSaveFailure('Could not save your ecosystem', new Error('The server did not accept the product update.'));
        }).catch(e => reportSaveFailure('Could not save your ecosystem', e));
      }
      setCurrentView('ecosystem');
      // Persist the RAW intake, not the legacy wrapper. `pendingQuizResults` is
      // already the output of mapIntakeToLegacyQuizProfile(), so saving it stored
      // the wrong shape in health_intakes.profile, and on the next load
      // mapIntakeToLegacyQuizProfile() ran over an already-mapped object, whose
      // keys it does not recognise. Conditions, symptoms, flow level and product
      // preferences all came back EMPTY for every user who signed up after
      // completing the intake (i.e. the whole OAuth signup path), and the LLM was
      // then handed a malformed intake on every subsequent build.
      const rawIntake = pendingQuizResults?.fullHealthIntake || pendingQuizResults;
      saveHealthIntakeForCurrentUser(rawIntake).catch(e => reportSaveFailure('Could not save your health profile', e));
      setPendingQuizResults(null);
      setShowWrapped(true);
    } else if (pendingAction === 'browse' || pendingAction === 'personalize') {
      handleViewDiscovery('');
    } else if (pendingAction === 'login') {
      // Signing in lands on Today, the home for signed-in accounts.
      setCurrentView('today');
    } else if (pendingAction === 'ecosystem') {
      setCurrentView('ecosystem');
    } else if (pendingAction === 'saved') {
      setCurrentView('you', { path: '/you/saved' });
    } else if (pendingAction === 'share-friend') {
      // Back to the shared answer she was on; the page sends the friend request.
      const pending = readPendingFriend();
      if (pending?.slug) openSharedAnswer(pending.slug);
    } else if (pendingAction === 'stay') {
      // Signed in from a page that needs an account (free product feedback and
      // invites, You, Today, Health data): stay on it, so the thing she was
      // doing still works (team direction 55). Nothing to navigate.
    } else if (pendingAction === 'delete-account') {
      // Returning from the Google re-confirmation redirect the delete-account
      // page kicks off before it lets someone delete a Google-linked account.
      setCurrentView('delete-account');
    }
    setPendingAction(null); pendingActionRef.current = null;
  }, [user, pendingAction, catalogReady]);

  // Google/Apple from a sign-in form (not the post-quiz save) can create a
  // brand-new empty account. Once her saved data has loaded, offer the quiz
  // first instead of an empty account (src/utils/oauthNewAccount.js).
  const [newAccountStart, setNewAccountStart] = useState(false);
  const newAccountLoadRef = useRef(false);
  React.useEffect(() => {
    if (!user) return;
    if (dataLoading) { newAccountLoadRef.current = true; return; }
    if (!newAccountLoadRef.current) return;
    newAccountLoadRef.current = false;
    // An app (mobile-preview) sign-in passes through here on its way back; the app checks it.
    try { if (localStorage.getItem('ayna_mobile_oauth_pending') === '1') return; } catch { /* private mode */ }
    const offer = shouldOfferEcosystemStart({
      user, source: takeOAuthSource(), hasIntake: Boolean(quizResults), productCount: Object.keys(myProducts || {}).length,
    });
    if (offer) Promise.resolve().then(() => setNewAccountStart(true));
  }, [user, dataLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Signed out, "Personalize" starts the quiz (account comes after the matches).
  const handleRequirePersonalizeAuth = useCallback(() => {
    if (!user) { setCurrentView('quiz'); return; }
    setPendingAction('personalize'); pendingActionRef.current = 'personalize';
    setShowAuthModal(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // (main's "profile-less sign-in goes straight to the quiz" redirect is
  // covered here by the new-account guard above, NewAccountStart.)

  // A Google account with no consent on record (created straight from Log in, which skips the
  // signup form) must confirm 18+ / consent / referral before going further. Waits briefly so a
  // signup-form Google account, whose consent is written right after the redirect, never flashes it.
  useEffect(() => {
    const OAUTH_PROVIDERS = ['google', 'apple'];
    const isOauth = OAUTH_PROVIDERS.includes(user?.app_metadata?.provider)
      || (Array.isArray(user?.identities) && user.identities.some((i) => OAUTH_PROVIDERS.includes(i?.provider)));
    const missingConsent = Boolean(user) && isOauth && !user.user_metadata?.consent_given_at;
    if (!missingConsent || authLoading || currentView === 'auth-callback' || currentView === 'campus-resources') {
      setConsentGateOpen(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      let pendingStash = false;
      try { pendingStash = Boolean(sessionStorage.getItem('ayna_pending_consent')); } catch { /* ignore */ }
      if (!pendingStash) setConsentGateOpen(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, authLoading, currentView]);

  const PROTECTED_VIEWS = ['omitted', 'recalls', 'doctor-prep', 'profile-edit', 'phone-verify', 'tracked', 'screenings', 'delete-account', 'health-data'];
  useEffect(() => {
    if (!authLoading && !user && PROTECTED_VIEWS.includes(currentView)) {
      // Say what the page was, so the sign-in sheet explains itself.
      const FEATURE = { 'doctor-prep': 'appointment prep', recalls: 'recall alerts', tracked: 'recall alerts', comparison: 'comparisons', omitted: 'your hidden products', 'profile-edit': 'your health profile', 'phone-verify': 'ayna by text', screenings: 'screening reminders', 'delete-account': 'account settings', 'health-data': 'health data' };
      setCurrentView('welcome', { replace: true });
      setAuthFeature(FEATURE[currentView] || '');
      setPendingAction(FEATURE[currentView] ? 'feature' : 'login'); pendingActionRef.current = FEATURE[currentView] ? 'feature' : 'login';
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
      } catch {
        if (timeoutId) window.clearTimeout(timeoutId);
      }
    })();
    return () => {
      active = false;
    };
  }, [quizResults]);

  // Behavior signals for the matching engine (saved, Not for me, in her
  // ecosystem), shared by Shop, Ecosystem and the product page so they all
  // show the same per-need score. Memoized: the engine caches by identity.
  // Connected health data (You -> Health data) strengthens needs she chose,
  // only from sources whose terms allow it (src/health/policy.js). Personal
  // matching only: never Browse ranking, partner placement or ads.
  const healthNeedIds = useMemo(() => {
    try { return quizResults ? getSelectedNeeds(quizResults).map((n) => n.id) : []; } catch { return []; }
  }, [quizResults, catalogReady]);
  const health = useHealthData(user?.id || null, healthNeedIds);
  // Her switch (You, Health data): "Use my health data in my matches". Shared with the app.
  const healthInMatches = useHealthMatchPref(user?.id || null).on;
  const matchOpts = useMemo(
    () => {
      const base = behaviorFrom({ saved: savedProducts, omitted: omittedProducts, inEcosystem: myProducts });
      return healthInMatches && health.matchContext ? { ...base, healthContext: health.matchContext } : base;
    },
    [savedProducts, omittedProducts, myProducts, health.matchContext, healthInMatches]
  );

  const recommendedProductIds = useMemo(() => {
    if (!hasCompletedPersonalization) return [];
    return getPersonalizedProductIds(quizResults || null, healthProfile, matchOpts);
  }, [quizResults, healthProfile, hasCompletedPersonalization, matchOpts, catalogReady]);

  // Categories this person actually matches on, in match order, the landing
  // Shop's Personalize toggle sorts by these.
  const landingProfileCategories = useMemo(() => {
    if (!hasCompletedPersonalization) return [];
    const seen = [];
    getRecommendations(quizResults || null, healthProfile).forEach((p) => {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    });
    return seen;
  }, [quizResults, healthProfile, hasCompletedPersonalization, catalogReady]);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('ayna_zip')) setUserZipCode(localStorage.getItem('ayna_zip') || '');
    } catch { /* ignore */ }
  }, []);

  const handleZipCodeChange = (zip) => {
    setUserZipCode(zip);
    try { if (typeof window !== 'undefined') localStorage.setItem('ayna_zip', zip || ''); } catch { /* ignore */ }
  };

  // The zip captured during intake was "capture-only, no downstream wiring"
  // when that field was added, Care near you has its own separate zip input
  // (userZipCode, above), so users had to type the same zip twice for it to
  // show up in local clinic/telehealth links. One-time carry-over, covering
  // fresh quiz completion, the post-OAuth-signup completion path, a health
  // profile edit, and a session-restore load, all of them funnel through
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
    } catch { /* ignore */ }
  }, []);

  const CHECKIN_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // ~monthly
  // Only nags once someone has done a first check-in, a brand-new user with
  // nothing in their ecosystem yet has nothing to "check in" about.
  const checkinDue = !!checkinCompletedAt && (Date.now() - new Date(checkinCompletedAt).getTime() > CHECKIN_INTERVAL_MS);
  const isScrolled = scrollY > 20;
  const navOnGradient = GRADIENT_NAV_VIEWS.includes(currentView);
  const accountInitials = avatarInitials(user);


  useEffect(() => {
    if (!user || authLoading || dataLoading || !quizResults) {
      setShowHealthProfileUpdateNotice(false);
      return;
    }

    const createdAt = Date.parse(user.created_at || '');
    const completedAt = Date.parse(
      quizResults?.personalizationCompletedAt
      || quizResults?.fullHealthIntake?.personalizationCompletedAt
      || ''
    );

    let seenLocally = false;
    try {
      seenLocally = localStorage.getItem(
        `${HEALTH_PROFILE_UPDATE_NOTICE_KEY}:${user.id}`
      ) === '1';
    } catch { /* ignore */ }

    const seenInAccount = user?.user_metadata?.[HEALTH_PROFILE_UPDATE_NOTICE_KEY] === true;

    const hasCompletedProfile =
      quizResults?.personalizationCompleted === true
      || quizResults?.fullHealthIntake?.personalizationCompleted === true;

    const profilePredatesCutoff = Number.isFinite(completedAt)
      ? completedAt < HEALTH_PROFILE_UPDATE_CUTOFF
      : hasCompletedProfile;

    const eligible =
      Number.isFinite(createdAt)
      && createdAt < HEALTH_PROFILE_UPDATE_CUTOFF
      && hasCompletedProfile
      && profilePredatesCutoff
      && !seenLocally
      && !seenInAccount;

    setShowHealthProfileUpdateNotice(eligible);
  }, [user, authLoading, dataLoading, quizResults]);

  const markHealthProfileUpdateNoticeSeen = async () => {
    if (!user?.id) return;

    try {
      localStorage.setItem(`${HEALTH_PROFILE_UPDATE_NOTICE_KEY}:${user.id}`, '1');
    } catch { /* ignore */ }

    setShowHealthProfileUpdateNotice(false);

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || data?.user?.id !== user.id) return;

      const current = data.user.user_metadata || {};
      const { data: updated, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...current,
          [HEALTH_PROFILE_UPDATE_NOTICE_KEY]: true,
        },
      });

      if (!updateError && updated?.user) {
        setUser(updated.user);
      }
    } catch (error) {
      console.warn('[Ayna] Could not persist health-profile update notice state:', error);
    }
  };

  const handleKeepCurrentHealthProfile = () => {
    markHealthProfileUpdateNoticeSeen();
  };

  const handleRedoUpdatedHealthProfile = () => {
    markHealthProfileUpdateNoticeSeen();
    setCurrentView('quiz');
  };

  const handleStartQuiz = () => setCurrentView('quiz');
  // Redo the quiz from the first question (not a resumed draft).
  const handleRedoQuiz = () => { setQuizResume(false); setQuizRun((n) => n + 1); setCurrentView('quiz'); };
  // "Finish your quiz": resume the draft at its exact step, or clear it and start at question 1.
  // Drafts are kept per device (the server only stores finished answers).
  const handleResumeQuiz = () => { setQuizResume(true); setCurrentView('quiz'); };
  const handleStartQuizOver = () => { clearIntakeDraft(); handleRedoQuiz(); };
  const handlePersonalizeQuiz = () => { setEditAtOptional(true); setCurrentView('profile-edit'); };
  const webQuizDraft = !quizResults && !authLoading && !dataLoading && !['quiz', 'profile-edit'].includes(currentView) ? readDraftProgress({ surface: 'web' }) : null;
  const finishQuizCard = (compact = false) => (webQuizDraft ? <FinishQuizCard variant="web" compact={compact} progress={webQuizDraft} onContinue={handleResumeQuiz} onStartOver={handleStartQuizOver} /> : null);
  let webOptionalRemaining = 0;
  if (quizResults?.fullHealthIntake && !webQuizDraft) {
    try { webOptionalRemaining = optionalProgress(reconstructIntakeFromSnapshot(quizResults.fullHealthIntake)).remaining; } catch { webOptionalRemaining = 0; }
  }
  // One quiz card at a time: an unfinished quiz first, else the optional questions.
  const ecosystemQuizCard = webQuizDraft ? finishQuizCard() : (user && webOptionalRemaining > 0 ? <MorePersonalCard remaining={webOptionalRemaining} onAnswer={handlePersonalizeQuiz} /> : null);
  // Same reset as the app: clears her Ecosystem, its tracking and her quiz
  // answers after she confirms. Saved products, check-ins and the account stay.
  const handleResetEcosystem = async () => {
    if (!user?.id) return;
    // Confirmed on the button itself (two taps, components/ui/ConfirmButton.jsx), never window.confirm.
    const supabase = getSupabaseClient();
    try {
      if (supabase) await clearEcosystemForUser(supabase, user.id, { includeTracking: true });
      await clearHealthIntakeForCurrentUser();
    } catch (e) {
      reportSaveFailure('Could not reset your ecosystem', e);
      return;
    }
    forgetSharedIntake();
    try { localStorage.removeItem(INTAKE_DRAFT_KEY); } catch { /* storage blocked */ }
    setMyProducts({});
    setTrackedProducts({});
    setOmittedProducts({});
    setQuizResults(null);
    toast('Your ecosystem is reset.');
    handleRedoQuiz();
  };
  const handleOpenHealthProfileEditor = () => setCurrentView('profile-edit');
  // Leave the profile editor without saving anything (the editor only writes
  // on "See my results"), back to wherever it was opened from.
  const handleExitProfileEdit = () => {
    if (inAppPushCountRef.current > 0 && window.history.state?.view === 'profile-edit') window.history.back();
    else setCurrentView(profileEditFromRef.current === 'profile-edit' ? 'ecosystem' : profileEditFromRef.current || 'ecosystem');
  };
  // Signed in: back from the first Wrapped slide reopens the quiz on its last
  // screen with every answer in place (same draft the quiz resumes from).
  const handleWrappedBackToQuiz = () => {
    const snapshot = quizResults?.fullHealthIntake;
    setShowWrapped(false);
    if (!snapshot) { setCurrentView('quiz'); return; }
    try {
      const intake = reconstructIntakeFromSnapshot(snapshot);
      const has = (v) => (Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== '');
      const didMore = ['productHistory', 'preferredFormats', 'priceRange', 'brandOpenness', 'trustedBrands', 'avoidIngredients', 'fsaHsaAnswer', 'anythingElse'].some((k) => has(intake[k]));
      const steps = getIntakeSteps(intake);
      const stepId = didMore ? steps[steps.length - 1]?.id : 'checkpoint';
      localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId }));
      setQuizResume(true);
    } catch { /* storage unavailable: the quiz opens from the saved profile */ }
    setCurrentView('quiz');
  };
  const handleOpenPhoneVerification = () => setCurrentView('phone-verify');
  const handleOpenDeleteAccount = () => setCurrentView('delete-account');
  const handleViewWaitlist = () => setCurrentView('waitlist');
  const handleViewEcosystem = () => setCurrentView('ecosystem');
  // The old Ecosystem "Dashboard" tab is Today now (Ask's "open my dashboard" lands there).
  const handleViewEcosystemDashboard = () => setCurrentView('today');
  // You's sections: /you/saved, /you/health, ... ('ecosystem' is its own view, /you/ecosystem).
  const openYou = (key = null) => {
    const section = key === 'overview' ? null : key;
    if (section === 'ecosystem') { setCurrentView('ecosystem'); return; }
    setCurrentView('you', { path: section ? `/you/${section}` : '/you' });
  };
  const handleViewWishlist = () => {
    if (!user) {
      setPendingAction('saved');
      pendingActionRef.current = 'saved';
      setShowAuthModal(true);
      return;
    }
    openYou('saved');
  };
  // Explore's sections. Products (the Shop) and Resources (the Library) are their own views.
  const openExplore = (section = 'overview', query = '') => {
    if (section === 'products') { handleViewDiscovery(query || ''); return; }
    if (section === 'resources') { setSelectedArticleId(null); setCurrentView('articles'); return; }
    setCurrentView(EXPLORE_VIEW[section] || 'explore');
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
  // Cmd/Ctrl+K focuses the search on this page, or opens the Shop search.
  const viewDiscoveryRef = useRef(handleViewDiscovery);
  viewDiscoveryRef.current = handleViewDiscovery;
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || String(e.key).toLowerCase() !== 'k') return;
      e.preventDefault();
      const focusSearch = () => {
        const input = [...document.querySelectorAll('input[type="search"], [role="search"] input')].find((el) => el.offsetParent !== null);
        if (input) { input.focus(); input.select?.(); return true; }
        return false;
      };
      if (!focusSearch()) { viewDiscoveryRef.current(''); window.setTimeout(focusSearch, 350); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const handleViewHowItWorks = () => setCurrentView('how-it-works');
  const handleViewAbout = () => setCurrentView('about');
  const handleViewContact = () => setCurrentView('contact');
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
  // Explicit log out: clear every user-scoped thing right away (header
  // badges, ecosystem, saved, profile) instead of waiting for the debounced
  // auth event, then land on the top of Home (audit G20, G09).
  const handleSignOut = () => {
    getSupabaseClient()?.auth.signOut();
    forgetSharedIntake();
    // A shelf layout saved before layouts were per account belongs to whoever is signing out now.
    try {
      const legacy = window.localStorage.getItem('ayna.drawers.v1');
      if (legacy && user?.id && !window.localStorage.getItem(`ayna.drawers.v1:${user.id}`)) window.localStorage.setItem(`ayna.drawers.v1:${user.id}`, legacy);
    } catch { /* storage blocked */ }
    clearPersonalStorage();
    toast('You’re signed out.');
    setMyProducts({});
    setTrackedProducts({});
    setOmittedProducts({});
    setQuizResults(null);
    setAynaReviews({});
    setHealthProfile(null);
    setSavedProducts({});
    clearSavedProducts();
    setShowAccountMenu(false);
    setCurrentView('welcome');
    window.scrollTo(0, 0);
  };

  // Nav targets are real links (cmd/middle-click open a tab); a plain click
  // stays in the app (audit G02).
  const linkProps = (go) => ({
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go();
    },
  });
  const savedCount = Object.keys(savedProducts || {}).length;

  // The logo: Today for a signed-in account with a profile, the welcome page otherwise.
  const navigateHome = () => {
    setDiscoverySearch('');
    setCurrentView(user && quizResults ? 'today' : 'welcome');
  };

  const handleQuizComplete = async (results, opts = {}) => {
    // First run ends on the reveal's "See my Today" (WebIntake): open Today, not the story.
    const toToday = opts?.land === 'today';
    await loadCatalog(); // her matches come from the catalog (already loaded by the quiz page)
    const completedResults = {
      ...results,
      personalizationCompleted: true,
      personalizationCompletedAt: new Date().toISOString(),
    };
    if (!user) {
      // Signed out: show her matches first (the same reveal signed-in users
      // get), then ask her to create an account to keep them.
      setPendingQuizResults(completedResults);
      setPendingAction('quiz-complete'); pendingActionRef.current = 'quiz-complete';
      const { mergedProducts: guestSeed } = getEcosystemSeedFromQuiz(completedResults, healthProfile, seedOpts);
      const guestProducts = Object.values(guestSeed || {});
      setGuestPreview({ results: completedResults, products: guestProducts, done: toToday });
      if (toToday) {
        // Explore first: her answers work signed out; Save stays one tap away.
        markOnboardingDone();
        setQuizResults(completedResults);
        setPendingAction(null); pendingActionRef.current = null;
        setCurrentView('today');
      }
      return;
    }
    setQuizResults(completedResults);
    const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(completedResults, healthProfile, seedOpts);
    setEcosystemSeedMeta(seedMeta);
    // Tagged so a later AI rebuild can tell these generated picks apart from
    // products she added herself (handleBuildEcosystemFromLlm).
    const instantProducts = Object.fromEntries(Object.entries(mergedProducts || {}).map(([id, product]) => [id, { ...product, intakeGenerated: true }]));
    // Her own products stay on her shelves; only ayna's earlier picks are replaced.
    setMyProducts(prev => ({ ...instantProducts, ...Object.fromEntries(Object.entries(prev || {}).filter(([, p]) => p && !isGeneratedPick(p))) }));
    setEcosystemOrder(prev => [...Object.keys(instantProducts), ...prev.filter(id => !instantProducts[id] && myProductsRef.current[id] && !isGeneratedPick(myProductsRef.current[id]))]);
    llmBuiltThisSessionRef.current = false;
    clearCachedLlmRecommendations();
    try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch { /* ignore */ }
    const supabase = getSupabaseClient();
    // Local reset is immediate; remote sync is best-effort and never blocks build.
    // Persist the instant seed too (chained after the reset, not fired in
    // parallel, so a race can't have the reset's in_ecosystem:false land
    // after the seed's in_ecosystem:true) — otherwise the seed only lives in
    // React state + a sessionStorage shadow and is gone the moment the
    // session ends if the async LLM build (the only other thing that writes
    // to user_ecosystems) never finishes.
    if (supabase && user) {
      seedSavePromiseRef.current = seedSavePromiseRef.current.then(() => clearGeneratedPicksForUser(supabase, user.id)).then(() => {
        const seeded = Object.values(instantProducts);
        if (seeded.length) {
          return upsertProductsBatch(supabase, user.id, seeded, { inEcosystem: true, isTracked: false, isOmitted: false });
        }
      }).then(result => {
        if (result?.synced === false) reportSaveFailure('Could not save your ecosystem', new Error('The server did not accept the product update.'));
      }).catch(e => reportSaveFailure('Could not save your ecosystem', e));
    }
    posthog.capture('intake_completed', {
      concernsCount: Array.isArray(completedResults.primaryConcerns) ? completedResults.primaryConcerns.length : 0,
      conditionsCount: Array.isArray(completedResults.conditions) ? completedResults.conditions.length : 0,
    });
    if (toToday) { markOnboardingDone(); setCurrentView('today'); return; }
    setCurrentView('ecosystem');
    setShowWrapped(true);
  };

  // One quiz answer changed in place (You > Your blend): same save path as the
  // monthly check-in; matches re-rank from the new answers. Rolls back and
  // returns false if neither the server nor the device copy saved.
  const handleUpdateIntake = async (nextIntake) => {
    if (!nextIntake) return false;
    const previous = quizResults;
    setQuizResults(mapIntakeToLegacyQuizProfile(nextIntake));
    try {
      const r = await saveHealthIntakeForCurrentUser(nextIntake);
      if (r?.saved || r?.localSaved) return true;
    } catch { /* falls through to the rollback */ }
    setQuizResults(previous);
    return false;
  };

  const handleHealthProfileEditorSave = async (updatedResults) => {
    if (!updatedResults) {
      setCurrentView('ecosystem');
      return;
    }
    await loadCatalog(); // her matches come from the catalog
    setQuizResults(updatedResults);
    const { seedMeta, mergedProducts } = getEcosystemSeedFromQuiz(updatedResults, healthProfile, seedOpts);
    setEcosystemSeedMeta(seedMeta);
    // Tagged so a later AI rebuild can tell these generated picks apart from
    // products she added herself (handleBuildEcosystemFromLlm).
    const instantProducts = Object.fromEntries(Object.entries(mergedProducts || {}).map(([id, product]) => [id, { ...product, intakeGenerated: true }]));
    // Her own products stay on her shelves; only ayna's earlier picks are replaced.
    setMyProducts(prev => ({ ...instantProducts, ...Object.fromEntries(Object.entries(prev || {}).filter(([, p]) => p && !isGeneratedPick(p))) }));
    setEcosystemOrder(prev => [...Object.keys(instantProducts), ...prev.filter(id => !instantProducts[id] && myProductsRef.current[id] && !isGeneratedPick(myProductsRef.current[id]))]);
    llmBuiltThisSessionRef.current = false;
    clearCachedLlmRecommendations();
    try { window.sessionStorage.setItem('ayna_force_llm_refresh', '1'); } catch { /* ignore */ }
    const supabase = getSupabaseClient();
    // Local reset is immediate; remote sync is best-effort and never blocks build.
    // Persist the instant seed too (chained after the reset, not fired in
    // parallel — see handleQuizComplete for why) so an edited profile's
    // re-seeded ecosystem survives even if the async LLM rebuild never
    // completes.
    if (supabase && user) {
      seedSavePromiseRef.current = seedSavePromiseRef.current.then(() => clearGeneratedPicksForUser(supabase, user.id)).then(() => {
        const seeded = Object.values(instantProducts);
        if (seeded.length) {
          return upsertProductsBatch(supabase, user.id, seeded, { inEcosystem: true, isTracked: false, isOmitted: false });
        }
      }).then(result => {
        if (result?.synced === false) reportSaveFailure('Could not save your ecosystem', new Error('The server did not accept the product update.'));
      }).catch(e => reportSaveFailure('Could not save your ecosystem', e));
    }
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
      _userSwapped: true, // survives cache reloads, never overwritten by handleBuildEcosystemFromLlm
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
    if (compareStore.toggle(product) === 'full') toast('You can compare up to 4. Remove one first.');
  };
  const openCompare = (product = null) => {
    if (product?.id) compareStore.add(product);
    setCurrentView('comparison');
  };
  const openCompareRef = useRef(openCompare);
  openCompareRef.current = openCompare;
  useEffect(() => compareStore.setOpener(() => openCompareRef.current()), []);
  const toggleSavedRef = useRef(null);
  useEffect(() => { setSavedRemindersOwner(user?.id || null); }, [user?.id]);
  // A save she started signed out finishes once she is signed in (also after a Google/Apple redirect).
  useEffect(() => {
    if (!user?.id || !catalogReady) return;
    const pending = takePendingSave();
    if (pending && !savedProducts[pending.id]) Promise.resolve().then(() => toggleSavedRef.current?.(getProductById(pending.id) || pending, { fromSheet: true }));
  }, [user?.id, catalogReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Anything in your ecosystem is watched for recalls by default, that is
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

    // A toast named after the action; a more specific one (a shelf's Undo) replaces it.
    toast(wasIn ? REMOVED_FROM_ROUTINE : addedToRoutineText(), wasIn ? { label: 'Undo', onClick: () => toggleMyProductRef.current?.(product) } : { label: 'See it', onClick: () => setCurrentView('ecosystem') });
    if (!wasIn) {
      const origin = lastOpenOrigin?.productId === product.id ? lastOpenOrigin : null;
      posthog.capture('product_added', {
        category: product.category,
        type: product.type,
        source: origin?.source,
        fromSearch: (origin?.source || '') === 'search_results',
      });
    }
    if (user) {
      upsertProductState(getSupabaseClient(), user.id, product, {
        inEcosystem: !wasIn,
        isTracked: nextTracked,
        isOmitted: !!omittedProducts[product.id],
      }).catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  // Undo in a toast runs after later renders, so it calls the latest handler.
  const toggleMyProductRef = useRef(null);
  toggleMyProductRef.current = toggleMyProduct;

  /** Save for later, the wishlist shown at the bottom of My Ecosystem. */
  const toggleSavedProduct = (product, { fromSheet = false } = {}) => {
    setSaveError(null);
    const wasSaved = !!savedProducts[product.id];
    if (!wasSaved && !user && !fromSheet) { setSaveSheet(product); return; }
    const next = { ...savedProducts };
    if (wasSaved) delete next[product.id];
    else next[product.id] = product;
    setSavedProducts(next);
    persistSavedProducts(next);
    if (!wasSaved) posthog.capture('product_saved_for_later', { category: product.category });
    // Saved: "Remind me later · Compare" next to it (inline on its product page).
    if (wasSaved) { savePrompt.hide(); toast('Removed from Saved', { label: 'Undo', onClick: () => toggleSavedRef.current?.(product, { fromSheet: true }) }); } else savePrompt.show(product);
    if (!wasSaved) {
      try {
        const h = document.querySelector('.app-nav__circle--wishlist');
        if (h) { h.classList.remove('is-bump'); void h.offsetWidth; h.classList.add('is-bump'); }
      } catch { /* decorative */ }
    }
    if (user) {
      setSavedForUser(getSupabaseClient(), user.id, product, !wasSaved)
        .catch(e => reportSaveFailure('Could not save that change', e));
    }
  };

  toggleSavedRef.current = toggleSavedProduct;

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
      } catch { /* ignore */ }
    }
  };

  const handleBuildEcosystemFromLlm = useCallback((products) => {
    setSaveError(null);
    if (!Array.isArray(products) || products.length === 0) return;
    llmBuiltThisSessionRef.current = true;
    const valid = products.filter(p => p?.id);
    const llmIdSet = new Set(valid.map(p => p.id));
    const staleGeneratedIds = Object.values(myProductsRef.current)
      .filter(p => p?.id && (p.llmGenerated || p.intakeGenerated) && !p._userSwapped && !llmIdSet.has(p.id))
      .map(p => p.id);
    const manualIds = Object.keys(myProductsRef.current).filter(id => {
      const product = myProductsRef.current[id];
      return product && ((!product.llmGenerated && !product.intakeGenerated) || product._userSwapped);
    });
    setMyProducts(prev => {
      // Preserve manually-added products (DB products without llmGenerated flag)
      // so navigating away and back doesn't wipe things like the Saalt steamer
      const currentManualIds = Object.keys(prev).filter(id => {
        const p = prev[id];
        return p && ((!p.llmGenerated && !p.intakeGenerated) || p._userSwapped);
      });
      const manual = Object.fromEntries(currentManualIds.map(id => [id, prev[id]]));
      return { ...valid.reduce((acc, p) => { acc[p.id] = p; return acc; }, {}), ...manual };
    });
    setEcosystemOrder(() => [
      ...valid.map(p => p.id),
      ...manualIds.filter(id => !llmIdSet.has(id)),
    ]);
    const supabase = getSupabaseClient();
    if (supabase && user) {
      // The seed write may still be running. Replace its generated picks only
      // after it finishes, while leaving manual, tracked and saved rows intact.
      seedSavePromiseRef.current = seedSavePromiseRef.current.then(async () => {
        if (staleGeneratedIds.length) {
          try {
            await removeGeneratedProductsFromEcosystem(supabase, user.id, staleGeneratedIds);
          } catch (error) {
            reportSaveFailure('Could not remove old ecosystem picks', error);
          }
        }
        const result = await upsertProductsBatch(supabase, user.id, valid, { inEcosystem: true, isTracked: false, isOmitted: false });
        if (result?.synced === false) reportSaveFailure('Could not save your ecosystem', new Error('The server did not accept the product update.'));
      }).catch(e => reportSaveFailure('Could not save your ecosystem', e));
    }
  }, [user, reportSaveFailure]);

  // Cache of the exact product object last clicked, so the dedicated page can
  // render instantly without waiting on a lookup, a fresh LLM-generated
  // recommendation, for instance, may not be findable any other way until
  // its ecosystem write round-trips. A URL loaded directly (refresh, shared
  // link, browser back/forward) won't have this and falls back to
  // `resolvedProduct` below, which looks the id up from real state instead.
  const [lastClickedProduct, setLastClickedProduct] = useState(null);
  // Tracks whether the currently open product was reached from a search
  // result, so downstream events (buy now, add to ecosystem) can carry the
  // same searchQuery and let us trace search -> click -> purchase in
  // PostHog. Cleared whenever a product is opened from anywhere else.
  const [lastOpenOrigin, setLastOpenOrigin] = useState(null);

  const omittedCount = Object.keys(omittedProducts).length;
  const ecosystemCount = Object.keys(myProducts).length;

  // The gradient nav shares one painted canvas with the hero below it, so it
  // has to know WHICH board's hero that is: 1a, 1c (returning) or 1j (About).
  // Declared here, below ecosystemCount, and not up with the other nav flags
  // reading ecosystemCount before its `const` is a temporal dead zone error,
  // and && short-circuiting hid it from every signed-out check.
  const navGradientVariant = (currentView === 'about' || currentView === 'how-it-works')
    ? ' app-nav--about'
    : (user && ecosystemCount > 0) ? ' app-nav--returning' : '';
  const handleOpenProduct = (product, meta = {}) => {
    recordProductView(product?.id);
    if (!product?.id) return;
    const p = product?.llmGenerated ? enrichLlmProductForDiscovery(product) : product;
    const source = meta.source || 'browse';
    posthog.capture('product_card_opened', {
      productId: p?.id,
      category: p?.category,
      source,
      // Never the typed text (it can name a condition): only that it came from search.
      fromSearch: source === 'search_results',
      queryLength: source === 'search_results' ? String(meta.searchQuery || '').length : undefined,
      position: meta.position,
    });
    setLastOpenOrigin(source === 'search_results' ? { productId: p.id, source, searchQuery: meta.searchQuery } : null);
    // The tapped card's photo grows into the product page's photo (View
    // Transitions where supported, else the page's usual fade).
    growTransition(() => {
      setLastClickedProduct(p);
      navigateToProduct(p);
    }, { target: 'product', from: 'img' });
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

    if (lastClickedProduct && productRouteKey(lastClickedProduct) === productRouteId) {
      return lastClickedProduct;
    }

    const stores = [myProducts, savedProducts, trackedProducts, omittedProducts];

    let raw = null;

    for (const store of stores) {
      raw = store[productRouteId]
        || Object.values(store).find((p) => productRouteKey(p) === productRouteId)
        || null;

      if (raw) break;
    }

    raw ||= getProductById(productRouteId);
    // Forgiving product links: /product/sootheher-elaris-pod finds
    // "sootheher-s-elaris-pod" (apostrophes became "-s-" in slugs).
    if (!raw) {
      const loose = (x) => String(x || '').toLowerCase().replace(/-s-/g, '-').replace(/[^a-z0-9]/g, '');
      const want = loose(productRouteId);
      raw = want.length > 4 ? ALL_PRODUCTS.find((p) => loose(productRouteKey(p)) === want) || null : null;
    }

    if (!raw) return null;
    return raw.llmGenerated ? enrichLlmProductForDiscovery(raw) : raw;
  }, [productRouteId, lastClickedProduct, myProducts, savedProducts, trackedProducts, omittedProducts, catalogReady]);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setPublicRouteProduct(null);

    if (
      currentView !== 'product'
      || !productRouteId
      || resolvedProduct
      || authLoading
      || dataLoading
      // Not in the catalog is only known once the catalog has loaded.
      || !catalogReady
    ) {
      setPublicRouteProductLoading(false);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    setPublicRouteProductLoading(true);

    fetch(`/api/public-product?slug=${encodeURIComponent(productRouteId)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`public_product_${response.status}`);
        const body = await response.json();
        return body?.product || null;
      })
      .then((product) => {
        if (!cancelled) setPublicRouteProduct(product);
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          console.error('[product-route] public product lookup failed:', error?.message);
          setPublicRouteProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPublicRouteProductLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentView, productRouteId, resolvedProduct, authLoading, dataLoading, catalogReady]);

  const displayedProduct = resolvedProduct || publicRouteProduct;

  const productStillResolving = !displayedProduct
    && (authLoading || dataLoading || publicRouteProductLoading || !catalogReady);
  // A first visit to a product page paints its hero from the page's seed
  // (ProductHeroPreview); the full page takes over once that hero has actually
  // been on screen, not in the same moment the catalog lands.
  const [heroShown, setHeroShown] = useState(false);
  const markHeroShown = useCallback(() => setHeroShown(true), []);
  const heroPending = !heroShown && currentView === 'product' && Boolean(productSeedFor(window.location.pathname));

  // Every route showed the identical generic <title> from index.html, no
  // way to tell tabs apart, bookmark a specific page, or get a useful link
  // preview when sharing (found live, 2026-08-24 bug bash). One page,
  // dynamic title per route/product instead.
  useEffect(() => {
    const base = HOME_TITLE;
    if (currentView === 'product') {
      setRobots(!displayedProduct?.name && !productStillResolving);
      document.title = displayedProduct?.name
        ? productSeoTitle(displayedProduct)
        : (productStillResolving ? 'Loading… | ayna' : 'Product not found | ayna');
      // A product sets its own description, canonical and share card, so it never
      // inherits the page before it (an article's description used to stick).
      if (displayedProduct?.name) {
        // Same title, description and canonical address the prerendered page has (src/utils/seoMeta.js).
        setCanonical(productHref(displayedProduct) || window.location.pathname);
        setMetaDescription(productSeoDescription(displayedProduct));
        setShareCard({ title: productSeoTitle(displayedProduct), image: displayedProduct.image });
      }
      return;
    }
    const missing = currentView === 'not-found';
    setRobots(missing || isNoindexPath(window.location.pathname));
    setCanonical(missing ? null : window.location.pathname);
    // The prerendered read's Article JSON-LD only belongs on that read.
    if (currentView !== 'articles' || !selectedArticleId) document.getElementById('ay-read-jsonld')?.remove();
    // Public pages use the same title and description as their prerendered HTML.
    const seo = SEO_PAGES[VIEW_TO_PATH[currentView]];
    const label = VIEW_TITLES[currentView];
    document.title = seo ? seo[0] : label ? (/\bayna$/.test(label) ? label : `${label} | ayna`) : base;
    setMetaDescription(seo ? seo[1] : VIEW_DESCRIPTIONS[currentView] || DEFAULT_DESCRIPTION);
    setShareCard({ title: document.title });
    // G10: an article and a community profile each get their own title and
    // description (Articles is lazy, so its data is read from the same chunk).
    let cancelled = false;
    if (currentView === 'articles' && selectedArticleId) {
      import('./components/Articles').then((m) => {
        const a = (m.ARTICLES || []).find((x) => x.id === selectedArticleId);
        if (cancelled || !a) return;
        document.title = `${a.title} | ayna Library`;
        if (a.teaser) setMetaDescription(a.teaser);
        setShareCard({ title: document.title, image: a.image });
      }).catch(() => {});
    } else if (currentView === 'community' && communityHandle) {
      document.title = `@${communityHandle} | Community | ayna`;
      setMetaDescription(`@${communityHandle} on the ayna community: product reviews, saves and questions.`);
    }
    return () => { cancelled = true; };
  }, [currentView, displayedProduct, productStillResolving, selectedArticleId, communityHandle]);

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

  // The website health dashboard: its own page (/health) and the Dashboard
  // tab on Ecosystem render this same element.
  const webHealth = (
    <WebHealth
      user={user}
      health={health}
      products={Object.values(myProducts)}
      needIds={healthNeedIds}
      hormonalBC={usesHormonalBC(quizResults)}
      quizAnswers={quizResults}
      onEditAnswers={(step) => { if (!user) { handleStartQuiz(); return; } setEditAtStep(step || ''); setCurrentView('profile-edit'); }}
      onSaveToProfile={user && quizResults?.fullHealthIntake ? handleUpdateIntake : null}
      rundown={{ saved: Object.values(savedProducts || {}), onToggleSaved: toggleSavedProduct, onOpenRead: handleViewArticle, onExplore: () => handleViewDiscovery(''), matchOpts, healthProfile }}
      onOpenProduct={(p) => handleOpenProduct(p, { source: 'health_dashboard' })}
      onAsk={(q, extra) => openAsk(q, extra?.stats)}
      onSignIn={() => { setPendingAction('stay'); pendingActionRef.current = 'stay'; setShowAuthModal(true); }}
      onOpenConnections={() => {
        if (user) { setCurrentView('health-data'); return; }
        setPendingAction('stay'); pendingActionRef.current = 'stay'; setShowAuthModal(true);
      }}
    />
  );

  // Today is home for a signed-in account with a profile (founder, Oct 24 2026):
  // the welcome page hands over to Today once her account and answers are in.
  useEffect(() => {
    if (currentView !== 'welcome' && currentView !== 'hero') return;
    if (!user || !quizResults || authLoading || dataLoading || showWrapped) return;
    setCurrentView('today', { replace: true });
  }, [currentView, user, quizResults, authLoading, dataLoading, showWrapped, setCurrentView]);

  // Where each main tab goes (top nav and phone tab bar).
  const mainTabGo = {
    today: () => setCurrentView('today'),
    explore: () => openExplore('overview'),
    ask: () => setCurrentView('ask'),
    community: () => setCurrentView('community'),
    profile: () => openYou(null),
  };

  return (
    <div className="app-container" data-theme={themeAttr} data-view={currentView} data-scroll-end={headerScroll.atEnd ? '1' : undefined}>
      {/* Shared fixed stacking wrapper for top-of-viewport status rows, so the
          save-error banner and the ecosystem-generation bar stack instead of
          overlapping if both are showing at once, neither sets its own
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
              color: '#991B1B', padding: '0.7rem 1rem', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            }}
          >
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 600, fontSize: 16, lineHeight: 1 }}
            >×</button>
          </div>
        )}
        <GlobalToast />
        <EcosystemGenerationBar intakeFingerprint={ecosystemIntakeFingerprint} onViewEcosystem={handleViewEcosystem} hasEcosystem={ecosystemCount > 0} />
      </div>
      <a className="ay-skip" href="#ay-content">Skip to content</a>
      {/* The header sits outside <main>. It slides away while scrolling down and
          comes back on any scroll up; its hairline shows only with content under it. */}
        <div className={`app-nav-wrap${headerScroll.scrolled ? ' is-scrolled' : ''}${headerScroll.away ? ' is-away' : ''}`}>
        <nav
          className={`ay-nav${isScrolled ? ' is-scrolled' : ''}${FOCUSED_FLOW_VIEWS.includes(currentView) ? ' is-focused' : ''}`}
          data-on-gradient={navOnGradient ? navGradientVariant || 'yes' : undefined}
          aria-label="Primary"
        >
          <a className="ay-nav__logo" href="/" aria-label="ayna home" {...linkProps(navigateHome)}>
            ayna
            <span className="ay-nav__beta">beta</span>
          </a>

          {/* The five main tabs, same names and order as the app (Today, Explore, Ask ayna, Community, You). Real links (G02). */}
          <div className="ay-nav__links">
            {MAIN_TABS.map((t) => (
              <a key={t.key} href={t.href} className="ay-nav__link" aria-current={WEB_TAB_VIEWS[t.key].includes(currentView) ? 'page' : undefined} {...linkProps(mainTabGo[t.key])}>
                {t.label}
                {t.key === 'today' && !user && !authLoading && <span className="ay-nav__start">Start here</span>}
              </a>
            ))}
          </div>

          {currentView === 'quiz' && (
            <a href="/" className="ay-nav__exit" aria-label="Exit the quiz" {...linkProps(navigateHome)}>Exit</a>
          )}
          {currentView === 'profile-edit' && (
            <button type="button" className="ay-nav__exit" aria-label="Exit without saving" onClick={handleExitProfileEdit}>Exit</button>
          )}
          <div className="ay-nav__actions">
            {/* Phone: Ask ayna sits in the header, as in the app (one tab set, P1-7). */}
            {!FOCUSED_FLOW_VIEWS.includes(currentView) && currentView !== 'campus-resources' && currentView !== 'ask' && (
              <button type="button" className="ay-nav__ask" onClick={() => openAsk('')}>
                <span className="ay-nav__ask-orb" aria-hidden="true"><AskMark /></span>Ask ayna
              </button>
            )}
            {/* No unlabeled heart in the header (team direction 25): Saved lives in You (You > Saved, or the account menu). */}
            <div ref={accountMenuRef} className="ay-nav__account">
              {user ? (
                // Avatar opens a small account menu: profile, health profile, saved, log out.
                <button
                  type="button"
                  className="ay-nav__icon ay-avatar"
                  aria-label="Your account"
                  aria-haspopup="menu"
                  aria-expanded={showAccountMenu}
                  aria-current={currentView === 'you' ? 'page' : undefined}
                  onClick={() => setShowAccountMenu((v) => !v)}
                >
                  <span className="ay-avatar__text">{accountInitials}</span>
                  {checkinDue && <span className="ay-nav__dot" aria-hidden />}
                </button>
              ) : (
                <button
                  type="button"
                  className="ay-nav__login"
                  onClick={() => { setShowAccountMenu(false); const next = ['welcome', 'hero'].includes(currentView) ? 'login' : 'stay'; setPendingAction(next); pendingActionRef.current = next; setShowAuthModal(true); }}
                  aria-label="Log in"
                >
                  Log in
                </button>
              )}
              {showAccountMenu && user && (
                <div className="nav-account-menu" role="menu">
                  <a role="menuitem" href="/you" {...linkProps(() => { setShowAccountMenu(false); setCurrentView('you'); })}>Your profile</a>
                  <a role="menuitem" href="/today" {...linkProps(() => { setShowAccountMenu(false); setCurrentView('today'); })}>Today</a>
                  <button type="button" role="menuitem" onClick={() => { setShowAccountMenu(false); handleOpenHealthProfileEditor(); }}>Health profile</button>
                  <a role="menuitem" href="/you/ecosystem" {...linkProps(() => { setShowAccountMenu(false); handleViewEcosystem(); })}>My ecosystem</a>
                  <a role="menuitem" href="/you/saved" {...linkProps(() => { setShowAccountMenu(false); handleViewWishlist(); })}>Saved{savedCount ? <span className="nav-account-menu__count"> {savedCount}</span> : null}</a>
                  <a role="menuitem" href="/you/settings" {...linkProps(() => { setShowAccountMenu(false); openYou('settings'); })}>Settings and privacy</a>
                  <button type="button" role="menuitem" className="is-quiet" onClick={() => { setShowAccountMenu(false); handleSignOut(); }}>Log out</button>
                </div>
              )}
              {showAccountMenu && !user && (
                <div className="nav-account-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setShowAccountMenu(false); setCurrentView('quiz'); }}>Build your ecosystem</button>
                  <button type="button" role="menuitem" onClick={() => { setShowAccountMenu(false); const next = ['welcome', 'hero'].includes(currentView) ? 'login' : 'stay'; setPendingAction(next); pendingActionRef.current = next; setShowAuthModal(true); }}>Log in</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        </div>
      <main data-view={currentView}>
        <div id="ay-content" tabIndex={-1} />

        {(currentView === 'welcome' || currentView === 'hero') && (
          <AynaLanding
            onLogIn={() => { setPendingAction('login'); pendingActionRef.current = 'login'; setShowAuthModal(true); }}
            onStartQuiz={handleStartQuiz}
            onViewDiscovery={handleViewDiscovery}
            onOpenProduct={handleOpenProduct}
            onViewEcosystem={handleViewEcosystem}
            onViewArticles={handleViewArticles}
            onViewArticle={handleViewArticle}
            onViewAbout={handleViewAbout}
            onViewCommunity={() => setCurrentView('community')}
            onViewWaitlist={() => setCurrentView('waitlist')}
            onViewHowItWorks={handleViewHowItWorks}
            user={user}
            myProducts={myProducts}
            savedProducts={savedProducts}
            onToggleSaved={toggleSavedProduct}
            loading={authLoading || (!!user && dataLoading)}
            hasProfile={!!quizResults}
            healthIntake={quizResults?.fullHealthIntake || quizResults}
            profileCategories={landingProfileCategories}
            recommendedProductIds={recommendedProductIds}
            initialCategory={homeCategory}
            quizResults={quizResults}
            healthProfile={healthProfile}
            matchOpts={matchOpts}
            heroBanner={finishQuizCard(true)}
          />
        )}
        {guestPreview && !guestPreview.done && !user && (
          <WebWrapped
            products={guestPreview.products}
            quizResults={guestPreview.results}
            startAtEnd={!!guestPreview.atEnd}
            onBack={() => {
              // The quiz is still on screen underneath, on its last step with every answer.
              setGuestPreview(null);
              setPendingQuizResults(null);
              setPendingAction(null); pendingActionRef.current = null;
            }}
            primaryLabel="Save my matches →"
            onPrimary={() => { setGuestPreview((g) => ({ ...g, done: true })); setShowAuthModal(true); }}
            onClose={() => { setGuestPreview((g) => ({ ...g, done: true })); setShowAuthModal(true); }}
            onBrowse={() => {
              // Browse means browse: her matches come along, no sign-up wall.
              setGuestPreview((g) => ({ ...g, done: true }));
              if (pendingQuizResults || guestPreview?.results) setQuizResults(pendingQuizResults || guestPreview.results);
              setPendingAction(null); pendingActionRef.current = null;
              handleViewDiscovery('');
            }}
          />
        )}
        {showWrapped && (
          <WebWrapped
            products={Object.values(myProducts || {})}
            quizResults={quizResults}
            healthProfile={healthProfile}
            matchOpts={matchOpts}
            onClose={() => setShowWrapped(false)}
            onBack={handleWrappedBackToQuiz}
            onBrowse={() => { setShowWrapped(false); handleViewDiscovery(''); }}
          />
        )}
        {currentView === 'community' && (
          <WebCommunity
            key={communitySeed?.token || 'community'}
            seedKind={communitySeed?.kind || null}
            seedProductId={communitySeed?.productId || null}
            initialProfileHandle={communityHandle}
            initialPostId={communitySeed?.postId || communityPostId}
            onPostChange={(id) => {
              const here = window.location.pathname;
              if (id) { const next = `/community/p/${id}`; if (here !== next) window.history.pushState({ view: 'community' }, '', next); }
              else if (/^\/community\/p\//.test(here)) window.history.pushState({ view: 'community' }, '', '/community');
            }}
            onProfileChange={(h) => {
              setCommunityHandle(h);
              const next = h ? `/community/@${h}` : '/community';
              if (window.location.pathname !== next) window.history.pushState({ view: 'community' }, '', next);
            }}
            user={user}
            products={ALL_PRODUCTS}
            quizResults={quizResults}
            healthProfile={healthProfile}
            matchOpts={matchOpts}
            myProducts={myProducts}
            onOpenProduct={handleOpenProduct}
            onOpenArticle={(a) => { setSelectedArticleId(a.id); setCurrentView('articles'); }}
            onRequireAuth={(feature) => { setAuthFeature(typeof feature === 'string' ? feature : ''); setPendingAction(typeof feature === 'string' && feature ? 'feature' : 'login'); pendingActionRef.current = typeof feature === 'string' && feature ? 'feature' : 'login'; setShowAuthModal(true); }}
          />
        )}
        {currentView === 'you' && (
          <WebYou
            section={youSection}
            nav={<YouNav active={youSection || 'overview'} onGo={(key) => openYou(key === 'overview' ? null : key)} />}
            onOpenSection={openYou}
            recentAsks={chatHistory}
            savedSlot={(
              <SavedForLater
                savedProducts={savedProducts}
                onOpenProduct={handleOpenProduct}
                onToggleSaved={toggleSavedProduct}
                onAddToEcosystem={toggleMyProduct}
                myProducts={myProducts}
                onBrowse={() => handleViewDiscovery('')}
              />
            )}
            onOpenPost={(postId) => { setCommunitySeed({ postId, token: Date.now() }); setCurrentView('community'); }}
            onUpdateIntake={user ? handleUpdateIntake : null}
            onUpdateIntakeLocal={handleUpdateIntake}
            onEditAnswerAt={(step) => { setEditAtStep(step); setCurrentView(quizResults ? 'profile-edit' : 'quiz'); }}
            healthConnected={health.connected || []}
            onOpenCommunity={(to) => {
              if (to?.username) setCommunityHandle(to.username);
              else setCommunitySeed({ kind: to?.kind || null, token: Date.now() });
              setCurrentView('community');
            }}
            onOpenArticle={(a) => { setSelectedArticleId(a.id); setCurrentView('articles'); }}
            onSignIn={() => { setPendingAction('stay'); pendingActionRef.current = 'stay'; setShowAuthModal(true); }}
            user={user}
            quizResults={quizResults}
            myProducts={myProducts}
            savedProducts={savedProducts}
            onEditProfile={() => setCurrentView(quizResults ? 'profile-edit' : 'quiz')}
            onStartQuiz={handleStartQuiz}
            onOpenEcosystem={() => handleViewEcosystem()}
            onOpenSaved={handleViewWishlist}
            onOpenCheckin={() => setShowCheckin(true)}
            onOpenStartups={() => setCurrentView('waitlist')}
            onOpenFreeProduct={() => setCurrentView('free-product')}
            onOpenPhoneVerify={() => setCurrentView('phone-verify')}
            onOpenProduct={handleOpenProduct}
            onSignOut={handleSignOut}
            onDeleteAccount={handleOpenDeleteAccount}
            onOpenHealthData={() => setCurrentView('health-data')}
            onOpenHealth={() => setCurrentView('today')}
            healthSummary={health.insights.sections.find((sec) => sec.status === 'ready') || null}
            healthConnectedCount={health.connected.length}
            theme={themeMode}
            onThemeChange={setThemeMode}
            quizSlot={finishQuizCard()}
          />
        )}
        {currentView === 'quiz' && (
          <WebIntake key={quizResume ? 'quiz-resume' : `quiz-${quizRun}`} introEnabled={!quizResume} initialSnapshot={quizResume ? null : quizResults?.fullHealthIntake || null} onComplete={handleQuizComplete} onBrowseLibrary={handleViewArticles} onExplore={() => handleViewDiscovery('')} />
        )}

        {currentView === 'profile-edit' && (
          <div className="ay-flow-editbar">
            <span>Editing your answers. Nothing changes until you finish; Exit leaves them as they were.</span>
          </div>
        )}
        {currentView === 'profile-edit' && (authLoading || dataLoading) && <ViewLoadingFallback />}
        {currentView === 'profile-edit' && !authLoading && !dataLoading && (
          // Same as the app: editing your profile reopens the quiz with your answers filled in.
          // WebIntake reads its snapshot once, so it waits for the saved answers on a cold
          // load of /profile and remounts if they arrive later (P1-29).
          <WebIntake
            key={`${editAtStep ? `profile-edit-${editAtStep}` : editAtOptional ? 'profile-edit-optional' : 'profile-edit'}${quizResults?.fullHealthIntake ? '-filled' : '-empty'}`}
            startAtOptional={editAtOptional}
            startAtStep={editAtStep}
            initialSnapshot={quizResults?.fullHealthIntake || null}
            onComplete={handleHealthProfileEditorSave}
            onBrowseLibrary={handleViewArticles}
          />
        )}
        {currentView === 'delete-account' && (
          <DeleteAccountPage onBack={() => setCurrentView('you')} />
        )}
        {/* Today: the first main tab and the home for signed-in accounts. Same page /health showed. */}
        {currentView === 'today' && (
          <div className="wx-today">
            {React.cloneElement(webHealth, {
              title: 'Today',
              // Same model as the app: the Daily Rundown card leads (with no profile
              // it says how to make one), then the decision items and her log.
              intro: !quizResults && !dataLoading ? finishQuizCard() || null : null,
              compact: true,
              rundown: { ...webHealth.props.rundown, onSetUp: !quizResults && !dataLoading && !finishQuizCard() ? handleStartQuiz : undefined },
            })}
            {/* Her routine per need, short; the full one is in You > My ecosystem (src/components/routine). */}
            <div className="ay-container wx-today-routine">
              <RoutineSummary variant="web" hideMedicines userId={user?.id || null} quizAnswers={quizResults} matchOpts={matchOpts} products={myProducts} saved={savedProducts} omitted={omittedProducts}
                onOpenRoutine={() => { handleViewEcosystem(); window.setTimeout(() => document.getElementById('eco-routines')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 600); }}
                onOpenProduct={(p) => handleOpenProduct(p, { source: 'today_routine' })}
                onCheckIn={() => openTodayLog('web')} />
            </div>
          </div>
        )}
        {(currentView === 'explore' || currentView === 'explore-topics' || currentView === 'explore-services') && (
          <WebExplore
            section={EXPLORE_SECTION_OF[currentView] || 'overview'}
            onSection={openExplore}
            quizResults={quizResults}
            healthProfile={healthProfile}
            matchOpts={matchOpts}
            savedProducts={savedProducts}
            myProducts={myProducts}
            onToggleSaved={toggleSavedProduct}
            onOpenProduct={handleOpenProduct}
            onOpenArticle={handleViewArticle}
            onStartQuiz={handleStartQuiz}
            recommendedProductIds={recommendedProductIds}
            onOpenCommunityPost={(postId) => { setCommunitySeed({ postId, token: Date.now() }); setCurrentView('community'); }}
            onOpenCommunity={(q) => {
              setCurrentView('community');
              // Community reads its search from ?q= when it mounts.
              if (q) window.history.replaceState({ view: 'community' }, '', `/community?q=${encodeURIComponent(q)}`);
            }}
          />
        )}
        {/* Ask ayna as a page: the same conversation as the floating panel. */}
        {currentView === 'ask' && (
          <div className="ay-container wx-askpage">
            <h1 className="ay-sr">Ask ayna</h1>
            {user && quizResults ? (
              <ProfileChatbot
                asPage
                onRequireAuth={(feature) => { setAuthFeature(typeof feature === 'string' ? feature : ''); setPendingAction(typeof feature === 'string' && feature ? 'feature' : 'login'); pendingActionRef.current = typeof feature === 'string' && feature ? 'feature' : 'login'; setShowAuthModal(true); }}
                openSignal={askOpenSignal}
                prefill={askPrefill}
                prefillStats={askPrefillStats}
                profile={quizResults}
                user={user}
                onProfileUpdate={setQuizResults}
                chatHistory={chatHistory}
                onChatHistoryUpdate={setChatHistory}
                disabled={false}
                onNavigateToDiscovery={handleViewDiscovery}
                onViewRecommendations={() => handleViewEcosystem()}
                products={myProducts}
                matchOpts={matchOpts}
                healthProfile={healthProfile}
                focusProduct={null}
                hasHealthData={!!user && health.connected.length > 0}
                resolveProduct={(id) => myProducts[id] || Object.values(myProducts).find((p) => String(p?.id) === String(id)) || getProductById(id) || null}
                onOpenProduct={(product) => handleOpenProduct(product, { source: 'ask_followup' })}
                onOpenDashboard={handleViewEcosystemDashboard}
                onOpenRead={handleViewArticle}
              />
            ) : (
              <>
                <p className="ay-h1 wx-title" aria-hidden="true">Ask ayna</p>
                <section className="wx-invite" aria-labelledby="wx-ask-invite-h">
                  <h3 id="wx-ask-invite-h">Ask about your health, products and the evidence</h3>
                  <p>ayna answers from your health profile, the products you use and checked sources, and tells you why. {user ? 'Create your health profile to start asking.' : 'Create your health profile, or log in, to start asking.'}</p>
                  <div className="wx-invite__acts">
                    <button type="button" className="ay-btn ay-btn--primary" onClick={handleStartQuiz}>Create your health profile</button>
                    {!user && <button type="button" className="ay-btn ay-btn--secondary" onClick={() => { setPendingAction('login'); pendingActionRef.current = 'login'; setShowAuthModal(true); }}>Log in</button>}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
        {currentView === 'health-data' && user && (
          <WebHealthData
            user={user}
            quizResults={quizResults}
            onBack={() => setCurrentView('you')}
            onSignIn={() => { setPendingAction('stay'); pendingActionRef.current = 'stay'; setShowAuthModal(true); }}
            onEditProfile={() => setCurrentView(quizResults ? 'profile-edit' : 'quiz')}
          />
        )}
        <FeedbackPrompts key={user?.id || 'guest'} user={user} authLoading={authLoading} currentView={currentView} />
        {currentView === 'admin-reviews' && (
          <AdminReviewsPage onBack={handleBackFromStandalonePage} />
        )}
        {(currentView === 'free-product' || currentView === 'free-product-reward') && (
          <FreeProductPage
            key={currentView}
            user={user}
            authLoading={authLoading}
            stage={currentView === 'free-product-reward' ? 'reward' : 'progress'}
            onNavigate={(view) => setCurrentView(view)}
            onSignIn={() => { setPendingAction('stay'); pendingActionRef.current = 'stay'; setShowAuthModal(true); }}
            onStartQuiz={handleStartQuiz}
          />
        )}
        {currentView === 'admin-campaign' && (
          <CampaignAdminPage onBack={handleBackFromStandalonePage} />
        )}
        {currentView === 'admin-topics' && (
          <AdminTopicsPage onBack={handleBackFromStandalonePage} />
        )}
        {currentView === 'admin-research' && (
          <AdminResearchPage onBack={handleBackFromStandalonePage} />
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
            onBack={() => handleViewEcosystem()}
            onAsk={(q) => openAsk(q)}
            results={quizResults}
            onRetake={() => setCurrentView(quizResults ? 'profile-edit' : 'quiz')}
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
            onBack={() => setCurrentView('you')}
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
              onBrowseBrand={handleViewDiscovery}
            />
          </Suspense>
        )}
        {currentView === 'articles' && !selectedArticleId && <ExploreHeader compact titleAs="p" active="resources" onGo={(key) => openExplore(key)} />}
        {currentView === 'articles' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Articles
              userId={user?.id || null}
              onAsk={(q) => openAsk(q)}
              initialArticleId={selectedArticleId}
              onArticleChange={(id) => {
                setSelectedArticleId(id);
                // A read keeps its /library/:id address (search engines know it); the list is Explore > Resources.
                const next = id ? `/library/${id}` : VIEW_TO_PATH.articles;
                if (window.location.pathname !== next) window.history.pushState({ view: 'articles' }, '', next);
              }}
              onOpenProduct={handleOpenProduct} quizResults={quizResults} healthProfile={healthProfile} />
          </Suspense>
        )}
        {currentView === 'privacy-policy' && (
          <PrivacyPolicy onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} />
        )}
        {currentView === 'consumer-health-data' && (
          <ConsumerHealthData onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} />
        )}
        {currentView === 'terms-of-use' && (
          <TermsOfUse onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} />
        )}
        {currentView === 'how-we-make-money' && (
          <HowWeMakeMoney onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} />
        )}
        {currentView === 'how-it-works' && (
          <HowItWorks
            onBack={handleBackFromStandalonePage}
            backLabel={standaloneBackLabel}
            onViewSources={handleViewArticles}
          />
        )}
        {currentView === 'about' && (
          <About onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} onExplore={() => handleViewDiscovery()} onStart={handleStartQuiz} />
        )}
        {currentView === 'contact' && (
          <Contact onBack={handleBackFromStandalonePage} backLabel={standaloneBackLabel} user={user} />
        )}
        {currentView === 'campus-resources' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <CampusResources />
          </Suspense>
        )}
        {currentView === 'auth-callback' && (
          <AuthCallback onAuthenticated={(user) => {
            // Navigation is handled by the restored pendingAction effect so
            // Google OAuth follows the same post-login path as email/password.
            setUser(user);
            if (!pendingActionRef.current) setCurrentView('welcome', { replace: true });
          }} />
        )}
        {currentView === 'auth-confirm' && (
          <AuthConfirm onAuthenticated={(user) => {
            setUser(user);
            setCurrentView('confirmed');
          }} />
        )}
        {currentView === 'confirmed' && (
          <EmailConfirmed onAuthenticated={(user) => {
            setUser(user);
            // Signed up from a shared answer's Add friend: go back there to send it.
            const pending = readPendingFriend();
            if (pending?.slug) openSharedAnswer(pending.slug);
            else setCurrentView('welcome');
          }} />
        )}
        {/* My ecosystem (You > My ecosystem, /you/ecosystem). Its old Dashboard tab is Today. */}
        {currentView === 'ecosystem' && (
          <EcosystemViewTabs dashboard={null} onHero={!!user && !(dataLoading && Object.keys(myProducts).length === 0)}>
          <YouNav active="ecosystem" onGo={(key) => openYou(key)} />
        {currentView === 'ecosystem' && dataLoading && Object.keys(myProducts).length === 0 && (
          <ViewSkeleton
            label="Loading your ecosystem"
            cards={6}
            slowAfterMs={8000}
            onRetry={() => setDataLoadNonce((n) => n + 1)}
          />
        )}
        {/* The bubble hero + shelves used to render here as two alternate
            App.jsx-level views (an "Ecosystem / Shelves" toggle) ABOVE
            MyEcosystem's own internal overview, two separate "your
            ecosystem" headers stacked on the same page. MyEcosystem now
            renders both combined (board 2a), so this toggle is gone rather
            than becoming a third, redundant copy. */}
        {currentView === 'ecosystem' && !user && !authLoading && ecosystemQuizCard && <div className="mockup-page fq-web-slot">{ecosystemQuizCard}</div>}
        {currentView === 'ecosystem' && !user && !authLoading && (
          <EcosystemPreview
            products={ALL_PRODUCTS}
            matches={guestPreview?.products || []}
            onBuild={() => { setQuizResume(false); setQuizRun((n) => n + 1); setCurrentView('quiz'); }}
            onSignIn={() => { setPendingAction('ecosystem'); pendingActionRef.current = 'ecosystem'; setShowAuthModal(true); }}
            onSave={() => {
              if (guestPreview?.results) setPendingQuizResults(guestPreview.results);
              setPendingAction('quiz-complete'); pendingActionRef.current = 'quiz-complete';
              setShowAuthModal(true);
            }}
            onOpenProduct={handleOpenProduct}
            onBrowse={() => handleViewDiscovery('')}
          />
        )}
        {currentView === 'ecosystem' && user && (
          <Suspense fallback={<ViewLoadingFallback />}>
          <MyEcosystem
            quizSlot={ecosystemQuizCard}
            quizSlotKind={webQuizDraft ? 'finish' : 'personal'}
            onFixLifeStages={() => { setEditAtStep('lifeStage'); setCurrentView('profile-edit'); }}
            matchOpts={matchOpts}
            myProducts={myProducts}
            ecosystemOrder={ecosystemOrder}
            onToggleProduct={toggleMyProduct}
            savedProducts={savedProducts}
            onToggleSaved={toggleSavedProduct}
            onOpenCheckIn={() => { setCurrentView('today'); window.setTimeout(() => openTodayLog('web'), 500); }}
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            toggleOmitProduct={toggleOmitProduct}
            omittedProducts={omittedProducts}
            onOpenProduct={handleOpenProduct}
            onOpenDoctorPrep={() => setCurrentView('doctor-prep')}
            onBuildEcosystem={handleStartQuiz}
            onRedoQuiz={handleRedoQuiz}
            onResetEcosystem={handleResetEcosystem}
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
            savedSlot={(
              <SavedForLater
                savedProducts={savedProducts}
                onOpenProduct={handleOpenProduct}
                onToggleSaved={toggleSavedProduct}
                onAddToEcosystem={toggleMyProduct}
                myProducts={myProducts}
                onBrowse={() => handleViewDiscovery('')}
              />
            )}
          />
          </Suspense>
        )}
          </EcosystemViewTabs>
        )}
        {(currentView === 'discovery' || (currentView === 'product' && discoveryKeepAliveRef.current)) && (
          <div style={currentView === 'discovery' ? undefined : { display: 'none' }}>
          <ExploreHeader compact active="products" onGo={(key) => openExplore(key)} />
          <Suspense fallback={<ViewLoadingFallback />}>
          <Discovery
            matchOpts={matchOpts}
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
            aynaReviews={productReviewBuckets}
            savedProducts={savedProducts}
            onToggleSaved={toggleSavedProduct}
            hasQuizFrustrations={!!(quizResults?.frustrations?.length)}
            hasHealthImport={hasHealthImport}
            hasStatedLifeStage={hasStatedQuizLifeStage}
            quizResults={quizResults}
            healthProfile={healthProfile}
            user={user}
            onRequirePersonalizeAuth={handleRequirePersonalizeAuth}
            onAsk={(q) => openAsk(`Help me find ${q}`)}
            inExplore
          />
          </Suspense>
          </div>
        )}
        {currentView === 'screenings' && (
          <Screenings checkinData={checkinData} onNavigate={setCurrentView} onOpenProduct={handleOpenProduct} onOpenCheckin={() => setShowCheckin(true)} onBack={() => handleViewEcosystem()} />
        )}
        {currentView === 'omitted' && (
          <OmittedProducts omittedProducts={omittedProducts} toggleOmitProduct={toggleOmitProduct} onBack={() => handleViewEcosystem()} onBrowse={() => handleViewDiscovery('')} />
        )}
        {currentView === 'recalls' && (
          <Recalls trackedProducts={trackedProducts} myProducts={myProducts} onBack={() => handleViewEcosystem()} />
        )}
        {currentView === 'comparison' && (
          <Comparison
            onBack={() => handleViewEcosystem()}
            compareList={compareList}
            onRemove={toggleCompare}
            onClear={() => compareStore.clear()}
            CATEGORY_LABELS={CATEGORY_LABELS}
            myProducts={myProducts}
            onBrowseProducts={() => handleViewDiscovery('')}
            onAddToCompare={toggleCompare}
            savedProducts={savedProducts}
            matchFor={quizResults ? (p) => getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) : null}
            detailsFor={quizResults ? (p) => getProductMatchDetailsForProduct(p, quizResults, healthProfile, matchOpts) : null}
            onOpenProduct={(p) => handleOpenProduct(p, { source: 'compare' })}
          />
        )}
        {currentView === 'doctor-prep' && (
          <DoctorPrep
            checkinData={checkinData}
            myProducts={myProducts}
            quizResults={quizResults}
            chatHistory={chatHistory}
            onOpenCheckin={() => setShowCheckin(true)}
            onBack={() => setCurrentView('ecosystem')}
          />
        )}

        {showCheckin && (
          <MonthlyCheckin
            onComplete={(answers) => {
              setCheckinData(answers);
              const now = new Date().toISOString();
              setCheckinCompletedAt(now);
              try { if (typeof window !== 'undefined') localStorage.setItem('ayna_checkin_completed_at', now); } catch { /* ignore */ }
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
              // Previously this only ever updated in-memory state, a real
              // check-in change (e.g. adding "Painful cramps") showed the
              // right confirmation, then silently vanished on reload,
              // because nothing was ever sent to the backend (found live,
              // 2026-08-24 bug bash). `frustrations` on the legacy profile
              // shape is DERIVED (mapIntakeToLegacyQuizProfile computes it
              // from the raw intake's own fields, e.g. `symptoms`), so it
              // can't be persisted by writing it back directly, instead,
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

        {!FOCUSED_FLOW_VIEWS.includes(currentView) && currentView !== 'campus-resources' && (
          <nav className="ay-tabbar ay-tabbar--main" aria-label="Main navigation">
            {/* The app's tab bar, same order, names and icons (src/components/nav/tabs.jsx). */}
            {MAIN_TABS.map((t) => {
              const on = WEB_TAB_VIEWS[t.key].includes(currentView);
              const go = mainTabGo[t.key];
              return (
                <a key={t.key} href={t.href} className={`${on ? 'is-on' : ''}${t.center ? ' is-center' : ''}`} aria-current={on ? 'page' : undefined} {...linkProps(go)}>
                  <span className="ay-tabbar__icon" aria-hidden="true"><TabIcon kind={t.key} on={on} /></span><span className="ay-tabbar__label">{t.label}</span>
                </a>
              );
            })}
          </nav>
        )}


        {currentView === 'product' && composerSeed && (
          <WebCommunity
            composeOnly
            key={composerSeed.token}
            seedKind={composerSeed.kind}
            seedProductId={composerSeed.productId}
            seedRating={composerSeed.rating || null}
            user={user}
            products={ALL_PRODUCTS}
            quizResults={quizResults}
            healthProfile={healthProfile}
            matchOpts={matchOpts}
            onOpenProduct={handleOpenProduct}
            onRequireAuth={(feature) => { setAuthFeature(typeof feature === 'string' ? feature : ''); setPendingAction(typeof feature === 'string' && feature ? 'feature' : 'login'); pendingActionRef.current = typeof feature === 'string' && feature ? 'feature' : 'login'; setShowAuthModal(true); }}
            onDone={() => setComposerSeed(null)}
          />
        )}
        {currentView === 'product' && (
          displayedProduct && !heroPending ? (
            // Keying by id forces a clean remount when navigating from one
            // product's page straight to another's, every internal tab,
            // the Summary/Evidence toggle, and the chat thread reset to that
            // product's own defaults instead of carrying the previous
            // product's state over.
            <ProductModal
              onStartQuiz={() => { setQuizResume(false); setQuizRun((n) => n + 1); setCurrentView('quiz'); }}
              key={displayedProduct.id}
              product={displayedProduct}
              isTracked={!!trackedProducts[displayedProduct.id]}
              onTrack={toggleTrackProduct}
              onOmit={toggleOmitProduct}
              isOmitted={!!omittedProducts[displayedProduct.id]}
              onToggleCompare={toggleCompare}
              onCompare={openCompare}
              isInCompare={compareList.some(p => p.id === displayedProduct.id)}
              onAddToEcosystem={toggleMyProduct}
              isInEcosystem={!!myProducts[displayedProduct.id]}
              onToggleSaved={toggleSavedProduct}
              isSaved={!!savedProducts[displayedProduct.id]}
              savedProducts={savedProducts}
              userZipCode={userZipCode || undefined}
              aynaReviews={productReviewBuckets}
              onRate={handleRateProduct}
              onReview={handleReviewProduct}
              quizResults={quizResults}
              healthProfile={healthProfile}
              ecosystemProducts={Object.values(myProducts)}
              matchOpts={matchOpts}
              user={user}
              userSession={userSession}
              onAskAyna={(q) => openAsk(q)}
              onOpenProduct={handleOpenProduct}
              onBack={handleBackFromProduct}
              onOpenShop={(category) => handleViewDiscovery(category ? { initialCategory: category } : '')}
              onOpenRead={(articleId) => {
                handleViewArticle(articleId);
                const next = `/library/${articleId}`;
                if (window.location.pathname !== next) window.history.pushState({ view: 'articles' }, '', next);
              }}
              onOpenReview={(postId) => {
                setCommunitySeed({ postId, token: Date.now() });
                setCurrentView('community');
                const next = `/community/p/${postId}`;
                if (window.location.pathname !== next) window.history.replaceState({ view: 'community' }, '', next);
              }}
              onCommunityAction={(kind, extra = {}) => {
                const seed = { kind, productId: displayedProduct?.id || null, rating: extra?.rating || null, token: Date.now() };
                if (!user && kind !== 'post') {
                  setCommunitySeed(null);
                  setAuthFeature(kind === 'review' ? 'reviews' : kind === 'question' ? 'questions' : 'Community');
                  setPendingAction('feature'); pendingActionRef.current = 'feature'; setShowAuthModal(true);
                  return;
                }
                setComposerSeed(seed);
              }}
              searchOrigin={lastOpenOrigin?.productId === displayedProduct.id ? lastOpenOrigin : null}
            />
          ) : productStillResolving || displayedProduct ? (
            <ProductLoading fallback={<ViewLoadingFallback />} onPainted={markHeroShown} />
          ) : (
            <NotFoundState
              title="Product not found"
              subtitle="This product may have been removed, or the link may be incorrect."
              ctaLabel="Or browse all products"
              onCta={() => handleViewDiscovery('')}
              onSearch={(q) => handleViewDiscovery(q || (productRouteId ? String(productRouteId).replace(/[-_]+/g, ' ') : ''))}
              searchPlaceholder="Search for the product"
            />
          )
        )}
        {currentView === 'product-audit' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <ProductAudit />
          </Suspense>
        )}
        {currentView === 'shared-answer' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <SharedAnswerPage
              slug={slugFromPath(window.location.pathname)}
              user={user}
              session={userSession}
              onRequireAuth={(mode) => {
                setShareAuthMode(mode === 'signin' ? 'signin' : 'signup');
                setPendingAction('share-friend'); pendingActionRef.current = 'share-friend';
                setShowAuthModal(true);
              }}
              onAskOwn={() => openAsk()}
              onHome={() => setCurrentView('welcome')}
            />
          </Suspense>
        )}
        {currentView === 'not-found' && (
          <NotFoundState
            title="Page not found"
            subtitle="That link may be broken, or the page may have moved."
            ctaLabel="Go to homepage"
            onCta={() => setCurrentView('welcome')}
            onSearch={(q) => handleViewDiscovery(q)}
            links={[
              { href: '/explore/products', label: 'Explore', go: () => handleViewDiscovery('') },
              { href: '/quiz', label: 'See my matches', go: () => setCurrentView('quiz') },
              { href: '/explore/resources', label: 'Resources', go: () => { setSelectedArticleId(null); setCurrentView('articles'); } },
            ]}
          />
        )}

        {showHealthProfileUpdateNotice && user && currentView !== 'campus-resources' && (
          <div className="ay-hpu" role="dialog" aria-modal="true" aria-labelledby="ayna-health-profile-update-title">
            <div className="ay-hpu__card">
              <p className="ay-hpu__eyebrow">Health profile update</p>
              <button type="button" className="ay-hpu__close" aria-label="Close and keep my current profile" onClick={handleKeepCurrentHealthProfile}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <h2 id="ayna-health-profile-update-title">{accountFirstName(user) ? `Hi ${accountFirstName(user)}` : 'Hi'}</h2>
              <p className="ay-hpu__body">
                We’ve updated our health profile to make personalization more useful.
                You can redo it now, or keep your current profile exactly as it is.
              </p>
              <div className="ay-hpu__actions">
                <button type="button" className="ay-hpu__primary" onClick={handleRedoUpdatedHealthProfile} autoFocus>Redo health profile</button>
                <button type="button" className="ay-hpu__ghost" onClick={handleKeepCurrentHealthProfile}>Keep my current profile</button>
              </div>
              <p className="ay-hpu__note">Keeping your current profile will not change or remove any saved information.</p>
            </div>
          </div>
        )}

        {showAuthModal && !user && pendingAction === 'quiz-complete' && guestPreview?.done && createPortal(
          <button type="button" className="ay-flow-auth-back" onClick={() => {
            setShowAuthModal(false);
            setGuestPreview((g) => (g ? { ...g, done: false, atEnd: true } : g));
          }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            Back to my Wrapped
          </button>,
          document.body,
        )}
        {consentGateOpen && user && (
          <ConsentGate
            onAgreed={(updatedUser) => { if (updatedUser) setUser(updatedUser); setConsentGateOpen(false); }}
            onDecline={async () => {
              setConsentGateOpen(false);
              try { await getSupabaseClient()?.auth.signOut(); } catch { /* ignore */ }
            }}
          />
        )}

        {!showAuthModal && !saveSheet && <SaveFollowUpStrip onCompare={openCompare} variant="web" />}
        {saveSheet && (
          <SaveAuthSheet
            variant="web"
            product={saveSheet}
            onContinue={() => { stashPendingSave(saveSheet); setSaveSheet(null); setAuthFeature(''); setPendingAction('save-item'); pendingActionRef.current = 'save-item'; setShowAuthModal(true); }}
            onKeepHere={() => { const p = saveSheet; setSaveSheet(null); toggleSavedProduct(p, { fromSheet: true }); }}
            onClose={() => setSaveSheet(null)}
          />
        )}
        {showAuthModal && (
          <AuthGate
            isModal
            onAuthenticated={(authenticatedUser, session) => {
              if (!authenticatedUser) return;
              setUser(authenticatedUser);
              if (session) setUserSession(session);
              setAuthLoading(false);
              setShowAuthModal(false);
            }}
            summary={pendingAction === 'quiz-complete' && guestPreview ? {
              count: guestPreview.products.length,
              products: guestPreview.products,
              // Same area names the Wrapped story just showed.
              areas: [...new Set(guestPreview.products.map((p) => resolveEcosystemProductArea(p, ECOSYSTEM_AREAS)?.label).filter(Boolean))],
            } : null}
            // Create account exists only in the save step after the quiz (Wrapped).
            // Everywhere else: sign in, or "Build your ecosystem" to start the quiz.
            allowSignup={pendingAction === 'quiz-complete' || pendingAction === 'share-friend'}
            initialMode={pendingAction === 'share-friend' ? shareAuthMode : undefined}
            onStartEcosystem={() => { setShowAuthModal(false); setPendingAction(null); pendingActionRef.current = null; setQuizResume(false); setQuizRun((n) => n + 1); setCurrentView('quiz'); }}
            context={pendingAction === 'quiz-complete' ? 'quiz' : pendingAction === 'browse' ? 'browse' : pendingAction === 'personalize' ? 'personalize' : pendingAction === 'login' ? 'login' : pendingAction === 'saved' ? 'saved' : pendingAction === 'save-item' ? 'save-item' : pendingAction === 'ecosystem' ? 'ecosystem' : pendingAction === 'feature' ? 'feature' : undefined}
            feature={authFeature}
            onBeforeOAuthRedirect={() => {
              markOAuthSource(pendingAction === 'quiz-complete' ? 'save' : 'signin');
              try {
                if (pendingAction) sessionStorage.setItem('ayna_pending_auth_action', pendingAction);
                if (pendingAction === 'quiz-complete' && pendingQuizResults) {
                  sessionStorage.setItem('ayna_pending_quiz_results', JSON.stringify(pendingQuizResults));
                }
              } catch { /* ignore */ }
            }}
            onSkip={() => {
              setShowAuthModal(false);
              if (pendingAction === 'quiz-complete' && pendingQuizResults) {
                setQuizResults(pendingQuizResults);
                const { seedMeta } = getEcosystemSeedFromQuiz(pendingQuizResults, healthProfile, seedOpts);
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
        {newAccountStart && user && currentView !== 'quiz' && (
          <NewAccountStart
            onStart={() => { setNewAccountStart(false); setQuizResume(false); setQuizRun((n) => n + 1); setCurrentView('quiz'); }}
            onSignOut={() => { setNewAccountStart(false); handleSignOut(); }}
            onClose={() => setNewAccountStart(false)}
          />
        )}
      </main>
      {!FOCUSED_FLOW_VIEWS.includes(currentView) && <SiteFooter
          onViewHowItWorks={handleViewHowItWorks}
          onViewAbout={handleViewAbout}
          onViewContact={handleViewContact}
          onViewDiscovery={handleViewDiscovery}
          onViewWaitlist={handleViewWaitlist}
          onViewArticles={handleViewArticles}
          onViewPrivacyPolicy={() => setCurrentView('privacy-policy')}
          onViewTermsOfUse={() => setCurrentView('terms-of-use')}
          onViewConsumerHealthData={() => setCurrentView('consumer-health-data')}
        onViewHowWeMakeMoney={handleViewHowWeMakeMoney}
        onViewEcosystem={() => handleViewEcosystem()}
        onViewCommunity={() => setCurrentView('community')}
      />}
      {/* Floating Ask pill comes after the page and footer in the DOM, so it is the last stop when tabbing, not the first. */}
      {!FOCUSED_FLOW_VIEWS.includes(currentView) && currentView !== 'campus-resources' && currentView !== 'ask' && (
        <ProfileChatbot
          onRequireAuth={(feature) => { setAuthFeature(typeof feature === 'string' ? feature : ''); setPendingAction(typeof feature === 'string' && feature ? 'feature' : 'login'); pendingActionRef.current = typeof feature === 'string' && feature ? 'feature' : 'login'; setShowAuthModal(true); }}
          openSignal={askOpenSignal}
          prefill={askPrefill}
          prefillStats={askPrefillStats}
          profile={quizResults}
          user={user}
          onProfileUpdate={setQuizResults}
          chatHistory={chatHistory}
          onChatHistoryUpdate={setChatHistory}
          disabled={false}
          onNavigateToDiscovery={handleViewDiscovery}
          onViewRecommendations={() => handleViewEcosystem()}
          products={myProducts}
          matchOpts={matchOpts}
          healthProfile={healthProfile}
          focusProduct={currentView === 'product' ? lastClickedProduct : null}
          hasHealthData={!!user && health.connected.length > 0}
          resolveProduct={(id) => myProducts[id] || Object.values(myProducts).find((p) => String(p?.id) === String(id)) || getProductById(id) || null}
          onOpenProduct={(product) => handleOpenProduct(product, { source: 'ask_followup' })}
          onOpenDashboard={user ? handleViewEcosystemDashboard : null}
          onOpenRead={handleViewArticle}
        />
      )}
      {/* Outside the currentView switch on purpose — the same bar on every
          view, fixed to the bottom of the viewport, so DOM order here is
          only about it never being unmounted by navigation. */}
      {currentView !== 'campus-resources' && <ConsentBanner />}
    </div>
  );
}

export default App;
