/* ==========================================================================
   app.js — start-up: routes, access rules, global click handlers

   ACCESS RULES (client-side only — see storage.js note):
   • /user/*  pages need a logged-in community user
   • /admin/* pages need a logged-in administrator
   • login / register pages redirect away if you are already logged in
   In a real system the SERVER must enforce these rules.
   ========================================================================== */
(function () {
  var R = CCMS.Router, V = CCMS.Views, Auth = CCMS.Auth, UI = CCMS.UI;

  CCMS.Store.init();

  /* --------------------------- route table --------------------------- */
  // public
  R.add('/', { view: V.landing });
  R.add('/login', { view: V.login, guestOnly: true });
  R.add('/register', { view: V.register, guestOnly: true });
  R.add('/admin-login', { view: V.adminLogin, guestOnly: true });
  R.add('/forgot', { view: V.forgot, guestOnly: true });
  R.add('/track', { view: V.publicTrack });
  R.add('/track/:id', { view: V.publicTrack });

  // community user
  R.add('/user/dashboard', { role: 'user', view: V.userDashboard });
  R.add('/user/submit', { role: 'user', view: V.userSubmit });
  R.add('/user/complaints', { role: 'user', view: V.userComplaints });
  R.add('/user/complaint/:id', { role: 'user', view: V.userComplaint });
  R.add('/user/track', { role: 'user', view: V.userTrack });
  R.add('/user/track/:id', { role: 'user', view: V.userTrack });
  R.add('/user/history', { role: 'user', view: V.userHistory });
  R.add('/user/profile', { role: 'user', view: V.userProfile });

  // administrator
  R.add('/admin/dashboard', { role: 'admin', view: V.adminDashboard });
  R.add('/admin/list/:filter', { role: 'admin', view: V.adminList });
  R.add('/admin/complaint/:id', { role: 'admin', view: V.adminComplaint });
  R.add('/admin/users', { role: 'admin', view: V.adminUsers });
  R.add('/admin/analytics', { role: 'admin', view: V.adminAnalytics });
  R.add('/admin/settings', { role: 'admin', view: V.adminSettings });

  /* --------------------------- access guard --------------------------- */
  function guard(route, ctx) {
    var user = Auth.currentUser();

    if (route.guestOnly && user) return Auth.homeFor(user);

    if (route.role) {
      if (!user) {
        var next = encodeURIComponent(ctx.path);
        return (route.role === 'admin' ? '/admin-login' : '/login') + '?next=' + next;
      }
      if (user.role !== route.role) {
        UI.toast('That page is not available for your account.', 'error');
        return Auth.homeFor(user);
      }
    }
    return null;
  }

  /* --------------------------- global events --------------------------- */
  document.addEventListener('click', function (e) {
    var out = e.target.closest('[data-action="logout"]');
    if (out) {
      Auth.logout();
      UI.toast('You have been logged out.', 'success');
      R.go('/');
      return;
    }

    // landing-page section links (hash routing means we scroll with JS)
    var sc = e.target.closest('[data-scroll]');
    if (sc) {
      e.preventDefault();
      var id = sc.getAttribute('data-scroll');
      if (location.hash === '' || location.hash === '#/' || location.hash === '#') {
        var el = id === 'top' ? null : document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        CCMS.pendingScroll = id;
        R.go('/');
      }
      var nav = document.getElementById('site-nav');
      if (nav) nav.classList.remove('open');
      return;
    }

    // close the notification panel when clicking elsewhere
    if (CCMS.Layout._closePanel && !e.target.closest('.notif-wrap')) CCMS.Layout._closePanel();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (CCMS.Layout._closePanel) CCMS.Layout._closePanel();
      var shellEl = document.querySelector('.app-shell.nav-open');
      if (shellEl) shellEl.classList.remove('nav-open');
    }
  });

  document.getElementById('skip-link').addEventListener('click', function (e) {
    e.preventDefault();
    var m = document.getElementById('main');
    if (m) { m.focus(); m.scrollIntoView(); }
  });

  // log in/out in another tab → update this tab
  window.addEventListener('storage', function (e) {
    if (e.key === CCMS.Store.KEYS.session) R.refresh();
  });

  R.start(document.getElementById('app'), guard);
})();
