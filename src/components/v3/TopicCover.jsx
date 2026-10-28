import React from 'react';

/* Topic covers for Library reads: a word on a flat brand
   colour. Shared by the Library and the landing page's reads block. */
const COVERS = {
  'intimate-wash': ['Intimate care', 'peri', 'bottle'],
  'heavy-bleeding': ['Heavy flow', 'pink', 'drops'],
  'menopause-basics': ['Menopause', 'ink', 'fan'],
  'uti-prevention': ['UTI', 'peri', 'glass'],
  'yeast-infection-basics': ['Yeast', 'ink', 'dots'],
  'period-pain-when-to-seek-care': ['Period pain', 'pink', 'bolt'],
  'pcos-basics': ['PMOS', 'peri', 'ovary'],
  'pelvic-floor-dysfunction': ['Pelvic floor', 'ink', 'bowl'],
  'endometriosis-basics': ['Endo', 'pink', 'bloom'],
  'bacterial-vaginosis': ['BV', 'peri', 'bubbles'],
  pmdd: ['PMDD', 'ink', 'cloud'],
  fibroids: ['Fibroids', 'peri', 'knots'],
  'iron-deficiency-anemia': ['Low iron', 'pink', 'leaf'],
  'ovarian-cysts': ['Cysts', 'pink', 'bubbles'],
  'hormonal-birth-control': ['Birth control', 'peri', 'pills'],
  'postpartum-stretch-marks': ['Stretch marks', 'mint', null],
  'genitourinary-syndrome-of-menopause': ['GSM', 'ink', 'drops'],
};

const SECTION_TONE = {
  'heavy-bleeding': 'pink', 'period-pain-when-to-seek-care': 'pink', fibroids: 'pink', 'iron-deficiency-anemia': 'pink',
  'pcos-basics': 'peri', 'menopause-basics': 'peri', pmdd: 'peri', 'hormonal-birth-control': 'peri',
  'endometriosis-basics': 'butter', 'pelvic-floor-dysfunction': 'butter', 'ovarian-cysts': 'butter',
  'intimate-wash': 'ink', 'uti-prevention': 'ink', 'yeast-infection-basics': 'ink', 'bacterial-vaginosis': 'ink',
  'genitourinary-syndrome-of-menopause': 'ink',
  'postpartum-stretch-marks': 'mint',
};



export default function TopicCover({ id, title = '', className = '' }) {
  // No drawn spot icons (founder, Oct 27: no doodles): the word on a flat colour.
  const [word] = COVERS[id] || [title];
  // Colour means the Library section: menstrual pink, hormonal sky, chronic and pelvic butter, vaginal and urinary espresso, pregnancy and postpartum mint.
  const tone = SECTION_TONE[id] || 'peri';
  return (
    <span className={`ay-lib-cover is-${tone} ${className}`.trim()} aria-hidden="true">
      <strong>{word}</strong>
    </span>
  );
}
