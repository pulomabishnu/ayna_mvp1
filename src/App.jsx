import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import Hero from './components/Hero';
import WelcomeGate from './components/WelcomeGate';
import HealthIntakeForm from './components/HealthIntakeForm';
import HealthProfileEditor from './components/HealthProfileEditor';
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
import { loadHealthIntakeForCurrentUser } from './utils/healthIntakeStore';
import { mapIntakeToLegacyQuizProfile } from './utils/healthIntake';

const ECOSYSTEM_NAV_VIEWS = ['ecosystem', 'comparison', 'omitted', 'recalls'];

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [quizResults, setQuizResults] = useState(null);
  const [trackedProducts, setTrackedProducts] = useState({});
  const [joinedWaitlists, setJoinedWaitlists] = useState({});
  const [myProducts, setMyProducts] = useState({});
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

  const handleQuizComplete = (results) => {
    const completedResults = {
      ...results,
      personalizationCompleted: true,
      personalizationCompletedAt: new Date().toISOString(),
    };
    setQuizResults(completedResults);
    const { seedMeta } = getEcosystemSeedFromQuiz(completedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    setCurrentView('ecosystem');
  };

  const handleHealthProfileEditorSave = (updatedResults) => {
    if (!updatedResults) {
      setCurrentView('ecosystem');
      return;
    }
    setQuizResults(updatedResults);
    const { seedMeta } = getEcosystemSeedFromQuiz(updatedResults, healthProfile);
    setEcosystemSeedMeta(seedMeta);
    setCurrentView('ecosystem');
  };

  const handleSwapEcosystemSeedProduct = (oldProductId, newProduct) => {
    setMyProducts((prev) => {
      const next = { ...prev };
      delete next[oldProductId];
      next[newProduct.id] = newProduct;
      return next;
    });
    setEcosystemSeedMeta((prev) => {
      const meta = prev[oldProductId];
      if (!meta) return prev;
      const n = { ...prev };
      delete n[oldProductId];
      n[newProduct.id] = meta;
      return n;
    });
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
    setTrackedProducts(prev => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = product;
      return next;
    });
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
    setMyProducts(prev => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = product;
      return next;
    });
  };

  const toggleOmitProduct = (product) => {
    setOmittedProducts(prev => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = product;
        // Also remove from tracked/ecosystem if omitted
        setTrackedProducts(curr => { const n = { ...curr }; delete n[product.id]; return n; });
        setMyProducts(curr => { const n = { ...curr }; delete n[product.id]; return n; });
      }
      return next;
    });
  };

  const handleLlmRecommendationsLoaded = (recommendations) => {
    if (!hasCompletedPersonalization) return;
    if (!Array.isArray(recommendations) || recommendations.length === 0) return;
  };

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
    setSelectedProductModal(p);
  };
  const handleCloseProduct = () => setSelectedProductModal(null);

  const handleRateProduct = (product, rating) => {
    const next = addRating(product.id, rating);
    setAynaReviews(next);
  };

  const handleReviewProduct = (product, text) => {
    const next = addReview(product.id, text);
    setAynaReviews(next);
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
        >
        <nav
          className={`app-nav${isScrolled ? ' app-nav--scrolled' : ''}`}
          aria-label="Primary"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={navigateHome}>
              Ayna
            </div>

            {/* Ecosystem: label + hover menu (Compare, Hidden, Recall) — left of Search */}
            <div
              ref={ecoNavRef}
              className={`nav-ecosystem ${ecoMenuOpen ? 'nav-ecosystem--open' : ''} ${ecoMenuOpen && touchUi ? 'nav-ecosystem--caret-open' : ''}`}
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
            <div className="app-nav__research-cluster">
              <button style={{ fontSize: '0.8rem', fontWeight: (currentView === 'discovery' || currentView === 'hero') ? '700' : '500', color: currentView === 'discovery' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={() => handleViewDiscovery('')}>
                Product Discovery
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'waitlist' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewWaitlist}>
                Startups
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'deeptech' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewDeeptech}>
                Deeptech
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'articles' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewArticles}>
                My Health Library
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.5rem',
                background: 'var(--color-secondary-fade)', color: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-primary)',
                opacity: 1
              }}
              onClick={() => setShowCheckin(true)}
            >
              Check-in
            </button>
          </div>
        </nav>
        </div>
        )}

        {currentView === 'welcome' && (
          <WelcomeGate
            onPersonalizedPath={handleStartQuiz}
            onBrowsePath={() => handleViewDiscovery('')}
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
        {currentView === 'ecosystem' && (
          <MyEcosystem
            myProducts={myProducts}
            onToggleProduct={toggleMyProduct}
            trackedProducts={trackedProducts}
            toggleTrackProduct={toggleTrackProduct}
            toggleOmitProduct={toggleOmitProduct}
            omittedProducts={omittedProducts}
            onOpenProduct={handleOpenProduct}
            onOpenDoctorPrep={() => setCurrentView('doctor-prep')}
            onBuildEcosystem={handleStartQuiz}
            onEditHealthProfile={handleOpenHealthProfileEditor}
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
          />
        )}
      </main>
    </div>
  );
}

export default App;
