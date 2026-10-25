import { EXPLORE_SECTIONS, YOU_SECTIONS } from '../nav/mainTabs.js';
import '../../styles/explore-web.css';

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
 * Explore's header: title and the five sections (For you, Health topics, Products, Services, Resources).
 * `titleAs="p"` when the section below has its own H1 (Resources), so the page has one H1.
 */
export function ExploreHeader({ active, onGo, children = null, compact = false, titleAs = 'h1' }) {
  const Title = titleAs;
  return (
    <header className={`wx-top ay-container${compact ? ' is-compact' : ''}`}>
      <Title className="ay-h1 wx-title">Explore</Title>
      {children}
      <SectionNav label="Explore sections" sections={EXPLORE_SECTIONS} active={active} onGo={onGo} />
    </header>
  );
}

/** You's section links (My ecosystem, Saved, My health, Tracking, Connected data, My activity, Settings and privacy). */
export function YouNav({ active, onGo }) {
  return <div className="ay-container wx-younav"><SectionNav label="You sections" sections={[{ key: 'overview', label: 'Overview', href: '/you' }, ...YOU_SECTIONS]} active={active} onGo={onGo} /></div>;
}
