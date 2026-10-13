import { cornell } from './schools/cornell';
import { berkeley } from './schools/berkeley';
import { brown } from './schools/brown';
import { cuboulder } from './schools/cuboulder';
import { dartmouth } from './schools/dartmouth';
import { indiana } from './schools/indiana';
import { iowa } from './schools/iowa';
import { kentucky } from './schools/kentucky';
import { michigan } from './schools/michigan';
import { osu } from './schools/osu';
import { pennstate } from './schools/pennstate';
import { stanford } from './schools/stanford';
import { ucla } from './schools/ucla';
import { utah } from './schools/utah';
import { uva } from './schools/uva';
import { yale } from './schools/yale';
import { princeton } from './schools/princeton';
import { columbia } from './schools/columbia';
import { upenn } from './schools/upenn';
import { mit } from './schools/mit';
import { duke } from './schools/duke';
import { unc } from './schools/unc';
import { nyu } from './schools/nyu';
import { georgetown } from './schools/georgetown';
import { northwestern } from './schools/northwestern';
import { uchicago } from './schools/uchicago';
import { tamu } from './schools/tamu';
import { rice } from './schools/rice';
import { tulane } from './schools/tulane';
import { vanderbilt } from './schools/vanderbilt';
import { utaustin } from './schools/utaustin';
import { uf } from './schools/uf';
import { fsu } from './schools/fsu';
import { uwmadison } from './schools/uwmadison';
import { umn } from './schools/umn';
import { msu } from './schools/msu';
import { uwseattle } from './schools/uwseattle';
import { uoregon } from './schools/uoregon';
import { asu } from './schools/asu';
import { uarizona } from './schools/uarizona';
import { umd } from './schools/umd';
import { rutgers } from './schools/rutgers';
import { umass } from './schools/umass';
import { bu } from './schools/bu';
import { emory } from './schools/emory';
import { harvard } from './schools/harvard';
import { jhu } from './schools/jhu';
import { notredame } from './schools/notredame';
import { wakeforest } from './schools/wakeforest';
import { bostoncollege } from './schools/bostoncollege';
import { usc } from './schools/usc';
import { ucsd } from './schools/ucsd';
import { ucdavis } from './schools/ucdavis';
import { ucsb } from './schools/ucsb';
import { uci } from './schools/uci';
import { uga } from './schools/uga';
import { clemson } from './schools/clemson';
import { uofsc } from './schools/uofsc';
import { auburn } from './schools/auburn';
import { alabama } from './schools/alabama';
import { purdue } from './schools/purdue';
import { uiuc } from './schools/uiuc';
import { unl } from './schools/unl';
import { isu } from './schools/isu';
import { mizzou } from './schools/mizzou';
import { utk } from './schools/utk';
import { lsu } from './schools/lsu';
import { virginiatech } from './schools/virginiatech';
import { ncstate } from './schools/ncstate';
import { pitt } from './schools/pitt';
import { syracuse } from './schools/syracuse';
import { uconn } from './schools/uconn';
import { tufts } from './schools/tufts';
import { northeastern } from './schools/northeastern';
import { umiami } from './schools/umiami';
import { baylor } from './schools/baylor';
import { ttu } from './schools/ttu';
import { smu } from './schools/smu';
import { uh } from './schools/uh';
import { ou } from './schools/ou';
import { kstate } from './schools/kstate';
import { okstate } from './schools/okstate';
import { msstate } from './schools/msstate';
import { jmu } from './schools/jmu';
import { gwu } from './schools/gwu';
import { au } from './schools/au';
import { temple } from './schools/temple';
import { bing } from './schools/bing';
import { ur } from './schools/ur';
import { ucf } from './schools/ucf';
import { uark } from './schools/uark';
import { ub } from './schools/ub';
import { uvm } from './schools/uvm';
import { usf } from './schools/usf';
import { gt } from './schools/gt';
import { wm } from './schools/wm';
import { udel } from './schools/udel';
import { unh } from './schools/unh';
import { ucin } from './schools/ucin';
import { orst } from './schools/orst';
import { wsu } from './schools/wsu';
import { csuco } from './schools/csuco';
import { ku } from './schools/ku';
import { olemiss } from './schools/olemiss';
import { howard } from './schools/howard';
import { ucsc } from './schools/ucsc';
import { sdsu } from './schools/sdsu';
import { ucr } from './schools/ucr';
import { calpoly } from './schools/calpoly';
import { unr } from './schools/unr';
import { colgate } from './schools/colgate';
import { middlebury } from './schools/middlebury';
import { williams } from './schools/williams';
import { wvu } from './schools/wvu';
import { louisville } from './schools/louisville';
import { ohiou } from './schools/ohiou';
import { miamioh } from './schools/miamioh';
import { txst } from './schools/txst';
import { utsa } from './schools/utsa';
import { unt } from './schools/unt';
import { boise } from './schools/boise';
import { kent } from './schools/kent';
import { bgsu } from './schools/bgsu';
import { wmu } from './schools/wmu';
import { usu } from './schools/usu';
import { CATEGORIES } from './categories';

// To add a school: create schools/<slug>.js with verified data (same shape as
// cornell.js) and add it here. No UI changes needed. Never add a school whose
// facts were not read from an official source on the lastVerified date.
export const SCHOOLS = [cornell, berkeley, brown, cuboulder, dartmouth, indiana, iowa, kentucky, michigan, osu, pennstate, stanford, ucla, utah, uva, yale, princeton, columbia, upenn, mit, duke, unc, nyu, georgetown, northwestern, uchicago, tamu, rice, tulane, vanderbilt, utaustin, uf, fsu, uwmadison, umn, msu, uwseattle, uoregon, asu, uarizona, umd, rutgers, umass, bu, emory, harvard, jhu, notredame, wakeforest, bostoncollege, usc, ucsd, ucdavis, ucsb, uci, uga, clemson, uofsc, auburn, alabama, purdue, uiuc, unl, isu, mizzou, utk, lsu, virginiatech, ncstate, pitt, syracuse, uconn, tufts, northeastern, umiami, baylor, ttu, smu, uh, ou, kstate, okstate, msstate, jmu, gwu, au, temple, bing, ur, ucf, uark, ub, uvm, usf, gt, wm, udel, unh, ucin, orst, wsu, csuco, ku, olemiss, howard, ucsc, sdsu, ucr, calpoly, unr, colgate, middlebury, williams, wvu, louisville, ohiou, miamioh, txst, utsa, unt, boise, kent, bgsu, wmu, usu];

export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getSchoolById(id) {
  return SCHOOLS.find((s) => s.id === id) || null;
}

export function searchSchools(query) {
  const q = normalize(query);
  if (!q) return [];
  return SCHOOLS.filter((s) => [s.name, ...(s.aliases || [])].some((n) => normalize(n).includes(q)) || (q.length >= 3 && normalize(s.city).startsWith(q)));
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
