export const OUTCOME_LABELS = { helping: 'Helping', same: 'No change yet', worse: 'Making it harder' };

/** Keep the latest twelve dated self-reports for a product, one per day. */
export function recordRoutineOutcome(outcomes = {}, productId, rating, at = new Date()) {
  if (!productId || !Object.hasOwn(OUTCOME_LABELS, rating)) return outcomes;
  const day = at instanceof Date
    ? `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`
    : String(at).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return outcomes;
  const old = Array.isArray(outcomes[productId]) ? outcomes[productId] : [];
  return { ...outcomes, [productId]: [...old.filter((entry) => entry?.day !== day), { day, rating }].slice(-12) };
}
