// Product contract: capabilities in development are never presented as ready.
export const PRO_FEATURES = [
  { id: 'ask', label: 'More Ask ayna', description: 'Higher daily usage with answers informed by the profile and context you choose to share.', stage: 'available' },
  { id: 'reads', label: 'Unlimited premium Reads', description: 'Open unlimited premium Reads as they are added. Free accounts get one premium Read per week; existing public articles stay free.', stage: 'available' },
  { id: 'playlists', label: 'Unlimited playlist creation', description: 'Create more playlists to organize your picks. Existing playlist contents and editing stay accessible.', stage: 'available' },
  { id: 'insights', label: 'Deeper personalized insights', description: 'More context around relevance, patterns and recommendations.', stage: 'evolving' },
  { id: 'history', label: 'Health trends and history', description: 'Open detailed cycle, sleep and body history where you have enough data. Your basic health summary stays free.', stage: 'available' },
  { id: 'recap', label: 'Personalized recaps', description: 'Review your recent observations where enough connected data is available.', stage: 'available' },
  { id: 'routines', label: 'Smarter, adaptive routines', description: 'More support for routines that respond to your needs and goals.', stage: 'evolving' },
  { id: 'tracking', label: 'More advanced tracking', description: 'Use personal try-and-check-back tools. Basic health logging stays free; broader tracking tools continue to evolve.', stage: 'available' },
  { id: 'appointment', label: 'Appointment prep', description: 'Organize symptoms, observations and questions before seeing a clinician.', stage: 'available' },
  { id: 'wearables', label: 'Deeper wearable insights', description: 'Broader interpretation of connected sleep, activity, stress and cycle data. Provider availability varies; Apple Health, Oura, Garmin, Health Connect and Strava are not all promised as ready.', stage: 'evolving' },
  { id: 'match', label: 'Deeper match intelligence', description: 'Richer explanations over time. Basic matches, safety flags and evidence remain free.', stage: 'evolving' },
  { id: 'early', label: 'Try new Pro features early', description: 'Founding members can try Pro additions as they become available and help shape what we build.', stage: 'available' },
  { id: 'perks', label: 'Member perks', description: 'Specific perks are still being defined.', stage: 'evolving' },
];
export const FREE_FEATURES = ['Shop and product discovery', 'Safety and evidence information', 'Basic personalized matching', 'Community', 'Basic health view and routines', 'Privacy and data controls', 'Limited Ask ayna, premium Reads and playlists'];
