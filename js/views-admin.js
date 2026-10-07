/* ==========================================================================
   views-admin.js — administrator area:
   Dashboard, complaint lists (All / Pending / In Progress / Resolved / High
   Priority), Complaint Details + management, Users, Analytics, Settings
   ========================================================================== */
window.CCMS = window.CCMS || {};
CCMS.Views = CCMS.Views || {};

(function () {
  var V = CCMS.Views, UI = CCMS.UI, U = CCMS.Util, esc = U.esc, Auth = CCMS.Auth, Store = CCMS.Store, CFG = CCMS.CONFIG, C = CCMS.Complaints, Ch = CCMS.Charts;

  function shell(nav, title, content, extra) {
    extra = extra || {};
    return CCMS.Layout.appPage({ role: 'admin', nav: nav, title: title, subtitle: extra.subtitle, actions: extra.actions, content: content });
  }

  function manageLink(c) {
    return '<a class="btn btn-secondary btn-sm" href="#/admin/complaint/' + esc(c.id) + '" aria-label="Manage complaint ' + esc(c.id) + '">Manage</a>';
  }

  /** Keep the "Pending" count in the sidebar up to date after a quick action. */
  function refreshNavCount() {
    var n = C.stats(Store.Complaints.all()).pending, el = document.querySelector('.nav-count');
    if (el) { if (n) el.textContent = n; else el.parentNode.removeChild(el); }
  }

  /* ------------------------------ dashboard ------------------------------ */
  V.adminDashboard = function () {
    var all = Store.Complaints.all(), st = C.stats(all);
    var attention = all.filter(function (c) { return c.status !== 'Resolved'; }).sort(function (a, b) {
      var d = C.PRIORITY_RANK[b.priority || 'Not Set'] - C.PRIORITY_RANK[a.priority || 'Not Set'];
      return d || new Date(a.createdAt) - new Date(b.createdAt);
    }).slice(0, 5);
    var cols = [
      { label: 'Complaint ID', render: function (c) { return '<strong>' + esc(c.id) + '</strong>'; } },
      { label: 'Category', render: function (c) { return UI.catChip(c.category); } },
      { label: 'Location', render: function (c) { return esc(c.location); } },
      { label: 'Priority', render: function (c) { return UI.priorityBadge(c.priority); } },
      { label: 'Status', render: function (c) { return UI.statusBadge(c.status); } },
      { label: 'Action', render: manageLink }
    ];
    var content =
      '<div class="stat-grid five">' +
      V.statCard('Total Complaints', st.total, 'clipboard', 'navy', '/admin/list/all') +
      V.statCard('Pending', st.pending, 'clock', 'amber', '/admin/list/pending') +
      V.statCard('In Progress', st.inProgress, 'tool', 'blue', '/admin/list/inprogress') +
      V.statCard('Resolved', st.resolved, 'check-circle', 'green', '/admin/list/resolved') +
      V.statCard('High Priority', st.high, 'flag', 'red', '/admin/list/high') + '</div>' +
      '<div class="chart-grid">' +
      '<section class="card"><h2>Complaints by Status</h2>' + Ch.donut(Ch.statusData(C.countBy(all, 'status', CFG.STATUSES)), 'Complaints') + '</section>' +
      '<section class="card"><h2>Complaints by Category</h2>' + Ch.bars(C.countBy(all, 'category', CFG.CATEGORIES)) + '</section>' +
      '<section class="card"><h2>Complaints by Priority</h2>' + Ch.bars(C.countBy(all, 'priority', CFG.PRIORITIES.concat(['Not Set'])), function (l) { return Ch.PRIORITY_COLORS[l]; }) + '</section></div>' +
      '<section class="card"><div class="card-head"><h2>Needs attention</h2><a href="#/admin/list/all">View all complaints</a></div>' +
      '<p class="muted small">Unresolved complaints, most urgent first.</p>' + UI.table(cols, attention, 'All caught up', 'There are no unresolved complaints.') + '</section>';
    return { title: 'Admin Dashboard', html: shell('dashboard', 'Admin Dashboard', content, { subtitle: 'Overview of all community complaints.' }) };
  };

  /* ------------------------------ complaint lists ------------------------------ */
  var LISTS = {
    all: { title: 'All Complaints', sub: 'Every complaint submitted by community members.', f: {} },
    pending: { title: 'Pending Complaints', sub: 'Waiting for review or for work to start.', f: { status: 'Pending' } },
    inprogress: { title: 'In Progress Complaints', sub: 'Work has started on these complaints.', f: { status: 'In Progress' } },
    resolved: { title: 'Resolved Complaints', sub: 'Completed complaints and how they were resolved (complaint history).', f: { status: 'Resolved' } },
    high: { title: 'High Priority Complaints', sub: 'Complaints marked High or Critical.', f: { priority: 'high+' } }
  };

  V.adminList = function (ctx) {
    var key = ctx.params.filter;
    var def = LISTS[key];
    if (!def) return V.notFound(ctx);
    var f = def.f;
    var content =
      '<div class="filters card"><div class="filter-grid admin">' +
      '<div class="field wide"><label for="f-q">Search</label><input type="search" id="f-q" placeholder="Complaint ID, user, category or location…"></div>' +
      '<div class="field"><label for="f-status">Status</label><select id="f-status">' + UI.options(CFG.STATUSES, f.status || '', 'All statuses') + '</select></div>' +
      '<div class="field"><label for="f-pri">Priority</label><select id="f-pri">' +
      UI.options([{ value: 'high+', label: 'High & Critical' }].concat(CFG.PRIORITIES.concat(['Not Set'])), f.priority || '', 'All priorities') + '</select></div>' +
      '<div class="field"><label for="f-cat">Category</label><select id="f-cat">' + UI.options(CFG.CATEGORIES, '', 'All categories') + '</select></div>' +
      '<div class="field"><label for="f-from">Date from</label><input type="date" id="f-from"></div>' +
      '<div class="field"><label for="f-to">Date to</label><input type="date" id="f-to"></div>' +
      '<div class="field"><label for="f-sort">Sort by date</label><select id="f-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>' +
      '</div><button type="button" class="btn btn-ghost btn-sm" id="f-reset">Clear filters</button></div>' +
      '<section class="card"><p class="result-count" id="count" aria-live="polite"></p><div id="results"></div></section>';

    return {
      title: def.title,
      html: shell(key, def.title, content, { subtitle: def.sub }),
      mount: function () {
        var ids = { q: 'f-q', status: 'f-status', priority: 'f-pri', category: 'f-cat', from: 'f-from', to: 'f-to', sort: 'f-sort' };
        var cols = [
          { label: 'Complaint ID', render: function (c) { return '<strong>' + esc(c.id) + '</strong>'; } },
          { label: 'User', render: function (c) { return esc(c.userName); } },
          { label: 'Category', render: function (c) { return UI.catChip(c.category); } },
          { label: 'Location', render: function (c) { return esc(c.location); } },
          { label: 'Date', render: function (c) { return esc(U.fmtDate(c.date)); } },
          { label: 'Priority', render: function (c) { return UI.priorityBadge(c.priority); } },
          { label: 'Assigned To', render: function (c) { return UI.assignedText(c.assignedTo); } }
        ];
        if (key === 'resolved') {
          cols.push({ label: 'Resolution', render: function (c) {
            return esc(U.truncate(c.remarks || 'Resolved by administrator', 80)) + '<br><span class="muted small">on ' + esc(U.fmtDate(C.resolvedAt(c))) + '</span>';
          } });
        }
        cols.push({ label: 'Status', render: function (c) { return UI.statusBadge(c.status); } });
        cols.push({ label: 'Action', render: function (c) {
          return '<div class="row-actions">' + manageLink(c) +
            (c.status !== 'Resolved' ? '<button type="button" class="btn btn-success btn-sm" data-resolve="' + esc(c.id) + '" aria-label="Mark ' + esc(c.id) + ' as resolved">Resolve</button>' : '') + '</div>';
        } });

        function render() {
          var o = {};
          Object.keys(ids).forEach(function (k) { o[k] = document.getElementById(ids[k]).value; });
          var list = C.filter(Store.Complaints.all(), o);
          document.getElementById('count').textContent = list.length + (list.length === 1 ? ' complaint found' : ' complaints found');
          document.getElementById('results').innerHTML = UI.table(cols, list, 'No matching complaints', 'Try changing or clearing the filters.');
        }
        Object.keys(ids).forEach(function (k) {
          var el = document.getElementById(ids[k]);
          el.addEventListener(k === 'q' ? 'input' : 'change', k === 'q' ? U.debounce(render, 120) : render);
        });
        document.getElementById('f-reset').addEventListener('click', function () {
          Object.keys(ids).forEach(function (k) {
            var v = k === 'sort' ? 'newest' : (k === 'status' ? (f.status || '') : (k === 'priority' ? (f.priority || '') : ''));
            document.getElementById(ids[k]).value = v;
          });
          render();
        });
        document.getElementById('results').addEventListener('click', function (e) {
          var b = e.target.closest('[data-resolve]');
          if (!b) return;
          var id = b.getAttribute('data-resolve');
          if (!window.confirm('Mark complaint ' + id + ' as Resolved? The user will be notified.')) return;
          var r = C.adminUpdate(id, { status: 'Resolved' });
          if (r.ok) { UI.toast(id + ' marked as resolved.', 'success'); render(); refreshNavCount(); }
          else UI.toast(r.error, 'error');
        });
        render();
      }
    };
  };

  /* --------------------------- complaint details --------------------------- */
  V.adminComplaint = function (ctx) {
    var c = Store.Complaints.byId(ctx.params.id);
    if (!c) {
      return { title: 'Complaint not found', html: shell('all', 'Complaint not found', UI.emptyState('Complaint not found', 'No complaint exists with this ID.', '<a class="btn btn-primary" href="#/admin/list/all">Back to All Complaints</a>')) };
    }
    var owner = Store.Users.byId(c.userId);
    var teams = Store.Settings.get().teams.slice();
    if (c.assignedTo && teams.indexOf(c.assignedTo) === -1) teams.push(c.assignedTo);

    var info = UI.kv([
      ['Complaint ID', '<strong>' + esc(c.id) + '</strong>'],
      ['Category', UI.catChip(c.category)],
      ['Title', esc(c.title)],
      ['Location', esc(c.location)],
      ['Submission Date', esc(U.fmtDate(c.date))],
      ['Last Updated', esc(U.fmtDateTime(c.updatedAt))],
      ['Priority', UI.priorityBadge(c.priority)],
      ['Status', UI.statusBadge(c.status)],
      ['Assigned Person / Team', UI.assignedText(c.assignedTo)]
    ]);
    var userInfo = owner ? UI.kv([['Name', esc(owner.name)], ['Email', '<a href="mailto:' + esc(owner.email) + '">' + esc(owner.email) + '</a>'], ['Mobile', esc(owner.mobile)], ['Community', esc(owner.community)]])
      : '<p class="muted">Submitted by ' + esc(c.userName) + ' (account no longer exists).</p>';

    var manage =
      '<section class="card manage-card"><h2>Manage complaint</h2>' +
      '<form id="manage-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'priority', label: 'Priority', type: 'select', list: CFG.PRIORITIES, value: c.priority === 'Not Set' ? '' : c.priority, placeholder: '— Not set —' }) +
      UI.field({ id: 'assignedTo', label: 'Assign To', type: 'select', list: teams, value: c.assignedTo, placeholder: 'Not assigned' }) +
      UI.field({ id: 'status', label: 'Status', type: 'select', list: CFG.STATUSES, value: c.status }) +
      UI.field({ id: 'remarks', label: 'Admin Remarks', type: 'textarea', rows: 4, value: c.remarks, placeholder: 'Notes visible to the user, e.g. work done or expected date.', attrs: 'maxlength="500"' }) +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Update Complaint</button>' +
      (c.status !== 'Resolved' ? '<button class="btn btn-success" type="button" id="resolve-btn">' + UI.icon('check', 18) + 'Mark as Resolved</button>' : '') + '</div></form></section>';

    var content =
      '<div class="detail-grid admin"><div class="stack">' +
      '<section class="card"><h2>Complaint information</h2>' + info +
      '<div class="block"><h3>Description</h3><p class="prewrap">' + esc(c.description) + '</p></div></section>' +
      '<section class="card"><h2>Photograph</h2>' + UI.photo(c) + '</section>' +
      '<section class="card"><h2>User information</h2>' + userInfo + '</section>' +
      '<section class="card"><h2>Timeline</h2>' + UI.timeline(c.timeline) + '</section></div>' +
      '<div class="stack">' + manage + '<section class="card"><h2>Progress</h2>' + UI.tracker(c.status) + '</section></div></div>';

    return {
      title: c.id,
      html: shell('all', 'Complaint ' + c.id, content, {
        subtitle: UI.statusBadge(c.status) + ' ' + UI.priorityBadge(c.priority),
        actions: '<a class="btn btn-ghost" href="#/admin/list/all">← All Complaints</a>'
      }),
      mount: function () {
        var f = document.getElementById('manage-form');
        function save(forceResolved) {
          UI.clearErrors(f);
          var status = forceResolved ? 'Resolved' : f.elements.status.value;
          var remarks = f.elements.remarks.value.trim();
          if (status === 'Resolved' && c.status !== 'Resolved' && !remarks) {
            UI.showErrors(f, { remarks: 'Please add a short resolution note before marking the complaint as resolved.' });
            return;
          }
          var r = C.adminUpdate(c.id, {
            priority: f.elements.priority.value, assignedTo: f.elements.assignedTo.value, status: status, remarks: remarks
          });
          if (!r.ok) { UI.showErrors(f, { _form: r.error }); return; }
          UI.toast(r.changed.length ? 'Complaint updated. The user has been notified.' : 'No changes to save.', r.changed.length ? 'success' : 'info');
          CCMS.Router.refresh();
        }
        f.addEventListener('submit', function (e) { e.preventDefault(); save(false); });
        var rb = document.getElementById('resolve-btn');
        if (rb) rb.addEventListener('click', function () { save(true); });
      }
    };
  };

  /* ------------------------------- users ------------------------------- */
  V.adminUsers = function () {
    var content = '<div class="filters card"><div class="filter-grid two"><div class="field"><label for="u-q">Search users</label><input type="search" id="u-q" placeholder="Name, email or community…"></div></div></div>' +
      '<section class="card"><p class="result-count" id="count" aria-live="polite"></p><div id="results"></div></section>';
    return {
      title: 'Users',
      html: shell('users', 'Users', content, { subtitle: 'Registered community members and administrators.' }),
      mount: function () {
        var all = Store.Complaints.all();
        var cols = [
          { label: 'Name', render: function (u) { return '<strong>' + esc(u.name) + '</strong>'; } },
          { label: 'Email', render: function (u) { return esc(u.email); } },
          { label: 'Mobile', render: function (u) { return esc(u.mobile); } },
          { label: 'Community', render: function (u) { return esc(u.community); } },
          { label: 'Role', render: function (u) { return '<span class="badge role-' + esc(u.role) + '">' + (u.role === 'admin' ? 'Administrator' : 'Community User') + '</span>'; } },
          { label: 'Complaints', render: function (u) { return all.filter(function (c) { return c.userId === u.id; }).length; } },
          { label: 'Resolved', render: function (u) { return all.filter(function (c) { return c.userId === u.id && c.status === 'Resolved'; }).length; } }
        ];
        function render() {
          var q = document.getElementById('u-q').value.trim().toLowerCase();
          var list = Store.Users.all().filter(function (u) { return !q || [u.name, u.email, u.community, u.mobile].join(' ').toLowerCase().indexOf(q) > -1; });
          document.getElementById('count').textContent = list.length + (list.length === 1 ? ' user' : ' users');
          document.getElementById('results').innerHTML = UI.table(cols, list, 'No users found', 'Try a different search.');
        }
        document.getElementById('u-q').addEventListener('input', U.debounce(render, 120));
        render();
      }
    };
  };

  /* ----------------------------- analytics ----------------------------- */
  function monthlyTrend(all) {
    var out = [], now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var n = all.filter(function (c) {
        var cd = new Date(c.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length;
      out.push({ label: U.MONTHS[d.getMonth()], value: n });
    }
    return out;
  }

  V.adminAnalytics = function () {
    var all = Store.Complaints.all(), st = C.stats(all);
    var rate = st.total ? Math.round(st.resolved / st.total * 100) : 0;
    var days = all.filter(function (c) { return c.status === 'Resolved' && C.resolvedAt(c); }).map(function (c) {
      return (new Date(C.resolvedAt(c)) - new Date(c.createdAt)) / 86400000;
    });
    var avg = days.length ? (days.reduce(function (a, b) { return a + b; }, 0) / days.length).toFixed(1) : '—';
    var open = all.filter(function (c) { return c.status !== 'Resolved'; });
    var workload = {};
    open.forEach(function (c) { var k = c.assignedTo || 'Not assigned'; workload[k] = (workload[k] || 0) + 1; });
    var workData = Object.keys(workload).map(function (k) { return { label: k, value: workload[k] }; }).sort(function (a, b) { return b.value - a.value; });

    var content =
      '<div class="stat-grid">' +
      V.statCard('Total Complaints', st.total, 'clipboard', 'navy') +
      V.statCard('Resolution Rate', rate + '%', 'check-circle', 'green') +
      V.statCard('Avg. Days to Resolve', avg, 'clock', 'blue') +
      V.statCard('Open Complaints', open.length, 'alert', 'amber') + '</div>' +
      '<div class="chart-grid two">' +
      '<section class="card"><h2>Status split</h2>' + Ch.donut(Ch.statusData(C.countBy(all, 'status', CFG.STATUSES)), 'Complaints') + '</section>' +
      '<section class="card"><h2>Complaints per month</h2><p class="muted small">Last 6 months</p>' + Ch.columns(monthlyTrend(all)) + '</section>' +
      '<section class="card"><h2>By category</h2>' + Ch.bars(C.countBy(all, 'category', CFG.CATEGORIES)) + '</section>' +
      '<section class="card"><h2>By priority</h2>' + Ch.bars(C.countBy(all, 'priority', CFG.PRIORITIES.concat(['Not Set'])), function (l) { return Ch.PRIORITY_COLORS[l]; }) + '</section>' +
      '<section class="card wide"><h2>Open work by team</h2>' + (workData.length ? Ch.bars(workData) : '<p class="muted">No open complaints.</p>') + '</section></div>';

    return {
      title: 'Reports / Analytics',
      html: shell('analytics', 'Reports / Analytics', content, {
        subtitle: 'Simple statistics to understand how complaints are handled.',
        actions: '<button class="btn btn-secondary" type="button" id="csv-btn">' + UI.icon('download', 18) + 'Export CSV</button><button class="btn btn-ghost" type="button" id="print-btn">' + UI.icon('printer', 18) + 'Print</button>'
      }),
      mount: function () {
        document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
        document.getElementById('csv-btn').addEventListener('click', function () {
          var head = ['Complaint ID', 'User', 'Category', 'Title', 'Description', 'Location', 'Date', 'Priority', 'Assigned To', 'Status', 'Remarks', 'Created', 'Last Updated'];
          var rows = Store.Complaints.all().map(function (c) {
            return [c.id, c.userName, c.category, c.title, c.description, c.location, c.date, c.priority, c.assignedTo, c.status, c.remarks, c.createdAt, c.updatedAt].map(U.csvCell).join(',');
          });
          U.download('complaints-' + U.localYMD() + '.csv', [head.map(U.csvCell).join(',')].concat(rows).join('\r\n'), 'text/csv;charset=utf-8');
          UI.toast('CSV file downloaded.', 'success');
        });
      }
    };
  };

  /* ------------------------------ settings ------------------------------ */
  V.adminSettings = function () {
    var s = Store.Settings.get();
    var content =
      '<div class="detail-grid"><div class="stack">' +
      '<section class="card"><h2>Community / organisation</h2><form id="org-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'orgName', label: 'Organisation name', required: true, value: s.orgName, hint: 'Shown in the sidebar.' }) +
      '<button class="btn btn-primary" type="submit">Save</button></form></section>' +
      '<section class="card"><h2>Responsible teams</h2><form id="teams-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'teams', label: 'Teams (one per line)', type: 'textarea', rows: 7, required: true, value: s.teams.join('\n'), hint: 'These appear in the “Assign To” list of each complaint.' }) +
      '<button class="btn btn-primary" type="submit">Save Teams</button></form></section></div>' +
      '<div class="stack"><section class="card"><h2>Change administrator password</h2><form id="pw-form" novalidate><div class="form-error" role="alert" hidden></div>' +
      UI.field({ id: 'current', label: 'Current password', type: 'password', required: true, autocomplete: 'current-password' }) +
      UI.field({ id: 'next', label: 'New password', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 6 characters.' }) +
      UI.field({ id: 'again', label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password' }) +
      '<button class="btn btn-secondary" type="submit">Update Password</button></form></section>' +
      '<section class="card"><h2>Prototype data</h2><p class="muted">All data is stored in this browser (localStorage), about <strong>' + Store.usageKB() + ' KB</strong> used. This is for demonstration only and is not secure storage.</p>' +
      '<p class="muted">Reset will delete all complaints, users and notifications and restore the sample data.</p>' +
      '<button class="btn btn-danger" type="button" id="reset-btn">Reset demo data</button></section></div></div>';
    return {
      title: 'Settings',
      html: shell('settings', 'Settings', content, { subtitle: 'Configure teams and account options.' }),
      mount: function () {
        var org = document.getElementById('org-form');
        org.addEventListener('submit', function (e) {
          e.preventDefault(); UI.clearErrors(org);
          var v = org.elements.orgName.value.trim();
          if (v.length < 2) { UI.showErrors(org, { orgName: 'Please enter the organisation name.' }); return; }
          var cur = Store.Settings.get(); cur.orgName = v; Store.Settings.set(cur);
          UI.toast('Organisation name saved.', 'success');
          CCMS.Router.refresh();
        });

        var tf = document.getElementById('teams-form');
        tf.addEventListener('submit', function (e) {
          e.preventDefault(); UI.clearErrors(tf);
          var seen = {}, list = [];
          tf.elements.teams.value.split('\n').forEach(function (t) {
            t = t.trim();
            if (t && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; list.push(t); }
          });
          if (!list.length) { UI.showErrors(tf, { teams: 'Please enter at least one team.' }); return; }
          if (list.some(function (t) { return t.length > 60; })) { UI.showErrors(tf, { teams: 'Each team name must be 60 characters or fewer.' }); return; }
          var cur = Store.Settings.get(); cur.teams = list; Store.Settings.set(cur);
          UI.toast('Teams saved.', 'success');
        });

        var pw = document.getElementById('pw-form');
        pw.addEventListener('submit', function (e) {
          e.preventDefault(); UI.clearErrors(pw);
          var errs = {};
          if (!pw.elements.current.value) errs.current = 'Please enter your current password.';
          if (pw.elements.next.value.length < 6) errs.next = 'New password must be at least 6 characters long.';
          if (pw.elements.again.value !== pw.elements.next.value) errs.again = 'Passwords do not match.';
          if (Object.keys(errs).length) { UI.showErrors(pw, errs); return; }
          var r = Auth.changePassword(Auth.currentUser().id, pw.elements.current.value, pw.elements.next.value);
          if (!r.ok) { UI.showErrors(pw, { current: r.error }); return; }
          pw.reset(); UI.toast('Password updated.', 'success');
        });

        document.getElementById('reset-btn').addEventListener('click', function () {
          if (!window.confirm('Reset all data to the original sample data? This cannot be undone.')) return;
          Store.resetDemo();
          UI.toast('Demo data restored. Please log in again.', 'success');
          CCMS.Router.go('/admin-login');
        });
      }
    };
  };
})();
