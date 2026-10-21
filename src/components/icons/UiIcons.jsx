// One small line-icon set for UI glyphs (anti-vibe guide, section 3):
// 24px canvas, 1.75 stroke, round caps and joins, decorative (aria-hidden).
// Use these instead of text glyphs (✕ ♥ ✓ ⚠️ ♫ ▶ ❚❚), which iOS can draw as
// colour emoji and screen readers read aloud. The button around an icon
// carries the label.
import { HEART_PATH } from '../../mobile/utils/heart.js';

function Svg({ size = 20, children, fill = 'none', className = '' }) {
  return (
    <svg className={`ay-ui-icon ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const CheckIcon = (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const HeartIcon = ({ filled = false, ...p }) => <Svg {...p} fill={filled ? 'currentColor' : 'none'}><path d={HEART_PATH} /></Svg>;
export const WarningIcon = (p) => <Svg {...p}><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.2M12 17.2v.1" /></Svg>;
export const PlaylistIcon = (p) => <Svg {...p}><path d="M4 6h11M4 11h11M4 16h6" /><path d="M17 17.5V8l4-1" /><circle cx="15.5" cy="17.5" r="1.8" /></Svg>;
export const PlayIcon = (p) => <Svg {...p} fill="currentColor"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></Svg>;
export const PauseIcon = (p) => <Svg {...p}><path d="M9 5.5v13M15 5.5v13" /></Svg>;
export const PlusIcon = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const ChevronLeftIcon = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const ChevronRightIcon = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
