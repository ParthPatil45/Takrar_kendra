/* ==========================================================================
   util.js — small helper functions (no dependencies)
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Util = (function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** Escape text before putting it into HTML (prevents HTML injection / XSS). */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Accepts "YYYY-MM-DD" (treated as a local date) or a full ISO string. */
  function toDate(v) {
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      var p = v.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtDate(v) {
    var d = toDate(v);
    return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : '—';
  }

  function fmtShort(v) {
    var d = toDate(v);
    return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] : '—';
  }

  function fmtDateTime(v) {
    var d = toDate(v);
    if (!d) return '—';
    var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return fmtDate(v) + ', ' + h + ':' + pad(d.getMinutes()) + ' ' + ap;
  }

  /** Today (or any date) as local "YYYY-MM-DD". */
  function localYMD(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms || 150);
    };
  }

  function truncate(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }

  function csvCell(v) {
    return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  }

  /** Trigger a file download from text content. */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  return {
    esc: esc, toDate: toDate, fmtDate: fmtDate, fmtShort: fmtShort, fmtDateTime: fmtDateTime,
    localYMD: localYMD, uid: uid, debounce: debounce, truncate: truncate, initials: initials,
    csvCell: csvCell, download: download, MONTHS: MONTHS
  };
})();
