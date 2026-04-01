/**
 * Vercel serverless: aggregate counts from FDA openFDA (FAERS + MAUDE).
 * MedWatch reports flow into these systems; we surface approximate public totals for a brand search term.
 * @see https://open.fda.gov/apis/drug/event/
 * @see https://open.fda.gov/apis/device/event/
 */
/* global process */

const OPENFDA_BASE = 'https://api.fda.gov';

const MEDWATCH_LINKS = {
  medwatchProgram: 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program',
  faersDashboard: 'https://www.fda.gov/drugs/drug-approvals-and-databases/fda-adverse-event-reporting-system-faers-public-dashboard',
  maude: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfMAUDE/search.cfm',
  openfdaDrug: 'https://open.fda.gov/apis/drug/event/',
  openfdaDevice: 'https://open.fda.gov/apis/device/event/',
};

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}

/** Alphanumeric brand token for Lucene-safe openFDA search (first word of name, or override). */
function deriveSearchTerm(productName, openfdaBrand) {
  const override = typeof openfdaBrand === 'string' ? openfdaBrand.trim() : '';
  if (override.length >= 2) {
    return override.replace(/[^a-zA-Z0-9\s-]/g, '').trim().split(/\s+/)[0]?.slice(0, 40) || '';
  }
  const base = String(productName || '')
    .split(/[–—\-]/)[0]
    .trim();
  const words = base.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z0-9]/g, '').length > 1);
  if (words.length === 0) return '';
  const first = words[0].replace(/[^a-zA-Z0-9]/g, '');
  return first.slice(0, 40);
}

async function fetchTotal(endpoint, search, apiKey) {
  const qs = new URLSearchParams();
  qs.set('search', search);
  qs.set('limit', '0');
  if (apiKey) qs.set('api_key', apiKey);
  const url = `${OPENFDA_BASE}${endpoint}?${qs.toString()}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: ac.signal,
  }).finally(() => clearTimeout(timer));
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { total: null, httpError: res.status, message: text.slice(0, 200) };
  }
  if (!res.ok) {
    return { total: null, httpError: res.status, message: json?.error?.message || text.slice(0, 200) };
  }
  if (json.error) {
    return { total: 0, openfdaMessage: json.error.message || String(json.error) };
  }
  const total = json.meta?.results?.total;
  if (typeof total === 'number') return { total };
  if (typeof total === 'string') return { total: parseInt(total, 10) || 0 };
  return { total: 0 };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseBody(req);
  const productName = body.productName;
  const openfdaBrand = body.openfdaBrand;
  const term = deriveSearchTerm(productName, openfdaBrand);

  if (!term || term.length < 2) {
    return res.status(200).json({
      searchTerm: '',
      drugTotal: null,
      deviceTotal: null,
      skipped: true,
      message: 'Could not derive a brand search term from the product name.',
      links: MEDWATCH_LINKS,
    });
  }

  const apiKey = (process.env.OPENFDA_API_KEY || '').trim();

  // FAERS: drug adverse events (includes many OTC / Rx products named in reports)
  const drugSearch = `patient.drug.openfda.brand_name:${term}`;
  // MAUDE: device adverse events
  const deviceSearch = `brand_name.brand_name:${term}`;

  let drugTotal = null;
  let deviceTotal = null;
  let drugNote = null;
  let deviceNote = null;

  try {
    const [drug, device] = await Promise.all([
      fetchTotal('/drug/event.json', drugSearch, apiKey),
      fetchTotal('/device/event.json', deviceSearch, apiKey),
    ]);
    if (drug.total !== null && drug.total !== undefined) drugTotal = drug.total;
    else drugNote = drug.message || drug.openfdaMessage || 'drug query unavailable';
    if (device.total !== null && device.total !== undefined) deviceTotal = device.total;
    else deviceNote = device.message || device.openfdaMessage || 'device query unavailable';
  } catch (e) {
    return res.status(200).json({
      searchTerm: term,
      drugTotal: null,
      deviceTotal: null,
      error: e instanceof Error ? e.message : 'openFDA request failed',
      links: MEDWATCH_LINKS,
    });
  }

  return res.status(200).json({
    searchTerm: term,
    drugTotal,
    deviceTotal,
    drugNote: drugNote || undefined,
    deviceNote: deviceNote || undefined,
    disclaimer:
      'Voluntary adverse event reports (MedWatch → FAERS / MAUDE). Counts are approximate openFDA matches for this brand string, not proof of causality or population risk.',
    links: MEDWATCH_LINKS,
  });
}
