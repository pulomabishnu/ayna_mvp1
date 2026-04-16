import React, { useState, useMemo, useRef, useEffect } from 'react';
import Hero from './components/Hero';
import WelcomeGate from './components/WelcomeGate';
import HealthIntakeForm from './components/HealthIntakeForm';
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
import { CATEGORY_LABELS, getRecommendations, createCustomEcosystemProducts, getEcosystemSeedFromQuiz } from './data/products';
import { loadAynaReviews, addRating, addReview } from './data/aynaReviews';
import AynaDeeptech from './components/AynaDeeptech';
import Screenings from './components/Screenings';
import { useScrollPosition } from './hooks/useScrollPosition';
import ProductModal from './components/ProductModal';
import LlmSearchSuggestionModal from './components/LlmSearchSuggestionModal';
import Articles from './components/Articles';
import ProfileChatbot from './components/ProfileChatbot';
import { loadHealthProfile, inferTagsFromHealthProfile } from './utils/healthDataProfile';
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
  const [isPremium, setIsPremium] = useState(false);
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
  const scrollY = useScrollPosition();

  const hasHealthImport = useMemo(
    () => inferTagsFromHealthProfile(healthProfile).length > 0,
    [healthProfile]
  );

  React.useEffect(() => {
    setAynaReviews(loadAynaReviews());
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedIntake = await loadHealthIntakeForCurrentUser();
        if (active && savedIntake && !quizResults) {
          setQuizResults(mapIntakeToLegacyQuizProfile(savedIntake));
        }
      } catch (_) {}
    })();
    return () => {
      active = false;
    };
  }, [quizResults]);

  const recommendedProductIds = useMemo(() => {
    return getRecommendations(quizResults || null, healthProfile).map(p => p.id);
  }, [quizResults, healthProfile]);

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

  const handleStartQuiz = () => setCurrentView('quiz');
  const handleViewWaitlist = () => setCurrentView('waitlist');
  const handleViewTracked = () => setCurrentView('tracked');
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
    setQuizResults(results);
    const customProducts = createCustomEcosystemProducts(results);
    const { mergedProducts: seededProducts, seedMeta } = getEcosystemSeedFromQuiz(results, healthProfile);
    setMyProducts((prev) => ({ ...prev, ...customProducts, ...seededProducts }));
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

  const togglePremium = () => setIsPremium(!isPremium);

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
    if (!Array.isArray(recommendations) || recommendations.length === 0) return;
    setMyProducts((prev) => {
      const next = { ...prev };
      recommendations.forEach((entry) => {
        const product = entry.topProduct || entry.tiers?.[0]?.product;
        if (product && product.id && !next[product.id]) {
          next[product.id] = product;
        }
      });
      return next;
    });
  };

  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [selectedLlmProduct, setSelectedLlmProduct] = useState(null);

  const totalBadge = Object.keys(trackedProducts).length + Object.keys(joinedWaitlists).length;

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
    if (product?.llmGenerated) {
      setSelectedProductModal(null);
      setSelectedLlmProduct(product);
      return;
    }
    setSelectedLlmProduct(null);
    setSelectedProductModal(product);
  };
  const handleCloseProduct = () => setSelectedProductModal(null);
  const handleCloseLlmProduct = () => setSelectedLlmProduct(null);

  const handleRateProduct = (product, rating) => {
    const next = addRating(product.id, rating);
    setAynaReviews(next);
  };

  const handleReviewProduct = (product, text) => {
    const next = addReview(product.id, text);
    setAynaReviews(next);
  };

  return (
    <div className="app-container">
      {/* Premium Banner for Free Users */}
      {!isPremium && (
        <div style={{
          background: 'linear-gradient(90deg, #FDF2F8 0%, #FCE7F3 50%, #E0F2FE 100%)',
          color: 'var(--color-surface-contrast)',
          padding: '0.7rem 1.25rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '500',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 8px 20px rgba(236, 91, 163, 0.15)'
        }}>
          <span>✨ Upgrade to Premium to save data, compare products, and access Deeptech.</span>
          <button
            onClick={togglePremium}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '0.25rem 0.9rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              fontWeight: '700',
              boxShadow: '0 4px 10px rgba(217, 76, 147, 0.45)'
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {isPremium && (
        <div style={{
          background: 'rgba(253, 236, 245, 0.9)',
          color: 'var(--color-primary)',
          padding: '0.5rem 1.25rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: '600',
          boxShadow: '0 6px 18px rgba(236, 91, 163, 0.12)'
        }}>
          🌟 Premium Member Status: Active
          <button onClick={togglePremium} style={{ marginLeft: '1rem', textDecoration: 'underline', fontSize: '0.7rem' }}>Demo: Downgrade</button>
        </div>
      )}

      <main>
        {/* Navigation — condensed */}
        <nav style={{
          padding: isScrolled ? '0.4rem 1rem' : '0.5rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 247, 251, 0.9)',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '0.35rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(14px)',
          boxShadow: isScrolled ? '0 8px 24px rgba(180, 112, 157, 0.12)' : '0 10px 28px rgba(180, 112, 157, 0.14)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={navigateHome}>
              Ayna
            </div>

            {/* Ecosystem: label + hover menu (Compare, Hidden, Recall) — left of Search */}
            <div
              ref={ecoNavRef}
              className={`nav-ecosystem ${ecoMenuOpen ? 'nav-ecosystem--open' : ''} ${ecoMenuOpen && touchUi ? 'nav-ecosystem--caret-open' : ''}`}
              style={{ opacity: isPremium ? 1 : 0.6 }}
            >
              <div className="nav-ecosystem__row">
                <button
                  type="button"
                  id="nav-ecosystem-trigger"
                  className={`nav-ecosystem__trigger ${ECOSYSTEM_NAV_VIEWS.includes(currentView) ? 'nav-ecosystem__trigger--active' : ''}`}
                  onClick={() => (isPremium ? handleViewEcosystem() : togglePremium())}
                  aria-haspopup="menu"
                  aria-expanded={touchUi ? ecoMenuOpen : undefined}
                  aria-controls="nav-ecosystem-menu"
                >
                  My Ecosystem
                  {!isPremium && <span aria-hidden>🔒</span>}
                  {isPremium && ecosystemCount > 0 && (
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
                    if (isPremium) handleViewComparison();
                    else togglePremium();
                  }}
                >
                  <span>Compare</span>
                  {!isPremium && <span aria-hidden>🔒</span>}
                  {isPremium && compareList.length > 0 && (
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

            {/* Public Research Tools (Free) */}
            <div style={{ display: 'flex', gap: '0.35rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.5rem' }}>
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
                opacity: isPremium ? 1 : 0.5
              }}
              onClick={() => isPremium ? setShowCheckin(true) : togglePremium()}
            >
              Check-in {!isPremium && '🔒'}
            </button>
            <button style={{ fontSize: '0.8rem', fontWeight: '500', border: 'none', background: 'none', cursor: 'pointer', color: currentView === 'tracked' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} onClick={handleViewTracked}>
              {isPremium ? 'Profile' : 'Guest'} {totalBadge > 0 && <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.05rem 0.3rem', borderRadius: '1rem', fontSize: '0.65rem', marginLeft: '0.1rem' }}>{totalBadge}</span>}
            </button>
          </div>
        </nav>

        {currentView === 'welcome' && (
          <WelcomeGate onPersonalizedPath={handleStartQuiz} onBrowsePath={() => handleViewDiscovery('')} />
        )}
        {currentView === 'hero' && (
          <Hero onStartQuiz={handleStartQuiz} onViewWaitlist={handleViewWaitlist} onViewDiscovery={handleViewDiscovery} />
        )}
        {currentView === 'quiz' && (
          <HealthIntakeForm onComplete={handleQuizComplete} />
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
            isPremium={isPremium}
            onUpgrade={togglePremium}
            myProducts={myProducts}
            onAddToEcosystem={toggleMyProduct}
            onViewRecalls={handleViewRecalls}
          />
        )}
        {currentView === 'deeptech' && (
          <AynaDeeptech
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
            isPremium={isPremium}
            onUpgrade={togglePremium}
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
            onOpenHealthData={() => setCurrentView('profile')}
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
            isPremium={isPremium}
            onUpgrade={togglePremium}
            initialSearch={discoverySearch}
            recommendedProductIds={recommendedProductIds}
            aynaReviews={aynaReviews}
            hasQuizFrustrations={!!(quizResults?.frustrations?.length)}
            hasHealthImport={hasHealthImport}
          />
        )}
        {currentView === 'screenings' && (
          <Screenings checkinData={checkinData} onNavigate={setCurrentView} onOpenProduct={handleOpenProduct} />
        )}
        {currentView === 'omitted' && (
          <OmittedProducts omittedProducts={omittedProducts} toggleOmitProduct={toggleOmitProduct} />
        )}
        {currentView === 'recalls' && (
          <Recalls trackedProducts={trackedProducts} myProducts={myProducts} isPremium={isPremium} onUpgrade={togglePremium} />
        )}
        {currentView === 'comparison' && isPremium && (
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
        {currentView === 'doctor-prep' && isPremium && (
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

        {selectedLlmProduct && (
          <LlmSearchSuggestionModal product={selectedLlmProduct} onClose={handleCloseLlmProduct} />
        )}

        {selectedProductModal && (
          <ProductModal
            product={selectedProductModal}
            onClose={handleCloseProduct}
            isTracked={!!trackedProducts[selectedProductModal.id]}
            onTrack={toggleTrackProduct}
            onOmit={toggleOmitProduct}
            isOmitted={!!omittedProducts[selectedProductModal.id]}
            onToggleCompare={isPremium ? toggleCompare : null}
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
