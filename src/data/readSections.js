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
