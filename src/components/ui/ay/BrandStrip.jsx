import './brand-strip.css';

/**
 * BrandStrip: ayna's one signature divider (founder, Oct 27 13:20: "i liked
 * that brown bar with the pink inside that we had before on the footer ...
 * integrate it more places"). The espresso bar with pink squares inside that
 * topped the website footer until Oct 27 04:21 (15098d39), as one primitive
 * so it looks the same everywhere. Static (nothing moves), decorative
 * (aria-hidden), 14px tall with a 1.5px rule top and bottom (size="lg": 18px,
 * for the website's big section break).
 *
 * One role everywhere (founder, Oct 27 13:58: fewer, well-chosen spots): it
 * marks the END of a page or a major section break, nothing else.
 *   end of a page    the website footer; the app's You, Library and My
 *                    ecosystem, above the legal note (LegalFooter strip)
 *   section break    the product page, between the product and More like this
 *
 *   <BrandStrip />                  the footer's edge
 *   <BrandStrip className="..." />  under a page head, at the end of a list
 */
export default function BrandStrip({ size = 'md', className = '' }) {
  return <div className={`ayk-strip${size === 'lg' ? ' is-lg' : ''} ${className}`.trim()} aria-hidden="true" />;
}
