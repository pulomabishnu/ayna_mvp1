/**
 * The Library's topics: every read lives in exactly one section. One source
 * for the website (shelves, contents, read headers, "Next in …") and the app
 * (topic chips and shelves), so every count matches everywhere.
 */
// A to Z: sections by name, reads in each section by title (Eliz, 2026-10-21), same on web and app.
export const READ_SECTIONS = [
  { id: 'chronic', label: 'Chronic and pelvic conditions', articleIds: ['endometriosis-basics', 'ovarian-cysts', 'pelvic-floor-dysfunction'] },
  { id: 'hormonal', label: 'Hormonal health', articleIds: ['hormonal-birth-control', 'menopause-basics', 'pmdd', 'pcos-basics'] },
  { id: 'menstrual', label: 'Menstrual health', articleIds: ['heavy-bleeding', 'iron-deficiency-anemia', 'period-pain-when-to-seek-care', 'fibroids'] },
  { id: 'postpartum', label: 'Pregnancy and postpartum', articleIds: ['postpartum-stretch-marks'] },
  { id: 'vaginal-urinary', label: 'Vaginal and urinary health', articleIds: ['bacterial-vaginosis', 'intimate-wash', 'uti-prevention', 'genitourinary-syndrome-of-menopause', 'yeast-infection-basics'] },
];

/**
 * Where a read sits in its topic, for "Previous / Next" under a read (Library nav pass, Oct 27).
 * Reads in a topic are ordered by title, the same A to Z order the shelves use.
 * @returns {{ id: string, label: string, pos: number, total: number, prev: object|null, next: object|null } | null}
 */
export function topicNeighbors(id, articles = []) {
  const sec = READ_SECTIONS.find((s) => s.articleIds.includes(id));
  if (!sec) return null;
  const byId = new Map(articles.map((a) => [a.id, a]));
  const list = sec.articleIds.map((x) => byId.get(x)).filter(Boolean).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  const i = list.findIndex((a) => a.id === id);
  if (i < 0) return null;
  return { id: sec.id, label: sec.label, pos: i + 1, total: list.length, prev: list[i - 1] || null, next: list[i + 1] || null };
}
