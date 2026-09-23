/* global process */
/**
 * Shared Airtable -> early-stage-startup mapping, used by /api/startups (live
 * read) and scripts/sync-startups-from-airtable.mjs (DB sync). Keeping one
 * mapping means the app shows exactly what the Airtable base says.
 */
export const AIRTABLE_TABLE_ID = 'tbl8E6VojepaM6eN3'; // "Startups" table

export const CATEGORY_MAP = {
  Diagnostics: 'diagnostics',
  Fertility: 'fertility',
  Menopause: 'menopause',
  'Mental Health': 'mental-health',
  'Hormonal Health': 'hormone-monitoring',
  Nutrition: 'supplement',
  'Sexual Health': 'intimate-care',
  'Maternal Health': 'maternal-health',
  'General Wellness': 'general-wellness',
};

export function slugify(name) {
  return String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function airtableConfigured() {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

export async function fetchActiveAirtableRecords({ signal } = {}) {
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!key || !base) throw new Error('airtable_not_configured');
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('filterByFormula', "{Status}='Active'");
    if (offset) url.searchParams.set('offset', offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal });
    if (!res.ok) throw new Error(`airtable_${res.status}`);
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

/** Airtable record -> early_stage_startups row. */
export function airtableRecordToRow(record) {
  const f = record?.fields || {};
  return {
    id: slugify(f['Startup Name']),
    airtable_record_id: record.id,
    name: f['Startup Name'] || '',
    tagline: f['One-Liner'] || null,
    description: f['Why We Picked Them'] || null,
    category: CATEGORY_MAP[f.Category] || 'general-wellness',
    stage: f.Stage || null,
    product_released: false,
    url: f['Website URL'] || null,
    waitlist_url: f['Waitlist URL'] || null,
    image: f.Logo?.[0]?.url || null,
    tags: Array.isArray(f['Symptom Tags']) ? f['Symptom Tags'] : [],
    health_functions: [],
    badges: Array.isArray(f.Tags) ? f.Tags : [],
    featured: f.Featured === true,
    extra: {
      founderNames: f['Founder Names'] || null,
      foundedYear: f['Founded Year'] || null,
      womenFounded: f['Women-Founded'] === true,
    },
    is_active: true,
  };
}

/** early_stage_startups row -> the shape the app renders. */
export function rowToClientStartup(row) {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    stage: row.stage,
    productReleased: row.product_released === true,
    url: row.url,
    waitlistUrl: row.waitlist_url,
    image: row.image,
    tags: row.tags || [],
    healthFunctions: row.health_functions || [],
    badges: row.badges || [],
    featured: row.featured === true,
    founderNames: row.extra?.founderNames ?? null,
    foundedYear: row.extra?.foundedYear ?? null,
    womenFounded: row.extra?.womenFounded === true,
  };
}
