import React, { useState } from 'react';
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
import { CATEGORY_LABELS } from './data/products';
import AynaDeeptech from './components/AynaDeeptech';
import Screenings from './components/Screenings';
import { useScrollPosition } from './hooks/useScrollPosition';
import ProductModal from './components/ProductModal'; // Assuming ProductModal is still used but managed differently
import Articles from './components/Articles';

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
  const [discoverySearch, setDiscoverySearch] = useState('');
  const scrollY = useScrollPosition();
  const isScrolled = scrollY > 20;

  const handleStartQuiz = () => setCurrentView('quiz');
  const handleViewWaitlist = () => setCurrentView('waitlist');
  const handleViewTracked = () => setCurrentView('tracked');
  const handleViewEcosystem = () => setCurrentView('ecosystem');
  const handleViewDiscovery = (query = '') => {
    setDiscoverySearch(query);
    setCurrentView('discovery');
  };
  const handleViewDeeptech = () => setCurrentView('deeptech');
  const handleViewArticles = () => setCurrentView('articles');
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

  return (
    <div className="app-container">
      {/* Premium Banner for Free Users */}
      {!isPremium && (
        <div style={{
          background: 'var(--color-surface-contrast)',
          color: 'white',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span>✨ Upgrade to Premium to save data, compare products, and access Deeptech.</span>
          <button
            onClick={togglePremium}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '0.2rem 0.75rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {isPremium && (
        <div style={{
          background: 'var(--color-secondary-fade)',
          color: 'var(--color-primary)',
          padding: '0.4rem 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          🌟 Premium Member Status: Active
          <button onClick={togglePremium} style={{ marginLeft: '1rem', textDecoration: 'underline', fontSize: '0.7rem' }}>Demo: Downgrade</button>
        </div>
      )}

      <main>
        {/* Navigation */}
        <nav style={{
          padding: isScrolled ? '0.75rem 1.5rem' : '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-surface-soft)',
          borderBottom: isScrolled ? '1px solid var(--color-border)' : '1px solid transparent',
          flexWrap: 'wrap',
          gap: '0.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={navigateHome}>
              Ayna
            </div>

            {/* Public Research Tools (Free) */}
            <div style={{ display: 'flex', gap: '1rem', borderRight: '1px solid var(--color-border)', paddingRight: '1rem' }}>
              <button style={{ fontSize: '0.9rem', fontWeight: (currentView === 'discovery' || currentView === 'hero') ? '700' : '500', color: currentView === 'discovery' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={() => handleViewDiscovery('')}>
                Search
              </button>
              <button style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'recalls' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewRecalls}>
                Safety Recall
              </button>
              <button style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'waitlist' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewWaitlist}>
                Startups
              </button>
              <button style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'deeptech' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewDeeptech}>
                Deeptech
              </button>
              <button style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'articles' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewArticles}>
                Articles
              </button>
            </div>

            {/* Personalized Ecosystem (Premium Gated) */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', opacity: isPremium ? 1 : 0.6 }}>
                <button
                  style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'ecosystem' ? 'var(--color-primary)' : 'var(--color-text-main)' }}
                  onClick={isPremium ? handleViewEcosystem : togglePremium}
                >
                  My Ecosystem {!isPremium && '🔒'} {isPremium && Object.keys(myProducts).length > 0 && <span style={{ background: 'var(--color-surface-contrast)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', marginLeft: '0.15rem' }}>{Object.keys(myProducts).length}</span>}
                </button>
                <button
                  style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'cycle-tracker' ? 'var(--color-primary)' : 'var(--color-text-main)' }}
                  onClick={isPremium ? handleViewCycleTracker : togglePremium}
                >
                  Trackers {!isPremium && '🔒'}
                </button>
                {isPremium && (
                  <button style={{ fontSize: '0.9rem', fontWeight: '500', color: currentView === 'comparison' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewComparison}>
                    Compare
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                fontSize: '0.8rem', fontWeight: '600', padding: '0.4rem 0.75rem',
                background: 'var(--color-secondary-fade)', color: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-primary)',
                opacity: isPremium ? 1 : 0.5
              }}
              onClick={() => isPremium ? setShowCheckin(true) : togglePremium()}
            >
              Check-in {!isPremium && '🔒'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button style={{ fontSize: '0.9rem', fontWeight: '500', border: 'none', background: 'none', cursor: 'pointer', color: currentView === 'tracked' ? 'var(--color-primary)' : 'var(--color-text-main)' }} onClick={handleViewTracked}>
                {isPremium ? 'My Profile' : 'Guest'} {totalBadge > 0 && <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', marginLeft: '0.15rem' }}>{totalBadge}</span>}
              </button>
            </div>
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
          <TrackedItems trackedProducts={trackedProducts} joinedWaitlists={joinedWaitlists} onViewWaitlist={handleViewWaitlist} />
        )}
        {currentView === 'waitlist' && (
          <WaitlistHub
            joinedWaitlists={joinedWaitlists}
            toggleJoinWaitlist={toggleJoinWaitlist}
            quizResults={quizResults}
            isPremium={isPremium}
            onUpgrade={togglePremium}
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
          <Articles />
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
            toggleOmitProduct={toggleOmitProduct}
            setCurrentView={setCurrentView}
            onOpenProduct={handleOpenProduct}
            isPremium={isPremium}
            onUpgrade={togglePremium}
            initialSearch={discoverySearch}
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
          />
        )}
        {currentView === 'recalls' && (
          <Recalls trackedProducts={trackedProducts} isPremium={isPremium} onUpgrade={togglePremium} />
        )}
        {currentView === 'doctor-prep' && isPremium && (
          <DoctorPrep
            cycleData={cycleData}
            myProducts={myProducts}
            quizResults={quizResults}
            onBack={() => setCurrentView('ecosystem')}
          />
        )}

        {showCheckin && (
          <MonthlyCheckin
            onComplete={(answers) => {
              setCheckinData(answers);
              // We do not close here automatically, MonthlyCheckin has its own "Done" button that triggers onClose
            }}
            onClose={() => setShowCheckin(false)}
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
          />
        )}
      </main>
    </div>
  );
}

export default App;
