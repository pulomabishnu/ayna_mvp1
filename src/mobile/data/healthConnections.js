/**
 * Wearable and health-record sources for the "Health data" screen.
 *
 * MOCKUP: nothing here talks to a device or an API yet. The screen keeps
 * connection state in localStorage so the flow can be reviewed end to end.
 * See docs/wearables-ehr-integration.md for the build plan.
 *
 * `access`:
 *   'device' - read on the phone only (HealthKit, Health Connect). Needs the native app.
 *   'cloud'  - OAuth to the vendor's API, works from the website and the app.
 * `phase`: 1 = first build, 2 = later.
 */

export const DATA_TYPES = {
  cycle: { label: 'Cycle', detail: 'Period dates and cycle length', usedFor: 'Period and fertility matches' },
  temperature: { label: 'Temperature', detail: 'Overnight temperature changes', usedFor: 'Cycle and menopause matches' },
  sleep: { label: 'Sleep', detail: 'Hours and consistency', usedFor: 'Sleep matches' },
  hrv: { label: 'Heart rate variability', detail: 'Stress and recovery', usedFor: 'Stress matches' },
  activity: { label: 'Activity', detail: 'Steps and workouts', usedFor: 'Movement and recovery matches' },
  conditions: { label: 'Conditions', detail: 'Diagnoses on your record', usedFor: 'Fills in your health profile' },
  medications: { label: 'Medications', detail: 'Current prescriptions', usedFor: 'Safety checks on products' },
  allergies: { label: 'Allergies', detail: 'Recorded allergies', usedFor: 'Ingredient safety checks' },
  labs: { label: 'Lab results', detail: 'Hormone panels and other tests', usedFor: 'Hormone and nutrient matches' },
};

export const SOURCE_GROUPS = [
  { id: 'devices', title: 'Devices and apps', tone: 'butter' },
  { id: 'records', title: 'Health records', tone: 'pink' },
];

export const HEALTH_SOURCES = [
  {
    id: 'apple-health',
    group: 'devices',
    name: 'Apple Health',
    note: 'Apple Watch and any app that shares with Apple Health',
    access: 'device',
    platform: 'ios',
    phase: 1,
    icon: 'heart',
    dataTypes: ['cycle', 'temperature', 'sleep', 'hrv', 'activity'],
  },
  {
    id: 'health-connect',
    group: 'devices',
    name: 'Health Connect',
    note: 'Samsung, Pixel, Fitbit and other Android apps',
    access: 'device',
    platform: 'android',
    phase: 1,
    icon: 'phone',
    dataTypes: ['cycle', 'temperature', 'sleep', 'hrv', 'activity'],
  },
  {
    id: 'oura',
    group: 'devices',
    name: 'Oura',
    note: 'Ring',
    access: 'cloud',
    phase: 1,
    icon: 'ring',
    dataTypes: ['cycle', 'temperature', 'sleep', 'hrv', 'activity'],
  },
  {
    id: 'whoop',
    group: 'devices',
    name: 'Whoop',
    note: 'Band',
    access: 'cloud',
    phase: 2,
    icon: 'watch',
    dataTypes: ['sleep', 'hrv', 'activity'],
  },
  {
    id: 'garmin',
    group: 'devices',
    name: 'Garmin',
    note: 'Watch',
    access: 'cloud',
    phase: 2,
    icon: 'watch',
    dataTypes: ['cycle', 'sleep', 'hrv', 'activity'],
  },
  {
    id: 'apple-health-records',
    group: 'records',
    name: 'Apple Health Records',
    note: 'Records your providers already send to your iPhone',
    access: 'device',
    platform: 'ios',
    phase: 2,
    icon: 'record',
    dataTypes: ['conditions', 'medications', 'allergies', 'labs'],
  },
  {
    id: 'patient-portal',
    group: 'records',
    name: 'Patient portal',
    note: "Sign in to your doctor's or hospital's portal",
    access: 'cloud',
    phase: 2,
    icon: 'clinic',
    dataTypes: ['conditions', 'medications', 'allergies', 'labs'],
  },
];

export const CONNECTIONS_STORAGE_KEY = 'ayna.healthConnections.mock.v1';

export function loadConnections() {
  try {
    const raw = window.localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveConnections(connections) {
  try {
    window.localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
  } catch { /* storage unavailable, state stays in memory */ }
}

/** Whether this source can be connected from where the person is right now. */
export function availabilityFor(source, { isNative = false, nativePlatform = 'web' } = {}) {
  if (source.access === 'cloud') return { ok: true };
  if (!isNative) return { ok: false, reason: `Connect from the ayna app on your ${source.platform === 'ios' ? 'iPhone' : 'Android phone'}.` };
  if (source.platform && source.platform !== nativePlatform) {
    return { ok: false, reason: source.platform === 'ios' ? 'Only on iPhone.' : 'Only on Android.' };
  }
  return { ok: true };
}

export function formatSynced(iso, now = Date.now()) {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Synced just now';
  if (mins < 60) return `Synced ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.round(hours / 24)}d ago`;
}
