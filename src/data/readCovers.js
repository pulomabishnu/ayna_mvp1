/**
 * Reads whose cover is a picture the team put in (a writer's own artwork).
 * Every other read uses the drawn topic cover (src/components/v3/TopicCover.jsx),
 * on the website and in the app alike.
 */
export const TEAM_COVER_READS = new Set(['postpartum-stretch-marks', 'genitourinary-syndrome-of-menopause']);

export const hasTeamCover = (article) => Boolean(article?.image && TEAM_COVER_READS.has(article.id));
