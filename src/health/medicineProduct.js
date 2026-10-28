/**
 * Medicines (OTC pain relievers such as ibuprofen or naproxen, and anything
 * prescription) stay information-only on Today: the decision engine may
 * explain them with their label sources, but Today's product blocks, the
 * Daily Rundown and the Today routine summary never surface one as a pick
 * (intervention rules, clinical review Oct 24). They stay in Explore and
 * in her ecosystem, where she chose them.
 */
const MEDICINE_CATEGORIES = new Set(['medication']);

export function isMedicineProduct(product) {
  if (!product) return false;
  return MEDICINE_CATEGORIES.has(String(product.category || '').toLowerCase())
    || product.prescription === true || product.requiresPrescription === true || product.rx === true;
}

export const withoutMedicines = (list = []) => (Array.isArray(list) ? list.filter((p) => !isMedicineProduct(p)) : []);
