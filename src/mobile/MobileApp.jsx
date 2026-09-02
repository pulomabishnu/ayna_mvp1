import { useState } from 'react';
import './mobile.css';
import { ALL_PRODUCTS } from '../data/products.js';
import { useSavedProducts } from './hooks/useSavedProducts.js';

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

// Dev-only fixtures, still used where real data isn't wired in yet
// (Ecosystem/Articles — separate steps). Browse/Product Detail use the real
// catalog, Saved uses the real localStorage store.
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
    areaKey: 'period',
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
    areaKey: 'hormones',
  },
  {
    id: 'sample-sleep',
    name: 'Sample Night Support',
    category: 'sleep',
    price: '$24',
    userRating: 4.4,
    image: '',
    summary: 'Dev-preview sample only — not real catalog data.',
    ingredients: 'L-theanine, glycine.',
    effectiveness: 'Sample effectiveness text for preview purposes.',
    doctorOpinion: 'Sample clinician note for preview purposes.',
    communityReview: 'Sample community note for preview purposes.',
    safety: {},
    badges: [],
    whereToBuy: ['Amazon'],
    areaKey: 'sleep-stress',
  },
];

// Shaped like the real ARTICLES array in src/components/Articles.jsx —
// body is raw JSX, dev-only fixture, not imported from the real content.
const SAMPLE_ARTICLES = [
  {
    id: 'sample-article',
    title: 'Sample Article Title',
    source: 'Sample Source',
    tags: ['Sample tag'],
    teaser: 'Dev-preview sample only — not real article content.',
    body: (
      <>
        <p>This is a sample paragraph standing in for real article body JSX during preview.</p>
        <p>
          A second paragraph with a{' '}
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            sample link
          </a>{' '}
          to confirm link color matches the site's --color-primary token.
        </p>
      </>
    ),
  },
];

export default function MobileApp() {
  const [screen, setScreen] = useState('landing');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const { savedMap, isSaved, toggleSaved } = useSavedProducts();
  // Dev-only stand-in for "does this person have an account / completed
  // ecosystem yet" — real auth-aware state gets wired in later. Starts
  // false so My Ecosystem prompts the intake first, matching a signed-out
  // or not-yet-onboarded user.
  const [hasEcosystem, setHasEcosystem] = useState(false);

  const Screen = SCREENS[screen] || LandingScreen;
  const currentProduct = selectedProduct || ALL_PRODUCTS[0];

  // Placeholder navigation wiring — enough to click through screens during
  // scaffolding. Real recommendation/area-matching logic and auth get
  // wired in later.
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
    onComplete: () => setScreen('building'),
    onFinish: () => setScreen('reveal'),
    onContinue: () => setScreen('signin'),
    onCreateAccount: () => {
      setHasEcosystem(true);
      setScreen('eco');
    },
    onContinueWithApple: () => {
      setHasEcosystem(true);
      setScreen('eco');
    },
    isSaved: isSaved(currentProduct?.id),
    onToggleSaved: () => toggleSaved(currentProduct),
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
        articles={SAMPLE_ARTICLES}
        product={currentProduct}
        article={selectedArticle || SAMPLE_ARTICLES[0]}
        savedProducts={savedMap}
        myProducts={SAMPLE_PRODUCTS}
        name="Maya"
        tags="3 areas covered"
        relatedReads={SAMPLE_ARTICLES}
        topAreas={['Period', 'Hormones', 'Sleep']}
        productCount={SAMPLE_PRODUCTS.length}
        readCount={SAMPLE_ARTICLES.length}
        goalCount={3}
        stats={[
          { label: 'Products', value: SAMPLE_PRODUCTS.length },
          { label: 'Reads', value: SAMPLE_ARTICLES.length },
          { label: 'Pillars', value: 3 },
        ]}
      />
    </div>
  );
}
