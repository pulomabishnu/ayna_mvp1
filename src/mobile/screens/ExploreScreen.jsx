import { useMemo } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import LibraryScreen from './LibraryScreen.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import BrowseScreen from './BrowseScreen.jsx';
import { splitCatalog } from '../../utils/search/exploreSearch.js';
import '../explore.css';
import '../explore-v9.css';
import '../app-header.css';


/**
 * Explore in the app: one shop page (founder, Oct 26: "isn't that all just
 * shop, just add the filters"). A compact pink band with the title and the
 * search, then the Shop: one row of need chips with a small Products or Services
 * toggle, Filters and Sort, and one grid. The old sections (For you, Needs,
 * Services) open this same page; Reads (the 'library' screen) is its own page,
 * linked at the bottom. Browsing works with no profile at all.
 */
export default function ExploreScreen(props) {
  const { exploreSection = 'overview', onExploreSection, products = [], onOpenSaved } = props;
  // Shop and Services are their own tabs now (founder, Oct 26): the tab picks the type, so no toggle.
  const kind = exploreSection === 'services' ? 'services' : 'products';
  const { products: catalog, services } = useMemo(() => splitCatalog(products), [products]);
  // Products is the Shop as before (products only, QA3 M8); Services lists the services.
  const shown = kind === 'services' ? services : catalog;
  // The header (founder, Oct 27: "fix the app header"): top bar, the Ask line, then ONE compact
  // pink band with a wavy edge holding the title and the search (no separate espresso band, no seal).

  // Reads: the Library's reads, on their own page (no longer an Explore tab).
  if (exploreSection === 'resources') {
    return <div className="ax ax--embed" data-tour="reads">
      <MobileHeader onOpenSaved={onOpenSaved} />
      <LibraryScreen {...props} embedded bandTitle="Library" />
    </div>;
  }

  return <div className="ax ax--embed" data-tour="explore" data-kind={kind}>
    <MobileHeader onOpenSaved={onOpenSaved} />
    <BrowseScreen key={kind} {...props} products={shown} embedded typeToggle={null} bandTitle={kind === 'services' ? 'Services' : 'Shop'} />
    <p className="ayshop__reads"><a href="/library" onClick={(e) => { e.preventDefault(); onExploreSection?.('resources'); }}>Library: guides and research</a></p>
    <LegalFooter />
  </div>;
}
