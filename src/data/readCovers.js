/**
 * Reads whose cover is a picture the team put in (a writer's own artwork).
 * Every other read uses the drawn topic cover (src/components/v3/TopicCover.jsx),
 * on the website and in the app alike.
 */
export const TEAM_COVER_READS = new Set(['postpartum-stretch-marks', 'genitourinary-syndrome-of-menopause']);

export const hasTeamCover = (article) => Boolean(article?.image && TEAM_COVER_READS.has(article.id));

/**
 * Library covers (website shelves and the app's Library tab): reads with a
 * real photo use it; every other read gets a designed colour cover
 * (src/components/library/ReadCover.jsx). Smaller files for the shelves.
 */
export const READ_PHOTOS = {
  'heavy-bleeding': '/landing/articles-heavy-bleeding-satin.webp',
  'period-pain-when-to-seek-care': '/landing/articles-period-pain-hotwater-480.webp',
  'pcos-basics': '/landing/articles-pcos-mirror-480.webp',
  'postpartum-stretch-marks': '/articles/postpartum-stretch-marks/glitter.webp',
};

/** Read id → Library section (sets the cover colours). */
export const READ_SECTION = {
  'heavy-bleeding': 'menstrual', 'period-pain-when-to-seek-care': 'menstrual', fibroids: 'menstrual', 'iron-deficiency-anemia': 'menstrual',
  'pcos-basics': 'hormonal', 'menopause-basics': 'hormonal', pmdd: 'hormonal', 'hormonal-birth-control': 'hormonal',
  'endometriosis-basics': 'pelvic', 'pelvic-floor-dysfunction': 'pelvic', 'ovarian-cysts': 'pelvic',
  'intimate-wash': 'vaginal', 'uti-prevention': 'vaginal', 'yeast-infection-basics': 'vaginal', 'bacterial-vaginosis': 'vaginal',
  'postpartum-stretch-marks': 'postpartum',
};

export function readPhoto(id) { return READ_PHOTOS[id] || null; }

/** Named writer and clinician reviewer, for reads that have them. */
export const READ_CREDITS = {
  'postpartum-stretch-marks': { by: 'Geena Yousry, MS1', reviewedBy: 'Dr. Anuja Vyas, Board-Certified OBGYN' },
  'genitourinary-syndrome-of-menopause': { by: 'Shruti Gajjar, MS1', reviewedBy: 'Dr. Anuja Vyas, Board-Certified OBGYN' },
};

/**
 * The one cover picture for a read, everywhere it shows (shelf, card, read
 * page): the Library photo, else the writer's own artwork, else none (the
 * read then gets a plain colour block with its title, ReadCover.jsx).
 */
export function coverPhotoFor(article) {
  if (!article) return null;
  return READ_PHOTOS[article.id] || (hasTeamCover(article) ? article.image : null);
}
