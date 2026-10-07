/* ==========================================================================
   views-public.js — pages anyone can open: Landing, Login, Register,
   Admin Login, Forgot Password, public Track Complaint, 404 / error page.
   ========================================================================== */
window.CCMS = window.CCMS || {};
CCMS.Views = CCMS.Views || {};

(function () {
  var V = CCMS.Views, UI = CCMS.UI, U = CCMS.Util, esc = U.esc, Auth = CCMS.Auth, Store = CCMS.Store, CFG = CCMS.CONFIG, L = CCMS.Layout;

  /* ------------------------- shared tracking card ------------------------- */
  /** Complaint status card with progress tracker + timeline. Used by user and public tracking pages. */
  V.trackCard = function (c, opts) {
    opts = opts || {};
    var rows = [
      ['Complaint ID', '<strong>' + esc(c.id) + '</strong>'],
      ['Category', UI.catChip(c.category)],
      ['Title', esc(c.title)],
      ['Location', esc(c.location)],
      ['Submitted Date', esc(U.fmtDate(c.date))],
      ['Priority', UI.priorityBadge(c.priority)],
      ['Assigned To', UI.assignedText(c.assignedTo)],
      ['Current Status', UI.statusBadge(c.status)]
    ];
    var html = '<section class="card track-card" aria-label="Status of complaint ' + esc(c.id) + '">' +
      '<div class="card-head"><h2>' + esc(c.id) + '</h2>' + UI.statusBadge(c.status) + '</div>' +
      UI.tracker(c.status) +
      '<p class="last-updated">Last updated: <strong>' + esc(U.fmtDateTime(c.updatedAt)) + '</strong></p>' +
      UI.kv(rows) +
      '<div class="block"><h3>Description</h3><p class="prewrap">' + esc(c.description) + '</p></div>';
    if (c.remarks && !opts.hideRemarks) html += '<div class="block"><h3>Administrator remarks</h3><p class="prewrap">' + esc(c.remarks) + '</p></div>';
    html += '<div class="block"><h3>Activity timeline</h3>' + UI.timeline(c.timeline) + '</div>';
    if (opts.footer) html += '<div class="card-actions">' + opts.footer + '</div>';
    return html + '</section>';
  };

  /* ------------------------------ landing ------------------------------ */
  function heroArt() {
    return '<svg viewBox="0 0 480 420" role="img" aria-label="Illustration: a community member reports a problem on a phone and an administrator tracks it to resolution" class="hero-art">' +
      '<rect x="0" y="0" width="480" height="420" rx="28" fill="#E6F4F3"/>' +
      '<circle cx="390" cy="70" r="34" fill="#FDE68A"/>' +
      '<g fill="#0B2545"><rect x="30" y="250" width="54" height="110" rx="4" opacity=".9"/><rect x="92" y="215" width="62" height="145" rx="4" opacity=".75"/><rect x="330" y="235" width="58" height="125" rx="4" opacity=".8"/><rect x="396" y="270" width="54" height="90" rx="4" opacity=".9"/></g>' +
      '<g fill="#E6F4F3"><rect x="42" y="266" width="10" height="10"/><rect x="62" y="266" width="10" height="10"/><rect x="42" y="288" width="10" height="10"/><rect x="62" y="288" width="10" height="10"/><rect x="104" y="232" width="10" height="10"/><rect x="126" y="232" width="10" height="10"/><rect x="104" y="256" width="10" height="10"/><rect x="126" y="256" width="10" height="10"/><rect x="342" y="252" width="10" height="10"/><rect x="364" y="252" width="10" height="10"/><rect x="342" y="276" width="10" height="10"/><rect x="364" y="276" width="10" height="10"/></g>' +
      '<rect x="0" y="360" width="480" height="60" rx="0" fill="#0B2545"/><rect x="0" y="384" width="480" height="4" fill="#FDE68A" opacity=".8"/>' +
      '<g><rect x="160" y="60" width="160" height="290" rx="24" fill="#0B2545"/><rect x="168" y="76" width="144" height="258" rx="16" fill="#fff"/>' +
      '<rect x="180" y="92" width="120" height="68" rx="10" fill="#E6F4F3"/>' +
      '<path d="M240 100a16 16 0 0 0-16 16c0 12 16 28 16 28s16-16 16-28a16 16 0 0 0-16-16z" fill="#0E8C88"/><circle cx="240" cy="116" r="6" fill="#fff"/>' +
      '<rect x="180" y="174" width="86" height="9" rx="4.5" fill="#CBD5E1"/><rect x="180" y="192" width="120" height="9" rx="4.5" fill="#E2E8F0"/><rect x="180" y="210" width="100" height="9" rx="4.5" fill="#E2E8F0"/>' +
      '<rect x="180" y="238" width="120" height="34" rx="10" fill="#0E8C88"/><text x="240" y="260" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">Submit Complaint</text>' +
      '<rect x="180" y="288" width="120" height="30" rx="8" fill="#F1F5F9"/><circle cx="196" cy="303" r="6" fill="#15803D"/><rect x="210" y="299" width="70" height="8" rx="4" fill="#CBD5E1"/></g>' +
      '<g><rect x="12" y="110" width="132" height="58" rx="14" fill="#fff" stroke="#DCE3EA"/><text x="26" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#0B2545">CMP-2026-001</text><rect x="26" y="142" width="84" height="16" rx="8" fill="#DBEAFE"/><text x="68" y="154" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="700" fill="#1E40AF">In Progress</text></g>' +
      '<g><rect x="338" y="150" width="130" height="58" rx="14" fill="#fff" stroke="#DCE3EA"/><text x="352" y="172" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#0B2545">CMP-2026-003</text><rect x="352" y="182" width="72" height="16" rx="8" fill="#DCFCE7"/><text x="388" y="194" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="700" fill="#166534">Resolved</text></g>' +
      '</svg>';
  }

  V.landing = function () {
    var all = Store.Complaints.all(), st = CCMS.Complaints.stats(all);
    var features = [
      ['clipboard', 'Easy Complaint Registration', 'Report a problem in a minute with a simple form — category, description, location and a photograph.'],
      ['eye', 'Transparent Tracking', 'Follow every complaint from submission to resolution with a clear progress tracker and timeline.'],
      ['bolt', 'Faster Administration', 'Administrators see all complaints in one place, set priority, assign teams and update status quickly.'],
      ['file', 'Organized Records', 'Every complaint is stored with its full history, so nothing is forgotten, duplicated or lost.'],
      ['heart', 'Community Participation', 'Everyone can raise issues and see them being solved, building trust between members and administrators.']
    ].map(function (f) {
      return '<article class="feature card"><span class="feature-icon">' + UI.icon(f[0], 26) + '</span><h3>' + esc(f[1]) + '</h3><p>' + esc(f[2]) + '</p></article>';
    }).join('');

    var steps = [
      ['Register / Login', 'Create a free account or log in.'],
      ['Submit Complaint', 'Describe the problem and add a photo.'],
      ['Admin Reviews', 'The administrator checks the complaint and sets its priority.'],
      ['Complaint is Assigned', 'A responsible person or team is assigned.'],
      ['Issue is Resolved', 'You are notified when the work is finished.']
    ].map(function (s, i) {
      return '<li class="how-step"><span class="how-num">' + (i + 1) + '</span><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></li>';
    }).join('');

    var cats = CFG.CATEGORIES.map(function (c) {
      return '<li class="cat-card"><span class="cat-icon">' + UI.catIcon(c, 26) + '</span><span>' + esc(c) + '</span></li>';
    }).join('');

    var html =
      '<section class="hero" id="top"><div class="container hero-inner"><div class="hero-text">' +
      '<p class="eyebrow">Community Engagement Project</p>' +
      '<h1>Smart Community Complaint Management System</h1>' +
      '<p class="hero-sub">Report. Track. Resolve. Together.</p>' +
      '<p class="hero-desc">A simple digital platform for reporting community problems and tracking their resolution.</p>' +
      '<div class="hero-actions"><a class="btn btn-primary btn-lg" href="#/user/submit">' + UI.icon('plus', 20) + 'Report a Complaint</a>' +
      '<a class="btn btn-light btn-lg" href="#/track">' + UI.icon('search', 20) + 'Track Complaint</a></div>' +
      '<div class="hero-actions secondary"><a class="btn btn-outline-light" href="#/login">Login</a><a class="btn btn-outline-light" href="#/register">Register</a></div>' +
      '</div><div class="hero-visual">' + heroArt() + '</div></div></section>' +

      '<section class="stats-strip" aria-label="Live statistics"><div class="container stats-grid">' +
      '<div><strong>' + st.total + '</strong><span>Complaints registered</span></div>' +
      '<div><strong>' + st.resolved + '</strong><span>Resolved</span></div>' +
      '<div><strong>' + (st.pending + st.inProgress) + '</strong><span>Being handled</span></div>' +
      '<div><strong>' + CFG.CATEGORIES.length + '</strong><span>Categories supported</span></div></div></section>' +

      '<section class="section" id="features"><div class="container"><h2 class="section-title">Why Smart Complaint Management?</h2>' +
      '<p class="section-sub">Phone calls and group messages get forgotten. A shared system keeps every complaint visible until it is solved.</p>' +
      '<div class="feature-grid">' + features + '</div></div></section>' +

      '<section class="section alt" id="how-it-works"><div class="container"><h2 class="section-title">How It Works</h2>' +
      '<p class="section-sub">Five simple steps from problem to solution.</p><ol class="how-grid">' + steps + '</ol></div></section>' +

      '<section class="section" id="categories"><div class="container"><h2 class="section-title">Supported Complaint Categories</h2>' +
      '<p class="section-sub">Choose the category that best matches your problem.</p><ul class="cat-grid">' + cats + '</ul>' +
      '<div class="center mt"><a class="btn btn-primary btn-lg" href="#/user/submit">Report a Complaint</a></div></div></section>';

    return { title: 'Report. Track. Resolve. Together.', html: L.publicPage(html) };
  };

  /* ------------------------------ auth pages ------------------------------ */
  function authPage(opts) {
    return L.publicPage('<section class="auth-wrap ' + (opts.admin ? 'auth-admin' : '') + '"><div class="container auth-inner">' +
      '<div class="auth-side"><span class="auth-badge">' + UI.icon(opts.admin ? 'shield' : 'pin', 28) + '</span><h2>' + esc(opts.sideTitle) + '</h2><p>' + esc(opts.sideText) + '</p>' + (opts.sideExtra || '') + '</div>' +
      '<div class="auth-card card">' + opts.body + '</div></div></section>');
  }

  /** Where to go after login: the page the user wanted (if allowed for their role), else their dashboard. */
  function afterLogin(user, next) {
    if (next && ((next.indexOf('/user/') === 0 && user.role === 'user') || (next.indexOf('/admin/') === 0 && user.role === 'admin'))) return next;
    return Auth.homeFor(user);
  }

  function bindDemoFill(form) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-fill]'), function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-fill').split('|');
        form.elements.email.value = p[0];
        form.elements.password.value = p[1];
        UI.clearErrors(form);
        form.elements.email.focus();
      });
    });
  }

  function loginSubmit(form, ctx, adminOnly) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      UI.clearErrors(form);
      var email = form.elements.email.value.trim(), pw = form.elements.password.value, errors = {};
      if (!email) errors.email = 'Please enter your email address.';
      else if (!Auth.isEmail(email)) errors.email = 'Enter a valid email address, for example name@example.com.';
      if (!pw) errors.password = 'Please enter your password.';
      if (Object.keys(errors).length) { UI.showErrors(form, errors); return; }

      var r = Auth.login(email, pw, form.elements.remember && form.elements.remember.checked);
      if (!r.ok) { UI.showErrors(form, { _form: r.error }); return; }
      if (adminOnly && r.user.role !== 'admin') {
        Auth.logout();
        UI.showErrors(form, { _form: 'This account is not an administrator. Please use the normal login page.' });
        return;
      }
      UI.toast('Welcome, ' + r.user.name + '!', 'success');
      CCMS.Router.go(afterLogin(r.user, ctx.query.next));
    });
  }

  V.login = function (ctx) {
    var body = '<h1>Login</h1><p class="muted">Log in to submit and track your complaints.</p>' +
      '<form id="login-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'username', placeholder: 'name@example.com' }) +
      UI.field({ id: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'current-password' }) +
      '<div class="row-between"><label class="check"><input type="checkbox" name="remember" id="remember"> Remember me</label><a href="#/forgot">Forgot Password?</a></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Login</button></form>' +
      '<p class="alt-link">New here? <a href="#/register">Create an account</a></p>' +
      '<div class="demo-box"><p><strong>Demo accounts</strong> (prototype only)</p><div class="demo-btns">' +
      '<button type="button" class="btn btn-secondary btn-sm" data-fill="user@gmail.com|user123">Fill user login</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-fill="admin@gmail.com|admin123">Fill admin login</button></div>' +
      '<p class="hint">User: user@gmail.com / user123<br>Admin: admin@gmail.com / admin123</p></div>';
    return {
      title: 'Login',
      html: authPage({ sideTitle: 'Welcome back', sideText: 'Log in to report new problems, follow their progress and see your complaint history.', body: body }),
      mount: function () { var f = document.getElementById('login-form'); loginSubmit(f, ctx, false); bindDemoFill(f); }
    };
  };

  V.adminLogin = function (ctx) {
    var body = '<h1>Administrator Login</h1><p class="muted">Authorised administrators only.</p>' +
      '<form id="admin-login-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'email', label: 'Administrator email', type: 'email', required: true, autocomplete: 'username' }) +
      UI.field({ id: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'current-password' }) +
      '<label class="check"><input type="checkbox" name="remember" id="remember"> Remember me</label>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Login to Admin Console</button></form>' +
      '<p class="alt-link"><a href="#/login">← Community member login</a></p>' +
      '<div class="demo-box"><p><strong>Demo administrator</strong> (prototype only)</p><div class="demo-btns"><button type="button" class="btn btn-secondary btn-sm" data-fill="admin@gmail.com|admin123">Fill admin login</button></div>' +
      '<p class="hint">admin@gmail.com / admin123</p></div>';
    return {
      title: 'Administrator Login',
      html: authPage({ admin: true, sideTitle: 'Admin Console', sideText: 'Review complaints, set priorities, assign teams and keep the community informed.', body: body }),
      mount: function () { var f = document.getElementById('admin-login-form'); loginSubmit(f, ctx, true); bindDemoFill(f); }
    };
  };

  V.register = function () {
    var body = '<h1>Create your account</h1><p class="muted">Registration is free and takes less than a minute.</p>' +
      '<form id="register-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'name', label: 'Full Name', required: true, autocomplete: 'name', placeholder: 'e.g. Rohan Deshmukh' }) +
      '<div class="grid-2">' +
      UI.field({ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email', placeholder: 'name@example.com' }) +
      UI.field({ id: 'mobile', label: 'Mobile Number', type: 'tel', required: true, autocomplete: 'tel', placeholder: '10-digit number', attrs: 'inputmode="numeric" maxlength="10"' }) +
      UI.field({ id: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 6 characters.' }) +
      UI.field({ id: 'confirm', label: 'Confirm Password', type: 'password', required: true, autocomplete: 'new-password' }) + '</div>' +
      UI.field({ id: 'community', label: 'Community / College / Society Name', required: true, placeholder: 'e.g. Green Valley Society' }) +
      '<p class="hint">Your role will be set to <strong>Community User</strong>.</p>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Register</button></form>' +
      '<p class="alt-link">Already have an account? <a href="#/login">Login</a></p>';
    return {
      title: 'Register',
      html: authPage({ sideTitle: 'Join your community', sideText: 'Create an account to report problems in your society or campus and see them get solved.', body: body }),
      mount: function () {
        var f = document.getElementById('register-form');
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          UI.clearErrors(f);
          var r = Auth.register({
            name: f.elements.name.value, email: f.elements.email.value, mobile: f.elements.mobile.value,
            password: f.elements.password.value, confirm: f.elements.confirm.value, community: f.elements.community.value
          });
          if (!r.ok) { UI.showErrors(f, r.errors); return; }
          Store.Session.set(r.user.id, false);
          UI.toast('Account created. Welcome, ' + r.user.name + '!', 'success');
          CCMS.Router.go('/user/dashboard');
        });
      }
    };
  };

  V.forgot = function () {
    var body = '<h1>Reset password</h1><p class="muted">Enter your registered email and choose a new password.</p>' +
      '<p class="notice">Prototype note: no email is sent. The password is reset directly in this browser.</p>' +
      '<form id="forgot-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'email', label: 'Registered email', type: 'email', required: true }) +
      UI.field({ id: 'password', label: 'New password', type: 'password', required: true, hint: 'At least 6 characters.', autocomplete: 'new-password' }) +
      UI.field({ id: 'confirm', label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password' }) +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Reset Password</button></form>' +
      '<p class="alt-link"><a href="#/login">← Back to login</a></p>';
    return {
      title: 'Forgot Password',
      html: authPage({ sideTitle: 'Forgot your password?', sideText: 'It happens. Set a new password and get back to your complaints.', body: body }),
      mount: function () {
        var f = document.getElementById('forgot-form');
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          UI.clearErrors(f);
          var errs = {}, email = f.elements.email.value.trim();
          if (!email) errs.email = 'Please enter your email address.';
          else if (!Auth.isEmail(email)) errs.email = 'Enter a valid email address.';
          if (f.elements.password.value.length < 6) errs.password = 'Password must be at least 6 characters long.';
          if (f.elements.confirm.value !== f.elements.password.value) errs.confirm = 'Passwords do not match.';
          if (Object.keys(errs).length) { UI.showErrors(f, errs); return; }
          var r = Auth.resetPassword(email, f.elements.password.value);
          if (!r.ok) { UI.showErrors(f, { email: r.error }); return; }
          UI.toast('Password updated. Please log in.', 'success');
          CCMS.Router.go('/login');
        });
      }
    };
  };

  /* ------------------------- public tracking page ------------------------- */
  V.publicTrack = function (ctx) {
    var preset = ctx.params.id || '';
    var body = '<section class="section"><div class="container narrow"><h1 class="section-title">Track Complaint</h1>' +
      '<p class="section-sub">Enter your Complaint ID (for example <strong>CMP-2026-001</strong>) to see its current status.</p>' +
      '<form id="track-form" class="track-form card" novalidate>' +
      UI.field({ id: 'cid', label: 'Complaint ID', required: true, value: preset, placeholder: 'CMP-2026-001', cls: 'grow' }) +
      '<button class="btn btn-primary" type="submit">' + UI.icon('search', 18) + 'Track</button></form>' +
      '<div id="track-result" aria-live="polite"></div></div></section>';
    return {
      title: 'Track Complaint',
      html: L.publicPage(body),
      mount: function () {
        var f = document.getElementById('track-form'), out = document.getElementById('track-result');
        function run() {
          var id = f.elements.cid.value.trim();
          UI.setError('cid', '');
          if (!id) { UI.setError('cid', 'Please enter a Complaint ID.'); out.innerHTML = ''; return; }
          var c = Store.Complaints.byId(id);
          if (!c) {
            out.innerHTML = UI.emptyState('Complaint not found', 'We could not find a complaint with ID "' + id + '". Please check the ID and try again.');
            return;
          }
          var user = Auth.currentUser();
          var extra = user ? '' : '<a class="btn btn-secondary" href="#/login">Login to see full details</a>';
          out.innerHTML = V.trackCard(c, { hideRemarks: true, footer: extra });
        }
        f.addEventListener('submit', function (e) { e.preventDefault(); run(); });
        if (preset) run();
      }
    };
  };

  /* ------------------------------ errors ------------------------------ */
  V.notFound = function () {
    var user = Auth.currentUser();
    return {
      title: 'Page not found',
      html: L.publicPage('<section class="section"><div class="container narrow center">' + UI.emptyState('Page not found', 'The page you are looking for does not exist.',
        '<a class="btn btn-primary" href="#' + (user ? Auth.homeFor(user) : '/') + '">Go to ' + (user ? 'Dashboard' : 'Home') + '</a>') + '</div></section>')
    };
  };

  V.errorPage = function () {
    return {
      title: 'Something went wrong',
      html: L.publicPage('<section class="section"><div class="container narrow center">' + UI.emptyState('Something went wrong', 'Please go back to the home page and try again.',
        '<a class="btn btn-primary" href="#/">Home</a>') + '</div></section>')
    };
  };
})();
