import { useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS, getPersonalizedProductIds, getProductById } from '../data/products.js';
import { ARTICLES } from '../components/Articles.jsx';
import { ECOSYSTEM_AREAS as REAL_ECOSYSTEM_AREAS, resolveEcosystemProductArea } from '../components/EcosystemBubbles.jsx';
import { useSavedProducts } from './hooks/useSavedProducts.js';
import { ECOSYSTEM_AREAS as AREA_LABELS } from './data/ecosystemAreas.js';

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

const SCREENS = {
  landing: LandingScreen,
  browse: BrowseScreen,
  product: ProductDetailScreen,
  article: ArticleDetailScreen,
  ecointro: EcosystemIntroScreen,
  quiz: IntakeScreen,
  building: BuildingScreen,
  reveal: RevealScreen,
  signin: SigninScreen,
  eco: EcosystemScreen,
  saved: SavedScreen,
};

// Real business logic: getPersonalizedProductIds returns every real,
// positively-scored catalog match for the quiz answers (not
// getRecommendations()'s padded fallback list, and not limited to one pick
// per frustration like getEcosystemSeedFromQuiz) — richer, so the orbit can
// naturally populate more than a handful of areas when the answers
// genuinely match more products. resolveEcosystemProductArea is the real
// product -> pillar-area matcher (keyword + category scanning) that
// EcosystemOrbit's contract has always deferred to rather than
// reimplementing. Both reused here, not duplicated.
function seedEcosystemFromAnswers(quizAnswers) {
  const ids = getPersonalizedProductIds(quizAnswers, null);
  const products = ids.map((id) => getProductById(id)).filter(Boolean);
  return products.map((p) => {
    const area = resolveEcosystemProductArea(p, REAL_ECOSYSTEM_AREAS);
    return { ...p, areaKey: area ? area.key : null };
  });
}

export default function MobileApp() {
  const [screen, setScreen] = useState('landing');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const { savedMap, isSaved, toggleSaved } = useSavedProducts();
  const [hasEcosystem, setHasEcosystem] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [lastQuizAnswers, setLastQuizAnswers] = useState(null);
  const [userName, setUserName] = useState('You');

  const Screen = SCREENS[screen] || LandingScreen;
  const currentProduct = selectedProduct || ALL_PRODUCTS[0];
  const currentArticle = selectedArticle || ARTICLES[0];

  const topAreaLabels = [...new Set(myProducts.map((p) => p.areaKey).filter(Boolean))]
    .map((key) => AREA_LABELS.find((a) => a.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3);
  const goalCount = lastQuizAnswers?.frustrations?.length || 0;

  const nav = {
    onStartQuiz: () => setScreen('quiz'),
    onBrowse: () => setScreen('browse'),
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen(hasEcosystem ? 'eco' : 'ecointro'),
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => {
      setSelectedProduct(p);
      setScreen('product');
    },
    onOpenArticle: (a) => {
      setSelectedArticle(a);
      setScreen('article');
    },
    onBack: () => setScreen('browse'),
    onRetake: () => setScreen('quiz'),
    onUpdateHealth: () => setScreen('quiz'),
    onComplete: (quizAnswers) => {
      setMyProducts(seedEcosystemFromAnswers(quizAnswers));
      setLastQuizAnswers(quizAnswers);
      setScreen('building');
    },
    onFinish: () => setScreen('reveal'),
    onContinue: () => setScreen('signin'),
    onCreateAccount: ({ name } = {}) => {
      if (name) setUserName(name);
      setHasEcosystem(true);
      setScreen('eco');
    },
    onContinueWithApple: ({ name } = {}) => {
      if (name) setUserName(name);
      setHasEcosystem(true);
      setScreen('eco');
    },
    isSaved: isSaved(currentProduct?.id),
    onToggleSaved: () => toggleSaved(currentProduct),
    hasEcosystem,
  };

  return (
    <div className="ayna-mobile">
      {/* Temporary dev-only screen switcher for smoke testing — not final navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, fontSize: 11 }}>
        {Object.keys(SCREENS).map((key) => (
          <button key={key} onClick={() => setScreen(key)}>
            {key}
          </button>
        ))}
      </div>
      <Screen
        {...nav}
        products={ALL_PRODUCTS}
        articles={ARTICLES}
        product={currentProduct}
        article={currentArticle}
        savedProducts={savedMap}
        myProducts={myProducts}
        quizAnswers={lastQuizAnswers}
        name={userName}
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
    </div>
  );
}
