import './brand-strip.css';

/**
 * BrandStrip: ayna's one signature divider (founder, Oct 27 13:20: "i liked
 * that brown bar with the pink inside that we had before on the footer ...
 * integrate it more places"). The espresso bar with pink squares inside that
 * topped the website footer until Oct 27 04:21 (15098d39), as one primitive
 * so it looks the same everywhere. Static (nothing moves), decorative
 * (aria-hidden), 14px tall with a 1.5px rule top and bottom. Use it sparingly:
 * a section divider, never on every block.
 *
 *   <BrandStrip />                  the footer's edge
 *   <BrandStrip className="..." />  under a page head, at the end of a list
 */
export default function BrandStrip({ className = '' }) {
  return <div className={`ayk-strip ${className}`.trim()} aria-hidden="true" />;
}
