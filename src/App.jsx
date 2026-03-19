import React, { useState, useMemo } from 'react';
import Hero from './components/Hero';
import Quiz from './components/Quiz';
import Recommendations from './components/Recommendations';
import WaitlistHub from './components/WaitlistHub';
import TrackedItems from './components/TrackedItems';
import MyEcosystem from './components/MyEcosystem';
import Discovery from './components/Discovery';
import MonthlyCheckin from './components/MonthlyCheckin';
import CycleTracker from './components/CycleTracker';
import MenopauseTracker from './components/MenopauseTracker';
import OmittedProducts from './components/OmittedProducts';
import Comparison from './components/Comparison';
import Recalls from './components/Recalls';
import DoctorPrep from './components/DoctorPrep';
import { CATEGORY_LABELS, getRecommendations, createCustomEcosystemProducts } from './data/products';
import { loadAynaReviews, addRating, addReview } from './data/aynaReviews';
import AynaDeeptech from './components/AynaDeeptech';
import Screenings from './components/Screenings';
import { useScrollPosition } from './hooks/useScrollPosition';
import ProductModal from './components/ProductModal';
import Articles from './components/Articles';
import DonateProducts from './components/DonateProducts';
import ProfileChatbot from './components/ProfileChatbot';

function App() {
  const [currentView, setCurrentView] = useState('hero');
  const [quizResults, setQuizResults] = useState(null);
  const [trackedProducts, setTrackedProducts] = useState({});
  const [joinedWaitlists, setJoinedWaitlists] = useState({});
  const [myProducts, setMyProducts] = useState({});
  const [omittedProducts, setOmittedProducts] = useState({});
  const [cycleData, setCycleData] = useState([]);
  const [menopauseData, setMenopauseData] = useState([]);
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
  const scrollY = useScrollPosition();

  React.useEffect(() => {
    setAynaReviews(loadAynaReviews());
  }, []);

  const recommendedProductIds = useMemo(() => {
    if (!quizResults) return [];
    return getRecommendations(quizResults).map(p => p.id);
  }, [quizResults]);

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
  const handleViewDonate = () => setCurrentView('donate');
  const handleViewArticle = (articleId) => {
    setSelectedArticleId(articleId);
    setCurrentView('articles');
  };
  const handleViewCycleTracker = () => setCurrentView('cycle-tracker');
  const handleViewMenopauseTracker = () => setCurrentView('menopause-tracker');
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
    if (Object.keys(customProducts).length > 0) {
      setMyProducts(prev => ({ ...prev, ...customProducts }));
    }
    setCurrentView('recommendations');
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

  const [selectedProductModal, setSelectedProductModal] = useState(null);

  const totalBadge = Object.keys(trackedProducts).length + Object.keys(joinedWaitlists).length;

  const handleOpenProduct = (product) => setSelectedProductModal(product);
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

            {/* Public Research Tools (Free) */}
            <div style={{ display: 'flex', gap: '0.35rem', borderRight: '1px solid var(--color-border)', paddingRight: '0.5rem' }}>
              <button style={{ fontSize: '0.8rem', fontWeight: (currentView === 'discovery' || currentView === 'hero') ? '700' : '500', color: currentView === 'discovery' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={() => handleViewDiscovery('')}>
                Search
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'recalls' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewRecalls}>
                Recall
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'waitlist' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewWaitlist}>
                Startups
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'deeptech' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewDeeptech}>
                Deeptech
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'articles' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewArticles}>
                Articles
              </button>
              <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'donate' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem' }} onClick={handleViewDonate}>
                Donate
              </button>
            </div>

            {/* Personalized Ecosystem (Premium Gated) */}
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.35rem', opacity: isPremium ? 1 : 0.6 }}>
                <button
                  style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'ecosystem' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={isPremium ? handleViewEcosystem : togglePremium}
                >
                  Ecosystem {!isPremium && '🔒'} {isPremium && Object.keys(myProducts).length > 0 && <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.05rem 0.3rem', borderRadius: '1rem', fontSize: '0.65rem', marginLeft: '0.1rem' }}>{Object.keys(myProducts).length}</span>}
                </button>
                <button
                  style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'cycle-tracker' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={isPremium ? handleViewCycleTracker : togglePremium}
                >
                  Period {!isPremium && '🔒'}
                </button>
                <button
                  style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'menopause-tracker' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={isPremium ? handleViewMenopauseTracker : togglePremium}
                >
                  Menopause {!isPremium && '🔒'}
                </button>
                {isPremium && (
                  <button style={{ fontSize: '0.8rem', fontWeight: '500', color: currentView === 'comparison' ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '0.2rem 0.4rem', border: 'none', background: 'none', cursor: 'pointer' }} onClick={handleViewComparison}>
                    Compare
                  </button>
                )}
                <button style={{ fontSize: '0.8rem', fontWeight: '500', border: 'none', background: 'none', cursor: 'pointer', color: currentView === 'omitted' ? 'var(--color-primary)' : 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.4rem' }} onClick={handleViewOmitted}>
                  Hidden {Object.keys(omittedProducts).length > 0 && <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.05rem 0.3rem', borderRadius: '1rem', fontSize: '0.65rem' }}>{Object.keys(omittedProducts).length}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://forms.gle/AnaaVhW2vjYr5r5RA"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.8rem', fontWeight: '600', padding: '0.25rem 0.5rem',
                background: 'var(--color-primary)', color: 'white',
                borderRadius: 'var(--radius-pill)', textDecoration: 'none'
              }}
            >
              Early Access
            </a>
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

        {currentView === 'hero' && (
          <Hero onStartQuiz={handleStartQuiz} onViewWaitlist={handleViewWaitlist} onViewDiscovery={handleViewDiscovery} />
        )}
        {currentView === 'quiz' && (
          <Quiz onComplete={handleQuizComplete} />
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
            cycleData={cycleData}
            menopauseData={menopauseData}
            myProducts={myProducts}
            onOpenProduct={handleOpenProduct}
            omittedProducts={omittedProducts}
            onViewOmitted={handleViewOmitted}
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
          <Articles initialArticleId={selectedArticleId} onOpenProduct={handleOpenProduct} quizResults={quizResults} />
        )}
        {currentView === 'donate' && (
          <DonateProducts omittedProducts={omittedProducts} onViewOmitted={handleViewOmitted} />
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
          />
        )}
        {currentView === 'cycle-tracker' && (
          <CycleTracker
            cycleData={cycleData}
            setCycleData={setCycleData}
            myProducts={myProducts}
            trackedProducts={trackedProducts}
            onToggleMyProduct={toggleMyProduct}
            onToggleTrackedProduct={toggleTrackProduct}
            omittedProducts={omittedProducts}
            toggleOmitProduct={toggleOmitProduct}
            onOpenProduct={handleOpenProduct}
          />
        )}
        {currentView === 'menopause-tracker' && (
          <MenopauseTracker
            menopauseData={menopauseData}
            setMenopauseData={setMenopauseData}
            myProducts={myProducts}
            trackedProducts={trackedProducts}
            onToggleMyProduct={toggleMyProduct}
            onToggleTrackedProduct={toggleTrackProduct}
            omittedProducts={omittedProducts}
            toggleOmitProduct={toggleOmitProduct}
            onOpenProduct={handleOpenProduct}
          />
        )}
        {currentView === 'screenings' && (
          <Screenings checkinData={checkinData} onNavigate={setCurrentView} onOpenProduct={handleOpenProduct} />
        )}
        {currentView === 'omitted' && (
          <OmittedProducts omittedProducts={omittedProducts} toggleOmitProduct={toggleOmitProduct} />
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
        {currentView === 'recalls' && (
          <Recalls trackedProducts={trackedProducts} myProducts={myProducts} isPremium={isPremium} onUpgrade={togglePremium} />
        )}
        {currentView === 'doctor-prep' && isPremium && (
          <DoctorPrep
            cycleData={cycleData}
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
            onToggleCompare={isPremium ? toggleCompare : null}
            isInCompare={compareList.some(p => p.id === selectedProductModal.id)}
            onAddToEcosystem={toggleMyProduct}
            isInEcosystem={!!myProducts[selectedProductModal.id]}
            userZipCode={userZipCode || undefined}
            aynaReviews={aynaReviews}
            onRate={handleRateProduct}
            onReview={handleReviewProduct}
          />
        )}
      </main>
    </div>
  );
}

export default App;
