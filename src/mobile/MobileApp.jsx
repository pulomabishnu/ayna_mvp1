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

export default function MobileApp() {
  const [screen, setScreen] = useState('landing');
  const Screen = SCREENS[screen] || LandingScreen;

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
      <Screen />
    </div>
  );
}
