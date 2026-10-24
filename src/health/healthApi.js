/**
 * Client for /api/health-data and /api/health-oauth. Authenticated with the
 * person's own Supabase session; never sends a user id of its own.
 * Nothing here logs values or sends them to analytics.
 */
import { withAuthRetry } from '../utils/authToken.js';
import { apiUrl } from '../utils/apiUrl.js';
import { fetchWithTimeout } from '../utils/network.js';

export class HealthApiError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}

async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    // Fresh token, one refresh-and-retry on 401 (src/utils/authToken.js).
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

export const fetchHealthData = () => call('/api/health-data');
const post = (body) => call('/api/health-data', { method: 'POST', body });
export const connectDeviceSource = (source, categories, platform) => post({ action: 'connect', source, categories, platform });
export const updateSourceCategories = (source, categories) => post({ action: 'update', source, categories });
export const pauseSource = (source) => post({ action: 'pause', source });
export const resumeSource = (source) => post({ action: 'resume', source });
export const disconnectSource = (source, deleteData) => post({ action: 'disconnect', source, deleteData: Boolean(deleteData) });
export const syncDeviceRows = (source, rows) => post({ action: 'sync', source, rows });
export const confirmImport = ({ declaredApp, fileKind, categories, rows, platform }) => post({ action: 'import', declaredApp, fileKind, categories, rows, platform });
export const deleteAllHealthData = () => post({ action: 'delete_all', confirm: 'DELETE' });
export const requestSource = (name, note) => post({ action: 'request_source', name, note });

/** Start an OAuth connection: returns the provider URL to open. */
export const startOAuth = (provider, categories, returnTo) => call('/api/health-oauth', {
  method: 'POST',
  body: { action: 'start', provider, categories, returnTo, returnPath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}`.slice(0, 200) : '/' },
});
export const syncOAuthSource = (provider) => call('/api/health-oauth', { method: 'POST', body: { action: 'sync', provider } });
export const oauthStatus = () => call('/api/health-oauth?action=status');
/** Live-only providers (WHOOP): recent rows, returned to her and never stored. */
export const fetchLiveRows = (provider) => call('/api/health-oauth', { method: 'POST', body: { action: 'live', provider } });

/** Whether screenshot reading is switched on for this deployment (off until the founders approve the processor). */
export const extractionStatus = () => call('/api/health-extract').then((d) => Boolean(d?.enabled)).catch(() => false);

/** Sends one image to /api/health-extract and returns candidate rows for review. Never saves anything. */
export async function extractFromImage(file, declaredApp) {
  if (file.size > 5 * 1024 * 1024) throw new HealthApiError('image_too_large', 413);
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new HealthApiError('read_failed', 0));
    reader.readAsDataURL(file);
  });
  const [, mediaType, data] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) || [];
  if (!data) throw new HealthApiError('read_failed', 0);
  return call('/api/health-extract', { method: 'POST', body: { mediaType, data, declaredApp: declaredApp || null } });
}

/** Apple Health Records consent log: record types and a count only. The records stay on her phone. */
export const logRecordsEvent = (action, types, count) => call('/api/health-data', { method: 'POST', body: { action, types, count } });
