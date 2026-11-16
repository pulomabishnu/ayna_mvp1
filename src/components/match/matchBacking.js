import { buildEvidence, claimRows } from '../pdp/evidenceModel.js';
import { clinicianOf } from '../pdp/pdpParts.js';

// Nov 16 (founder: "show the clinician opinion and the studies behind the match"): only what is already on
// file with a source: the team's named clinician, and recorded claims that link to a study or a health
// source (never the brand's own claim, a seller listing or community posts). Labels say what kind each is.
const BACKING_KINDS = ['product', 'paper', 'gov', 'expert', 'ingredient'];
const KIND_ORDER = { product: 0, paper: 1, gov: 2, expert: 3, ingredient: 4 };
export function matchBacking(product) {
  if (!product) return { clinician: null, studies: [] };
  let clinician = null;
  // Only an independent clinician: a brand's own founder or staff ("Sourced from the brand's site") is not one.
  try { const m = buildEvidence(product); clinician = m.independent && !/sourced from|own site|brand'?s? (own )?(site|materials)|founder|co-?founded/i.test(m.expert?.attribution || '') ? clinicianOf(m.expert) : null; } catch { clinician = null; }
  let rows = [];
  try { rows = claimRows(product); } catch { rows = []; }
  const seen = new Set();
  const studies = rows
    .filter((r) => r.url && BACKING_KINDS.includes(r.kind) && !r.via)
    .sort((a, z) => KIND_ORDER[a.kind] - KIND_ORDER[z.kind])
    .filter((r) => (seen.has(r.url) ? false : seen.add(r.url)))
    .slice(0, 3);
  // Nov 16 (founder: "say stuff like clinicians recommend these ingredients for this symptom"): each source as a
  // plain sentence about who says it. The words of the claim are the recorded ones, never new.
  const WHO = { product: 'A study of this product', paper: 'A published study', gov: 'Health guidance', expert: 'Medical society guidance', ingredient: 'Research on what’s in it' };
  return { clinician: clinician && (clinician.who || clinician.credential) ? clinician : null, studies: studies.map((x) => ({ ...x, who: WHO[x.kind] || x.label })) };
}

