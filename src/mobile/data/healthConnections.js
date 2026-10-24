/**
 * Health data sources shown on the "Health data" screen (You -> Health data).
 *
 * `availability` is the honest state of each integration, decided from the
 * provider's current official developer docs (see the matrix in
 * docs/wearables-ehr-integration.md). Nothing is shown as connectable unless
 * a real connection path exists in this build.
 *
 *   'device'      - read on the phone (HealthKit / Health Connect). Native app only.
 *   'oauth'       - the provider's official OAuth API, through our server.
 *   'upload'      - the person uploads an export; we read it on her device.
 *   'needs_approval' - an official API exists but ayna must be approved first.
 *   'import_only' - no third-party API; bring data in by export or a phone health app.
 *   'request'     - "Request another app or wearable".
 *   'records'     - Apple Health Records, read and kept on the iPhone. iOS app only.
 *   'blocked'     - an API exists but its terms don't fit ayna; explained, not connectable.
 *
 * `categories` are the consent categories (src/health/metrics.js CATEGORIES).
 * Every toggle starts OFF.
 */
export const SOURCE_GROUPS = [
  { id: 'devices', title: 'Apps and wearables', tone: 'butter' },
  { id: 'bring', title: 'Bring your data in', tone: 'pink' },
  { id: 'records', title: 'Health records', tone: 'peri' },
];

export const HEALTH_SOURCES = [
  {
    id: 'apple_health',
    group: 'devices',
    name: 'Apple Health',
    kind: 'On your iPhone',
    availability: 'device',
    platform: 'ios',
    icon: 'heart',
    categories: ['sleep', 'cycle', 'temperature', 'heart', 'activity'],
    reads: 'Daily totals for what you turn on: sleep and sleep stages, period days, basal and overnight temperature, resting heart rate, heart rate variability, average heart rate, steps, active energy and workouts.',
    never: "We don't read your location, medications, clinical records or anything you leave off. We never write to Apple Health.",
    note: 'Apple Watch, Oura and other apps that share with Apple Health come through here. Flo does not send period logs to Apple Health, so use Import from Flo for those.',
  },
  {
    id: 'oura',
    group: 'devices',
    name: 'Oura',
    kind: 'Ring',
    availability: 'oauth',
    icon: 'ring',
    categories: ['sleep', 'temperature', 'heart', 'activity', 'recovery'],
    reads: 'Daily summaries: sleep and sleep stages, temperature change from your normal, resting heart rate and HRV during sleep, readiness, steps, active calories and workouts.',
    never: "We don't read your email, profile, tags or minute-by-minute heart rate. Oura data is never given to an AI model.",
    note: 'Oura data shows in your insights. It does not change your product matches until Oura confirms its terms allow it.',
  },
  {
    id: 'whoop',
    group: 'devices',
    name: 'WHOOP',
    kind: 'Band',
    availability: 'oauth',
    icon: 'watch',
    categories: ['sleep', 'temperature', 'heart', 'activity', 'recovery'],
    reads: 'Your main sleep each night and its stages, recovery score, resting heart rate, heart rate variability, overnight skin temperature and workouts.',
    never: "We don't read your profile, body measurements, strain or minute-by-minute heart rate. WHOOP data is never given to an AI model.",
    note: "WHOOP's terms don't allow apps to keep copies of WHOOP data, so ayna reads it fresh from WHOOP each time you open the app and never saves it.",
  },
  {
    id: 'health_connect',
    group: 'devices',
    name: 'Health Connect',
    kind: 'On your Android phone',
    availability: 'device',
    platform: 'android',
    icon: 'phone',
    categories: ['sleep', 'cycle', 'temperature', 'heart', 'activity'],
    reads: 'Daily totals for what you turn on: sleep, period days, basal body temperature, resting heart rate, heart rate variability, average heart rate, steps, active calories and workouts.',
    never: "We don't read your location, nutrition, medical records or anything you leave off. We never write to Health Connect.",
    note: 'Samsung Health, Fitbit and other Android apps that share with Health Connect come through here.',
  },
  {
    id: 'strava',
    group: 'devices',
    name: 'Strava',
    kind: 'Running and training',
    availability: 'blocked',
    icon: 'run',
    categories: ['activity'],
    pending: "Strava's developer terms don't let apps like ayna keep your workouts or use them alongside your other health data, so ayna doesn't connect to Strava directly. If you sync Strava to Apple Health or Health Connect, your workouts come through there.",
  },
  {
    id: 'garmin',
    group: 'devices',
    name: 'Garmin',
    kind: 'Watch',
    availability: 'needs_approval',
    icon: 'watch',
    categories: ['sleep', 'cycle', 'heart', 'activity', 'recovery'],
    reads: 'Planned: sleep, stress, steps, resting heart rate, Body Battery, workouts and cycle data from the Garmin Connect app.',
    never: "We'll never read your location or routes.",
    pending: "Garmin has to approve ayna for its developer program, and Garmin has paused new applications for now. Until then, some Garmin data can still reach ayna if you sync Garmin Connect to Apple Health or Health Connect.",
  },
  {
    id: 'upload',
    group: 'bring',
    name: 'Upload health data',
    kind: 'A file or a screenshot',
    availability: 'upload',
    icon: 'upload',
    categories: ['sleep', 'cycle', 'temperature', 'heart', 'activity', 'recovery'],
    reads: 'Only the numbers you check and confirm.',
    never: "We read the file on your device and don't keep it.",
  },
  {
    id: 'flo',
    group: 'bring',
    name: 'Import from Flo',
    kind: 'Cycle app',
    availability: 'import_only',
    icon: 'cycle',
    categories: ['cycle'],
    reads: 'Your period dates from a Flo data export.',
    never: "Flo doesn't offer apps like ayna a direct connection, so ayna never signs in to Flo.",
  },
  {
    id: 'request',
    group: 'bring',
    name: 'Request another app or wearable',
    kind: 'Fitbit, Natural Cycles, Clue…',
    availability: 'request',
    icon: 'plus',
    categories: [],
  },
  {
    id: 'records',
    group: 'records',
    name: 'Apple Health Records',
    kind: 'Allergies, conditions and medicines',
    availability: 'records',
    platform: 'ios',
    icon: 'clinic',
    categories: [],
    reads: 'Only what you pick: allergies, conditions and medicines from the health records your hospitals and clinics share with the Health app on your iPhone.',
    never: "We don't read lab results, vitals, procedures, immunizations, clinical notes or insurance. Your records stay on your iPhone: they aren't sent to ayna's servers, to an AI model, to brands or to partners.",
    note: 'Used for safety and context in your matches: a warning if a product has something you are allergic to, or may not mix with a medicine. A condition never adds a goal you did not choose.',
  },
];

/**
 * The four kinds of data a source can provide, in the words the connection
 * screen uses (team direction 42). Each maps to the consent categories in
 * src/health/metrics.js, which stay the per-category switches.
 */
export const PROVIDE_GROUPS = [
  { id: 'sleep', label: 'Sleep', cats: ['sleep'] },
  { id: 'cycle', label: 'Cycle and temperature', cats: ['cycle', 'temperature'] },
  { id: 'activity', label: 'Activity', cats: ['activity'] },
  { id: 'heart', label: 'Heart rate and recovery', cats: ['heart', 'recovery'] },
];

/** Which of the four groups this source can provide, in screen order. */
export function providesFor(source) {
  const cats = new Set(source?.categories || []);
  return PROVIDE_GROUPS.filter((g) => g.cats.some((c) => cats.has(c)));
}

/** "Sleep, activity and heart rate and recovery" style list, or ''. */
export function providesLine(source) {
  const labels = providesFor(source).map((g) => g.label);
  if (labels.length <= 1) return labels[0] || '';
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1).charAt(0).toLowerCase()}${labels.at(-1).slice(1)}`;
}

/**
 * What happens when she taps Connect, step by step (team direction 43).
 * Plain facts about each platform's own flow, no health claims.
 */
export function connectSteps(source) {
  if (!source) return [];
  if (source.availability === 'device' && source.platform === 'ios') {
    return [
      'Tap Connect. Your iPhone shows the Health access sheet.',
      'Turn on the items you want ayna to read, then tap Allow.',
      'ayna reads up to your last 90 days and shows when it last synced.',
    ];
  }
  if (source.availability === 'device') {
    return [
      'Tap Connect. Health Connect asks which data ayna can read.',
      'Allow the items you want, then come back to ayna.',
      'ayna reads up to your last 90 days and shows when it last synced.',
    ];
  }
  if (source.availability === 'oauth') {
    return [
      `Tap Connect. You go to ${source.name} to sign in and approve ayna.`,
      'You come back here automatically.',
      'ayna reads your recent days and shows when it last synced.',
    ];
  }
  return [];
}

export const sourceById = (id) => HEALTH_SOURCES.find((s) => s.id === id) || null;

/** API source id for a screen source (the upload and Flo screens both save as 'manual_import'). */
export const apiSourceFor = (id) => (id === 'upload' || id === 'flo' ? 'manual_import' : id);

export const SOURCE_NAMES = {
  apple_health: 'Apple Health', health_connect: 'Health Connect', oura: 'Oura', whoop: 'WHOOP', strava: 'Strava', garmin: 'Garmin', manual_import: 'your uploads',
};

/** Whether this source can be connected from where the person is right now. */
export function availabilityFor(source, { isNative = false, nativePlatform = 'web' } = {}) {
  if (!source) return { ok: false, reason: 'unknown' };
  if (source.availability === 'oauth' || source.availability === 'upload' || source.availability === 'import_only' || source.availability === 'request') return { ok: true };
  if (source.availability === 'device' || source.availability === 'records') {
    const phone = source.platform === 'ios' ? 'iPhone' : 'Android phone';
    if (!isNative) return { ok: false, reason: `Open the ayna app on your ${phone} to connect ${source.name}. It can't be connected from a browser.` };
    if (source.platform !== nativePlatform) return { ok: false, reason: `${source.name} is only on ${source.platform === 'ios' ? 'iPhone' : 'Android'}.` };
    return { ok: true };
  }
  return { ok: false, reason: source.pending || 'Not available yet.' };
}

/** "Last synced Oct 24, 9:14 AM", for the connected view. */
export function lastSyncedLine(iso) {
  if (!iso) return 'Not synced yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not synced yet';
  return `Last synced ${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

export function formatSynced(iso, now = Date.now()) {
  if (!iso) return 'Not synced yet';
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Synced just now';
  if (mins < 60) return `Synced ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.round(hours / 24)}d ago`;
}

export function statusLine(connection, now = Date.now()) {
  if (!connection || connection.status === 'disconnected') return null;
  if (connection.status === 'paused') return { text: 'Paused', tone: 'warn' };
  if (connection.status === 'needs_reauth') return { text: 'Reconnect needed', tone: 'alert' };
  if (connection.status === 'error') return { text: "Couldn't sync", tone: 'alert' };
  return { text: formatSynced(connection.last_synced_at, now), tone: 'on' };
}
