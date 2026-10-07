/* ==========================================================================
   views-user.js — community user area:
   Dashboard, Submit Complaint, My Complaints, Complaint Details,
   Track Complaint, Complaint History, Profile
   ========================================================================== */
window.CCMS = window.CCMS || {};
CCMS.Views = CCMS.Views || {};

(function () {
  var V = CCMS.Views, UI = CCMS.UI, U = CCMS.Util, esc = U.esc, Auth = CCMS.Auth, Store = CCMS.Store, CFG = CCMS.CONFIG, C = CCMS.Complaints;

  function shell(nav, title, content, extra) {
    extra = extra || {};
    return CCMS.Layout.appPage({ role: 'user', nav: nav, title: title, subtitle: extra.subtitle, actions: extra.actions, content: content });
  }

  /** Big number card used on both dashboards. */
  V.statCard = function (label, value, icon, tone, href) {
    var inner = '<span class="stat-icon">' + UI.icon(icon, 24) + '</span><span class="stat-body"><span class="stat-value">' + value + '</span><span class="stat-label">' + esc(label) + '</span></span>';
    return href ? '<a class="stat tone-' + tone + '" href="#' + href + '">' + inner + '</a>' : '<div class="stat tone-' + tone + '">' + inner + '</div>';
  };

  function viewLink(c) {
    return '<a class="btn btn-secondary btn-sm" href="#/user/complaint/' + esc(c.id) + '" aria-label="View details of ' + esc(c.id) + '">View Details</a>';
  }

  function userColumns() {
    return [
      { label: 'Complaint ID', render: function (c) { return '<strong>' + esc(c.id) + '</strong>'; } },
      { label: 'Category', render: function (c) { return UI.catChip(c.category); } },
      { label: 'Description', render: function (c) { return '<span class="desc">' + esc(U.truncate(c.description, 70)) + '</span>'; } },
      { label: 'Location', render: function (c) { return esc(c.location); } },
      { label: 'Date', render: function (c) { return esc(U.fmtDate(c.date)); } },
      { label: 'Priority', render: function (c) { return UI.priorityBadge(c.priority); } },
      { label: 'Status', render: function (c) { return UI.statusBadge(c.status); } },
      { label: 'Action', render: viewLink }
    ];
  }

  function notFoundInShell(nav) {
    return {
      title: 'Complaint not found',
      html: shell(nav, 'Complaint not found', UI.emptyState('Complaint not found', 'This complaint does not exist or does not belong to your account.', '<a class="btn btn-primary" href="#/user/complaints">Back to My Complaints</a>'))
    };
  }

  /* ------------------------------ dashboard ------------------------------ */
  V.userDashboard = function () {
    var user = Auth.currentUser();
    var mine = Store.Complaints.byUser(user.id), st = C.stats(mine);
    var recent = C.filter(mine, { sort: 'newest' }).slice(0, 5);
    var content =
      '<div class="stat-grid">' +
      V.statCard('Total Complaints', st.total, 'clipboard', 'navy', '/user/complaints') +
      V.statCard('Pending', st.pending, 'clock', 'amber', '/user/complaints') +
      V.statCard('In Progress', st.inProgress, 'tool', 'blue', '/user/complaints') +
      V.statCard('Resolved', st.resolved, 'check-circle', 'green', '/user/history') + '</div>' +
      '<section class="card"><div class="card-head"><h2>Recent Complaints</h2><a href="#/user/complaints">View all</a></div>' +
      UI.table(userColumns(), recent, 'No complaints yet', 'Use the “Submit New Complaint” button to report your first problem.') + '</section>';
    return {
      title: 'Dashboard',
      html: shell('dashboard', 'Welcome, ' + user.name, content, {
        subtitle: 'Here is a summary of your complaints.',
        actions: '<a class="btn btn-primary btn-lg" href="#/user/submit">' + UI.icon('plus', 20) + 'Submit New Complaint</a>'
      })
    };
  };

  /* --------------------------- submit complaint --------------------------- */
  V.userSubmit = function () {
    var today = U.localYMD();
    var form =
      '<form id="complaint-form" class="card form-card" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'category', label: 'Complaint Category', type: 'select', required: true, list: CFG.CATEGORIES, placeholder: 'Select a category' }) +
      UI.field({ id: 'title', label: 'Complaint Title', required: true, placeholder: 'Short summary, e.g. Water leaking near Block A', attrs: 'maxlength="100"' }) +
      UI.field({ id: 'description', label: 'Complaint Description', type: 'textarea', rows: 5, required: true, placeholder: 'Describe the problem: what is wrong, since when, and who is affected.', attrs: 'maxlength="1000"', hint: 'At least 15 characters.' }) +
      '<div class="grid-2">' +
      UI.field({ id: 'location', label: 'Location', required: true, placeholder: 'e.g. Block A, near the staircase', attrs: 'maxlength="100"' }) +
      UI.field({ id: 'date', label: 'Date', type: 'date', required: true, value: today, attrs: 'max="' + today + '"' }) + '</div>' +
      '<div class="field"><label for="image">Upload Photograph <span class="muted">(optional)</span></label>' +
      '<input type="file" id="image" name="image" accept="image/jpeg,image/png,image/webp" aria-describedby="image-hint image-err">' +
      '<p class="hint" id="image-hint">JPG, PNG or WebP, up to 3 MB. A photo helps the administrator understand the problem.</p>' +
      '<p class="error-msg" id="image-err" role="alert"></p>' +
      '<div class="preview" id="preview" hidden><img id="preview-img" alt="Preview of the photograph you selected"><button type="button" class="btn btn-ghost btn-sm" id="preview-remove">Remove photo</button></div></div>' +
      '<p class="hint">Priority is set by the administrator after reviewing your complaint.</p>' +
      '<div class="form-actions"><button class="btn btn-primary btn-lg" type="submit" id="submit-btn">Submit Complaint</button><a class="btn btn-ghost btn-lg" href="#/user/dashboard">Cancel</a></div></form>' +
      '<div id="confirm" hidden></div>';
    return {
      title: 'Submit Complaint',
      html: shell('submit', 'Submit a Complaint', form, { subtitle: 'Fields marked <span class="req">*</span> are required.' }),
      mount: function () {
        var user = Auth.currentUser();
        var f = document.getElementById('complaint-form'), file = document.getElementById('image');
        var prev = document.getElementById('preview'), prevImg = document.getElementById('preview-img');
        var imageData = '';

        function clearPhoto() { file.value = ''; imageData = ''; prev.hidden = true; prevImg.removeAttribute('src'); UI.setError('image', ''); }
        file.addEventListener('change', function () {
          UI.setError('image', '');
          var fl = file.files[0];
          if (!fl) { clearPhoto(); return; }
          var err = UI.validateImage(fl);
          if (err) { clearPhoto(); UI.setError('image', err); return; }
          UI.readImage(fl).then(function (data) {
            imageData = data; prevImg.src = data; prev.hidden = false;
          }).catch(function (e) { clearPhoto(); UI.setError('image', e.message); });
        });
        document.getElementById('preview-remove').addEventListener('click', clearPhoto);

        f.addEventListener('submit', function (e) {
          e.preventDefault();
          UI.clearErrors(f);
          var d = {
            category: f.elements.category.value, title: f.elements.title.value, description: f.elements.description.value,
            location: f.elements.location.value, date: f.elements.date.value, image: imageData
          };
          var errs = {};
          if (!d.category) errs.category = 'Please choose a complaint category.';
          if (d.title.trim().length < 5) errs.title = 'Please enter a short title (at least 5 characters).';
          if (d.description.trim().length < 15) errs.description = 'Please describe the problem in a little more detail (at least 15 characters).';
          if (d.location.trim().length < 3) errs.location = 'Please tell us where the problem is.';
          if (!d.date) errs.date = 'Please select the date.';
          else if (d.date > U.localYMD()) errs.date = 'The date cannot be in the future.';
          var imgErr = UI.validateImage(file.files[0]);
          if (imgErr) errs.image = imgErr;
          if (Object.keys(errs).length) { UI.showErrors(f, errs); return; }

          var r = C.create(user, d);
          if (!r.ok) { UI.showErrors(f, { _form: r.error }); return; }
          var c = r.complaint;
          f.hidden = true;
          var box = document.getElementById('confirm');
          box.hidden = false;
          box.innerHTML = '<section class="card success-card" tabindex="-1" id="success">' +
            '<span class="success-icon">' + UI.icon('check-circle', 44) + '</span>' +
            '<h2>Complaint successfully submitted!</h2>' +
            '<p class="muted">Please note your Complaint ID. You can use it to track the progress.</p>' +
            '<div class="id-box"><span>Complaint ID</span><strong>' + esc(c.id) + '</strong></div>' +
            '<p>Status: ' + UI.statusBadge(c.status) + '</p>' +
            '<div class="form-actions center"><a class="btn btn-primary btn-lg" href="#/user/track/' + esc(c.id) + '">Track this complaint</a>' +
            '<a class="btn btn-secondary btn-lg" href="#/user/complaint/' + esc(c.id) + '">View details</a>' +
            '<a class="btn btn-ghost btn-lg" href="#/user/dashboard">Go to dashboard</a></div></section>';
          UI.toast('Complaint ' + c.id + ' submitted.', 'success');
          var s = document.getElementById('success'); if (s) s.focus();
          window.scrollTo(0, 0);
        });
      }
    };
  };

  /* ---------------------------- my complaints ---------------------------- */
  V.userComplaints = function () {
    var filters =
      '<div class="filters card"><div class="filter-grid">' +
      '<div class="field"><label for="f-q">Search</label><input type="search" id="f-q" placeholder="ID, title, location…"></div>' +
      '<div class="field"><label for="f-cat">Category</label><select id="f-cat">' + UI.options(CFG.CATEGORIES, '', 'All categories') + '</select></div>' +
      '<div class="field"><label for="f-status">Status</label><select id="f-status">' + UI.options(CFG.STATUSES, '', 'All statuses') + '</select></div>' +
      '<div class="field"><label for="f-pri">Priority</label><select id="f-pri">' + UI.options(CFG.PRIORITIES.concat(['Not Set']), '', 'All priorities') + '</select></div>' +
      '<div class="field"><label for="f-sort">Sort by date</label><select id="f-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>' +
      '</div><button type="button" class="btn btn-ghost btn-sm" id="f-reset">Clear filters</button></div>' +
      '<section class="card"><p class="result-count" id="count" aria-live="polite"></p><div id="results"></div></section>';
    return {
      title: 'My Complaints',
      html: shell('complaints', 'My Complaints', filters, {
        subtitle: 'All complaints you have submitted.',
        actions: '<a class="btn btn-primary" href="#/user/submit">' + UI.icon('plus', 18) + 'New Complaint</a>'
      }),
      mount: function () {
        var user = Auth.currentUser();
        var ids = { q: 'f-q', category: 'f-cat', status: 'f-status', priority: 'f-pri', sort: 'f-sort' };
        function render() {
          var o = {};
          Object.keys(ids).forEach(function (k) { o[k] = document.getElementById(ids[k]).value; });
          var list = C.filter(Store.Complaints.byUser(user.id), o);
          document.getElementById('count').textContent = list.length + (list.length === 1 ? ' complaint found' : ' complaints found');
          document.getElementById('results').innerHTML = UI.table(userColumns(), list, 'No matching complaints', 'Try changing or clearing the filters.');
        }
        Object.keys(ids).forEach(function (k) {
          var el = document.getElementById(ids[k]);
          el.addEventListener(k === 'q' ? 'input' : 'change', k === 'q' ? U.debounce(render, 120) : render);
        });
        document.getElementById('f-reset').addEventListener('click', function () {
          Object.keys(ids).forEach(function (k) { document.getElementById(ids[k]).value = k === 'sort' ? 'newest' : ''; });
          render();
        });
        render();
      }
    };
  };

  /* --------------------------- complaint details --------------------------- */
  V.userComplaint = function (ctx) {
    var user = Auth.currentUser();
    var c = Store.Complaints.byId(ctx.params.id);
    if (!c || c.userId !== user.id) return notFoundInShell('complaints');
    var info = UI.kv([
      ['Complaint ID', '<strong>' + esc(c.id) + '</strong>'],
      ['Complaint Category', UI.catChip(c.category)],
      ['Complaint Title', esc(c.title)],
      ['Location', esc(c.location)],
      ['Submission Date', esc(U.fmtDate(c.date))],
      ['Priority', UI.priorityBadge(c.priority)],
      ['Assigned Person / Department', UI.assignedText(c.assignedTo)],
      ['Current Status', UI.statusBadge(c.status)],
      ['Last Updated', esc(U.fmtDateTime(c.updatedAt))]
    ]);
    var content =
      '<div class="detail-grid"><div class="stack">' +
      '<section class="card"><h2>Complaint information</h2>' + info +
      '<div class="block"><h3>Full description</h3><p class="prewrap">' + esc(c.description) + '</p></div>' +
      (c.remarks ? '<div class="block"><h3>Administrator remarks</h3><p class="prewrap">' + esc(c.remarks) + '</p></div>' : '') + '</section>' +
      '<section class="card"><h2>Uploaded photograph</h2>' + UI.photo(c) + '</section></div>' +
      '<div class="stack"><section class="card"><h2>Progress</h2>' + UI.tracker(c.status) + '</section>' +
      '<section class="card"><h2>Status timeline</h2>' + UI.timeline(c.timeline) + '</section></div></div>';
    return {
      title: c.id,
      html: shell('complaints', 'Complaint ' + c.id, content, {
        subtitle: UI.statusBadge(c.status),
        actions: '<a class="btn btn-ghost" href="#/user/complaints">← Back</a><a class="btn btn-secondary" href="#/user/track/' + esc(c.id) + '">' + UI.icon('search', 18) + 'Track</a>'
      })
    };
  };

  /* ------------------------------- tracking ------------------------------- */
  V.userTrack = function (ctx) {
    var user = Auth.currentUser();
    var preset = ctx.params.id || '';
    var mine = Store.Complaints.byUser(user.id);
    var chips = mine.length ? '<p class="muted small">Your complaints:</p><div class="chips">' + mine.map(function (c) {
      return '<a class="chip" href="#/user/track/' + esc(c.id) + '">' + esc(c.id) + '</a>';
    }).join('') + '</div>' : '';
    var content =
      '<form id="track-form" class="track-form card" novalidate>' + UI.field({ id: 'cid', label: 'Complaint ID', required: true, value: preset, placeholder: 'CMP-2026-001', cls: 'grow' }) +
      '<button class="btn btn-primary" type="submit">' + UI.icon('search', 18) + 'Track</button></form>' + chips +
      '<div id="track-result" aria-live="polite"></div>';
    return {
      title: 'Track Complaint',
      html: shell('track', 'Track Complaint', content, { subtitle: 'Search by Complaint ID to see the latest progress.' }),
      mount: function () {
        var f = document.getElementById('track-form'), out = document.getElementById('track-result');
        function run() {
          var id = f.elements.cid.value.trim();
          UI.setError('cid', '');
          if (!id) { UI.setError('cid', 'Please enter a Complaint ID.'); out.innerHTML = ''; return; }
          var c = Store.Complaints.byId(id);
          if (!c || c.userId !== user.id) {
            out.innerHTML = UI.emptyState('Complaint not found', 'No complaint with ID "' + id + '" was found in your account. Please check the ID.');
            return;
          }
          out.innerHTML = V.trackCard(c, { footer: '<a class="btn btn-secondary" href="#/user/complaint/' + esc(c.id) + '">View full details</a>' });
        }
        f.addEventListener('submit', function (e) { e.preventDefault(); run(); });
        if (preset) run();
      }
    };
  };

  /* -------------------------------- history -------------------------------- */
  V.userHistory = function () {
    var content =
      '<div class="filters card"><div class="filter-grid two"><div class="field"><label for="h-show">Show</label><select id="h-show">' +
      '<option value="">All complaints</option><option value="Resolved">Resolved only</option><option value="open">Not yet resolved</option></select></div></div></div>' +
      '<section class="card"><p class="result-count" id="count" aria-live="polite"></p><div id="results"></div></section>';
    return {
      title: 'Complaint History',
      html: shell('history', 'Complaint History', content, { subtitle: 'A digital record of all your previous complaints and how they were resolved.' }),
      mount: function () {
        var user = Auth.currentUser();
        var cols = [
          { label: 'Complaint ID', render: function (c) { return '<strong>' + esc(c.id) + '</strong>'; } },
          { label: 'Category', render: function (c) { return UI.catChip(c.category); } },
          { label: 'Date', render: function (c) { return esc(U.fmtDate(c.date)); } },
          { label: 'Resolution', render: function (c) {
            if (c.status === 'Resolved') return esc(c.remarks || 'Resolved by administrator') + '<br><span class="muted small">Resolved on ' + esc(U.fmtDate(C.resolvedAt(c))) + '</span>';
            return '<span class="muted">Not resolved yet</span>';
          } },
          { label: 'Status', render: function (c) { return UI.statusBadge(c.status); } },
          { label: 'Action', render: viewLink }
        ];
        function render() {
          var v = document.getElementById('h-show').value;
          var list = C.filter(Store.Complaints.byUser(user.id), { sort: 'newest' }).filter(function (c) {
            return v === '' || (v === 'open' ? c.status !== 'Resolved' : c.status === v);
          });
          document.getElementById('count').textContent = list.length + (list.length === 1 ? ' record' : ' records');
          document.getElementById('results').innerHTML = UI.table(cols, list, 'No history yet', 'Your complaints will be listed here.');
        }
        document.getElementById('h-show').addEventListener('change', render);
        render();
      }
    };
  };

  /* -------------------------------- profile -------------------------------- */
  V.userProfile = function () {
    var user = Auth.currentUser();
    var mine = Store.Complaints.byUser(user.id), st = C.stats(mine);
    var content =
      '<div class="detail-grid"><div class="stack">' +
      '<section class="card profile-card"><div class="profile-top"><span class="avatar lg" aria-hidden="true">' + esc(U.initials(user.name)) + '</span><div><h2>' + esc(user.name) + '</h2><p class="muted">Community User</p></div></div>' +
      UI.kv([['Name', esc(user.name)], ['Email', esc(user.email)], ['Mobile Number', esc(user.mobile)], ['Community', esc(user.community)],
        ['Total Complaints', '<strong>' + st.total + '</strong>'], ['Resolved Complaints', '<strong>' + st.resolved + '</strong>']]) + '</section></div>' +
      '<div class="stack"><section class="card"><h2>Edit profile</h2>' +
      '<form id="profile-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'name', label: 'Full Name', required: true, value: user.name }) +
      UI.field({ id: 'email', label: 'Email', type: 'email', value: user.email, readonly: true, hint: 'Email cannot be changed in this prototype.' }) +
      UI.field({ id: 'mobile', label: 'Mobile Number', type: 'tel', required: true, value: user.mobile, attrs: 'inputmode="numeric" maxlength="10"' }) +
      UI.field({ id: 'community', label: 'Community / College / Society', required: true, value: user.community }) +
      '<button class="btn btn-primary" type="submit">Save Changes</button></form></section>' +
      '<section class="card"><h2>Change password</h2><form id="pw-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'current', label: 'Current password', type: 'password', required: true, autocomplete: 'current-password' }) +
      UI.field({ id: 'next', label: 'New password', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 6 characters.' }) +
      UI.field({ id: 'again', label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password' }) +
      '<button class="btn btn-secondary" type="submit">Update Password</button></form></section></div></div>';
    return {
      title: 'Profile',
      html: shell('profile', 'My Profile', content),
      mount: function () {
        var f = document.getElementById('profile-form');
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          UI.clearErrors(f);
          var errs = {}, name = f.elements.name.value.trim(), mobile = f.elements.mobile.value.trim(), comm = f.elements.community.value.trim();
          if (name.length < 3) errs.name = 'Please enter your full name (at least 3 characters).';
          if (!Auth.isMobile(mobile)) errs.mobile = 'Enter a valid 10-digit mobile number.';
          if (comm.length < 2) errs.community = 'Please enter your community name.';
          if (Object.keys(errs).length) { UI.showErrors(f, errs); return; }
          var u = Store.Users.byId(user.id);
          u.name = name; u.mobile = mobile; u.community = comm;
          Store.Users.update(u);
          // keep the name on existing complaints in sync
          Store.Complaints.byUser(u.id).forEach(function (c) { c.userName = name; Store.Complaints.update(c); });
          UI.toast('Profile updated.', 'success');
          CCMS.Router.refresh();
        });
        var p = document.getElementById('pw-form');
        p.addEventListener('submit', function (e) {
          e.preventDefault();
          UI.clearErrors(p);
          var errs = {};
          if (!p.elements.current.value) errs.current = 'Please enter your current password.';
          if (p.elements.next.value.length < 6) errs.next = 'New password must be at least 6 characters long.';
          if (p.elements.again.value !== p.elements.next.value) errs.again = 'Passwords do not match.';
          if (Object.keys(errs).length) { UI.showErrors(p, errs); return; }
          var r = Auth.changePassword(user.id, p.elements.current.value, p.elements.next.value);
          if (!r.ok) { UI.showErrors(p, { current: r.error }); return; }
          p.reset();
          UI.toast('Password updated.', 'success');
        });
      }
    };
  };
})();
