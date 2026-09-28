/* Auto-actualización: si el despliegue cambió, recarga para no
   quedarse con caché viejo. Sin dependencias. */
(function () {
  var KEY = 'canita_build_id';
  var CHECK_MS = 5 * 60 * 1000;

  function showToast() {
    if (document.getElementById('canita-update-toast')) return;
    var el = document.createElement('div');
    el.id = 'canita-update-toast';
    el.style.cssText =
      'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
      'background:#0f172a;color:#fff;font:700 13px system-ui;padding:12px 18px;' +
      'border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:999999;';
    el.textContent = 'Nueva versión disponible. Actualizando…';
    document.body.appendChild(el);
  }

  async function check(first) {
    try {
      var res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      var data = await res.json();
      var remote = data && data.buildId;
      if (!remote) return;
      var local = null;
      try {
        local = localStorage.getItem(KEY);
      } catch (e) {}
      if (!local) {
        try {
          localStorage.setItem(KEY, remote);
        } catch (e) {}
        return;
      }
      if (local !== remote && !first) {
        showToast();
        try {
          localStorage.setItem(KEY, remote);
        } catch (e) {}
        setTimeout(function () {
          window.location.reload();
        }, 2200);
      }
    } catch (e) {}
  }

  check(true);
  setInterval(function () {
    check(false);
  }, CHECK_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check(false);
  });
})();
