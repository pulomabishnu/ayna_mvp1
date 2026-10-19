/**
 * Apple Health Records on iPhone (native/capacitor-ayna-records). iOS app only;
 * everywhere else every call reports "unavailable" and nothing is faked.
 * Records are read on the phone and parsed on the phone (src/health/records.js).
 */
import { Capacitor } from '@capacitor/core';
import { AynaRecords } from 'capacitor-ayna-records';
import { RECORD_TYPES } from './records.js';

const validTypes = (types) => (Array.isArray(types) ? types.filter((t) => RECORD_TYPES[t]) : []);

/** { available, reason?: 'web'|'not_ios'|'plugin_missing'|'records_not_supported'|'not_supported' } */
export async function recordsAvailability() {
  if (!Capacitor.isNativePlatform()) return { available: false, reason: 'web' };
  if (Capacitor.getPlatform() !== 'ios') return { available: false, reason: 'not_ios' };
  if (!Capacitor.isPluginAvailable('AynaRecords')) return { available: false, reason: 'plugin_missing' };
  try {
    const out = await AynaRecords.isAvailable();
    return out?.available ? { available: true } : { available: false, reason: out?.reason === 'records_not_supported' ? 'records_not_supported' : 'not_supported' };
  } catch {
    return { available: false, reason: 'plugin_missing' };
  }
}

/** Apple's own clinical-records sheet for these types. Resolves { asked: true }; Apple never says if she allowed it. */
export async function requestRecordsAccess(types) {
  const t = validTypes(types);
  if (!t.length) throw new Error('no_types');
  await AynaRecords.requestAuthorization({ types: t });
  return { asked: true };
}

/** Raw records [{ type, resourceType, fhirVersion, json, sourceName }]. */
export async function readClinicalRecords(types) {
  const t = validTypes(types);
  if (!t.length) return [];
  const out = await AynaRecords.readRecords({ types: t });
  return Array.isArray(out?.records) ? out.records : [];
}
