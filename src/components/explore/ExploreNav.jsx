import { YOU_SECTIONS } from '../nav/mainTabs.js';
import '../../styles/explore-web.css';
import { Seal } from '../personality/Bits.jsx';
import { ProductStickers } from '../personality/DS.jsx';
import { Shout } from '../ui/ay';
import '../../styles/explore-v9.css';

const plainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/**
 * Section links under a main tab's title (Explore, You). Real links so they
 * open in a new tab; a plain click stays in the app. Scrolls with the page.
 */
function SectionNav({ label, sections, active, onGo, className = '' }) {
  return (
    <nav className={`wx-nav ${className}`.trim()} aria-label={label}>
      {sections.map((s) => (
        <a key={s.key} href={s.href} className={active === s.key ? 'is-on' : ''} aria-current={active === s.key ? 'page' : undefined}
          onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onGo?.(s.key); }}>{s.label}</a>
      ))}
    </nav>
  );
}

/**
 * Explore's header: the slim espresso band with "Explore". Explore is one shop
 * page now (founder, Oct 26: "isn't that all just shop, just add the filters"),
 * so there are no section tabs; the filters sit on the page under the search.
 * `titleAs="p"` when the page below has its own H1, so the page has one H1.
 */
export function ExploreHeader({ children = null, compact = false, titleAs = 'h1', stickers = [], title = 'Explore' }) {
  return (
    // The approved Shop header, kept for all of Explore: a full-bleed espresso band with a scalloped edge (signature 3: scallops at section edges only).
    <header className={`wx-top ay-container ay-pagehead ay-band ay-band--espresso wx-top--v9${compact ? ' is-compact' : ''}`}>
      {/* The page's one shout (#4dfb3fbd FEEL FITS): "Explore" oversized in the espresso band. */}
      <Shout as={titleAs} className="wx-title wx-shout">{title}</Shout>
      {/* The band's one seal, as on the Oct 21-22 Shop band. */}
      <Seal className="wx-seal" />
      {/* Her picks as die-cut stickers beside the seal (real photos only; nothing without them). */}
      <ProductStickers products={stickers} max={3} className="wx-stickers" />
      {children}
    </header>
  );
}

/** You's section links (My ecosystem, Saved, My health, Tracking, Connected data, My activity, Settings and privacy). */
export function YouNav({ active, onGo }) {
  return <div className="ay-container wx-younav"><SectionNav label="You sections" sections={[{ key: 'overview', label: 'Overview', href: '/you' }, ...YOU_SECTIONS]} active={active} onGo={onGo} /></div>;
}
