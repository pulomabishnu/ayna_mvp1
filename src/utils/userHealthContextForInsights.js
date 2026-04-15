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
  let safetyConcern = false;
  if (quizResults && typeof quizResults === 'object') {
    const {
      frustrations,
      preference,
      sensitivities,
      productsToAvoid,
      currentProductBrands,
      currentMedications,
      currentSupplements,
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
      if (frustrations.includes('Not sure if products are safe')) safetyConcern = true;
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
    const customListed = [
      ...(Array.isArray(currentProductBrands) ? currentProductBrands : []),
      ...(Array.isArray(currentMedications) ? currentMedications : []),
      ...(Array.isArray(currentSupplements) ? currentSupplements : []),
    ].filter(Boolean);
    if (customListed.length) {
      lines.push(
        `User-listed products/meds/supplements: ${customListed
          .slice(0, 24)
          .map((t) => truncateItem(t, 80))
          .join('; ')}`
      );
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
    if (hp.wearableSummary?.text?.trim()) {
      lines.push(`Wearable / activity summary: ${truncateItem(hp.wearableSummary.text, 600)}`);
    }
  }

  const tags = inferTagsFromHealthProfile(hp || healthProfile);
  if (tags.length) {
    lines.push(`Inferred topic tags: ${tags.join(', ')}`);
  }

  const intake = quizResults?.fullHealthIntake || {};
  const primaryConcerns = Array.isArray(quizResults?.primaryConcerns) ? quizResults.primaryConcerns : [];
  const customConcerns = Array.isArray(intake?.customConcerns) ? intake.customConcerns : [];
  const concernBlob = [...primaryConcerns, ...customConcerns].join(' ').toLowerCase();
  if (/safe|safety|ingredients|materials|toxins|chemical/.test(concernBlob)) {
    safetyConcern = true;
  }
  if (safetyConcern) {
    lines.push(
      'Safety priority: User wants product-safety-focused guidance. Prioritize ingredient/material transparency, recall status, evidence quality, and plain-language risk flags over convenience or brand popularity.'
    );
  }

  const text = lines.join('\n').trim();
  if (!text) return '';
  return text.slice(0, MAX_TOTAL);
}
