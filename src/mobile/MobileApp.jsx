import { useState } from 'react';
import './mobile.css';

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

// Dev-only fixtures for visually smoke-testing the preview — shaped like
// real src/data/products.js entries, NOT imported from the real catalog
// (no live data wiring yet). Remove once real product data is wired in.
const SAMPLE_PRODUCTS = [
  {
    id: 'sample-pad',
    name: 'Sample Comfort Pad',
    category: 'pad',
    price: '$8 for 18',
    userRating: 4.5,
    image: '',
    summary: 'Dev-preview sample only — not real catalog data.',
    ingredients: 'Cotton, polyethylene film, adhesive.',
    effectiveness: 'Sample effectiveness text for preview purposes.',
    doctorOpinion: 'Sample clinician note for preview purposes.',
    communityReview: 'Sample community note for preview purposes.',
    safety: { fdaStatus: 'FDA-registered medical device (sample)' },
    badges: ['Sample Badge'],
    whereToBuy: ['Target', 'Amazon'],
  },
  {
    id: 'sample-supplement',
    name: 'Sample Cycle Support',
    category: 'supplement',
    price: '$28',
    userRating: 4.6,
    image: '',
    summary: 'Dev-preview sample only — not real catalog data.',
    ingredients: 'Magnesium glycinate, vitamin B6.',
    effectiveness: 'Sample effectiveness text for preview purposes.',
    doctorOpinion: 'Sample clinician note for preview purposes.',
    communityReview: 'Sample community note for preview purposes.',
    safety: { sideEffects: 'Sample side-effect note for preview purposes.' },
    badges: [],
    whereToBuy: ['Amazon'],
  },
];

// Shaped like savedProductsStore.js's compactProduct() map (keyed by id),
// dev-only fixture — not the real store.
const SAMPLE_SAVED_PRODUCTS = {
  'sample-pad': { id: 'sample-pad', name: 'Sample Comfort Pad', category: 'pad', price: '$8 for 18' },
};

export default function MobileApp() {
  const [screen, setScreen] = useState('landing');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const Screen = SCREENS[screen] || LandingScreen;

  // Placeholder navigation wiring — enough to click through screens during
  // scaffolding. Real product data / auth-aware routing gets wired in later.
  const nav = {
    onStartQuiz: () => setScreen('quiz'),
    onBrowse: () => setScreen('browse'),
    onOpenSaved: () => setScreen('saved'),
    onGoEco: () => setScreen('eco'),
    onGoLanding: () => setScreen('landing'),
    onOpenProduct: (p) => {
      setSelectedProduct(p);
      setScreen('product');
    },
    onBack: () => setScreen('browse'),
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
        products={SAMPLE_PRODUCTS}
        product={selectedProduct || SAMPLE_PRODUCTS[0]}
        savedProducts={SAMPLE_SAVED_PRODUCTS}
      />
    </div>
  );
}
