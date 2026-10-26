import { LEVELS } from './evidenceMarks.js';

/**
 * One evidence mark (PDP audit 12, signature 4): an 8px circle, 1.5px ink.
 * filled = checked against .gov, half = peer-reviewed, outline = the brand's,
 * dotted = people's experiences. Always paired with its words for screen
 * readers; the visible label shows the first time on a screen.
 */
export default function EvidenceMark({ level }) {
  const def = LEVELS.find((l) => l.id === level);
  if (!def) return null;
  return (
    <svg className={`ayv-mark8 is-${def.mark}`} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      {def.mark === 'half' && <path d="M5 1.25a3.75 3.75 0 0 0 0 7.5Z" fill="currentColor" />}
      <circle cx="5" cy="5" r="3.75" fill={def.mark === 'filled' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeDasharray={def.mark === 'dotted' ? '1.2 1.6' : undefined} />
    </svg>
  );
}

