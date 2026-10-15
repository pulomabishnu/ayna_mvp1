import React from 'react';

/* Topic covers for Library reads: a word and a small spot drawing in brand
   colours. Shared by the Library and the landing page's reads block. */
const COVERS = {
  'intimate-wash': ['Intimate care', 'peri', 'bottle'],
  'heavy-bleeding': ['Heavy flow', 'pink', 'drops'],
  'menopause-basics': ['Menopause', 'ink', 'fan'],
  'uti-prevention': ['UTI', 'peri', 'glass'],
  'yeast-infection-basics': ['Yeast', 'ink', 'dots'],
  'period-pain-when-to-seek-care': ['Period pain', 'pink', 'bolt'],
  'pcos-basics': ['PCOS', 'peri', 'ovary'],
  'pelvic-floor-dysfunction': ['Pelvic floor', 'ink', 'bowl'],
  'endometriosis-basics': ['Endo', 'pink', 'bloom'],
  'bacterial-vaginosis': ['BV', 'peri', 'bubbles'],
  pmdd: ['PMDD', 'ink', 'cloud'],
  fibroids: ['Fibroids', 'peri', 'knots'],
  'iron-deficiency-anemia': ['Low iron', 'pink', 'leaf'],
  'ovarian-cysts': ['Cysts', 'pink', 'bubbles'],
  'hormonal-birth-control': ['Birth control', 'peri', 'pills'],
};

/* Small spot drawings for each topic, one stroke weight, drawn in the
   tile's ink colour. They teach the topic at a glance. */
const SPOTS = {
  drops: <><path d="M20 6c-6 9-9 14-9 19a9 9 0 0 0 18 0c0-5-3-10-9-19Z" /><path d="M38 22c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8Z" /></>,
  bolt: <><path d="M27 4 12 26h11l-4 18 17-24H25l2-16Z" /></>,
  fan: <><circle cx="24" cy="24" r="7" /><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4" /></>,
  glass: <><path d="M14 8h20l-3 32H17L14 8Z" /><path d="M15 18h18" /><path d="M21 26v6M18 29h6" /></>,
  dots: <><circle cx="16" cy="16" r="5" /><circle cx="31" cy="20" r="6" /><circle cx="19" cy="33" r="7" /><circle cx="35" cy="35" r="3" /></>,
  ovary: <><circle cx="24" cy="26" r="11" /><circle cx="20" cy="23" r="2.5" /><circle cx="28" cy="24" r="2" /><circle cx="24" cy="31" r="2.5" /><path d="M13 22C8 18 6 12 9 8M35 22c5-4 7-10 4-14" /></>,
  bowl: <><path d="M6 18c0 12 8 22 18 22s18-10 18-22" /><path d="M6 18h36" /><path d="M16 28h16" /></>,
  bloom: <><circle cx="24" cy="24" r="4" /><path d="M24 20c-4-8 4-14 0-16 -4 2 4 8 0 16ZM28 24c8-4 14 4 16 0-2-4-8 4-16 0ZM24 28c4 8-4 14 0 16 4-2-4-8 0-16ZM20 24c-8 4-14-4-16 0 2 4 8-4 16 0Z" /></>,
  bubbles: <><circle cx="18" cy="28" r="9" /><circle cx="33" cy="16" r="6" /><circle cx="35" cy="34" r="4" /></>,
  cloud: <><path d="M14 32h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z" /><path d="M18 38l-2 5M26 38l-2 5M34 38l-2 5" /></>,
  knots: <><circle cx="24" cy="24" r="14" /><circle cx="19" cy="20" r="4" /><circle cx="29" cy="28" r="5" /></>,
  leaf: <><path d="M10 38C10 18 22 8 40 8c0 18-10 30-30 30Z" /><path d="M10 38 30 18" /></>,
  bottle: <><rect x="15" y="16" width="18" height="26" rx="4" /><path d="M20 16V9h8v7M18 9h12" /><path d="M19 27h10" /></>,
  pills: <><rect x="8" y="10" width="32" height="28" rx="5" /><circle cx="17" cy="19" r="2.5" /><circle cx="24" cy="19" r="2.5" /><circle cx="31" cy="19" r="2.5" /><circle cx="17" cy="29" r="2.5" /><circle cx="24" cy="29" r="2.5" /><circle cx="31" cy="29" r="2.5" /></>,
};


export default function TopicCover({ id, title = '', className = '' }) {
  const [word, tone, spot] = COVERS[id] || [title, 'peri', null];
  return (
    <span className={`ay-lib-cover is-${tone}${spot ? ' has-spot' : ''} ${className}`.trim()} aria-hidden="true">
      {spot && SPOTS[spot] && <svg className="ay-lib-cover__spot" viewBox="0 0 48 48">{SPOTS[spot]}</svg>}
      <strong>{word}</strong>
    </span>
  );
}
