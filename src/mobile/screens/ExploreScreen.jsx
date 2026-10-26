import { useMemo } from 'react';
import { Seal } from '../../components/personality/Bits.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import LibraryScreen from './LibraryScreen.jsx';
import { Shout } from '../../components/ui/ay';
import LegalFooter from '../components/LegalFooter.jsx';
import BrowseScreen from './BrowseScreen.jsx';
import { splitCatalog } from '../../utils/search/exploreSearch.js';
import '../explore.css';
import '../explore-v9.css';


/**
 * Explore in the app: one shop page (founder, Oct 26: "isn't that all just
 * shop, just add the filters"). The espresso band with "Explore", then the
 * Shop: search, one row of need chips with a small Products or Services
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
  const band = (title) => <header className="ax-top ax-top--band">
    <Shout className="ax-title ax-shout">{title}</Shout>
    <Seal className="ax-seal" />
  </header>;

  // Reads: the Library's reads, on their own page (no longer an Explore tab).
  if (exploreSection === 'resources') {
    return <div className="ax ax--embed" data-tour="reads">
      <MobileHeader onOpenSaved={onOpenSaved} />
      {band('Library')}
      <LibraryScreen {...props} embedded />
    </div>;
  }

  return <div className="ax ax--embed" data-tour="explore" data-kind={kind}>
    <MobileHeader onOpenSaved={onOpenSaved} />
    {band(kind === 'services' ? 'Services' : 'Shop')}
    <BrowseScreen key={kind} {...props} products={shown} embedded typeToggle={null} />
    <p className="ayshop__reads"><a href="/library" onClick={(e) => { e.preventDefault(); onExploreSection?.('resources'); }}>Library: guides and research</a></p>
    <LegalFooter />
  </div>;
}
