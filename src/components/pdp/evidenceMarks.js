/**
 * The four evidence levels and their marks, with no data imports, so light
 * surfaces (Ask ayna answers) can draw the same marks as the product page.
 * evidenceLevels.js re-exports these; the sorting of links lives there.
 */
export const PEER_LABEL = 'Peer-reviewed · not graded by ayna';

export const LEVELS = [
  { id: 'gov', n: 1, mark: 'filled', grades: true },
  { id: 'peer', n: 2, mark: 'half', grades: false },
  { id: 'brand', n: 3, mark: 'outline', grades: false },
  { id: 'people', n: 4, mark: 'dotted', grades: false },
];

/** The label for a level ("From Saalt" for the brand). */
export function levelLabel(id, brand = '') {
  if (id === 'gov') return 'Checked against .gov';
  if (id === 'peer') return PEER_LABEL;
  if (id === 'brand') return `From ${String(brand || '').trim() || 'the brand'}`;
  if (id === 'people') return 'People’s experiences';
  return '';
}

