/* ==========================================================================
   charts.js — lightweight charts made with SVG + CSS (no external libraries)
   Every chart also lists its numbers as text, so it is readable without colour.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Charts = (function () {
  var esc = CCMS.Util.esc;

  var STATUS_COLORS = { 'Pending': '#D97706', 'In Progress': '#2563EB', 'Resolved': '#15803D' };
  var PRIORITY_COLORS = { 'Low': '#64748B', 'Medium': '#2563EB', 'High': '#EA580C', 'Critical': '#B91C1C', 'Not Set': '#A8B3C0' };
  var BAR_COLOR = '#0E8C88';

  /** Donut chart. data: [{label, value, color}] */
  function donut(data, centerLabel) {
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    var r = 15.915, offset = 25, segs = '';
    if (total === 0) {
      segs = '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="#E5EAF0" stroke-width="6"></circle>';
    } else {
      data.forEach(function (d) {
        if (!d.value) return;
        var pct = d.value / total * 100;
        segs += '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="' + d.color + '" stroke-width="6" stroke-dasharray="' + pct.toFixed(3) + ' ' + (100 - pct).toFixed(3) + '" stroke-dashoffset="' + offset.toFixed(3) + '"></circle>';
        offset -= pct;
      });
    }
    var legend = data.map(function (d) {
      return '<li><span class="swatch" style="background:' + d.color + '"></span><span class="lg-label">' + esc(d.label) + '</span><strong>' + d.value + '</strong></li>';
    }).join('');
    return '<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="' + esc(centerLabel || 'Chart') + ': ' +
      data.map(function (d) { return d.label + ' ' + d.value; }).join(', ') + '">' + segs + '</svg><div class="donut-center"><strong>' + total + '</strong><span>' + esc(centerLabel || 'Total') + '</span></div></div><ul class="legend">' + legend + '</ul></div>';
  }

  /** Horizontal bars. data: [{label, value}], colorFn(label) optional */
  function bars(data, colorFn) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    return '<ul class="bars">' + data.map(function (d) {
      var w = Math.round(d.value / max * 100);
      var color = colorFn ? colorFn(d.label) : BAR_COLOR;
      return '<li><span class="bar-label">' + esc(d.label) + '</span><span class="bar-track"><span class="bar-fill" style="width:' + w + '%;background:' + color + '"></span></span><strong class="bar-value">' + d.value + '</strong></li>';
    }).join('') + '</ul>';
  }

  /** Vertical columns for a short time series. data: [{label, value}] */
  function columns(data) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    return '<div class="cols" role="list">' + data.map(function (d) {
      var h = Math.round(d.value / max * 100);
      return '<div class="col" role="listitem" aria-label="' + esc(d.label) + ': ' + d.value + '"><span class="col-value">' + d.value + '</span><span class="col-bar" style="height:' + Math.max(h, d.value ? 4 : 0) + '%"></span><span class="col-label">' + esc(d.label) + '</span></div>';
    }).join('') + '</div>';
  }

  function statusData(counts) {
    return counts.map(function (c) { return { label: c.label, value: c.value, color: STATUS_COLORS[c.label] || '#64748B' }; });
  }
  function priorityData(counts) {
    return counts.map(function (c) { return { label: c.label, value: c.value, color: PRIORITY_COLORS[c.label] || '#64748B' }; });
  }

  return {
    donut: donut, bars: bars, columns: columns, statusData: statusData, priorityData: priorityData,
    STATUS_COLORS: STATUS_COLORS, PRIORITY_COLORS: PRIORITY_COLORS
  };
})();
