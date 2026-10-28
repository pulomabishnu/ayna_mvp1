/**
 * The scalloped plate (signature 2, PDP audit 7.1): 12 lobes, lobe depth 8%
 * of the width. One drawing for the product page (ayv-plate, styled in
 * pdp-v7.css) and the shared Plate primitive (ayk-plate__svg).
 */
// Founder Oct 26 19:48: "no weird flower thing around the pictures, just make a circle or square".
// The plate is now a plain rounded square (radius 16 of 100), same box, same API.
export const PLATE_PATH = 'M20 4H80A16 16 0 0 1 96 20V80A16 16 0 0 1 80 96H20A16 16 0 0 1 4 80V20A16 16 0 0 1 20 4Z';

export function ScallopPlate({ tone = 'white', stroke = false, className = '' }) {
  return (
    <svg className={`ayv-plate is-${tone}${stroke ? ' has-stroke' : ''} ${className}`.trim()} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d={PLATE_PATH} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
