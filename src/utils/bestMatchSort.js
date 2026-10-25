import { matchBadge } from './matchDisplay.js';

// "Best match" sort, shared by the website Shop and the app Shop: highest
// match % first (the same % the cards show), ties keep their incoming order
// or fall to an optional tie break. A missing score counts as 0.
export function sortByBestMatch(list, scoreOf, tieBreak = null) {
    const scores = new Map(list.map((item) => [item.id, Number(scoreOf(item)) || 0]));
    return list
        .map((item, index) => ({ item, index }))
        .sort((a, b) => (scores.get(b.item.id) - scores.get(a.item.id))
            || (tieBreak ? tieBreak(a.item, b.item) : 0)
            || (a.index - b.index))
        .map(({ item }) => item);
}

// Best match only sorts when there is a profile to match against. Without
// one it keeps the Featured order and the Shop shows the quiz note instead.
export function bestMatchNeedsQuiz(sortBy, hasProfile) {
    return sortBy === 'best' && !hasProfile;
}

// The percent a card shows for this product (v2 engine details, see
// getProductMatchDetailsForProduct), or 0 when the card shows none (under
// 50, excluded, no profile). Best match sorts by exactly this number on the
// website Shop and the app Shop, so the order never contradicts the cards.
export function shownMatchPercent(details) {
    const badge = matchBadge(details);
    return badge && !badge.partial ? badge.percent : 0;
}
