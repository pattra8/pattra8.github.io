/* ── Pattra Villa 8 · แบดจ์บัญชีลูกบ้าน (shared) ─────────────────────────────
   Published to https://pattra8.com/assets/resident-badge.js.

   Every pattra8.com page that shows a signed-in resident mounts this instead
   of copying its own pill + dropdown. The account menu is defined once here,
   so adding an item (as "เปลี่ยน PIN" was) reaches every page at the next
   deploy of this one file.

   The badge owns *presentation* only. Each page keeps its own session read,
   its own login modal and its own sign-out cleanup, and passes them in — so a
   page still behaves correctly if this script fails to load.

   Usage:
     <link rel="stylesheet" href="/assets/resident-badge.css">
     <script src="/assets/resident-badge.js" defer></script>
     …
     PattraBadge.mount('#headerIdentity', {
       onLogin:  () => showLoginModal(),   // no session → this runs on click
       onLogout: () => cleanUpThisPage(),  // runs after the session is cleared
       extraItems: [{ label: '📋 กล่องรับเรื่อง', href: '/report/?view=admin' }],
       align: 'right'                      // or 'left'
     });

   The mount re-renders itself when the session changes in another tab
   (`storage`) and when a mobile browser restores the page from its
   back/forward cache (`pageshow`) — the drift that used to leave a stale
   house pill on screen after the session had already gone.
   ────────────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  var SESSION_KEY = 'pattra_resident_session_v1';
  var ADMIN_CACHE_KEY = 'pattra_admin_access_v1';
  var TTL = 30 * 24 * 60 * 60 * 1000;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      }[c];
    });
  }

  // The 30-day stamp is written once at sign-in, so slide it whenever an
  // active page reads it — otherwise a resident who uses the site every week
  // is still signed out on day 30.
  function renew(session) {
    if (Number(session.expiresAt) - Date.now() > TTL / 2) return session;
    session.expiresAt = Date.now() + TTL;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) { /* private mode — the session still works for this visit */ }
    return session;
  }

  function getSession() {
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!s || !s.houseNo || !s.pin) return null;
      if (Number(s.expiresAt) <= Date.now()) return null;
      return renew(s);
    } catch (e) { return null; }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(ADMIN_CACHE_KEY);
    } catch (e) { /* ignore */ }
  }

  function menuHtml(session, options) {
    var house = encodeURIComponent(session.houseNo);
    var items = [
      '<a href="/data/?house=' + house + '">👤 แก้ไขข้อมูลส่วนตัว</a>',
      '<a href="/vehicle/?house=' + house + '">🚗 ลงทะเบียนรถยนต์</a>',
      // /data/ owns the PIN dialog; every other page links into it.
      '<a href="/data/?house=' + house + '&action=changepin">🔑 เปลี่ยน PIN</a>'
    ];
    (options.extraItems || []).forEach(function (item) {
      if (!item || !item.label) return;
      items.push(item.href ?
        '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>' :
        '<button type="button" data-pv-item="' + esc(item.id || item.label) +
          '">' + esc(item.label) + '</button>');
    });
    return items.join('') + '<div class="pv-badge-sep"></div>' +
      '<button type="button" class="pv-badge-logout" data-pv-logout>ออกจากระบบ</button>';
  }

  function render(host, options) {
    var session = getSession();
    if (!session) {
      host.innerHTML = options.onLogin ?
        '<button type="button" class="pv-badge-login" data-pv-login>เข้าสู่ระบบ</button>' :
        '<a class="pv-badge-login" href="/">เข้าสู่ระบบ</a>';
      var loginBtn = host.querySelector('[data-pv-login]');
      if (loginBtn) {
        loginBtn.addEventListener('click', function () { options.onLogin(); });
      }
      return null;
    }

    var name = session.residentName || '';
    var initial = (String(name || session.houseNo).match(/[\dA-Za-z฀-๿]/) ||
      ['P'])[0].toUpperCase();

    host.innerHTML =
      '<details class="pv-badge" data-align="' + (options.align === 'left' ? 'left' : 'right') + '">' +
        '<summary aria-label="เปิดเมนูบัญชีของบ้าน ' + esc(session.houseNo) + '">' +
          '<span class="pv-badge-avatar">' + esc(initial) + '</span>' +
          '<span class="pv-badge-text">' +
            '<span class="pv-badge-house">บ้าน ' + esc(session.houseNo) + '</span>' +
            (name ? '<span class="pv-badge-name">' + esc(name) + '</span>' : '') +
          '</span>' +
          '<span class="pv-badge-chev" aria-hidden="true">▼</span>' +
        '</summary>' +
        '<div class="pv-badge-menu">' + menuHtml(session, options) + '</div>' +
      '</details>';

    var details = host.querySelector('.pv-badge');

    host.querySelectorAll('[data-pv-item]').forEach(function (button) {
      button.addEventListener('click', function () {
        details.open = false;
        var match = (options.extraItems || []).filter(function (item) {
          return (item.id || item.label) === button.dataset.pvItem;
        })[0];
        if (match && typeof match.onClick === 'function') match.onClick(session);
      });
    });

    host.querySelector('[data-pv-logout]').addEventListener('click', function () {
      var confirmText = options.confirmLogout === false ? null : 'ออกจากระบบ?';
      if (confirmText && !confirm(confirmText)) { details.open = false; return; }
      clearSession();
      if (typeof options.onLogout === 'function') options.onLogout();
      render(host, options);
    });

    return details;
  }

  var mounted = [];

  function refreshAll() {
    mounted.forEach(function (entry) {
      if (document.body.contains(entry.host)) render(entry.host, entry.options);
    });
  }

  function mount(target, options) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    options = options || {};
    mounted.push({ host: host, options: options });
    render(host, options);
    return host;
  }

  document.addEventListener('click', function (event) {
    document.querySelectorAll('.pv-badge[open]').forEach(function (badge) {
      if (!badge.contains(event.target)) badge.open = false;
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.pv-badge[open]').forEach(function (badge) {
      badge.open = false;
    });
  });
  window.addEventListener('storage', function (event) {
    if (event.key === SESSION_KEY) refreshAll();
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) refreshAll();
  });

  global.PattraBadge = {
    SESSION_KEY: SESSION_KEY,
    TTL: TTL,
    getSession: getSession,
    clearSession: clearSession,
    mount: mount,
    refresh: refreshAll
  };
})(window);
