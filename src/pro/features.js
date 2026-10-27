// Product contract: capabilities in development are never presented as ready.
// The founder's official Free vs Pro breakdown (Oct 27, 17:00; Ask per month from 17:02).
// The server enforces Ask per calendar month: 5 free, 50 Pro (api/_proFeatures.js).
export const PRO_FEATURES = [
  { id: 'wearables', label: 'Wearable + health app connections', description: 'Connect Apple Health, Health Connect, Oura, or upload your health data or screenshots, so ayna can understand cycle signals, sleep, activity, temperature, HRV/stress and other relevant trends. More wearables over time.', stage: 'available' },
  { id: 'health', label: 'Health-data personalization', description: 'Can use connected health and app signals to improve personalization.', stage: 'available' },
  { id: 'insights', label: 'Deeper personalized insights', description: 'More context around patterns, symptoms, goals, preferences, life stage and connected health signals.', stage: 'available' },
  { id: 'tracking', label: 'Advanced tracking', description: 'More detailed tracking over time, with trend insights, so you can understand changes and patterns instead of single data points.', stage: 'available' },
  { id: 'quiz', label: 'Unlimited personalization', description: 'Update your profile and retake the personalization quiz whenever your needs change. Free accounts can retake it once per month.', stage: 'available' },
  { id: 'ask', label: 'More Ask ayna', description: 'Up to 50 Ask ayna chats a month. Free accounts get 5 chats a month.', stage: 'available' },
  { id: 'reads', label: 'More ayna Reads', description: 'Unlimited Reads. Free accounts get 1 Read per week.', stage: 'available' },
  { id: 'playlists', label: 'More playlists', description: 'Unlimited playlists. Free accounts can create 1 playlist.', stage: 'available' },
];

// What stays free (founder, Oct 27): ayna itself is never useless without Pro.
export const FREE_FEATURES = [
  'Complete your personalization profile',
  'Receive personalized product and resource recommendations',
  'Browse the marketplace',
  'See your health match and recommendation results',
  'Use basic Ask ayna',
  'Access limited Reads',
  'Create one playlist',
  'Update your quiz monthly',
];

export const PRO_TAGLINE = 'Free helps you find what fits. Pro learns with you.';
