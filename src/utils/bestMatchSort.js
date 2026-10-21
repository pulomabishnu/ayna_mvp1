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
