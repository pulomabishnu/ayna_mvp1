/** The title for the Why view. Who reads it: the web side panel (WhyMatchPanel) and the app screen (WhyMatchScreen). */
export function whyFitTitle(details) {
  if (details.matchStatus === 'excluded' || details.eligible === false) return 'Not in your matches';
  return 'Why this fits you';
}

export const WHY_FIT_FINE = 'Not a diagnosis. Brands can’t pay for a higher match.';

