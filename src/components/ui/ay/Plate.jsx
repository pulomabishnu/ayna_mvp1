import { ScallopPlate } from './ScallopPlate.jsx';
import './ay-primitives.css';

/**
 * Plate (#32 Glossier app: the product standing on a scalloped flower; #53
 * Glowie: every product on the same plate at the same scale): the white
 * scalloped plate behind every product image (the PDP drawing, not a copy).
 * White on butter, pink when saved; no outline unless `stroke` (it sits on a
 * white surface). The product sits at 70% everywhere.
 * Without an image it shows the brand name on the plain plate, never an
 * empty oval.
 *
 *   <Plate src={p.image} alt="" sticker="Period" saved={isSaved} />
 */
export default function Plate({ src = '', alt = '', saved = false, tone = null, stroke = false, frame = 'square', sticker = null, fallback = '', className = '', children = null, imgProps = {} }) {
  const t = tone || (saved ? 'pink' : 'white');
  return (
    <div className={`ayk-plate is-${frame} ${className}`.trim()}>
      <ScallopPlate tone={t} stroke={stroke} className={`ayk-plate__svg is-${t}`} />
      {src ? <img className="ayk-plate__img" src={src} alt={alt} loading="lazy" decoding="async" {...imgProps} />
        : children || (fallback && <span className="ayk-plate__name">{fallback}</span>)}
      {sticker && <span className="ayk-sticker ayk-plate__sticker">{sticker}</span>}
    </div>
  );
}
