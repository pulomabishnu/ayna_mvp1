/**
 * Client for /api/health-data and /api/health-oauth. Authenticated with the
 * person's own Supabase session; never sends a user id of its own.
 *
 * Analytics records only workflow metadata (provider/action/success/failure).
 * It never records health values, rows, categories selected, uploaded contents,
 * provider free text, or connected measurements.
 */
import posthog from 'posthog-js';
import { withAuthRetry } from '../utils/authToken.js';
import { apiUrl } from '../utils/apiUrl.js';
import { fetchWithTimeout } from '../utils/network.js';
import { analyticsId, ensureAnalyticsContext, eventSurface } from '../utils/analyticsEvents.js';

export class HealthApiError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}

async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await withAuthRetry((t) => fetchWithTimeout(apiUrl(path), {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
  } catch {
    throw new HealthApiError('network', 0);
  }
  if (!res) throw new HealthApiError('not_signed_in', 401);
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new HealthApiError(data?.error || `http_${res.status}`, res.status);
  return data;
}

function safeHealthCapture(event, props = {}) {
  try {
    ensureAnalyticsContext();
    posthog.capture(event, { surface: eventSurface(), ...props });
  } catch { /* analytics never blocks health flows */ }
}

async function tracked(eventBase, provider, fn) {
  const safeProvider = analyticsId(provider || 'unknown');
  safeHealthCapture(`${eventBase}_started`, { provider: safeProvider });
  try {
    const out = await fn();
    safeHealthCapture(`${eventBase}_succeeded`, { provider: safeProvider });
    return out;
  } catch (e) {
    safeHealthCapture(`${eventBase}_failed`, {
      provider: safeProvider,
      failure_code: analyticsId(e?.code || 'unknown'),
    });
    throw e;
  }
}

export const fetchHealthData = () => call('/api/health-data');
const post = (body) => call('/api/health-data', { method: 'POST', body });

export const connectDeviceSource = (source, categories, platform) => tracked('health_connection', source, () => post({ action: 'connect', source, categories, platform }));

export const updateSourceCategories = async (source, categories) => {
  const out = await post({ action: 'update', source, categories });
  safeHealthCapture('health_connection_permissions_updated', { provider: analyticsId(source), category_count: Array.isArray(categories) ? categories.length : 0 });
  return out;
};

export const pauseSource = async (source) => {
  const out = await post({ action: 'pause', source });
  safeHealthCapture('health_connection_paused', { provider: analyticsId(source) });
  return out;
};

export const resumeSource = async (source) => {
  const out = await post({ action: 'resume', source });
  safeHealthCapture('health_connection_resumed', { provider: analyticsId(source) });
  return out;
};

export const disconnectSource = async (source, deleteData) => {
  const out = await post({ action: 'disconnect', source, deleteData: Boolean(deleteData) });
  safeHealthCapture('health_connection_disconnected', { provider: analyticsId(source), deleted_stored_data: Boolean(deleteData) });
  return out;
};

export const syncDeviceRows = (source, rows) => tracked('health_sync', source, () => post({ action: 'sync', source, rows }));

export const confirmImport = ({ declaredApp, fileKind, categories, rows, platform }) => tracked('health_import', 'manual_import', () => post({ action: 'import', declaredApp, fileKind, categories, rows, platform }));

export const deleteAllHealthData = async () => {
  const out = await post({ action: 'delete_all', confirm: 'DELETE' });
  safeHealthCapture('health_data_deleted_all', { success: true });
  return out;
};

export const requestSource = async (name, note) => {
  try {
    const out = await post({ action: 'request_source', name, note });
    // Never send the requested integration name/note: it is free text.
    safeHealthCapture('health_integration_request_submitted', { success: true });
    return out;
  } catch (e) {
    safeHealthCapture('health_integration_request_failed', { success: false, failure_code: analyticsId(e?.code || 'unknown') });
    throw e;
  }
};

/** Start an OAuth connection: returns the provider URL to open. */
export const startOAuth = (provider, categories, returnTo) => tracked('health_connection', provider, () => call('/api/health-oauth', {
  method: 'POST',
  body: { action: 'start', provider, categories, returnTo, returnPath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}`.slice(0, 200) : '/' },
}));

export const syncOAuthSource = (provider) => tracked('health_sync', provider, () => call('/api/health-oauth', { method: 'POST', body: { action: 'sync', provider } }));
export const oauthStatus = () => call('/api/health-oauth?action=status');
/** Live-only providers: recent rows, returned to her and never stored. */
export const fetchLiveRows = (provider) => call('/api/health-oauth', { method: 'POST', body: { action: 'live', provider } });

/** Whether screenshot reading is switched on for this deployment. */
export const extractionStatus = () => call('/api/health-extract').then((d) => Boolean(d?.enabled)).catch(() => false);

/** Sends one image to /api/health-extract and returns candidate rows for review. Never saves anything. */
export async function extractFromImage(file, declaredApp) {
  if (file.size > 5 * 1024 * 1024) throw new HealthApiError('image_too_large', 413);
  safeHealthCapture('health_upload_started', { provider: 'manual_upload' });
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new HealthApiError('read_failed', 0));
      reader.readAsDataURL(file);
    });
    const [, mediaType, data] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) || [];
    if (!data) throw new HealthApiError('read_failed', 0);
    const out = await call('/api/health-extract', { method: 'POST', body: { mediaType, data, declaredApp: declaredApp || null } });
    safeHealthCapture('health_upload_succeeded', { provider: 'manual_upload' });
    return out;
  } catch (e) {
    safeHealthCapture('health_upload_failed', { provider: 'manual_upload', failure_code: analyticsId(e?.code || 'unknown') });
    throw e;
  }
}

/** Apple Health Records consent log: record types and a count only. The records stay on her phone. */
export const logRecordsEvent = (action, types, count) => call('/api/health-data', { method: 'POST', body: { action, types, count } });
