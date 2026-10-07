/* ==========================================================================
   layout.js — page frames: public header/footer and the dashboard shell
   (sidebar + top bar + notifications) used by the user and admin areas.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Layout = (function () {
  var UI = CCMS.UI, U = CCMS.Util, esc = U.esc, Store = CCMS.Store, Auth = CCMS.Auth;

  function brand(light) {
    return '<a class="brand' + (light ? ' brand-light' : '') + '" href="#/" aria-label="Smart Community Complaint Management System — home">' +
      '<span class="brand-mark">' + UI.icon('pin', 20) + '</span>' +
      '<span class="brand-text"><strong>Smart Complaint</strong><small>Management System</small></span></a>';
  }

  /* ------------------------------ public pages ------------------------------ */
  function publicHeader() {
    var user = Auth.currentUser();
    var right = user
      ? '<a class="btn btn-secondary btn-sm" href="#' + Auth.homeFor(user) + '">Go to Dashboard</a><button class="btn btn-ghost btn-sm" type="button" data-action="logout">Logout</button>'
      : '<a class="btn btn-ghost btn-sm" href="#/login">Login</a><a class="btn btn-primary btn-sm" href="#/register">Register</a>';
    return '<header class="site-header"><div class="container header-inner">' + brand() +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">' + UI.icon('menu', 24) + '</button>' +
      '<nav id="site-nav" class="site-nav" aria-label="Main">' +
      '<a href="#/" data-scroll="top">Home</a>' +
      '<a href="#/" data-scroll="features">Features</a>' +
      '<a href="#/" data-scroll="how-it-works">How It Works</a>' +
      '<a href="#/" data-scroll="categories">Categories</a>' +
      '<a href="#/track">Track Complaint</a>' +
      '<span class="nav-actions">' + right + '</span></nav></div></header>';
  }

  function publicFooter() {
    return '<footer class="site-footer"><div class="container footer-inner"><div>' +
      '<p class="footer-title">Smart Community Complaint Management System</p>' +
      '<p>Community Engagement Project (CEP)</p>' +
      '<p class="footer-note">Prototype for academic demonstration. Data is stored only in this browser. No real SMS or email is sent.</p></div>' +
      '<nav class="footer-links" aria-label="Footer"><a href="#/login">Login</a><a href="#/register">Register</a><a href="#/track">Track Complaint</a><a href="#/admin-login">Administrator Login</a></nav></div></footer>';
  }

  function publicPage(content) {
    return publicHeader() + '<main id="main" tabindex="-1">' + content + '</main>' + publicFooter();
  }

  /* ------------------------------ dashboard shell ------------------------------ */
  var USER_NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'home', href: '/user/dashboard' },
    { key: 'submit', label: 'Submit Complaint', icon: 'plus', href: '/user/submit' },
    { key: 'complaints', label: 'My Complaints', icon: 'list', href: '/user/complaints' },
    { key: 'track', label: 'Track Complaint', icon: 'search', href: '/user/track' },
    { key: 'history', label: 'Complaint History', icon: 'clock', href: '/user/history' },
    { key: 'profile', label: 'Profile', icon: 'user', href: '/user/profile' }
  ];
  var ADMIN_NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'home', href: '/admin/dashboard' },
    { key: 'all', label: 'All Complaints', icon: 'list', href: '/admin/list/all' },
    { key: 'pending', label: 'Pending', icon: 'clock', href: '/admin/list/pending', count: 'pending' },
    { key: 'inprogress', label: 'In Progress', icon: 'tool', href: '/admin/list/inprogress' },
    { key: 'resolved', label: 'Resolved', icon: 'check-circle', href: '/admin/list/resolved' },
    { key: 'high', label: 'High Priority', icon: 'flag', href: '/admin/list/high' },
    { key: 'users', label: 'Users', icon: 'users', href: '/admin/users' },
    { key: 'analytics', label: 'Reports / Analytics', icon: 'chart', href: '/admin/analytics' },
    { key: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }
  ];

  function notificationPanel(user) {
    var list = Store.Notifications.forUser(user.id).slice(0, 15);
    var unread = Store.Notifications.unreadCount(user.id);
    var items = list.length ? list.map(function (n) {
      return '<li><button type="button" class="notif-item' + (n.read ? '' : ' unread') + '" data-notif="' + esc(n.id) + '" data-msg="' + esc(n.message) + '">' +
        '<span class="notif-msg">' + esc(n.message) + '</span><span class="notif-date">' + esc(U.fmtDateTime(n.date)) + '</span></button></li>';
    }).join('') : '<li class="notif-empty">You have no notifications yet.</li>';
    return '<div class="notif-wrap"><button class="icon-btn" type="button" id="notif-btn" aria-haspopup="true" aria-expanded="false" aria-controls="notif-panel" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' +
      UI.icon('bell', 22) + (unread ? '<span class="notif-count" aria-hidden="true">' + unread + '</span>' : '') + '</button>' +
      '<div class="notif-panel" id="notif-panel" hidden><div class="notif-head"><strong>Notifications</strong>' +
      (unread ? '<button type="button" class="link-btn" id="notif-readall">Mark all as read</button>' : '') + '</div><ul>' + items + '</ul>' +
      '<p class="notif-foot">In-app messages only. SMS and email are not connected in this prototype.</p></div></div>';
  }

  /**
   * Wrap page content in the dashboard shell.
   * o: {role:'user'|'admin', nav:key, title, subtitle, actions, content}
   */
  function appPage(o) {
    var user = Auth.currentUser();
    var isAdmin = o.role === 'admin';
    var items = isAdmin ? ADMIN_NAV : USER_NAV;
    var pending = isAdmin ? CCMS.Complaints.stats(Store.Complaints.all()).pending : 0;
    var org = Store.Settings.get().orgName;

    var links = items.map(function (n) {
      var badge = n.count === 'pending' && pending ? '<span class="nav-count">' + pending + '</span>' : '';
      return '<li><a href="#' + n.href + '" class="side-link' + (o.nav === n.key ? ' active' : '') + '"' + (o.nav === n.key ? ' aria-current="page"' : '') + '>' +
        UI.icon(n.icon, 20) + '<span>' + esc(n.label) + '</span>' + badge + '</a></li>';
    }).join('');

    return '<div class="app-shell ' + (isAdmin ? 'role-admin' : 'role-user') + '">' +
      '<div class="scrim" id="scrim"></div>' +
      '<aside class="sidebar" id="sidebar" aria-label="Sidebar">' +
      '<div class="side-top">' + brand(true) + '<button class="icon-btn side-close" type="button" id="side-close" aria-label="Close menu">' + UI.icon('x', 22) + '</button></div>' +
      (isAdmin ? '<p class="role-tag">Administrator</p>' : '<p class="role-tag user">Community Member</p>') +
      '<nav aria-label="' + (isAdmin ? 'Administrator' : 'User') + ' navigation"><ul class="side-links">' + links + '</ul></nav>' +
      '<div class="side-bottom"><div class="side-user"><span class="avatar" aria-hidden="true">' + esc(U.initials(user.name)) + '</span>' +
      '<span class="side-user-text"><strong>' + esc(user.name) + '</strong><small>' + esc(U.truncate(org, 30)) + '</small></span></div>' +
      '<button class="side-link logout" type="button" data-action="logout">' + UI.icon('logout', 20) + '<span>Logout</span></button></div></aside>' +
      '<div class="app-main"><header class="topbar"><button class="icon-btn menu-btn" type="button" id="menu-btn" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">' + UI.icon('menu', 24) + '</button>' +
      '<div class="topbar-title"><span class="topbar-app">' + (isAdmin ? 'Admin Console' : 'My Account') + '</span></div>' +
      '<div class="topbar-right">' + notificationPanel(user) + '</div></header>' +
      '<main id="main" tabindex="-1" class="content"><div class="page-head"><div><h1>' + esc(o.title) + '</h1>' +
      (o.subtitle ? '<p class="subtitle">' + o.subtitle + '</p>' : '') + '</div>' + (o.actions ? '<div class="page-actions">' + o.actions + '</div>' : '') + '</div>' +
      o.content + '</main></div></div>';
  }

  /** Attach events for the shell (menu, notifications). Called after every render. */
  function bindShell() {
    var shell = document.querySelector('.app-shell');
    var header = document.querySelector('.site-header');

    if (header) {
      var tg = header.querySelector('.nav-toggle'), nav = header.querySelector('.site-nav');
      tg.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        tg.setAttribute('aria-expanded', open ? 'true' : 'false');
        tg.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) { nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); }
      });
    }
    if (!shell) return;

    var menuBtn = document.getElementById('menu-btn'), scrim = document.getElementById('scrim'), closeBtn = document.getElementById('side-close');
    function setNav(open) {
      shell.classList.toggle('nav-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    menuBtn.addEventListener('click', function () { setNav(!shell.classList.contains('nav-open')); });
    scrim.addEventListener('click', function () { setNav(false); });
    closeBtn.addEventListener('click', function () { setNav(false); menuBtn.focus(); });
    document.getElementById('sidebar').addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });

    var btn = document.getElementById('notif-btn'), panel = document.getElementById('notif-panel');
    function setPanel(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setPanel(panel.hidden); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    CCMS.Layout._closePanel = function () { if (panel && !panel.hidden) setPanel(false); };

    var all = document.getElementById('notif-readall');
    if (all) all.addEventListener('click', function () {
      var u = Auth.currentUser();
      Store.Notifications.markAllRead(u.id);
      CCMS.Router.refresh();
    });
    Array.prototype.forEach.call(panel.querySelectorAll('[data-notif]'), function (b) {
      b.addEventListener('click', function () {
        var u = Auth.currentUser();
        Store.Notifications.markRead(b.getAttribute('data-notif'));
        var m = /CMP-\d{4}-\d{3}/.exec(b.getAttribute('data-msg') || '');
        if (m) CCMS.Router.go((u.role === 'admin' ? '/admin/complaint/' : '/user/complaint/') + m[0]);
        else CCMS.Router.refresh();
      });
    });
  }

  return { publicPage: publicPage, appPage: appPage, bindShell: bindShell, brand: brand, _closePanel: null };
})();
