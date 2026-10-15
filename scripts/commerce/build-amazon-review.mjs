#!/usr/bin/env node
/**
 * Builds the Amazon human-verification worksheet: one row per Amazon offer a
 * shopper can reach (the product-level listing, plus one row per Ayna size /
 * option). Nothing here is fetched from Amazon; it only lays out what ayna
 * currently maps so a person can open each link and record what they see.
 *
 *   npx tsx scripts/commerce/build-amazon-review.mjs
 *
 * Inputs:  docs/commerce/audit/live_catalog_commerce_fields_2026-10-15.json
 *          docs/commerce/audit/no_link_investigation_2026-10-15.json (optional)
 * Outputs: docs/commerce/amazon_human_review.csv
 *          docs/commerce/audit/amazon_mapping_summary.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildAmazonReviewRows } from '../../src/commerce/amazonReview.js';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const live = JSON.parse(fs.readFileSync(path.join(root, 'docs/commerce/audit/live_catalog_commerce_fields_2026-10-15.json'), 'utf8'));
const noLinkPath = path.join(root, 'docs/commerce/audit/no_link_investigation_2026-10-15.json');
const noLink = fs.existsSync(noLinkPath) ? JSON.parse(fs.readFileSync(noLinkPath, 'utf8')) : [];

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const COLUMNS = [
  'review_order', 'row_type', 'ayna_product_id', 'product_name', 'brand', 'is_ayna_partner', 'ayna_display_name',
  'ayna_option_label', 'ayna_price_text', 'ayna_size', 'ayna_count', 'ayna_color_or_scent', 'ayna_image_url',
  'parent_asin', 'asin_for_this_row', 'child_asin_for_option', 'amazon_link_to_open', 'expected_exact_variant',
  'button_destination_today', 'brand_site_fallback_url',
  'amazon_identity_status', 'amazon_variant_status', 'amazon_price_status', 'amazon_availability_status',
  'human_review_required', 'review_reason', 'severity_if_wrong', 'notes',
  // filled in by the reviewer
  'reviewer_exact_product_yes_no', 'reviewer_exact_variant_yes_no', 'reviewer_verified_size_count', 'reviewer_price_seen_usd_internal_only',
  'reviewer_availability', 'reviewer_image_matches_yes_no', 'reviewer_notes', 'reviewed_by', 'reviewed_at',
];

const { rows, summary } = buildAmazonReviewRows(live.products, { noLink });

const csv = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'docs/commerce/amazon_human_review.csv'), csv);
fs.writeFileSync(path.join(root, 'docs/commerce/audit/amazon_mapping_summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, groups: undefined }, null, 2));
