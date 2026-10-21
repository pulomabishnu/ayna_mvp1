/**
 * The Library's topics: every read lives in exactly one section. One source
 * for the website (shelves, contents, read headers, "Next in …") and the app
 * (topic chips and shelves), so every count matches everywhere.
 */
export const READ_SECTIONS = [
  { id: 'menstrual', label: 'Menstrual health', articleIds: ['heavy-bleeding', 'period-pain-when-to-seek-care', 'fibroids', 'iron-deficiency-anemia'] },
  { id: 'hormonal', label: 'Hormonal health', articleIds: ['pcos-basics', 'menopause-basics', 'pmdd', 'hormonal-birth-control'] },
  { id: 'chronic', label: 'Chronic and pelvic conditions', articleIds: ['endometriosis-basics', 'pelvic-floor-dysfunction', 'ovarian-cysts'] },
  { id: 'vaginal-urinary', label: 'Vaginal and urinary health', articleIds: ['intimate-wash', 'uti-prevention', 'yeast-infection-basics', 'bacterial-vaginosis'] },
  { id: 'postpartum', label: 'Pregnancy and postpartum', articleIds: ['postpartum-stretch-marks'] },
];
