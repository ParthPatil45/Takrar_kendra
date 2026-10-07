/* ==========================================================================
   router.js — tiny hash router (#/path?query)

   Each route has a pattern such as "/user/complaint/:id", an optional "role"
   ('user' or 'admin') and a view function that returns {title, html, mount}.
   Access rules (who may open which page) live in app.js via setGuard().
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Router = (function () {
  var routes = [];
  var guard = null;
  var root = null;

  function add(pattern, opts) {
    opts = opts || {};
    opts.pattern = pattern;
    opts.segs = pattern.split('/').filter(Boolean);
    routes.push(opts);
  }

  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var parts = h.split('?');
    var query = {};
    try {
      new URLSearchParams(parts[1] || '').forEach(function (v, k) { query[k] = v; });
    } catch (e) { /* ignore */ }
    return { path: parts[0] || '/', query: query };
  }

  function matchRoute(r, path) {
    var parts = path.split('/').filter(Boolean);
    if (parts.length !== r.segs.length) return null;
    var params = {};
    for (var i = 0; i < parts.length; i++) {
      if (r.segs[i].charAt(0) === ':') {
        try { params[r.segs[i].slice(1)] = decodeURIComponent(parts[i]); } catch (e) { params[r.segs[i].slice(1)] = parts[i]; }
      } else if (r.segs[i] !== parts[i]) return null;
    }
    return params;
  }

  function go(path, replace) {
    var target = '#' + path;
    if (location.hash === target) { resolve(); return; }
    if (replace) location.replace(target); else location.hash = target;
  }

  function refresh() { resolve(); }

  function resolve() {
    var cur = parseHash(), found = null, params = null;
    for (var i = 0; i < routes.length; i++) {
      params = matchRoute(routes[i], cur.path);
      if (params) { found = routes[i]; break; }
    }
    var ctx = { path: cur.path, query: cur.query, params: params || {} };

    if (found && guard) {
      var redirect = guard(found, ctx);
      if (redirect) { go(redirect, true); return; }
    }
    render(found, ctx);
  }

  function render(route, ctx) {
    var view;
    try {
      view = route ? route.view(ctx) : CCMS.Views.notFound(ctx);
    } catch (err) {
      console.error(err);
      view = CCMS.Views.errorPage();
    }
    root.innerHTML = view.html;
    document.title = (view.title ? view.title + ' · ' : '') + CCMS.CONFIG.APP_NAME;
    document.body.classList.toggle('is-app', !!document.querySelector('.app-shell'));
    CCMS.Layout.bindShell();
    try { if (view.mount) view.mount(ctx); } catch (err2) { console.error(err2); }

    var scrollTo = CCMS.pendingScroll;
    CCMS.pendingScroll = null;
    var target = scrollTo && scrollTo !== 'top' ? document.getElementById(scrollTo) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  function start(rootEl, guardFn) {
    root = rootEl;
    guard = guardFn;
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add: add, go: go, refresh: refresh, start: start, resolve: resolve };
})();
