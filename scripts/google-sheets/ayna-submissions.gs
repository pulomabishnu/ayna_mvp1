/**
 * ayna submissions tracker: Google Apps Script for the founders' sheet.
 *
 * Paste this whole file into the sheet: Extensions > Apps Script, replace the
 * contents of Code.gs, save. Setup steps: docs/submissions-sheet.md.
 *
 * Reads from https://<production domain>/api/admin-export (api/admin-export.js).
 * The URL and token live in Script Properties (Project Settings > Script
 * Properties), never in this file:
 *   AYNA_EXPORT_URL    https://<production domain>/api/admin-export
 *   AYNA_EXPORT_TOKEN  the same value as ADMIN_EXPORT_TOKEN in Vercel
 *
 * One tab per source. Each sync asks only for rows changed since the last
 * successful sync, adds rows whose ID is new, refreshes rows that can change
 * (claims, reviews, partners, campaign feedback) and rewrites the snapshot tabs
 * (invites, signups). Columns to the right of the data are never touched, so
 * the team can add their own notes columns there.
 *
 * Run syncAyna once by hand (to authorize), then installTrigger once.
 */

// Tab order in the sheet: Claims first, Setup last.
var AYNA_SOURCES = [
  { source: 'claims', tab: 'Claims' },
  { source: 'campaign_feedback', tab: 'Campaign feedback' },
  { source: 'survey', tab: 'Survey' },
  { source: 'reviews', tab: 'Reviews' },
  { source: 'contact', tab: 'Contact' },
  { source: 'topics', tab: 'Topics' },
  { source: 'partners', tab: 'Partners' },
  { source: 'invites', tab: 'Invites' },
  { source: 'signups', tab: 'Signups' },
];
var SETUP_TAB = 'Setup';
var MAX_PAGES = 25;
var OVERLAP_MS = 10 * 60 * 1000; // re-ask for the last 10 minutes; IDs dedupe
var HEADER_LABELS = { id: 'ID', shipped: 'Shipped?', complete: 'Complete?', ship_to_name: 'Ship to (name)' };
var DATE_COLUMNS = /(_at|^date|_on)$/;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ayna')
    .addItem('Sync now', 'syncAyna')
    .addItem('Turn on hourly sync', 'installTrigger')
    .addToUi();
}

/** Pulls every source into its tab. Safe to run any time; runs one at a time. */
function syncAyna() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return;
  try {
    var ss = SpreadsheetApp.getActive();
    var setup = ensureSetup_(ss);
    var props = PropertiesService.getScriptProperties();
    var url = props.getProperty('AYNA_EXPORT_URL');
    var token = props.getProperty('AYNA_EXPORT_TOKEN');
    var errors = [];
    if (!url || !token) {
      errors.push(['setup', 'Set AYNA_EXPORT_URL and AYNA_EXPORT_TOKEN in Project Settings > Script Properties.']);
    } else {
      AYNA_SOURCES.forEach(function (s, i) {
        try {
          syncSource_(ss, s, i, url, token, props);
        } catch (e) {
          errors.push([s.tab, String(e && e.message ? e.message : e).slice(0, 300)]);
        }
      });
    }
    writeStatus_(setup, errors);
  } finally {
    lock.releaseLock();
  }
}

/** Adds one hourly time-driven trigger for syncAyna (replaces any old one). */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAyna') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncAyna').timeBased().everyHours(1).create();
  var setup = ensureSetup_(SpreadsheetApp.getActive());
  setup.getRange('B4').setValue('On (every hour)');
}

// ── internals ────────────────────────────────────────────────────────────────

function syncSource_(ss, s, index, url, token, props) {
  var key = 'since_' + s.source;
  var since = props.getProperty(key) || '';
  var sheet = ss.getSheetByName(s.tab) || ss.insertSheet(s.tab, index);
  var result = null;
  var startedAt = null;
  for (var page = 0; page < MAX_PAGES; page++) {
    var data = fetchSource_(url, token, s.source, since);
    if (!startedAt) startedAt = data.generated_at;
    applyRows_(sheet, data, page === 0);
    result = data;
    if (!data.next_since || data.mode === 'replace') break;
    since = data.next_since;
  }
  if (result && result.mode !== 'replace' && startedAt) {
    props.setProperty(key, new Date(new Date(startedAt).getTime() - OVERLAP_MS).toISOString());
  }
  if (sheet.getIndex() !== index + 1) {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(index + 1);
  }
}

function fetchSource_(url, token, source, since) {
  var q = '?source=' + encodeURIComponent(source) + (since ? '&since=' + encodeURIComponent(since) : '');
  var resp = UrlFetchApp.fetch(url + q, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
    followRedirects: false,
  });
  var code = resp.getResponseCode();
  if (code === 401) throw new Error('401: the token was rejected. Check AYNA_EXPORT_TOKEN matches ADMIN_EXPORT_TOKEN in Vercel.');
  if (code === 503) throw new Error('503: the export is not configured on the server (ADMIN_EXPORT_TOKEN or Supabase keys).');
  if (code === 429) throw new Error('429: rate limited. It will retry on the next sync.');
  if (code !== 200) throw new Error(code + ': ' + resp.getContentText().slice(0, 200));
  return JSON.parse(resp.getContentText());
}

function applyRows_(sheet, data, firstPage) {
  var cols = data.columns;
  var width = cols.length;
  var header = cols.map(function (c) {
    if (HEADER_LABELS[c]) return HEADER_LABELS[c];
    var t = c.replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  });
  sheet.getRange(1, 1, 1, width).setValues([header]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  var values = data.rows.map(function (r) {
    return cols.map(function (c) { return cell_(c, r[c]); });
  });

  if (data.mode === 'replace') {
    if (!firstPage) return;
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, width).clearContent();
    if (values.length) sheet.getRange(2, 1, values.length, width).setValues(values);
  } else {
    var existing = {};
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(function (v, i) {
        if (v[0] !== '') existing[String(v[0])] = i + 2;
      });
    }
    var toAppend = [];
    values.forEach(function (row) {
      var at = existing[String(row[0])];
      if (at && data.mode === 'upsert') sheet.getRange(at, 1, 1, width).setValues([row]);
      else if (!at) { toAppend.push(row); existing[String(row[0])] = -1; }
    });
    if (toAppend.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, width).setValues(toAppend);
    }
  }

  var rows = Math.max(sheet.getLastRow() - 1, 1);
  cols.forEach(function (c, i) {
    if (DATE_COLUMNS.test(c)) {
      sheet.getRange(2, i + 1, rows, 1).setNumberFormat(c === 'date' || c === 'submitted_on' ? 'yyyy-mm-dd' : 'yyyy-mm-dd hh:mm');
    }
  });
}

/** Dates become real dates; text that looks like a formula is kept as text. */
function cell_(col, v) {
  if (v === null || v === undefined) return '';
  if (DATE_COLUMNS.test(col) && typeof v === 'string' && v) {
    var d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
    return isNaN(d.getTime()) ? v : d;
  }
  // IDs and ZIP codes stay text (no "02139" -> 2139, no ID turned into a date).
  if (col === 'id' || col === 'postal_code') return "'" + String(v);
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function ensureSetup_(ss) {
  var sheet = ss.getSheetByName(SETUP_TAB);
  if (sheet) return sheet;
  sheet = ss.insertSheet(SETUP_TAB);
  sheet.getRange('A1').setValue('ayna submissions tracker').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A3:A5').setValues([['Last synced'], ['Hourly sync'], ['Status']]).setFontWeight('bold');
  sheet.getRange('B4').setValue('Off: run installTrigger');
  sheet.getRange('A7:A16').setValues([
    ['How it works'],
    ['Every tab is filled from the ayna site by syncAyna (menu: ayna > Sync now). Hourly once installTrigger has run.'],
    ['New rows are added at the bottom. Claims, Reviews, Partners and Campaign feedback rows also refresh when they change.'],
    ['Invites and Signups are rewritten on every sync (they are running totals).'],
    ['You can add your own columns to the right of the data; the sync never touches them.'],
    ['Do not edit the ID column or the synced columns: the next sync may overwrite them.'],
    ['Claims has shipping names and addresses. Share this sheet only with the founders.'],
    ['No health data or quiz answers are ever in this sheet.'],
    ['Setup steps: docs/submissions-sheet.md in the ayna repo.'],
    ['Errors from the last sync are listed below Status.'],
  ]);
  sheet.getRange('A7').setFontWeight('bold');
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 520);
  return sheet;
}

function writeStatus_(setup, errors) {
  var now = new Date();
  setup.getRange('B3').setValue(now).setNumberFormat('yyyy-mm-dd hh:mm');
  var hasTrigger = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'syncAyna'; });
  setup.getRange('B4').setValue(hasTrigger ? 'On (every hour)' : 'Off: run installTrigger');
  setup.getRange('A18:C60').clearContent();
  if (!errors.length) {
    setup.getRange('B5').setValue('OK');
    return;
  }
  setup.getRange('B5').setValue(errors.length + ' error(s), see below');
  setup.getRange('A18:C18').setValues([['Tab', 'Error', 'When']]).setFontWeight('bold');
  var rows = errors.slice(0, 40).map(function (e) { return [e[0], e[1], now]; });
  setup.getRange(19, 1, rows.length, 3).setValues(rows);
}
