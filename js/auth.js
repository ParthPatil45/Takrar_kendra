/* ==========================================================================
   auth.js — registration, login, logout, role checks

   PROTOTYPE ONLY: passwords are compared in the browser against localStorage.
   For a real deployment, replace login()/register() with calls to a secure
   server (hashed passwords, sessions/JWT, HTTPS). The views only use the
   functions exported here, so they will not need to change.
   ========================================================================== */
window.CCMS = window.CCMS || {};

CCMS.Auth = (function () {
  var Store = CCMS.Store;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MOBILE_RE = /^[6-9]\d{9}$/;

  function isEmail(v) { return EMAIL_RE.test(String(v || '').trim()); }
  function isMobile(v) { return MOBILE_RE.test(String(v || '').trim()); }

  /** The logged-in user (re-read from the data store each time) or null. */
  function currentUser() {
    var s = Store.Session.get();
    if (!s) return null;
    var u = Store.Users.byId(s.userId);
    if (!u) { Store.Session.clear(); return null; }
    return u;
  }

  function homeFor(user) {
    return user && user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  }

  /** @returns {{ok:boolean, user?:object, error?:string}} */
  function login(email, password, remember) {
    var u = Store.Users.byEmail(email);
    if (!u || u.password !== password) {
      return { ok: false, error: 'Incorrect email or password. Please check and try again.' };
    }
    Store.Session.set(u.id, !!remember);
    return { ok: true, user: u };
  }

  function logout() { Store.Session.clear(); }

  /**
   * Validate + create a community user. Role is always "user" here — admins
   * cannot be created from the public registration form.
   * @returns {{ok:boolean, errors?:object, user?:object}}
   */
  function register(d) {
    var errors = {};
    var name = String(d.name || '').trim();
    var email = String(d.email || '').trim().toLowerCase();
    var mobile = String(d.mobile || '').trim();
    var community = String(d.community || '').trim();

    if (name.length < 3) errors.name = 'Please enter your full name (at least 3 characters).';
    if (!email) errors.email = 'Please enter your email address.';
    else if (!isEmail(email)) errors.email = 'Enter a valid email address, for example name@example.com.';
    else if (Store.Users.byEmail(email)) errors.email = 'An account with this email already exists. Please log in instead.';
    if (!mobile) errors.mobile = 'Please enter your mobile number.';
    else if (!isMobile(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).';
    if (!d.password) errors.password = 'Please create a password.';
    else if (d.password.length < 6) errors.password = 'Password must be at least 6 characters long.';
    if (!d.confirm) errors.confirm = 'Please re-enter your password.';
    else if (d.confirm !== d.password) errors.confirm = 'Passwords do not match.';
    if (community.length < 2) errors.community = 'Please enter your community, college or society name.';

    if (Object.keys(errors).length) return { ok: false, errors: errors };

    var user = {
      id: CCMS.Util.uid('U'), name: name, email: email, mobile: mobile,
      password: d.password, role: 'user', community: community
    };
    if (!Store.Users.add(user)) return { ok: false, errors: { _form: 'Could not save your account. Browser storage may be full or blocked.' } };
    return { ok: true, user: user };
  }

  /** Prototype "forgot password": no email is sent, the password is reset directly. */
  function resetPassword(email, newPassword) {
    var u = Store.Users.byEmail(email);
    if (!u) return { ok: false, error: 'No account was found with this email address.' };
    u.password = newPassword;
    Store.Users.update(u);
    return { ok: true };
  }

  function changePassword(userId, current, next) {
    var u = Store.Users.byId(userId);
    if (!u) return { ok: false, error: 'User not found.' };
    if (u.password !== current) return { ok: false, error: 'Current password is incorrect.' };
    u.password = next;
    Store.Users.update(u);
    return { ok: true };
  }

  return {
    isEmail: isEmail, isMobile: isMobile, currentUser: currentUser, homeFor: homeFor,
    login: login, logout: logout, register: register, resetPassword: resetPassword, changePassword: changePassword
  };
})();
