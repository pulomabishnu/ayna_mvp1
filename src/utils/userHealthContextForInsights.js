import { inferTagsFromHealthProfile, normalizeProfile } from './healthDataProfile';

const MAX_TOTAL = 4000;

function stripEmails(s) {
  return String(s).replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[redacted]');
}

function truncateItem(s, max) {
  return stripEmails(String(s).trim().slice(0, max));
}

/**
 * Compact, privacy-conscious text for product-insights API and client keys.
 * Omits quiz email and other obvious PII patterns in free text.
 */
export function buildUserHealthContextString(quizResults, healthProfile) {
  const lines = [];
  if (quizResults && typeof quizResults === 'object') {
    const {
      frustrations,
      preference,
      sensitivities,
      productsToAvoid,
      currentProductsDetail,
      contraceptionUse,
      contraceptionPreference,
    } = quizResults;
    if (Array.isArray(frustrations) && frustrations.length) {
      lines.push(
        `Frustrations / focus: ${frustrations
          .slice(0, 14)
          .map((t) => truncateItem(t, 80))
          .join('; ')}`
      );
    }
    const prefs = Array.isArray(preference) ? preference : preference ? [preference] : [];
    if (prefs.length) {
      lines.push(`Product preferences: ${prefs.map((p) => truncateItem(p, 80)).join('; ')}`);
    }
    if (Array.isArray(sensitivities) && sensitivities.length) {
      const sens = sensitivities.filter((s) => s && s !== 'None that I know of');
      if (sens.length) lines.push(`Sensitivities: ${sens.map((t) => truncateItem(t, 60)).join('; ')}`);
    }
    if (Array.isArray(productsToAvoid) && productsToAvoid.length) {
      lines.push(
        `Prefers to avoid: ${productsToAvoid
          .slice(0, 12)
          .map((t) => truncateItem(t, 60))
          .join('; ')}`
      );
    }
    if (currentProductsDetail && String(currentProductsDetail).trim()) {
      lines.push(`Current products (user-supplied): ${truncateItem(currentProductsDetail, 400)}`);
    }
    if (contraceptionUse && contraceptionUse !== 'Prefer not to say') {
      lines.push(`Contraception: ${truncateItem(contraceptionUse, 40)}`);
    }
    if (Array.isArray(contraceptionPreference) && contraceptionPreference.length) {
      lines.push(
        `Contraception types: ${contraceptionPreference
          .slice(0, 8)
          .map((t) => truncateItem(t, 60))
          .join('; ')}`
      );
    }
  }

  const hp = healthProfile ? normalizeProfile(healthProfile) : null;
  if (hp) {
    if (hp.conditions.length) {
      lines.push(
        `Conditions (imported or manual): ${hp.conditions
          .slice(0, 14)
          .map((c) => truncateItem(c, 80))
          .join('; ')}`
      );
    }
    if (hp.medications.length) {
      lines.push(
        `Medications (imported or manual): ${hp.medications
          .slice(0, 14)
          .map((m) => truncateItem(m, 80))
          .join('; ')}`
      );
    }
    if (hp.allergies.length) {
      lines.push(
        `Allergies (imported or manual): ${hp.allergies
          .slice(0, 14)
          .map((a) => truncateItem(a, 80))
          .join('; ')}`
      );
    }
    if (hp.notes?.trim()) {
      lines.push(`Notes: ${truncateItem(hp.notes, 500)}`);
    }
  }

  const tags = inferTagsFromHealthProfile(hp || healthProfile);
  if (tags.length) {
    lines.push(`Inferred topic tags: ${tags.join(', ')}`);
  }

  const text = lines.join('\n').trim();
  if (!text) return '';
  return text.slice(0, MAX_TOTAL);
}
