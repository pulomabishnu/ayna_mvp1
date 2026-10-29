import { shownMatchPercent } from '../../utils/matchDisplay.js';

export const WEB_ECO_VIEWS = [
  ['mine', 'Mine'],
  ['picks', 'ayna picks'],
  ['saved', 'Saved'],
  ['routine', 'Routine'],
];

export function makePctFor(quizResults, scoreFor) {
  return (p) => {
    if (!quizResults) return null;
    const d = scoreFor(p);
    return d?.percent > 0 && (d.matchStatus || 'scored') === 'scored' ? shownMatchPercent(d.percent) : null;
  };
}
