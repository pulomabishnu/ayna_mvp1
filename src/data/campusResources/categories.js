// Display order and labels for resource categories. Presentation components
// read this; verified data files only reference the `id`.
export const CATEGORIES = [
  { id: 'confidential', label: 'Confidential support', blurb: 'Talk through options without it being reported to the university.' },
  { id: 'medical', label: 'Medical care', blurb: 'Care after an assault, including evidence collection.' },
  { id: 'mental-health', label: 'Mental health support', blurb: 'Counseling and support groups.' },
  { id: 'reporting', label: 'Reporting options', blurb: 'Ways to report to the university or to law enforcement.' },
  { id: 'title-ix', label: 'Title IX', blurb: 'The university office that handles reports and supportive measures.' },
  { id: 'safety', label: 'Campus safety / emergency help', blurb: 'For immediate danger or to report a crime.' },
  { id: 'local', label: 'Local / community resources', blurb: 'Independent of the university.' },
  { id: 'national', label: 'National resources', blurb: 'Available to anyone, anywhere.' },
];
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
