/** Short enough to stay on screen as the quiz's one helper line; anything longer goes behind "Why we ask". */
export const isShortHelper = (text) => typeof text === 'string' && text.length <= 64;
