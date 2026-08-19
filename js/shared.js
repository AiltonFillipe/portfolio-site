/* ============================================================
   Shared — API client + UI helpers used by public and admin apps.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- tiny API client ---------- */

  async function api(path, opts) {
    const o = opts || {};
    const method = o.method || 'GET';
    const headers = {};
    let body;
    if (o.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(o.json);
    } else if (o.body !== undefined) {
      body = o.body;
    }
    const res = await fetch(path, {
      method,
      headers,
      body,
      credentials: 'same-origin'
    });
    let data = null;
    try { data = await res.json(); } catch (_) { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Request failed (' + res.status + ')');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /* ---------- DOM helpers ---------- */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function mount(parent, nodeOrString) {
    const p = typeof parent === 'string' ? document.querySelector(parent) : parent;
    if (nodeOrString == null) { p.innerHTML = ''; return; }
    if (typeof nodeOrString === 'string') p.innerHTML = nodeOrString;
    else { p.innerHTML = ''; p.appendChild(nodeOrString); }
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  /* ---------- misc ---------- */

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function initials(name) {
    return String(name || 'A').split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  }

  /* ---------- toasts ---------- */

  const toastWrap = () => global.document.getElementById('toasts') ||
    (function () {
      const t = el('div', { id: 'toasts', class: 'toasts' });
      document.body.appendChild(t);
      return t;
    })();

  function toast(msg, type) {
    const wrap = toastWrap();
    const t = el('div', { class: 'toast toast-' + (type || 'ok') }, [
      el('span', { class: 'toast-ico' }, type === 'err' ? '!' : '✓'),
      el('span', { class: 'toast-msg', text: msg })
    ]);
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  /* ---------- modal ---------- */

  let modalRoot = null;
  function ensureModalRoot() {
    if (!modalRoot) {
      modalRoot = global.document.getElementById('modal-root');
      if (!modalRoot) {
        modalRoot = el('div', { id: 'modal-root' });
        document.body.appendChild(modalRoot);
      }
    }
    return modalRoot;
  }

  function openModal(opts) {
    const root = ensureModalRoot();
    const overlay = el('div', { class: 'modal-overlay' });
    const box = el('div', { class: 'modal-box ' + (opts.class || '') });
    const close = () => { overlay.classList.add('out'); setTimeout(() => overlay.remove(), 250); };

    const head = el('div', { class: 'modal-head' }, [
      el('div', { class: 'modal-title', html: opts.title || '' }),
      el('button', { class: 'modal-x', html: '&times;', onclick: close, 'aria-label': 'Close' })
    ]);
    const body = el('div', { class: 'modal-body' });
    box.appendChild(head);
    box.appendChild(body);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
    overlay.appendChild(box);
    root.appendChild(overlay);
    return { overlay, box, body, close };
  }

  /* ---------- confirm dialog ---------- */

  function confirmDialog(message, { title, okText, danger } = {}) {
    return new Promise((resolve) => {
      const m = openModal({ title: title || 'Tem certeza?', class: 'modal-sm' });
      const body = el('div', { class: 'confirm-body' }, [
        el('p', { class: 'confirm-text', text: message }),
        el('div', { class: 'confirm-actions' }, [
          el('button', { class: 'btn btn-ghost', text: 'Cancelar', onclick: () => { m.close(); resolve(false); } }),
          el('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-solid'), text: okText || 'Confirmar', onclick: () => { m.close(); resolve(true); } })
        ])
      ]);
      m.body.appendChild(body);
    });
  }

  /* ---------- inline SVG icons ---------- */

  const ICON_PATHS = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    layers: 'M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 17l10 5 10-5',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-3.3 3.6-6 8-6s8 2.7 8 6',
    tools: 'M14.7 6.3a4.5 4.5 0 0 0-6.1 5.5L3 17.4V21h3.6l5.6-5.6a4.5 4.5 0 0 0 5.5-6.1L14 13l-3-3 3.7-3.7z',
    share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
    chat: 'M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z',
    cog: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm7.4 4a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    plus: 'M12 5v14M5 12h14',
    edit: 'M17 3l4 4L8 20l-5 1 1-5L17 3z',
    trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
    copy: 'M8 8h12v12H8zM4 16V4h12',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeOff: 'M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.1-4.9M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4M1 1l22 22',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    starFill: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    up: 'M12 19V5M5 12l7-7 7 7',
    down: 'M12 5v14M19 12l-7 7-7-7',
    left: 'M19 12H5M12 19l-7-7 7-7',
    right: 'M5 12h14M12 5l7 7-7 7',
    external: 'M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5',
    check: 'M20 6L9 17l-5-5',
    menu: 'M4 6h16M4 12h16M4 18h16',
    x: 'M18 6L6 18M6 6l12 12',
    drag: 'M8 9h8M8 12h8M8 15h8',
    search: 'M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 3l8 5 8-5',
    pin: 'M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3',
    upload: 'M12 16V4M6 10l6-6 6 6M4 20h16',
    key: 'M21 2l-2 2m-5.6 8.4a5.5 5.5 0 1 1-3.6-3.6L14 5l2 2 2-2 3 3-2 2-4-4M7 14h.01',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'
  };

  function icon(name, size) {
    const s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICON_PATHS[name] || '') + '"/></svg>';
  }

  /* ---------- drag & drop list (HTML5) ---------- */

  function makeSortable(container, { onReorder, handleClass } = {}) {
    let dragEl = null;
    container.addEventListener('dragstart', (e) => {
      const item = e.target.closest('[data-sortable]');
      if (!item) return;
      if (handleClass && !e.target.closest('.' + handleClass) && e.target !== item) return;
      dragEl = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'drag'); } catch (_) { /* IE */ }
    });
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!dragEl) return;
      const after = getAfter(dragEl, e.clientY, container);
      if (after) container.insertBefore(dragEl, after);
      else container.appendChild(dragEl);
    });
    container.addEventListener('dragend', () => {
      if (!dragEl) return;
      dragEl.classList.remove('dragging');
      dragEl = null;
      const ids = qsa('[data-sortable]', container).map((n) => Number(n.dataset.sortable));
      if (typeof onReorder === 'function') onReorder(ids);
    });
    function getAfter(elm, y, root) {
      const items = qsa('[data-sortable]:not(.dragging)', root);
      for (const item of items) {
        const box = item.getBoundingClientRect();
        if (y < box.top + box.height / 2) return item;
      }
      return null;
    }
  }

  /* ---------- file helpers ---------- */

  function fileInput(accept, multiple, onFiles) {
    const input = el('input', { type: 'file', accept: accept || 'image/*', multiple: !!multiple });
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      if (files.length) onFiles(files);
      input.value = '';
    });
    input.click();
  }

  async function uploadFile(file, url) {
    const fd = new FormData();
    fd.append('file', file);
    return api(url || '/api/admin/upload', { method: 'POST', body: fd });
  }

  async function uploadProjectImages(projectId, files) {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return api('/api/admin/projects/' + projectId + '/images', { method: 'POST', body: fd });
  }

  /* ---------- validation of settings-ish groups ---------- */

  const PUBLIC_SETTINGS_GROUPS = ['site', 'hero', 'about', 'contact', 'footer', 'design'];

  /* ---------- export ---------- */
  global.S = {
    api, esc, el, mount, qs, qsa, debounce, fmtDate, initials,
    toast, openModal, confirmDialog, icon, makeSortable,
    fileInput, uploadFile, uploadProjectImages,
    PUBLIC_SETTINGS_GROUPS
  };
})(window);