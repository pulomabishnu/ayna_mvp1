import { cornell } from './schools/cornell';
import { CATEGORIES } from './categories';

// To add a school: create schools/<slug>.js with verified data (same shape as
// cornell.js) and add it here. No UI changes needed. Never add a school whose
// facts were not read from an official source on the lastVerified date.
export const SCHOOLS = [cornell];

export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getSchoolById(id) {
  return SCHOOLS.find((s) => s.id === id) || null;
}

export function searchSchools(query) {
  const q = normalize(query);
  if (!q) return [];
  return SCHOOLS.filter((s) => [s.name, ...(s.aliases || []), `${s.city} ${s.state}`].some((n) => normalize(n).includes(q) || q.includes(normalize(n))));
}

// Groups a school's resources by category in display order. A resource appears
// under its own category and any `alsoIn` categories.
export function groupResources(resources) {
  return CATEGORIES.map((cat) => ({
    ...cat,
    items: resources.filter((r) => r.category === cat.id || (r.alsoIn || []).includes(cat.id)),
  })).filter((g) => g.items.length);
}

export function formatVerified(iso) {
  const [y, m] = String(iso).split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${y}`;
}
