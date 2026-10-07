/* ==========================================================================
   complaints.js — complaint business logic (create, admin update, filter, stats)

   This is the "workflow engine". Views call these functions and never edit
   complaint records directly.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Complaints = (function () {
  var Store = CCMS.Store, CFG = CCMS.CONFIG, U = CCMS.Util;

  var STAGES = ['Submitted', 'Pending', 'In Progress', 'Resolved'];

  /** Position of a status in the 4-step progress tracker. */
  function stageIndex(status) {
    return { 'Pending': 1, 'In Progress': 2, 'Resolved': 3 }[status] || 1;
  }

  function entry(text, type) { return { date: new Date().toISOString(), text: text, type: type }; }

  /**
   * Create a new complaint. Status is always "Pending" and priority is left for
   * the administrator to set.
   * @returns {{ok:boolean, complaint?:object, error?:string}}
   */
  function create(user, d) {
    var now = new Date().toISOString();
    var c = {
      id: Store.Complaints.nextId(),
      userId: user.id,
      userName: user.name,
      category: d.category,
      title: d.title.trim(),
      description: d.description.trim(),
      location: d.location.trim(),
      image: d.image || '',
      date: d.date,
      priority: CFG.DEFAULT_PRIORITY,
      assignedTo: '',
      status: 'Pending',
      remarks: '',
      createdAt: now,
      updatedAt: now,
      timeline: [entry('Complaint submitted', 'submitted')]
    };
    if (!Store.Complaints.add(c)) {
      return { ok: false, error: 'Could not save the complaint. Browser storage may be full — try a smaller photograph.' };
    }
    // Let administrators know a new complaint has arrived
    Store.Users.all().filter(function (u) { return u.role === 'admin'; }).forEach(function (a) {
      Store.Notifications.add(a.id, 'New complaint ' + c.id + ' submitted by ' + user.name + '.');
    });
    return { ok: true, complaint: c };
  }

  /**
   * Apply an administrator's changes (priority / assignee / status / remarks).
   * Adds timeline entries and notifies the complaint owner.
   * @param {string} id
   * @param {{priority?:string, assignedTo?:string, status?:string, remarks?:string}} ch
   * @returns {{ok:boolean, changed:string[], complaint?:object, error?:string}}
   */
  function adminUpdate(id, ch) {
    var c = Store.Complaints.byId(id);
    if (!c) return { ok: false, changed: [], error: 'Complaint not found.' };

    var notes = [];          // notification messages for the user
    var newEntries = [];     // timeline entries
    var changed = [];
    var firstReview = !c.timeline.some(function (t) { return t.type === 'reviewed'; });

    if (ch.priority && ch.priority !== c.priority && CFG.PRIORITIES.indexOf(ch.priority) > -1) {
      c.priority = ch.priority;
      changed.push('priority');
      newEntries.push(entry('Priority set to ' + ch.priority, 'priority'));
      notes.push('The priority of your complaint ' + c.id + ' was set to ' + ch.priority + '.');
    }
    if (typeof ch.assignedTo === 'string' && ch.assignedTo !== c.assignedTo) {
      c.assignedTo = ch.assignedTo;
      changed.push('assignedTo');
      if (ch.assignedTo) {
        newEntries.push(entry('Assigned to ' + ch.assignedTo, 'assigned'));
        notes.push('Your complaint ' + c.id + ' has been assigned to ' + ch.assignedTo + '.');
      } else {
        newEntries.push(entry('Assignment removed', 'assigned'));
      }
    }
    if (ch.status && ch.status !== c.status && CFG.STATUSES.indexOf(ch.status) > -1) {
      c.status = ch.status;
      changed.push('status');
      if (ch.status === 'In Progress') {
        newEntries.push(entry('Work started — status changed to In Progress', 'status'));
        notes.push('Your complaint ' + c.id + ' is now In Progress.');
      } else if (ch.status === 'Resolved') {
        newEntries.push(entry('Complaint resolved', 'resolved'));
        notes.push('Your complaint ' + c.id + ' has been resolved.');
      } else {
        newEntries.push(entry('Status changed to ' + ch.status, 'status'));
        notes.push('The status of your complaint ' + c.id + ' is now ' + ch.status + '.');
      }
    }
    if (typeof ch.remarks === 'string' && ch.remarks.trim() !== (c.remarks || '')) {
      c.remarks = ch.remarks.trim();
      changed.push('remarks');
      if (c.remarks) {
        newEntries.push(entry('Administrator remark: ' + U.truncate(c.remarks, 140), 'remark'));
        notes.push('The administrator added a remark on your complaint ' + c.id + '.');
      }
    }

    if (!changed.length) return { ok: true, changed: [], complaint: c };

    if (firstReview) {
      newEntries.unshift(entry('Reviewed by administrator', 'reviewed'));
      notes.unshift('Your complaint ' + c.id + ' has been reviewed.');
    }

    c.timeline = c.timeline.concat(newEntries);
    c.updatedAt = new Date().toISOString();
    if (!Store.Complaints.update(c)) return { ok: false, changed: [], error: 'Could not save changes (browser storage problem).' };
    notes.forEach(function (m) { Store.Notifications.add(c.userId, m); });
    return { ok: true, changed: changed, complaint: c };
  }

  /** Counts used by dashboards. "High priority" means High + Critical. */
  function stats(list) {
    var s = { total: list.length, pending: 0, inProgress: 0, resolved: 0, high: 0 };
    list.forEach(function (c) {
      if (c.status === 'Pending') s.pending++;
      else if (c.status === 'In Progress') s.inProgress++;
      else if (c.status === 'Resolved') s.resolved++;
      if (c.priority === 'High' || c.priority === 'Critical') s.high++;
    });
    return s;
  }

  function countBy(list, key, order) {
    var map = {};
    (order || []).forEach(function (k) { map[k] = 0; });
    list.forEach(function (c) { var v = c[key] || 'Not Set'; map[v] = (map[v] || 0) + 1; });
    return Object.keys(map).map(function (k) { return { label: k, value: map[k] }; });
  }

  /**
   * Search + filter + sort. Works for both the user and admin lists.
   * o = {q, category, status, priority, from, to, sort}
   */
  function filter(list, o) {
    o = o || {};
    var q = String(o.q || '').trim().toLowerCase();
    var out = list.filter(function (c) {
      if (q) {
        var hay = [c.id, c.title, c.description, c.location, c.category, c.userName, c.assignedTo, c.status].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (o.category && c.category !== o.category) return false;
      if (o.status && c.status !== o.status) return false;
      if (o.priority) {
        if (o.priority === 'high+') { if (c.priority !== 'High' && c.priority !== 'Critical') return false; }
        else if (c.priority !== o.priority) return false;
      }
      if (o.from && c.date < o.from) return false;
      if (o.to && c.date > o.to) return false;
      return true;
    });
    out.sort(function (a, b) {
      var diff = new Date(a.createdAt) - new Date(b.createdAt);
      return o.sort === 'oldest' ? diff : -diff;
    });
    return out;
  }

  /** Date a complaint was resolved (from the timeline), or null. */
  function resolvedAt(c) {
    var r = c.timeline.filter(function (t) { return t.type === 'resolved'; }).pop();
    return r ? r.date : (c.status === 'Resolved' ? c.updatedAt : null);
  }

  var PRIORITY_RANK = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Not Set': 0 };

  return {
    STAGES: STAGES, stageIndex: stageIndex, create: create, adminUpdate: adminUpdate,
    stats: stats, countBy: countBy, filter: filter, resolvedAt: resolvedAt, PRIORITY_RANK: PRIORITY_RANK
  };
})();
