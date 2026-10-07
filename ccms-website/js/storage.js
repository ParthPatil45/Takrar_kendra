/* ==========================================================================
   storage.js — DATA LAYER (localStorage)

   Every read/write of application data goes through CCMS.Store. No other file
   touches localStorage directly. To connect a real backend later, replace the
   bodies of the repository methods below (Users, Complaints, Notifications,
   Settings, Session) with fetch() calls to your API. The rest of the app only
   uses these methods.

   NOTE FOR REVIEWERS: localStorage is only a demo database. Data lives in this
   browser, passwords are stored in plain text and there is NO real security.
   A production system needs a server, a database and hashed passwords.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Store = (function () {
  var CFG = CCMS.CONFIG, U = CCMS.Util, P = CFG.STORAGE_PREFIX;
  var VERSION = '1';

  var KEYS = {
    users: P + 'users',
    complaints: P + 'complaints',
    notifications: P + 'notifications',
    settings: P + 'settings',
    session: P + 'session',
    version: P + 'data_version'
  };

  /* ---- storage backends (falls back to memory if the browser blocks storage) ---- */
  function makeMemory() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }
  function pick(name) {
    try {
      var s = window[name];
      s.setItem('__ccms_test', '1');
      s.removeItem('__ccms_test');
      return s;
    } catch (e) { return makeMemory(); }
  }
  var local = pick('localStorage');
  var sess = pick('sessionStorage');

  function read(key, fallback) {
    try {
      var raw = local.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  /** Returns false if the browser refused the write (e.g. storage full). */
  function write(key, value) {
    try { local.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('CCMS storage write failed:', e); return false; }
  }

  /* ---- demo data ---- */
  function ago(days, hour, min) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour == null ? 10 : hour, min || 0, 0, 0);
    return d.toISOString();
  }
  function dayStr(days) { var d = new Date(); d.setDate(d.getDate() - days); return U.localYMD(d); }
  function tl(days, hour, text, type) { return { date: ago(days, hour), text: text, type: type }; }

  function buildSeed() {
    var org = CFG.DEFAULT_ORG_NAME;
    var users = [
      { id: 'U001', name: 'Rohan Deshmukh', email: 'user@gmail.com', mobile: '9822012345', password: 'user123', role: 'user', community: org },
      { id: 'U002', name: 'Priya Kulkarni', email: 'priya.kulkarni@example.com', mobile: '9890123456', password: 'priya123', role: 'user', community: org },
      { id: 'U003', name: 'Amit Jadhav', email: 'amit.jadhav@example.com', mobile: '9765432101', password: 'amit123', role: 'user', community: org },
      { id: 'A001', name: 'Campus Administrator', email: 'admin@gmail.com', mobile: '9876500000', password: 'admin123', role: 'admin', community: org }
    ];

    var complaints = [
      {
        id: 'CMP-2026-001', userId: 'U001', userName: 'Rohan Deshmukh', category: 'Water Leakage',
        title: 'Water pipe leaking near Block A staircase',
        description: 'A pipe near the ground-floor staircase of Block A has been leaking for two days. Water is collecting on the steps and the floor has become slippery, which is risky for students and staff.',
        location: 'Block A', image: '', date: dayStr(12), priority: 'High', assignedTo: 'Plumbing Team', status: 'In Progress',
        remarks: 'Plumber inspected the line. Replacement joint has been ordered and repair work is in progress.',
        createdAt: ago(12, 9, 30), updatedAt: ago(8, 11),
        timeline: [
          tl(12, 9, 'Complaint submitted', 'submitted'),
          tl(11, 10, 'Reviewed by administrator', 'reviewed'),
          tl(11, 10, 'Priority set to High', 'priority'),
          tl(10, 12, 'Assigned to Plumbing Team', 'assigned'),
          tl(8, 11, 'Work started — status changed to In Progress', 'status')
        ]
      },
      {
        id: 'CMP-2026-002', userId: 'U002', userName: 'Priya Kulkarni', category: 'Street Light',
        title: 'Street light not working at Main Gate',
        description: 'Two of the street lights at the Main Gate have not been working since last week. The entrance is very dark after 7 PM and it is unsafe for people walking to the bus stop.',
        location: 'Main Gate', image: '', date: dayStr(6), priority: 'Medium', assignedTo: '', status: 'Pending',
        remarks: '',
        createdAt: ago(6, 17, 45), updatedAt: ago(5, 11),
        timeline: [
          tl(6, 17, 'Complaint submitted', 'submitted'),
          tl(5, 11, 'Reviewed by administrator', 'reviewed'),
          tl(5, 11, 'Priority set to Medium', 'priority')
        ]
      },
      {
        id: 'CMP-2026-003', userId: 'U001', userName: 'Rohan Deshmukh', category: 'Garbage',
        title: 'Garbage overflowing in the parking area',
        description: 'The garbage bins in the parking area have not been emptied for several days. There is a bad smell and stray animals are spreading the waste around the vehicles.',
        location: 'Parking Area', image: '', date: dayStr(20), priority: 'High', assignedTo: 'Housekeeping & Sanitation Team', status: 'Resolved',
        remarks: 'Garbage cleared and bins relocated. Collection schedule changed to twice daily.',
        createdAt: ago(20, 8, 15), updatedAt: ago(15, 16),
        timeline: [
          tl(20, 8, 'Complaint submitted', 'submitted'),
          tl(19, 10, 'Reviewed by administrator', 'reviewed'),
          tl(19, 10, 'Priority set to High', 'priority'),
          tl(18, 9, 'Assigned to Housekeeping & Sanitation Team', 'assigned'),
          tl(17, 9, 'Work started — status changed to In Progress', 'status'),
          tl(15, 16, 'Complaint resolved', 'resolved')
        ]
      },
      {
        id: 'CMP-2026-004', userId: 'U003', userName: 'Amit Jadhav', category: 'Road / Pothole',
        title: 'Large pothole at the college entrance',
        description: 'A deep pothole has formed right at the college entrance. Two-wheelers are skidding while turning in and it becomes full of water when it rains. Needs urgent repair.',
        location: 'College Entrance', image: '', date: dayStr(3), priority: 'Critical', assignedTo: '', status: 'Pending',
        remarks: '',
        createdAt: ago(3, 13, 20), updatedAt: ago(2, 9),
        timeline: [
          tl(3, 13, 'Complaint submitted', 'submitted'),
          tl(2, 9, 'Reviewed by administrator', 'reviewed'),
          tl(2, 9, 'Priority set to Critical', 'priority')
        ]
      },
      {
        id: 'CMP-2026-005', userId: 'U002', userName: 'Priya Kulkarni', category: 'Drainage',
        title: 'Blocked drain behind the canteen',
        description: 'The drain behind the canteen is blocked and dirty water is flowing onto the walking path. Mosquitoes are increasing in the area.',
        location: 'Canteen Back Lane', image: '', date: dayStr(9), priority: 'Medium', assignedTo: 'Drainage Team', status: 'In Progress',
        remarks: 'Drain cleaning has started. Team will complete the work in two days.',
        createdAt: ago(9, 11, 5), updatedAt: ago(6, 10),
        timeline: [
          tl(9, 11, 'Complaint submitted', 'submitted'),
          tl(8, 10, 'Reviewed by administrator', 'reviewed'),
          tl(8, 10, 'Priority set to Medium', 'priority'),
          tl(7, 15, 'Assigned to Drainage Team', 'assigned'),
          tl(6, 10, 'Work started — status changed to In Progress', 'status')
        ]
      },
      {
        id: 'CMP-2026-006', userId: 'U003', userName: 'Amit Jadhav', category: 'Electricity',
        title: 'Power fluctuation in the library block',
        description: 'Lights and fans in the library reading hall keep switching off and on during the afternoon. Computers are restarting, which is affecting students who are studying.',
        location: 'Library Block', image: '', date: dayStr(25), priority: 'High', assignedTo: 'Electrical Team', status: 'Resolved',
        remarks: 'Loose connection found in the main distribution board and replaced. Supply is stable now.',
        createdAt: ago(25, 14, 40), updatedAt: ago(21, 17),
        timeline: [
          tl(25, 14, 'Complaint submitted', 'submitted'),
          tl(24, 9, 'Reviewed by administrator', 'reviewed'),
          tl(24, 9, 'Priority set to High', 'priority'),
          tl(23, 11, 'Assigned to Electrical Team', 'assigned'),
          tl(22, 10, 'Work started — status changed to In Progress', 'status'),
          tl(21, 17, 'Complaint resolved', 'resolved')
        ]
      },
      {
        id: 'CMP-2026-007', userId: 'U001', userName: 'Rohan Deshmukh', category: 'Sanitation',
        title: 'Washroom in the boys hostel needs cleaning',
        description: 'The washrooms on the second floor of the boys hostel are not being cleaned regularly. Taps are leaking and there is no running water in two of the cubicles.',
        location: 'Boys Hostel, 2nd Floor', image: '', date: dayStr(2), priority: 'Not Set', assignedTo: '', status: 'Pending',
        remarks: '',
        createdAt: ago(2, 18, 10), updatedAt: ago(2, 18, 10),
        timeline: [tl(2, 18, 'Complaint submitted', 'submitted')]
      },
      {
        id: 'CMP-2026-008', userId: 'U002', userName: 'Priya Kulkarni', category: 'Other',
        title: 'Broken fence around the playground',
        description: 'A section of the metal fence around the playground has broken and the sharp edges are sticking out. Children and students playing nearby could get hurt.',
        location: 'Playground', image: '', date: dayStr(30), priority: 'Low', assignedTo: 'Estate Office (General)', status: 'Resolved',
        remarks: 'Fence repaired and sharp edges removed.',
        createdAt: ago(30, 9, 50), updatedAt: ago(22, 12),
        timeline: [
          tl(30, 9, 'Complaint submitted', 'submitted'),
          tl(28, 10, 'Reviewed by administrator', 'reviewed'),
          tl(28, 10, 'Priority set to Low', 'priority'),
          tl(26, 11, 'Assigned to Estate Office (General)', 'assigned'),
          tl(24, 10, 'Work started — status changed to In Progress', 'status'),
          tl(22, 12, 'Complaint resolved', 'resolved')
        ]
      }
    ];

    var notifications = [
      { id: 'N001', userId: 'U001', message: 'Your complaint CMP-2026-001 is now In Progress.', date: ago(8, 11), read: false },
      { id: 'N002', userId: 'U001', message: 'Your complaint CMP-2026-003 has been resolved.', date: ago(15, 16), read: true },
      { id: 'N003', userId: 'U002', message: 'Your complaint CMP-2026-002 has been reviewed.', date: ago(5, 11), read: false },
      { id: 'N004', userId: 'A001', message: 'New complaint CMP-2026-007 submitted by Rohan Deshmukh.', date: ago(2, 18), read: false }
    ];

    return {
      users: users, complaints: complaints, notifications: notifications,
      settings: { orgName: org, teams: CFG.DEFAULT_TEAMS.slice() }
    };
  }

  function seed() {
    var s = buildSeed();
    write(KEYS.users, s.users);
    write(KEYS.complaints, s.complaints);
    write(KEYS.notifications, s.notifications);
    write(KEYS.settings, s.settings);
    local.setItem(KEYS.version, VERSION);
  }

  /** Called once on startup: loads demo data the first time the site is opened. */
  function init() {
    if (local.getItem(KEYS.version) !== VERSION || !read(KEYS.users, null) || !read(KEYS.complaints, null)) seed();
  }

  /** Wipe everything and reload the demo data (Admin > Settings). */
  function resetDemo() {
    try { sess.removeItem(KEYS.session); } catch (e) { /* ignore */ }
    local.removeItem(KEYS.session);
    seed();
  }

  /* ---------------------------- repositories ---------------------------- */
  var Users = {
    all: function () { return read(KEYS.users, []); },
    byId: function (id) { return Users.all().filter(function (u) { return u.id === id; })[0] || null; },
    byEmail: function (email) {
      email = String(email || '').trim().toLowerCase();
      return Users.all().filter(function (u) { return u.email.toLowerCase() === email; })[0] || null;
    },
    add: function (u) { var a = Users.all(); a.push(u); return write(KEYS.users, a); },
    update: function (u) {
      var a = Users.all().map(function (x) { return x.id === u.id ? u : x; });
      return write(KEYS.users, a);
    }
  };

  var Complaints = {
    all: function () { return read(KEYS.complaints, []); },
    byId: function (id) {
      id = String(id || '').trim().toUpperCase();
      return Complaints.all().filter(function (c) { return c.id.toUpperCase() === id; })[0] || null;
    },
    byUser: function (userId) { return Complaints.all().filter(function (c) { return c.userId === userId; }); },
    add: function (c) { var a = Complaints.all(); a.push(c); return write(KEYS.complaints, a); },
    update: function (c) {
      var a = Complaints.all().map(function (x) { return x.id === c.id ? c : x; });
      return write(KEYS.complaints, a);
    },
    /** Next unique ID like CMP-2026-009 (counts per year). */
    nextId: function () {
      var year = new Date().getFullYear(), max = 0;
      Complaints.all().forEach(function (c) {
        var m = /^CMP-(\d{4})-(\d+)$/.exec(c.id);
        if (m && +m[1] === year && +m[2] > max) max = +m[2];
      });
      return 'CMP-' + year + '-' + ('00' + (max + 1)).slice(-3);
    }
  };

  var Notifications = {
    all: function () { return read(KEYS.notifications, []); },
    forUser: function (userId) {
      return Notifications.all().filter(function (n) { return n.userId === userId; })
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    },
    unreadCount: function (userId) { return Notifications.forUser(userId).filter(function (n) { return !n.read; }).length; },
    add: function (userId, message) {
      var a = Notifications.all();
      a.push({ id: U.uid('N'), userId: userId, message: message, date: new Date().toISOString(), read: false });
      return write(KEYS.notifications, a);
    },
    markRead: function (id) {
      write(KEYS.notifications, Notifications.all().map(function (n) { if (n.id === id) n.read = true; return n; }));
    },
    markAllRead: function (userId) {
      write(KEYS.notifications, Notifications.all().map(function (n) { if (n.userId === userId) n.read = true; return n; }));
    }
  };

  var Settings = {
    get: function () {
      var s = read(KEYS.settings, {}) || {};
      return {
        orgName: s.orgName || CFG.DEFAULT_ORG_NAME,
        teams: (s.teams && s.teams.length) ? s.teams : CFG.DEFAULT_TEAMS.slice()
      };
    },
    set: function (s) { return write(KEYS.settings, s); }
  };

  /** Login session. "Remember me" keeps it in localStorage; otherwise it ends when the tab closes. */
  var Session = {
    get: function () {
      try {
        var raw = sess.getItem(KEYS.session) || local.getItem(KEYS.session);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    set: function (userId, remember) {
      var val = JSON.stringify({ userId: userId, at: new Date().toISOString() });
      Session.clear();
      try { (remember ? local : sess).setItem(KEYS.session, val); } catch (e) { /* ignore */ }
    },
    clear: function () {
      try { sess.removeItem(KEYS.session); } catch (e) { /* ignore */ }
      try { local.removeItem(KEYS.session); } catch (e) { /* ignore */ }
    }
  };

  /** Rough size of stored data, shown in Settings. */
  function usageKB() {
    var total = 0;
    [KEYS.users, KEYS.complaints, KEYS.notifications, KEYS.settings].forEach(function (k) {
      var v = local.getItem(k);
      if (v) total += v.length;
    });
    return Math.round(total / 102.4) / 10;
  }

  return {
    KEYS: KEYS, init: init, resetDemo: resetDemo, usageKB: usageKB,
    Users: Users, Complaints: Complaints, Notifications: Notifications, Settings: Settings, Session: Session
  };
})();
