/**
 * The scalloped plate (signature 2, PDP audit 7.1): 12 lobes, lobe depth 8%
 * of the width. One drawing for the product page (ayv-plate, styled in
 * pdp-v7.css) and the shared Plate primitive (ayk-plate__svg).
 */
export const PLATE_PATH = (() => {
  const pts = [];
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * Math.PI * 2;
    const r = 41.5 + 4 * (1 + Math.cos(12 * t));
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();

export function ScallopPlate({ tone = 'white', stroke = false, className = '' }) {
  return (
    <svg className={`ayv-plate is-${tone}${stroke ? ' has-stroke' : ''} ${className}`.trim()} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d={PLATE_PATH} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
