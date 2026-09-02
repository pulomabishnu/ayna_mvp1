// Mirrors ARTICLE_CATEGORIES in src/components/Articles.jsx verbatim (not
// exported there) — the real grouping of article ids into named sections,
// already used by the website's own Articles library page. Keep in sync if
// the real groupings change.
export const ARTICLE_CATEGORIES = [
  {
    id: 'menstrual',
    label: 'Menstrual Health',
    articleIds: ['heavy-bleeding', 'period-pain-when-to-seek-care', 'fibroids', 'iron-deficiency-anemia'],
  },
  {
    id: 'hormonal',
    label: 'Hormonal Health',
    articleIds: ['pcos-basics', 'menopause-basics', 'pmdd', 'hormonal-birth-control'],
  },
  {
    id: 'chronic',
    label: 'Chronic Conditions',
    articleIds: ['pcos-basics', 'endometriosis-basics', 'pelvic-floor-dysfunction', 'fibroids', 'pmdd', 'iron-deficiency-anemia', 'ovarian-cysts'],
  },
  {
    id: 'vaginal-urinary',
    label: 'Vaginal & Urinary Health',
    articleIds: ['intimate-wash', 'uti-prevention', 'yeast-infection-basics', 'bacterial-vaginosis'],
  },
  {
    id: 'pelvic',
    label: 'Pelvic Health',
    articleIds: ['pelvic-floor-dysfunction', 'endometriosis-basics', 'ovarian-cysts'],
  },
];
