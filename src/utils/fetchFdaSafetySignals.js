const API_PATH = '/api/fda-safety-signals';

/**
 * @param {{ productName: string, openfdaBrand?: string }} params
 * @returns {Promise<{
 *   searchTerm: string,
 *   drugTotal: number|null,
 *   deviceTotal: number|null,
 *   skipped?: boolean,
 *   message?: string,
 *   error?: string,
 *   disclaimer?: string,
 *   drugNote?: string,
 *   deviceNote?: string,
 *   links?: Record<string, string>
 * }>}
 */
export async function fetchFdaSafetySignals({ productName, openfdaBrand }) {
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName, openfdaBrand }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid FDA signals response');
  }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.detail = data;
    throw err;
  }
  return data;
}
