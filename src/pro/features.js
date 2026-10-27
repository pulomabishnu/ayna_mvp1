// Product contract: capabilities in development are never presented as ready.
// The founder's official Free vs Pro breakdown (Oct 27, 17:00). Ask limits are enforced per
// day on the server (5 and 50); the copy says "a day" to match.
export const PRO_FEATURES = [
  { id: 'wearables', label: 'Wearable + health app connections', description: 'Connect Apple Health or Android Health Connect in the ayna app, plus Oura and WHOOP, so ayna can understand cycle signals, sleep, activity, temperature, HRV/stress and other relevant trends. More wearables over time.', stage: 'available' },
  { id: 'health', label: 'Health-data personalization', description: 'Can use connected health and app signals to improve personalization.', stage: 'available' },
  { id: 'insights', label: 'Deeper personalized insights', description: 'More context around patterns, symptoms, goals, preferences, life stage and connected health signals.', stage: 'available' },
  { id: 'tracking', label: 'Advanced tracking', description: 'More detailed tracking over time, with trend insights, so you can understand changes and patterns instead of single data points.', stage: 'available' },
  { id: 'why', label: 'Recommendation explanations', description: 'Deeper context around why products, resources or insights are relevant.', stage: 'evolving' },
  { id: 'quiz', label: 'Unlimited personalization', description: 'Update your profile and retake the personalization quiz whenever your needs change. Free accounts can retake it once per month.', stage: 'available' },
  { id: 'ask', label: 'More Ask ayna', description: 'Up to 50 Ask ayna chats a day. Free accounts get 5 chats a day.', stage: 'available' },
  { id: 'reads', label: 'More ayna Reads', description: 'Expanded, unlimited access to Reads. Free accounts get 1 Read per week.', stage: 'available' },
  { id: 'playlists', label: 'More playlists', description: 'Expanded, unlimited playlist creation. Free accounts can create 1 playlist.', stage: 'available' },
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
