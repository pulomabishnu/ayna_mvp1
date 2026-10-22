import { localEstimate, PRICE_REGION_NOTE } from '../../utils/localPrice.js';

/*
 * International shoppers (Trevina, Oct 7). Two small pieces for the Shop and
 * product pages, web and app:
 *   <PriceRegionNote />          the one line about US dollars and shipping
 *   <LocalPriceEstimate price /> "≈ €23" for a visitor outside the US, else nothing
 * The product page isn't wired yet (src/components/pdp/* is being edited
 * elsewhere): render both under the price there.
 */
export function PriceRegionNote({ className = '' }) {
  return <p className={`ay-price-region ${className}`.trim()}>{PRICE_REGION_NOTE}</p>;
}

export function LocalPriceEstimate({ price, locale, className = '' }) {
  const text = localEstimate(price, locale);
  if (!text) return null;
  return <small className={`ay-price-local ${className}`.trim()}><span className="sr-only">About </span>{text.replace(/^≈\s*/, '≈ ')}</small>;
}
