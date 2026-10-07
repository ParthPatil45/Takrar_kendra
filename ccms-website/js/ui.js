/* ==========================================================================
   ui.js — reusable interface pieces: icons, badges, form fields, tables,
   progress tracker, timeline, toast messages, image processing
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.UI = (function () {
  var U = CCMS.Util, esc = U.esc, CFG = CCMS.CONFIG;

  /* ------------------------------ icons ------------------------------ */
  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    road: '<path d="M4 22L8 2"/><path d="M20 22L16 2"/><path d="M12 6v2"/><path d="M12 12v2"/><path d="M12 18v2"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'
  };

  function icon(name, size) {
    size = size || 20;
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.more) + '</svg>';
  }

  var CAT_ICON = {
    'Road / Pothole': 'road', 'Street Light': 'bulb', 'Water Leakage': 'droplet', 'Garbage': 'trash',
    'Drainage': 'layers', 'Sanitation': 'shield', 'Electricity': 'bolt', 'Other': 'more'
  };
  function catIcon(cat, size) { return icon(CAT_ICON[cat] || 'more', size); }

  /* ------------------------------ badges ------------------------------ */
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function statusBadge(s) {
    return '<span class="badge st-' + slug(s) + '"><span class="dot" aria-hidden="true"></span>' + esc(s) + '</span>';
  }
  function priorityBadge(p) {
    var label = (!p || p === 'Not Set') ? 'Not set' : p;
    return '<span class="badge pr-' + slug(p || 'not-set') + '">' + esc(label) + '</span>';
  }
  function assignedText(a) { return a ? esc(a) : '<span class="muted">Not assigned</span>'; }

  /* ------------------------------ toast ------------------------------ */
  function toast(message, type) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = icon(type === 'error' ? 'alert' : 'check-circle', 18) + '<span>' + esc(message) + '</span>';
    host.appendChild(t);
    setTimeout(function () { t.classList.add('hide'); }, 3800);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4300);
  }

  /* --------------------------- form helpers --------------------------- */
  function options(list, selected, placeholder) {
    var html = placeholder != null ? '<option value="">' + esc(placeholder) + '</option>' : '';
    list.forEach(function (o) {
      var val = typeof o === 'string' ? o : o.value;
      var lab = typeof o === 'string' ? o : o.label;
      html += '<option value="' + esc(val) + '"' + (val === selected ? ' selected' : '') + '>' + esc(lab) + '</option>';
    });
    return html;
  }

  /**
   * Build a labelled form field with its own error message area.
   * o: {id,label,type,value,placeholder,required,hint,list,rows,autocomplete,attrs,readonly}
   */
  function field(o) {
    var id = o.id, type = o.type || 'text';
    var describedBy = (o.hint ? id + '-hint ' : '') + id + '-err';
    var common = ' id="' + id + '" name="' + id + '"' + (o.required ? ' aria-required="true"' : '') +
      ' aria-describedby="' + describedBy + '"' + (o.readonly ? ' readonly' : '') + (o.attrs ? ' ' + o.attrs : '');
    var control;
    if (type === 'select') {
      control = '<select' + common + '>' + options(o.list || [], o.value, o.placeholder) + '</select>';
    } else if (type === 'textarea') {
      control = '<textarea' + common + ' rows="' + (o.rows || 4) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' + esc(o.value || '') + '</textarea>';
    } else {
      control = '<input type="' + type + '"' + common + ' value="' + esc(o.value || '') + '"' +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
        (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') + '>';
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label for="' + id + '">' + esc(o.label) +
      (o.required ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + control +
      (o.hint ? '<p class="hint" id="' + id + '-hint">' + esc(o.hint) + '</p>' : '') +
      '<p class="error-msg" id="' + id + '-err" role="alert"></p></div>';
  }

  function setError(id, msg) {
    var el = document.getElementById(id), err = document.getElementById(id + '-err');
    if (el) {
      if (msg) { el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true'); }
      else { el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); }
    }
    if (err) err.textContent = msg || '';
  }
  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (el) { el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); });
    Array.prototype.forEach.call(form.querySelectorAll('.error-msg'), function (el) { el.textContent = ''; });
    var fe = form.querySelector('.form-error');
    if (fe) { fe.textContent = ''; fe.hidden = true; }
  }
  /** Show errors object {fieldId: message}; focuses the first invalid field. */
  function showErrors(form, errors) {
    var first = null;
    Object.keys(errors).forEach(function (id) {
      if (id === '_form') {
        var fe = form.querySelector('.form-error');
        if (fe) { fe.textContent = errors[id]; fe.hidden = false; }
        return;
      }
      setError(id, errors[id]);
      if (!first) first = document.getElementById(id);
    });
    if (first) first.focus();
  }

  /* ------------------------------ tables ------------------------------ */
  function emptyState(title, text, actionHtml) {
    return '<div class="empty">' + icon('clipboard', 36) + '<h3>' + esc(title) + '</h3><p>' + esc(text || '') + '</p>' + (actionHtml || '') + '</div>';
  }

  /** cols: [{label, render(item)}]. On phones each row turns into a card using data-label. */
  function table(cols, items, emptyTitle, emptyText) {
    if (!items.length) return emptyState(emptyTitle || 'Nothing to show', emptyText || '');
    var head = cols.map(function (c) { return '<th scope="col">' + esc(c.label) + '</th>'; }).join('');
    var body = items.map(function (it) {
      return '<tr>' + cols.map(function (c) {
        return '<td data-label="' + esc(c.label) + '">' + c.render(it) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="table-wrap"><table class="data"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function catChip(cat) { return '<span class="cat-chip">' + catIcon(cat, 16) + '<span>' + esc(cat) + '</span></span>'; }

  /* ----------------- progress tracker and timeline ----------------- */
  function tracker(status) {
    var idx = CCMS.Complaints.stageIndex(status);
    var items = CCMS.Complaints.STAGES.map(function (label, i) {
      var cls = i < idx ? 'done' : (i === idx ? 'current' : 'todo');
      var state = i < idx ? 'completed' : (i === idx ? 'current stage' : 'not reached yet');
      var inner = (i < idx || (i === idx && status === 'Resolved')) ? icon('check', 16) : '<span>' + (i + 1) + '</span>';
      return '<li class="step ' + cls + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="step-dot">' + inner +
        '</span><span class="step-label">' + esc(label) + '<span class="sr-only"> — ' + state + '</span></span></li>';
    }).join('');
    return '<ol class="tracker' + (status === 'Resolved' ? ' is-resolved' : '') + '" aria-label="Complaint progress">' + items + '</ol>';
  }

  function timeline(entries) {
    var list = (entries || []).slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    if (!list.length) return '<p class="muted">No activity yet.</p>';
    return '<ol class="timeline">' + list.map(function (t, i) {
      var last = i === list.length - 1;
      return '<li class="' + (last ? 'latest' : '') + '"><span class="tl-dot" aria-hidden="true"></span><div><p class="tl-text">' + esc(t.text) +
        '</p><p class="tl-date"><time datetime="' + esc(t.date) + '">' + esc(U.fmtDateTime(t.date)) + '</time></p></div></li>';
    }).join('') + '</ol>';
  }

  function photo(c) {
    if (c.image && /^data:image\/(jpeg|png|webp);base64,/.test(c.image)) {
      return '<img class="photo" src="' + esc(c.image) + '" alt="Photograph submitted with complaint ' + esc(c.id) + ': ' + esc(c.title) + '">';
    }
    return '<div class="photo-none">' + icon('camera', 28) + '<p>No photograph was uploaded with this complaint.</p></div>';
  }

  /* ------------------------ image processing ------------------------ */
  /** Check type and size. Returns an error message or ''. */
  function validateImage(file) {
    if (!file) return '';
    if (CFG.ALLOWED_IMAGE_TYPES.indexOf(file.type) === -1) return 'Please upload a JPG, PNG or WebP image.';
    if (file.size > CFG.MAX_IMAGE_BYTES) return 'The image is too large. Please choose a photo smaller than ' + Math.round(CFG.MAX_IMAGE_BYTES / 1048576) + ' MB.';
    return '';
  }

  /** Resize to keep localStorage small. Resolves with a JPEG data URL. */
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Could not read the file.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('This file is not a valid image.')); };
        img.onload = function () {
          var max = CFG.IMAGE_MAX_DIMENSION, sc = Math.min(1, max / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          var ctx = cv.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL('image/jpeg', 0.8));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /** Small key/value list used on detail pages. rows: [[label, htmlValue], ...] */
  function kv(rows) {
    return '<dl class="kv">' + rows.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  return {
    icon: icon, catIcon: catIcon, slug: slug, statusBadge: statusBadge, priorityBadge: priorityBadge, assignedText: assignedText,
    toast: toast, options: options, field: field, setError: setError, clearErrors: clearErrors, showErrors: showErrors,
    emptyState: emptyState, table: table, catChip: catChip, tracker: tracker, timeline: timeline, photo: photo,
    validateImage: validateImage, readImage: readImage, kv: kv
  };
})();
