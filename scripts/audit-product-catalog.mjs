#!/usr/bin/env node

import {
  ALL_PRODUCTS,
  isRxOnlyProduct,
} from '../src/data/products.js';

const failures = [];
const warnings = [];

function add(bucket, product, rule, detail) {
  bucket.push({
    id: product?.id || '(missing id)',
    name: product?.name || '(missing name)',
    rule,
    detail,
  });
}

function linksFor(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.links)) return value.links;
  if (typeof value === 'object' && value.url) return [value];
  return [];
}

function verificationSection(product, key) {
  return linksFor(product?.verificationLinks?.[key]);
}

function hasValidUrl(link) {
  return typeof link?.url === 'string' && /^https?:\/\//i.test(link.url.trim());
}

function allText(product) {
  const fields = [
    product.summary,
    product.doctorOpinion,
    product.communityReview,
    product.effectiveness,
    product.recommendationWhyDetail,
    product.safety?.fdaStatus,
    product.safety?.recalls,
    product.safety?.sideEffects,
    product.safety?.opinionAlerts,
    product.privacy?.dataStorage,
    product.privacy?.sellsData,
    product.privacy?.hipaa,
    product.privacy?.keyPolicy,
  ];

  return fields.filter(Boolean).join(' ');
}

const riskyClaims = [
  [/\bclinically proven\b/i, 'Uses "clinically proven"'],
  [/\bguaranteed\b/i, 'Uses "guaranteed"'],
  [/\bfirst[- ]line\b/i, 'Uses "first-line"'],
  [/\bas effective as\b/i, 'Uses "as effective as"'],
  [/\bequals? (?:nsaid|ibuprofen|medication)/i, 'Claims equivalence to medication'],
  [/\b100%\b/i, 'Uses an absolute percentage claim'],
  [/\bno side effects?\b/i, 'Claims no side effects'],
  [/\bcompletely safe\b/i, 'Uses an absolute safety claim'],
  [/\bsafe for everyone\b/i, 'Uses an absolute safety claim'],
  [/\blife[- ]changing\b/i, 'Uses strong anecdotal efficacy language'],
];

const privacyClaims = [
  [/\bdoes not sell (?:your )?data\b/i, 'Absolute data-sale statement'],
  [/\bnever sells? (?:your )?data\b/i, 'Absolute data-sale statement'],
  [/\bend[- ]to[- ]end encrypt/i, 'Encryption claim requires current verification'],
  [/\bhipaa[- ]compliant\b/i, 'HIPAA compliance claim requires current verification'],
  [/\bgdpr[- ]compliant\b/i, 'GDPR compliance claim requires current verification'],
];

const recallClaims = [
  /^no recalls?\.?$/i,
  /^no known recalls?\.?$/i,
];

for (const product of ALL_PRODUCTS) {
  if (!product.id) add(failures, product, 'IDENTITY', 'Missing product id.');
  if (!product.name) add(failures, product, 'IDENTITY', 'Missing product name.');

  if (product.requiresPrescription === true || isRxOnlyProduct(product)) {
    add(
      failures,
      product,
      'PRESCRIPTION_GATE',
      'Prescription-restricted product is present in ALL_PRODUCTS.'
    );
  }

  const scientific = verificationSection(product, 'scientific');
  const doctor = verificationSection(product, 'doctor');
  const community = verificationSection(product, 'community');

  if (!scientific.length) {
    add(
      failures,
      product,
      'SCIENTIFIC_MISSING',
      'No scientific verification source.'
    );
  } else {
    for (const link of scientific) {
      if (!hasValidUrl(link)) {
        add(
          failures,
          product,
          'SCIENTIFIC_URL',
          `Invalid or missing scientific URL: ${link?.url || '(none)'}`
        );
      }

      const url = String(link?.url || '').toLowerCase();

      if (
        /youtube\.com|youtu\.be|instagram\.com|tiktok\.com|facebook\.com/.test(url)
      ) {
        add(
          warnings,
          product,
          'SCIENTIFIC_SOURCE_QUALITY',
          `Social/media URL is being used as scientific evidence: ${link.url}`
        );
      }

      if (
        /amazon\.com|walmart\.com|target\.com/.test(url)
      ) {
        add(
          warnings,
          product,
          'SCIENTIFIC_SOURCE_QUALITY',
          `Retailer URL is being used as scientific evidence: ${link.url}`
        );
      }

      const evidenceText =
        `${link?.text || ''} ${link?.summary || ''} ${link?.justification || ''}`.toLowerCase();

      if (
        !/product|specific|category|general|intervention|adjacent|does not validate|not specific|not validate/.test(
          evidenceText
        )
      ) {
        add(
          warnings,
          product,
          'EVIDENCE_SCOPE',
          'Scientific source does not clearly say whether evidence is product-specific or category/adjacent.'
        );
      }
    }
  }

  if (!product.clinicianAttribution) {
    add(
      failures,
      product,
      'CLINICIAN_ATTRIBUTION',
      'Missing clinician attribution/synthesis disclosure.'
    );
  }

  if (!product.doctorOpinion) {
    add(
      failures,
      product,
      'CLINICIAN_OPINION',
      'Missing clinician-opinion/synthesis text.'
    );
  }

  if (
    product.clinicianOpinionSource === 'independent' &&
    product.doctorOpinion &&
    !/synthesis|not a direct clinician quote/i.test(
      String(product.clinicianAttribution || '')
    )
  ) {
    add(
      warnings,
      product,
      'CLINICIAN_DISCLOSURE',
      'Independent clinician content should clearly disclose when it is an ayna synthesis rather than a direct quote.'
    );
  }

  if (!community.length && !product.communityReviewSourceUrl) {
    add(
      warnings,
      product,
      'COMMUNITY_SOURCE',
      'Community review exists without a linked public community source.'
    );
  }

  for (const link of community) {
    if (!hasValidUrl(link)) {
      add(
        warnings,
        product,
        'COMMUNITY_URL',
        `Invalid or missing community URL: ${link?.url || '(none)'}`
      );
    }
  }

  const text = allText(product);

  for (const [regex, description] of riskyClaims) {
    if (regex.test(text)) {
      add(warnings, product, 'RISKY_CLAIM', description);
    }
  }

  const privacyText = [
    product.privacy?.dataStorage,
    product.privacy?.sellsData,
    product.privacy?.hipaa,
    product.privacy?.keyPolicy,
  ]
    .filter(Boolean)
    .join(' ');

  for (const [regex, description] of privacyClaims) {
    if (regex.test(privacyText)) {
      add(warnings, product, 'PRIVACY_VERIFY', description);
    }
  }

  const recalls = String(product.safety?.recalls || '').trim();

  if (recallClaims.some((regex) => regex.test(recalls))) {
    add(
      warnings,
      product,
      'RECALL_VERIFY',
      `"${recalls}" is time-sensitive and should come from a current recall check rather than static copy.`
    );
  }

  if (/[✅⚠️❌]/u.test(JSON.stringify(product))) {
    add(
      failures,
      product,
      'EMOJI',
      'Product data contains a prohibited emoji marker.'
    );
  }

  if (product.userRating != null && !product.userRatingSourceUrl) {
    add(
      warnings,
      product,
      'RATING_SOURCE',
      `User rating ${product.userRating} has no explicit source URL.`
    );
  }
}

function printSection(title, rows) {
  console.log(`\n${title}: ${rows.length}`);

  if (!rows.length) {
    console.log('  None');
    return;
  }

  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.rule)) grouped.set(row.rule, []);
    grouped.get(row.rule).push(row);
  }

  for (const [rule, items] of grouped) {
    console.log(`\n  ${rule} (${items.length})`);
    for (const item of items) {
      console.log(`    - ${item.id} | ${item.name}`);
      console.log(`      ${item.detail}`);
    }
  }
}

console.log('ayna product catalog audit');
console.log(`Products scanned: ${ALL_PRODUCTS.length}`);

printSection('FAILURES', failures);
printSection('WARNINGS', warnings);

const failedProducts = new Set(failures.map((x) => x.id));
const warnedProducts = new Set(warnings.map((x) => x.id));

console.log('\nSUMMARY');
console.log(`  Products scanned: ${ALL_PRODUCTS.length}`);
console.log(`  Products with failures: ${failedProducts.size}`);
console.log(`  Products with warnings: ${warnedProducts.size}`);
console.log(`  Total failures: ${failures.length}`);
console.log(`  Total warnings: ${warnings.length}`);

if (failures.length) {
  process.exitCode = 1;
}
