import { CATEGORY_LABELS } from '../data/products';
import { inferTagsFromHealthProfile } from './healthDataProfile';

/**
 * Short intro copy for Discovery, before the product grid.
 * @param {{ quizResults?: object|null, healthProfile?: object|null, categoryFilter?: string, searchQuery?: string }} opts
 * @returns {string}
 */
export function buildDiscoveryProfileSummary({
  quizResults = null,
  healthProfile = null,
  categoryFilter = 'all',
  searchQuery = '',
}) {
  const sentences = [];

  if (quizResults?.frustrations?.length) {
    sentences.push(
      `Based on your profile, you’ve highlighted: ${quizResults.frustrations.slice(0, 5).join(', ')}.`
    );
  }
  if (quizResults?.preference?.length) {
    const pref = Array.isArray(quizResults.preference)
      ? quizResults.preference.join(', ')
      : String(quizResults.preference);
    sentences.push(`You noted ${pref} as important.`);
  }
  if (quizResults?.sensitivities?.length) {
    sentences.push(
      `Sensitivities on file: ${quizResults.sensitivities.slice(0, 5).join(', ')}—always check labels and ask your clinician when unsure.`
    );
  }

  const tags = inferTagsFromHealthProfile(healthProfile);
  if (tags.length && !quizResults?.frustrations?.length) {
    sentences.push(`Themes from your health notes include: ${tags.slice(0, 6).join(', ')}.`);
  }

  const intake = (healthProfile?.intakeSummary || '').trim();
  if (intake && sentences.length === 0) {
    sentences.push(
      intake.length > 280 ? `${intake.slice(0, 279)}…` : intake
    );
  }

  const cat =
    categoryFilter && categoryFilter !== 'all'
      ? CATEGORY_LABELS[categoryFilter] || categoryFilter
      : null;
  const q = (searchQuery || '').trim();
  if (q) {
    sentences.push(
      `Below are options that relate to “${q}”${cat ? ` (${cat})` : ''}. Tap Details for clinician, science, and community tabs.`
    );
  } else if (cat) {
    sentences.push(`You’re browsing ${cat}. Use search to narrow further.`);
  } else if (sentences.length > 0) {
    sentences.push('Explore results below and use Details to compare evidence and community context.');
  }

  return sentences.join(' ').trim();
}
