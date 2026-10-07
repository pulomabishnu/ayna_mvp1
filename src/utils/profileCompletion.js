/**
 * "your profile is N% complete" — a checklist of the steps that actually make
 * ayna better for you. Pure function so it's testable; the component gathers
 * the inputs. Weights sum to 100. Partial credit only for the ecosystem
 * (n of 3 products) so the ring moves as people add things.
 */
export const COMPLETION_STEPS = [
  { key: 'account', weight: 10, label: 'Create your account', hint: 'save everything across devices' },
  { key: 'quiz', weight: 30, label: 'Take the health quiz', hint: 'unlocks your % match on every product' },
  { key: 'ecosystem', weight: 20, label: 'Add 3 products you use', hint: 'better matches + recall alerts' },
  { key: 'community', weight: 15, label: 'Set up your community profile', hint: 'photo, bio or interests' },
  { key: 'phone', weight: 10, label: 'Verify your phone', hint: 'text ayna questions + recall texts' },
  { key: 'contribute', weight: 15, label: 'Share a review or post', hint: 'help someone like you' },
];

export function computeProfileCompletion({
  signedIn = false,
  quizDone = false,
  ecosystemCount = 0,
  communityProfile = null,
  phoneVerified = false,
  contributions = 0,
} = {}) {
  const ecoProgress = Math.max(0, Math.min(1, (Number(ecosystemCount) || 0) / 3));
  const communityDone = Boolean(
    communityProfile
    && (communityProfile.avatar_url || (communityProfile.bio && communityProfile.bio.trim()) || (communityProfile.public_interests || []).length),
  );
  const progress = {
    account: signedIn ? 1 : 0,
    quiz: quizDone ? 1 : 0,
    ecosystem: ecoProgress,
    community: communityDone ? 1 : communityProfile ? 0.4 : 0,
    phone: phoneVerified ? 1 : 0,
    contribute: contributions > 0 ? 1 : 0,
  };
  const steps = COMPLETION_STEPS.map((s) => {
    const p = progress[s.key];
    let label = s.label;
    if (s.key === 'ecosystem' && p > 0 && p < 1) {
      const left = 3 - Math.round(p * 3);
      label = `Add ${left} more product${left === 1 ? '' : 's'}`;
    }
    if (s.key === 'community' && communityProfile && !communityDone) label = 'Add a photo, bio or interests';
    return { ...s, label, progress: p, done: p >= 1 };
  });
  const percent = Math.round(steps.reduce((sum, s) => sum + s.weight * s.progress, 0));
  const next = steps.find((s) => !s.done) || null;
  return { percent, steps, next };
}
