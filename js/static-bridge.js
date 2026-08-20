/* Ponte estatica: substitui as chamadas de API por dados locais. */
(function () {
  'use strict';
  if (!window.S) return;
  var DATA = window.__STATIC__;

  function projPath(p) {
    var m = String(p).split('?')[0].match(/^\/api\/public\/projects\/(\d+)$/);
    return m ? Number(m[1]) : null;
  }

  async function api(path, opts) {
    var o = opts || {};
    var p = String(path).split('?')[0];

if (o.method === 'POST' && p === '/api/public/contact') {
      var c = (DATA.settings && DATA.settings.contact) || {};
      var whatsapp = c.whatsapp || '';
      var subject = (o.json && o.json.subject || '');
      var message = (o.json && o.json.message || '');
      var text = (subject ? 'Assunto: ' + subject + '\n\n' : '') + message;
      if (whatsapp) window.location.href = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(text);
      return { ok: true };
    }

    if (p === '/api/public/boot') return DATA;

    var id = projPath(path);
    if (id !== null) {
      var proj = DATA.projects.find(function (x) { return x.id === id; });
      if (!proj) { var e = new Error('Project not found'); e.status = 404; throw e; }
      return { ok: true, project: proj };
    }

    var err = new Error('Request failed (404)');
    err.status = 404;
    throw err;
  }

  window.S.api = api;
})();
