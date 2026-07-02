import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import Hero from './components/Hero';
import WelcomeGate from './components/WelcomeGate';
import HealthIntakeForm from './components/HealthIntakeForm';
import HealthProfileEditor from './components/HealthProfileEditor';
import PhoneVerification from './components/PhoneVerification';
import Recommendations from './components/Recommendations';
import WaitlistHub from './components/WaitlistHub';
import TrackedItems from './components/TrackedItems';
import MyEcosystem from './components/MyEcosystem';
import Discovery from './components/Discovery';
import MonthlyCheckin from './components/MonthlyCheckin';
import OmittedProducts from './components/OmittedProducts';
import Comparison from './components/Comparison';
import DoctorPrep from './components/DoctorPrep';
import Recalls from './components/Recalls';
import { CATEGORY_LABELS, getRecommendations, getEcosystemSeedFromQuiz } from './data/products';
import { loadAynaReviews, addRating, addReview } from './data/aynaReviews';
import AynaDeeptech from './components/AynaDeeptech';
import Screenings from './components/Screenings';
import { useScrollPosition } from './hooks/useScrollPosition';
import ProductModal from './components/ProductModal';
import { enrichLlmProductForDiscovery } from './utils/enrichLlmProductForDiscovery';
import Articles from './components/Articles';
import ProfileChatbot from './components/ProfileChatbot';
import { loadHealthProfile, hasHealthProfileSignals } from './utils/healthDataProfile';
import { loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from './utils/healthIntakeStore';
import { mapIntakeToLegacyQuizProfile } from './utils/healthIntake';
import AuthGate from './components/AuthGate';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import AuthCallback from './components/AuthCallback';
import EmailConfirmed from './components/EmailConfirmed';
import { getSupabaseClient } from './utils/supabaseClient';
import { loadEcosystemForUser, upsertProductState, clearEcosystemForUser } from './utils/ecosystemStore';
import { loadLearningMemoryForUser, saveLearningMemoryForUser } from './utils/learningMemoryStore';
import { loadReviewsForUser, upsertProductReviews } from './utils/reviewsStore';
import { clearCachedLlmRecommendations } from './utils/fetchLlmRecommendations';
import posthog from 'posthog-js';

const ECOSYSTEM_NAV_VIEWS = ['ecosystem', 'comparison', 'omitted', 'recalls'];

const VIEW_TO_PATH = {
  welcome: '/', hero: '/', quiz: '/quiz', ecosystem: '/ecosystem',
  discovery: '/discovery', waitlist: '/startups', deeptech: '/deeptech',
  articles: '/library', screenings: '/screenings', omitted: '/omitted',
  comparison: '/comparison', recalls: '/recalls',
  'doctor-prep': '/appointment-prep', 'profile-edit': '/profile', 'phone-verify': '/text-ayna', tracked: '/tracked',
  'privacy-policy': '/privacy-policy',
  'terms-of-use': '/terms-of-use',
  'auth-callback': '/auth/callback',
  'confirmed': '/confirmed',
};
const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).filter(([, p]) => p !== '/').map(([v, p]) => [p, v])
);
PATH_TO_VIEW['/'] = 'welcome';

function getInitialView() {
  const path = window.location.pathname;
  return PATH_TO_VIEW[path] || 'welcome';
}

function App() {
  const [currentView, setCurrentViewRaw] = useState(getInitialView);
  // Ref always mirrors currentView synchronously — safe to read inside Supabase callbacks
  // that run outside React's render cycle.
  const currentViewRef = useRef(getInitialView());
  const setCurrentView = useCallback((view, { replace = false } = {}) => {
    currentViewRef.current = view;
    setCurrentViewRaw(view);
    const path = VIEW_TO_PATH[view] || '/';
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ view }, '', path);
      else window.history.pushState({ view }, '', path);
    }
  }, []);
  useEffect(() => {
    window.history.replaceState({ view: currentView }, '', VIEW_TO_PATH[currentView] || '/');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onPop = (e) => {
      const view = e.state?.view || PATH_TO_VIEW[window.location.pathname] || 'welcome';
      currentViewRef.current = view;
      setCurrentViewRaw(view);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
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
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [discoveryInitial, setDiscoveryInitial] = useState(null); // { initialCategory, initialPadFlow, initialPadPreference, initialPadUseCase }
  const [userZipCode, setUserZipCode] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [aynaReviews, setAynaReviews] = useState({});
  const [healthProfile, setHealthProfile] = useState(() => loadHealthProfile());
  const [ecosystemSeedMeta, setEcosystemSeedMeta] = useState({});
  const [welcomeSubPhase, setWelcomeSubPhase] = useState('intro');
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    // null = initial check not done yet; false = checked and was signed out; User = was signed in
    // Used to distinguish an explicit login (false → User) from session restoration (User → User).
    const initialSessionRef = { current: null };
    if (!isCallbackPage) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        initialSessionRef.current = session?.user ?? false;
        setUser(session?.user ?? null);
        setUserSession(session ?? null);
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
    const STATIC_VIEWS = ['privacy-policy', 'terms-of-use', 'confirmed', 'auth-callback'];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setUserSession(session ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
        setShowAuthModal(false);
        // Only navigate when the user was actually signed out before (explicit login).
        // Session restoration on page load and token refresh on tab switch both fire
        // SIGNED_IN — those must not redirect the user away from where they are.
        const wasSignedOut = initialSessionRef.current === false;
        if (wasSignedOut && !pendingActionRef.current && !STATIC_VIEWS.includes(currentViewRef.current)) {
          setCurrentView('ecosystem');
        }
      }
      if (!session) {
        posthog.reset();
        setMyProducts({});
        setTrackedProducts({});
        setOmittedProducts({});
        setQuizResults(null);
        setAynaReviews({});
        if (!STATIC_VIEWS.includes(currentViewRef.current)) {
          setCurrentView('welcome', { replace: true });
        }
        try {
          // Keep LLM recommendations cache — it's fingerprint-keyed so a
          // different quiz will naturally miss. Clearing it caused a re-fetch
          // on every login for the same user.
          localStorage.removeItem('ayna_llm_learning_memory_v1');
        } catch (_) {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setDataLoading(true);
    Promise.all([
      loadEcosystemForUser(supabase, user.id).catch(() => null),
      loadReviewsForUser(supabase, user.id).catch(() => null),
      loadLearningMemoryForUser(supabase, user.id).catch(() => null),
      loadHealthIntakeForCurrentUser().catch(() => null),
    ]).then(([ecosystem, reviews, memory, intake]) => {
      if (ecosystem) {
        if (!llmBuiltThisSessionRef.current) {
          setMyProducts(ecosystem.myProducts);
          setEcosystemOrder(Object.keys(ecosystem.myProducts));
        } else {
          // LLM already built this session — merge only manual (non-LLM) products from Supabase
          setMyProducts(prev => {
            const manual = Object.fromEntries(
              Object.entries(ecosystem.myProducts)
                .filter(([, p]) => !p?.llmGenerated && !p?.intakeGenerated)
            );
            return { ...prev, ...manual };
          });
          setEcosystemOrder(prev => {
            const newManualIds = Object.keys(ecosystem.myProducts)
              .filter(id => !ecosystem.myProducts[id]?.llmGenerated && !ecosystem.myProducts[id]?.intakeGenerated && !prev.includes(id));
            return [...prev, ...newManualIds];
          });
        }
        setTrackedProducts(ecosystem.trackedProducts);
        setOmittedProducts(ecosystem.omittedProducts);
      }
      if (reviews) setAynaReviews(reviews);
      if (memory) {
        try { localStorage.setItem('ayna_llm_learning_memory_v1', JSON.stringify(memory)); } catch (_) {}
      }
      if (intake?.personalizationCompleted) {
        setQuizResults(mapIntakeToLegacyQuizProfile(intake));
      }
    }).finally(() => setDataLoading(false));
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
      const { seedMeta } = getEcosystemSeedFromQuiz(pendingQuizResults, healthProfile);
      setEcosystemSeedMeta(seedMeta);
      setMyProducts({});
      clearCachedLlmRecommendations();
      try { window.localStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
      const _supabase = getSupabaseClient();
      if (_supabase && user) clearEcosystemForUser(_supabase, user.id).catch(console.error);
      setCurrentView('ecosystem');
      saveHealthIntakeForCurrentUser(pendingQuizResults).catch(console.error);
      setPendingQuizResults(null);
    } else if (pendingAction === 'browse') {
      handleViewDiscovery('');
    } else if (pendingAction === 'login') {
      setCurrentView('ecosystem');
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
    return getRecommendations(quizResults || null, healthProfile).map(p => p.id);
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
  const isScrolled = scrollY > 20;

  const previousViewRef = useRef(null);
  // When *entering* the welcome view from elsewhere, show the full intro (nav hidden) again.
  useLayoutEffect(() => {
    const was = previousViewRef.current;
    if (currentView === 'welcome' && was != null && was !== 'welcome') {
      setWelcomeSubPhase('intro');
    }
    previousViewRef.current = currentView;
  }, [currentView]);

  const hideWelcomeIntroChrome = currentView === 'welcome' && welcomeSubPhase === 'intro';
  /** Second welcome screen: fade top chrome in with the page (not an instant pop). */
  const welcomeMainChromeEntrance = currentView === 'welcome' && welcomeSubPhase === 'main';

  const handleStartQuiz = () => setCurrentView('quiz');
  const handleOpenHealthProfileEditor = () => setCurrentView('profile-edit');
  const handleOpenPhoneVerification = () => setCurrentView('phone-verify');
  const handleViewWaitlist = () => setCurrentView('waitlist');
  const handleViewEcosystem = () => setCurrentView('ecosystem');
  const handleViewDiscovery = (queryOrOptions = '') => {
    if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
      setDiscoverySearch(queryOrOptions.query || '');
      setDiscoveryInitial({
        initialCategory: queryOrOptions.initialCategory || null,
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
  const handleViewDeeptech = () => setCurrentView('deeptech');
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
    setCurrentView('hero');
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
    const { seedMeta } = getEcosystemSeedFromQuiz(completedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    llmBuiltThisSessionRef.current = false;
    setMyProducts({});
    clearCachedLlmRecommendations();
    try { window.localStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
    const supabase = getSupabaseClient();
    // Await clear so token-refresh reloads never bring back stale products
    if (supabase && user) await clearEcosystemForUser(supabase, user.id).catch(console.error);
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
    const { seedMeta } = getEcosystemSeedFromQuiz(updatedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    llmBuiltThisSessionRef.current = false;
    setMyProducts({});
    clearCachedLlmRecommendations();
    try { window.localStorage.setItem('ayna_force_llm_refresh', '1'); } catch (_) {}
    const supabase = getSupabaseClient();
    // Await clear so token-refresh reloads never bring back stale products
    if (supabase && user) await clearEcosystemForUser(supabase, user.id).catch(console.error);
    setCurrentView('ecosystem');
  };

  const handleSwapEcosystemSeedProduct = (oldProductId, newProduct) => {
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
      if (oldProduct) upsertProductState(supabase, user.id, oldProduct, { inEcosystem: false, isTracked: false, isOmitted: false }).catch(console.error);
      upsertProductState(supabase, user.id, enriched, { inEcosystem: true, isTracked: false, isOmitted: false }).catch(console.error);
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
      }).catch(e => console.error('[Ayna] upsert failed:', e));
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
    if (!wasIn) {
      posthog.capture('product_added', { category: product.category, type: product.type });
    }
    if (user) {
      upsertProductState(getSupabaseClient(), user.id, product, {
        inEcosystem: !wasIn,
        isTracked: !!trackedProducts[product.id],
        isOmitted: !!omittedProducts[product.id],
      }).catch(e => console.error('[Ayna] upsert failed:', e));
    }
  };

  const toggleOmitProduct = (product) => {
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
      }).catch(e => console.error('[Ayna] upsert failed:', e));
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
      Promise.all(
        valid.map(p => upsertProductState(supabase, user.id, p, { inEcosystem: true, isTracked: false, isOmitted: false }))
      ).catch(console.error);
    }
  }, [user]);

  const [selectedProductModal, setSelectedProductModal] = useState(null);

  const omittedCount = Object.keys(omittedProducts).length;
  const ecosystemCount = Object.keys(myProducts).length;
  const ecoNavRef = useRef(null);
  const [ecoMenuOpen, setEcoMenuOpen] = useState(false);
  const [touchUi, setTouchUi] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)');
    const sync = () => setTouchUi(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!ecoMenuOpen) return;
    const close = (e) => {
      if (ecoNavRef.current && !ecoNavRef.current.contains(e.target)) setEcoMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [ecoMenuOpen]);

  useEffect(() => {
    if (!ecoMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setEcoMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ecoMenuOpen]);

  const handleOpenProduct = (product) => {
    const p = product?.llmGenerated ? enrichLlmProductForDiscovery(product) : product;
    posthog.capture('product_card_opened', { category: p?.category });
    setSelectedProductModal(p);
  };
  const handleCloseProduct = () => setSelectedProductModal(null);

  const handleRateProduct = (product, rating) => {
    const next = addRating(product.id, rating);
    setAynaReviews(next);
    if (user && next[product.id]) {
      upsertProductReviews(getSupabaseClient(), user.id, product.id, next[product.id]).catch(console.error);
    }
  };

  const handleReviewProduct = (product, text) => {
    const next = addReview(product.id, text);
    setAynaReviews(next);
    if (user && next[product.id]) {
      upsertProductReviews(getSupabaseClient(), user.id, product.id, next[product.id]).catch(console.error);
    }
  };


  return (
    <div
      className={`app-container${hideWelcomeIntroChrome ? ' app--welcome-intro-immersive' : ''}`.trim()}
    >
      <main>
        {/* Navigation — hidden during welcome intro; fades in on first frame of “main” with the landing body */}
        {!hideWelcomeIntroChrome && (
        <div
          className={welcomeMainChromeEntrance ? 'app-welcome-chrome-entrance' : undefined}
          style={{ position: 'relative', zIndex: 1001 }}
        >
        <nav
          className={`app-nav app-nav--landing${isScrolled ? ' app-nav--scrolled' : ''}`}
          aria-label="Primary"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={navigateHome}>
              Ayna
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? '✕' : '≡'}
            </button>

            {/* Ecosystem: label + hover menu (Compare, Hidden, Recall) — left of Search */}
            <div
              ref={ecoNavRef}
              className={`nav-ecosystem desktop-only ${ecoMenuOpen ? 'nav-ecosystem--open' : ''} ${ecoMenuOpen && touchUi ? 'nav-ecosystem--caret-open' : ''}`}
            >
              <div className="nav-ecosystem__row">
                <button
                  type="button"
                  id="nav-ecosystem-trigger"
                  className={`nav-ecosystem__trigger ${ECOSYSTEM_NAV_VIEWS.includes(currentView) ? 'nav-ecosystem__trigger--active' : ''}`}
                  onClick={() => handleViewEcosystem()}
                  aria-haspopup="menu"
                  aria-expanded={touchUi ? ecoMenuOpen : undefined}
                  aria-controls="nav-ecosystem-menu"
                >
                  My Ecosystem
                  {ecosystemCount > 0 && (
                    <span className="nav-ecosystem__pill">{ecosystemCount}</span>
                  )}
                  {!touchUi && <span className="nav-ecosystem__hint" aria-hidden>▾</span>}
                </button>
                {touchUi && (
                  <button
                    type="button"
                    className="nav-ecosystem__caret-btn"
                    aria-label="Open Ecosystem menu (Compare, Hidden, Recall)"
                    aria-expanded={ecoMenuOpen}
                    aria-controls="nav-ecosystem-menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEcoMenuOpen((v) => !v);
                    }}
                  >
                    ▾
                  </button>
                )}
              </div>
              <div className="nav-ecosystem__panel" role="menu" id="nav-ecosystem-menu" aria-labelledby="nav-ecosystem-trigger">
                <button
                  type="button"
                  role="menuitem"
                  className={`nav-ecosystem__item ${currentView === 'comparison' ? 'nav-ecosystem__item--active' : ''}`}
                  onClick={() => {
                    setEcoMenuOpen(false);
                    handleViewComparison();
                  }}
                >
                  <span>Compare</span>
                  {compareList.length > 0 && (
                    <span className="nav-ecosystem__item-pill">{compareList.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`nav-ecosystem__item ${currentView === 'omitted' ? 'nav-ecosystem__item--active' : ''}`}
                  onClick={() => {
                    setEcoMenuOpen(false);
                    handleViewOmitted();
                  }}
                >
                  <span>Hidden</span>
                  {omittedCount > 0 && <span className="nav-ecosystem__item-pill">{omittedCount}</span>}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`nav-ecosystem__item ${currentView === 'recalls' ? 'nav-ecosystem__item--active' : ''}`}
                  onClick={() => {
                    setEcoMenuOpen(false);
                    handleViewRecalls();
                  }}
                >
                  <span>Recall</span>
                </button>
              </div>
            </div>

            {/* Public research tools */}
            <div className="app-nav__research-cluster desktop-only">
              <button style={{ fontSize: '1rem', fontWeight: (currentView === 'discovery' || currentView === 'hero') ? '700' : '500', color: currentView === 'discovery' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={() => handleViewDiscovery('')}>
                Product Discovery
              </button>
              <button style={{ fontSize: '1rem', fontWeight: '500', color: currentView === 'waitlist' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewWaitlist}>
                Startups
              </button>
              <button style={{ fontSize: '1rem', fontWeight: '500', color: currentView === 'deeptech' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewDeeptech}>
                Deeptech
              </button>
              <button style={{ fontSize: '1rem', fontWeight: '500', color: currentView === 'articles' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewArticles}>
                My Health Library
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="desktop-only" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                fontSize: '0.9rem', fontWeight: '600', padding: '0.3rem 0.65rem',
                background: 'var(--color-secondary-fade)', color: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-primary)',
              }}
              onClick={() => setShowCheckin(true)}
            >
              Check-in
            </button>
            {user ? (
              <div ref={accountMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowAccountMenu(v => !v)}
                  style={{
                    fontSize: '0.9rem', fontWeight: '600', padding: '0.3rem 0.75rem',
                    background: 'var(--color-primary)', color: 'var(--color-text-light)',
                    borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                  }}
                >
                  Account
                </button>
                {showAccountMenu && (
                  <div className="nav-account-menu" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                    padding: '0.9rem 1.1rem', minWidth: '200px', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                      {user.email}
                    </span>
                    <button
                      onClick={() => { getSupabaseClient()?.auth.signOut(); setShowAccountMenu(false); }}
                      style={{
                        fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      Log out
                    </button>
                    <button
                      onClick={() => { setShowDeleteModal(true); setShowAccountMenu(false); }}
                      style={{
                        fontSize: '0.78rem', fontWeight: '500', color: 'var(--color-text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      Delete account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setPendingAction('login'); pendingActionRef.current = 'login'; setShowAuthModal(true); }}
                style={{
                  fontSize: '0.9rem', fontWeight: '600', padding: '0.3rem 0.75rem',
                  background: 'var(--color-primary)', color: 'var(--color-text-light)',
                  borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                }}
              >
                Log in
              </button>
            )}
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
            <button className="mobile-drawer-item" onClick={() => { handleViewEcosystem(); setMobileMenuOpen(false); }}>
              My Ecosystem {ecosystemCount > 0 && <span className="nav-ecosystem__pill">{ecosystemCount}</span>}
            </button>
            <button className="mobile-drawer-item" onClick={() => { handleViewDiscovery(''); setMobileMenuOpen(false); }}>Product Discovery</button>
            <button className="mobile-drawer-item" onClick={() => { handleViewWaitlist(); setMobileMenuOpen(false); }}>Startups</button>
            <button className="mobile-drawer-item" onClick={() => { handleViewDeeptech(); setMobileMenuOpen(false); }}>Deeptech</button>
            <button className="mobile-drawer-item" onClick={() => { handleViewArticles(); setMobileMenuOpen(false); }}>My Health Library</button>
            <button className="mobile-drawer-item" onClick={() => { setShowCheckin(true); setMobileMenuOpen(false); }}>Check-in</button>
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
        )}

        {currentView === 'welcome' && (
          <WelcomeGate
            onPersonalizedPath={handleStartQuiz}
            onBrowsePath={() => {
              if (!user) {
                setPendingAction('browse'); pendingActionRef.current = 'browse';
                setShowAuthModal(true);
              } else {
                handleViewDiscovery('');
              }
            }}
            onWelcomePhaseChange={setWelcomeSubPhase}
          />
        )}
        {currentView === 'hero' && (
          <Hero onStartQuiz={handleStartQuiz} onViewWaitlist={handleViewWaitlist} onViewDiscovery={handleViewDiscovery} />
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
            onHealthProfileUpdate={setHealthProfile}
            healthProfile={healthProfile}
          />
        )}
        {currentView === 'waitlist' && (
          <WaitlistHub
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
            quizResults={quizResults}
            myProducts={myProducts}
            onAddToEcosystem={toggleMyProduct}
            onViewRecalls={handleViewRecalls}
          />
        )}
        {currentView === 'deeptech' && (
          <AynaDeeptech
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
          />
        )}
        {currentView === 'articles' && (
          <Articles initialArticleId={selectedArticleId} onOpenProduct={handleOpenProduct} quizResults={quizResults} healthProfile={healthProfile} />
        )}
        {currentView === 'privacy-policy' && (
          <PrivacyPolicy onBack={() => window.history.back()} />
        )}
        {currentView === 'terms-of-use' && (
          <TermsOfUse onBack={() => window.history.back()} />
        )}
        {currentView === 'auth-callback' && (
          <AuthCallback onAuthenticated={(user) => {
            setUser(user);
            setCurrentView('ecosystem');
          }} />
        )}
        {currentView === 'confirmed' && (
          <EmailConfirmed onAuthenticated={(user) => {
            setUser(user);
            setCurrentView('ecosystem');
          }} />
        )}
        {currentView === 'ecosystem' && (
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
            onGoToSearch={(query) => handleViewDiscovery(query || '')}
            onHealthProfileUpdate={(next) => setHealthProfile(next)}
            onViewRecommendedArticles={handleViewArticles}
            onOpenArticle={(articleId) => {
              setSelectedArticleId(articleId);
              setCurrentView('articles');
            }}
            onLlmRecommendationsLoaded={handleLlmRecommendationsLoaded}
            onBuildEcosystemFromLlm={handleBuildEcosystemFromLlm}
            user={user}
            userSession={userSession}
            isPremium={user?.user_metadata?.is_premium === true}
          />
        )}
        {currentView === 'discovery' && (
          <Discovery
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            myProducts={myProducts}
            onToggleProduct={toggleMyProduct}
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
            omittedProducts={omittedProducts}
            initialCategory={discoveryInitial?.initialCategory}
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
            hasQuizFrustrations={!!(quizResults?.frustrations?.length)}
            hasHealthImport={hasHealthImport}
            quizResults={quizResults}
            healthProfile={healthProfile}
          />
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
            }}
          />
        )}

        {quizResults && (
          <ProfileChatbot
            profile={quizResults}
            onProfileUpdate={setQuizResults}
            chatHistory={chatHistory}
            onChatHistoryUpdate={setChatHistory}
            disabled={!quizResults}
            onNavigateToDiscovery={handleViewDiscovery}
          />
        )}

        {selectedProductModal && (
          <ProductModal
            product={selectedProductModal}
            onClose={handleCloseProduct}
            isTracked={!!trackedProducts[selectedProductModal.id]}
            onTrack={toggleTrackProduct}
            onOmit={toggleOmitProduct}
            isOmitted={!!omittedProducts[selectedProductModal.id]}
            onToggleCompare={toggleCompare}
            isInCompare={compareList.some(p => p.id === selectedProductModal.id)}
            onAddToEcosystem={toggleMyProduct}
            isInEcosystem={!!myProducts[selectedProductModal.id]}
            userZipCode={userZipCode || undefined}
            aynaReviews={aynaReviews}
            onRate={handleRateProduct}
            onReview={handleReviewProduct}
            quizResults={quizResults}
            healthProfile={healthProfile}
            ecosystemProducts={Object.values(myProducts)}
            user={user}
            userSession={userSession}
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
                  href="mailto:pulomabishnu@gmail.com?subject=Account%20Deletion%20Request"
                  style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '500' }}
                >
                  pulomabishnu@gmail.com
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
            context={pendingAction === 'quiz-complete' ? 'quiz' : pendingAction === 'browse' ? 'browse' : pendingAction === 'login' ? 'login' : undefined}
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
      {!hideWelcomeIntroChrome && (
        <footer style={{
          padding: '0.85rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.55)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,252,249,0.82) 100%)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          letterSpacing: '0.01em',
        }}>
          Ayna provides wellness information only — not medical advice. Always consult a qualified healthcare provider for medical decisions. By using Ayna, you agree your data is stored securely and never sold.
          <br />
          <button type="button" onClick={() => setCurrentView('privacy-policy')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}>Privacy Policy</button>
          {' · '}
          <button type="button" onClick={() => setCurrentView('terms-of-use')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}>Terms of Use</button>
        </footer>
      )}
    </div>
  );
}

export default App;
