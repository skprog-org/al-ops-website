/**
 * Contact-form sink for the website. Receives JSON POSTs from the Cloudflare
 * Worker and appends one row per submission to a tab named after the form.
 *
 * Script property required: SECRET (shared with the Worker).
 * Script property optional: SHEET_ID (only if the script is not container-bound).
 */

/** Tab name per form type. */
var TABS = {
  move: 'Contact',
  docs: 'Documentation requests',
  readiness: 'Readiness'
};

/** Known fields per form type, in preferred column order. */
var FIELDS = {
  move: ['mv-email', 'mv-org', 'mv-role', 'mv-priority', 'mv-region', 'mv-move', 'mv-help', 'mv-notes', 'mv-updates', 'mv-readiness-id'],
  docs: ['docs-email', 'docs-org', 'docs-role', 'docs-deploy', 'docs-areas', 'docs-notes'],
  readiness: ['rd-id', 'rd-score', 'rd-band', 'rd-areas', 'rd-selected', 'rd-answers']
};

/**
 * Builds a JSON response.
 * @param {Object} obj Response payload.
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Compares two strings without returning early on the first difference.
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
function safeEqual_(a, b) {
  a = String(a);
  b = String(b);
  var diff = a.length ^ b.length;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Converts a value into something safe to store in a cell. Arrays are joined,
 * objects are serialised, and leading formula characters are neutralised.
 * @param {*} v
 * @return {string|number|boolean}
 */
function cell_(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) v = v.join(', ');
  else if (typeof v === 'object') v = JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  v = String(v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

/**
 * Returns the target spreadsheet.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Returns the tab for a form, creating it with a header row if missing.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} form
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet_(ss, form) {
  var name = TABS[form];
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    var header = ['submitted_at', 'form'].concat(FIELDS[form], ['page', 'country']);
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  return sheet;
}

/**
 * Handles form submissions from the Worker.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  var expected = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!expected || !safeEqual_(data.secret === undefined ? '' : data.secret, expected)) {
    return json_({ ok: false, error: 'unauthorized' });
  }

  var form = data.form;
  if (!Object.prototype.hasOwnProperty.call(TABS, form)) {
    return json_({ ok: false, error: 'invalid form' });
  }
  delete data.secret;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    var sheet = getSheet_(getSpreadsheet_(), form);
    var lastCol = sheet.getLastColumn();
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);

    // Append any unknown incoming keys as new columns.
    var added = Object.keys(data).filter(function (k) {
      return header.indexOf(k) === -1;
    });
    if (added.length) {
      sheet.getRange(1, lastCol + 1, 1, added.length)
        .setValues([added])
        .setFontWeight('bold');
      header = header.concat(added);
    }

    var row = header.map(function (col) {
      return cell_(data[col]);
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server error' });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Health check. Reveals nothing beyond the service name.
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet() {
  return json_({ ok: true, service: 'contact-sheet' });
}
