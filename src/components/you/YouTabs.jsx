import { PillTabs } from '../ui/ay';
import '../../styles/you-hub.css';
import { YOU_SECTIONS } from '../nav/mainTabs.js';

const SHORT = { ecosystem: 'Ecosystem', saved: 'Saved', health: 'Health', activity: 'Activity', settings: 'Settings' };
const plainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/**
 * You's five sections as the product page's pill tabs (You audit P1/P2): a
 * "You" breadcrumb back to the hub on top, then My ecosystem · Saved · My
 * health · Activity · Settings & privacy. Five labels in equal columns (short
 * ones on a phone), so it never scrolls sideways. No Back button: these are
 * the You tab's own sections. Real links, so they open in a new tab too.
 */
export default function YouTabs({ active, onGo }) {
  const current = YOU_SECTIONS.find((s) => s.key === active);
  return (
    <div className="ay-container yh-tabs">
      <nav className="yh-crumb" aria-label="Breadcrumb">
        <a href="/you" onClick={(e) => { if (!plainClick(e)) return; e.preventDefault(); onGo?.('overview'); }}>You</a>
        {current && <><span aria-hidden="true">/</span><span aria-current="page">{current.label}</span></>}
      </nav>
      <PillTabs
        idBase="you"
        label="You sections"
        active={active}
        onChange={(key) => onGo?.(key)}
        tabs={YOU_SECTIONS.map((s) => ({ id: s.key, href: s.href, label: <><span className="yh-long">{s.label}</span><span className="yh-short" aria-hidden="true">{SHORT[s.key] || s.label}</span></> }))}
      />
    </div>
  );
}
