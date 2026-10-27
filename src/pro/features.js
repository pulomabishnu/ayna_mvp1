// Product contract: capabilities in development are never presented as ready.
export const PRO_FEATURES = [
  { id: 'ask', label: 'More Ask ayna', description: 'Up to 50 Ask ayna chats per day. Free accounts get 5 per day.', stage: 'available' },
  { id: 'quiz', label: 'Update your ecosystem anytime', description: 'Retake the quiz and rebuild your ecosystem whenever you want. Free accounts can update it once a month.', stage: 'available' },
  { id: 'reads', label: 'Unlimited Reads', description: 'Open unlimited Reads. Free accounts get one Read per week.', stage: 'available' },
  { id: 'playlists', label: 'Unlimited playlist creation', description: 'Create as many playlists as you want. Free accounts can create one playlist.', stage: 'available' },
  { id: 'wearables', label: 'Connect health apps and wearables', description: 'Connect supported health sources so ayna can use the data you choose to share.', stage: 'available' },
  { id: 'history', label: 'Health trends and history', description: 'Open detailed cycle, sleep and body history where you have enough data. Your basic health summary stays free.', stage: 'available' },
  { id: 'recap', label: 'Personalized recaps', description: 'Review your recent observations where enough connected data is available.', stage: 'available' },
  { id: 'tracking', label: 'More advanced tracking', description: 'Use personal try-and-check-back tools. Basic health logging stays free.', stage: 'available' },
  { id: 'appointment', label: 'Appointment prep', description: 'Organize symptoms, observations and questions before seeing a clinician.', stage: 'available' },
  { id: 'early', label: 'Try new Pro features early', description: 'Early Access members can try new Pro additions as they become available and help shape what we build.', stage: 'available' },
  { id: 'insights', label: 'Deeper personalized insights', description: 'More context around relevance, patterns and recommendations as Pro expands.', stage: 'evolving' },
  { id: 'routines', label: 'Smarter, adaptive routines', description: 'More support for routines that respond to your needs and goals.', stage: 'evolving' },
  { id: 'wearable-insights', label: 'Deeper wearable interpretation', description: 'Broader interpretation across connected sleep, activity, stress, temperature and cycle signals as supported integrations grow.', stage: 'evolving' },
  { id: 'match', label: 'Deeper match intelligence', description: 'Richer explanations over time. Basic matches, safety flags and evidence remain free.', stage: 'evolving' },
];

export const FREE_FEATURES = [
  'Shop and product discovery',
  'Safety and evidence information',
  'Basic personalized matching',
  'Community',
  'Basic health view and routines',
  'Privacy and data controls',
  '5 Ask ayna chats per day',
  '1 Read per week',
  '1 playlist',
  '1 ecosystem update per month',
];
