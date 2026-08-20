/* ============================================================
   Public app — homepage + project detail (case studies).
   ============================================================ */
(function () {
  'use strict';
  const { api, esc, el, mount, qs, qsa, toast } = window.S;

  let data = null; // boot payload
  let state = { cat: 0, projects: [] };

  /* ---------- theming from settings ---------- */
  function applyTheme(settings) {
    const d = settings.design || {};
    const root = document.documentElement;
    if (d.bg) root.style.setProperty('--paper', d.bg);
    if (d.ink) root.style.setProperty('--ink', d.ink);
    if (d.accent) root.style.setProperty('--accent', d.accent);
    if (d.muted) root.style.setProperty('--muted', d.muted);
    if (d.fontDisplay) root.style.setProperty('--font-display', "'" + d.fontDisplay + "', sans-serif");
    if (d.fontBody) root.style.setProperty('--font-body', "'" + d.fontBody + "', sans-serif");
    document.title = (settings.site && settings.site.name ? settings.site.name : 'Portfólio') + ' — Designer Gráfico';
  }

  function applyStoredTheme() {
    const saved = localStorage.getItem('as-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }

  function toggleTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('as-theme', dark ? 'light' : 'dark');
    const label = dark ? 'Modo escuro' : 'Modo claro';
    const ico = dark ? 'moon' : 'sun';
    qsa('.theme-toggle').forEach((b) => {
      b.innerHTML = window.S.icon(ico, 20);
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
    });
  }

  function themeBtn() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const label = dark ? 'Modo claro' : 'Modo escuro';
    return '<button class="theme-toggle" aria-label="' + label + '" title="' + label + '" onclick="S.pub.toggleTheme()">' + window.S.icon(dark ? 'sun' : 'moon', 20) + '</button>';
  }

  /* ---------- shared header/footer ---------- */
  function headerHTML(site) {
    const nav = [
      ['#home', 'Início'], ['#portfolio', 'Portfólio'], ['#about', 'Sobre'],
      ['#skills', 'Habilidades'], ['#services', 'Serviços'], ['#contact', 'Contato']
    ];
    return `
    <header class="site-header" id="top">
      <a class="brand" href="#home" aria-label="Início">
        ${site.logo ? '<img class="brand-img" src="' + esc(site.logo) + '" alt="">' :
        '<span class="brand-mark">' + esc((site.logoText || site.name || 'A').slice(0, 1)) + '</span>'}
        <span class="brand-name">${esc(site.logoText || site.name || '')}</span>
      </a>
      <nav class="site-nav" aria-label="Menu principal">
        ${nav.map(([href, label]) => '<a href="' + href + '">' + label + '</a>').join('')}
      </nav>
      <div class="site-actions">
        ${themeBtn()}
        <a class="btn btn-ghost btn-sm" href="#portfolio">Ver Portfólio</a>
        <a class="btn btn-solid btn-sm" href="#contact">Fale Comigo</a>
      </div>
      <button class="nav-toggle" aria-label="Menu" onclick="S.pub.toggleNav()">${window.S.icon('menu', 22)}</button>
    </header>
    <div class="mobile-nav" id="mobileNav">
      ${nav.map(([href, label]) => '<a href="' + href + '">' + label + '</a>').join('')}
      <div class="mobile-nav-actions">
        ${themeBtn()}
        <a class="btn btn-solid" href="#portfolio">Ver Portfólio</a>
        <a class="btn btn-ghost" href="#contact">Fale Comigo</a>
      </div>
    </div>`;
  }

  function footerHTML(site, footer, socials, contact) {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            ${site.logo ? '<img class="brand-img" src="' + esc(site.logo) + '" alt="">' : '<span class="brand-mark">' + esc((site.logoText || site.name || 'A').slice(0, 1)) + '</span>'}
            <p>${esc(footer.text || '')}</p>
          </div>
          <div class="footer-col">
            <p class="footer-title">Menu</p>
            <a href="#home">Início</a><a href="#portfolio">Portfólio</a>
            <a href="#about">Sobre</a><a href="#skills">Habilidades</a>
            <a href="#services">Serviços</a><a href="#contact">Contato</a>
          </div>
          <div class="footer-col">
            <p class="footer-title">Contato</p>
            <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
            <a href="#contact">${esc(contact.location || '')}</a>
          </div>
          <div class="footer-col">
            <p class="footer-title">Siga-me</p>
            ${socials.map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.platform) + '</a>').join('')}
          </div>
        </div>
        <div class="footer-bottom">
          <span>${esc(footer.copyright || '')}</span>
          <a class="back-top" href="#top">Voltar ao topo ↑</a>
        </div>
      </div>
    </footer>`;
  }

  const navOnce = () => {
    const toggle = qs('.nav-toggle');
    const nav = qs('#mobileNav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('open'));
      qsa('.mobile-nav a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
    }
  };

  /* ---------- sections ---------- */

  function heroHTML(s) {
    const hero = s.hero || {};
    const art = hero.image || (state.featured && state.featured[0] && state.featured[0].cover ? state.featured[0].cover.thumb : null);
    const count = state.featured.length;
    return `
    <section class="hero" id="home">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow"><span class="dot"></span>${esc(hero.badge || '')}</p>
          <h1 class="hero-title">${heroTitleHTML(hero.title || '', hero.highlight || '')}</h1>
          <p class="hero-sub">${esc(hero.subtitle || '')}</p>
          <div class="hero-cta">
            <a class="btn btn-solid btn-lg" href="#portfolio">${esc(hero.primaryCta || 'Ver Meus Trabalhos')} <span class="arr">↓</span></a>
            <a class="btn btn-ghost btn-lg" href="#contact">${esc(hero.secondaryCta || 'Vamos Trabalhar Juntos')}</a>
          </div>
          <div class="hero-tags">
            ${state.categories.map((c) => '<span>' + esc(c.name) + '</span>').join('')}
          </div>
        </div>
        <div class="hero-art">
          ${art ? '<div class="hero-frame"><img src="' + esc(art) + '" alt="Featured artwork" fetchpriority="high"></div>' : '<div class="hero-frame hero-frame-empty">✦</div>'}
          <span class="sticker sticker-1">${esc(s.about.stats && s.about.stats[0] ? s.about.stats[0].value : '')} ${esc(s.about.stats && s.about.stats[0] ? s.about.stats[0].label : '')}</span>
          <span class="sticker sticker-2">${count ? count + ' trabalhos em destaque' : 'Disponível para projetos'}</span>
        </div>
      </div>
    </section>`;
  }

  function heroTitleHTML(title, highlight) {
    if (!highlight) return esc(title || '');
    const idx = title.indexOf(highlight);
    if (idx === -1) return esc(title || '');
    const before = esc(title.slice(0, idx));
    const hl = esc(highlight);
    const after = esc(title.slice(idx + highlight.length));
    return before + '<span class="hl">' + hl + '</span>' + after;
  }

  const marqueeItems = () => data.categories.map((c) => c.name);

  function marqueeHTML() {
    const items = marqueeItems();
    const row = items.concat(items);
    return `
    <div class="marquee" aria-hidden="true">
      <div class="marquee-track">
        ${row.map((t) => '<span>' + esc(t) + '</span><span class="mq-star">✦</span>').join('')}
      </div>
    </div>`;
  }

  function featuredHTML() {
    const items = state.featured;
    if (!items.length) return '';
    const [first, ...rest] = items;
    return `
    <section class="featured" id="featured">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">01 — Trabalhos em destaque</p>
            <h2 class="section-title">Projetos selecionados</h2>
          </div>
          <a class="btn btn-ghost btn-sm" href="#portfolio">Ver todos os projetos <span class="arr">↗</span></a>
        </div>
        <div class="featured-grid">
          ${featureCard(first, true)}
          ${rest.map((p) => featureCard(p, false)).join('')}
        </div>
      </div>
    </section>`;
  }

  function featureCard(p, big) {
    const cover = p.cover;
    return `
    <a class="feat-card ${big ? 'feat-big' : ''}" href="#/project/${p.id}">
      <div class="feat-media">
        ${cover ? '<img loading="lazy" src="' + esc(cover.thumb || cover.filename) + '" alt="' + esc(p.title) + '">' : '<div class="feat-empty">✦</div>'}
        <span class="feat-idx">${String(state.projects.indexOf(p) + 1).padStart(2, '0')}</span>
        <span class="feat-view">Ver estudo de caso <span class="arr">↗</span></span>
      </div>
      <div class="feat-info">
        <div class="feat-meta"><span>${esc(p.category ? p.category.name : '')}</span><span>${esc(p.year || '')}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description || '')}</p>
      </div>
    </a>`;
  }

  function portfolioHTML() {
    const cats = [{ id: 0, name: 'Todos os projetos' }].concat(state.categories);
    return `
    <section class="portfolio" id="portfolio">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">02 — Portfólio</p>
            <h2 class="section-title">Trabalhos selecionados</h2>
          </div>
          <p class="section-note">${state.projects.length} projetos · ${state.categories.length} categorias</p>
        </div>
        <div class="filter-scroller reveal">
          <button class="filter-arrow" id="filterPrev" aria-label="Filtros anteriores" onclick="S.pub.scrollFilters(-1)">←</button>
          <div class="filter-bar" id="filterBar" role="tablist" aria-label="Filtrar projetos">
            ${cats.map((c) => '<button class="filter-btn' + (c.id === state.cat ? ' active' : '') + '" data-cat="' + c.id + '">' + esc(c.name) + '</button>').join('')}
          </div>
          <button class="filter-arrow" id="filterNext" aria-label="Próximos filtros" onclick="S.pub.scrollFilters(1)">→</button>
        </div>
        <div class="project-grid" id="projectGrid">
          ${renderGrid()}
        </div>
        <div class="no-results hidden" id="noResults">
          <p>Ainda não há projetos nesta categoria.</p>
          <a class="btn btn-ghost" href="#portfolio" onclick="S.pub.resetFilter()">Mostrar tudo</a>
        </div>
      </div>
    </section>`;
  }

  function renderGrid() {
    const list = state.projects.filter((p) => state.cat === 0 || (p.category && p.category.id === state.cat));
    state.filtered = list;
    if (!list.length) {
      const grid = qs('#projectGrid'); if (grid) grid.innerHTML = '';
      const nr = qs('#noResults'); if (nr) nr.classList.remove('hidden');
      return '';
    }
    const nr = qs('#noResults'); if (nr) nr.classList.add('hidden');
    return list.map((p, i) => projCard(p, i)).join('');
  }

  function projCard(p, i) {
    const cover = p.cover;
    const catId = p.category ? p.category.id : 0;
    const idx = state.projects.filter((q) => (q.category ? q.category.id : 0) === catId).indexOf(p) + 1;
    return `
    <a class="proj-card reveal" href="#/project/${p.id}" data-cat="${p.category ? p.category.id : 0}">
      <div class="proj-media">
        ${cover ? '<img loading="lazy" src="' + esc(cover.thumb || cover.filename) + '" alt="' + esc(p.title) + '">' : '<div class="proj-empty">✦</div>'}
        ${p.featured ? '<span class="proj-feat">★</span>' : ''}
        ${state.cat !== 0 ? '<span class="proj-idx">' + String(idx).padStart(2, '0') + '</span>' : ''}
        <span class="proj-view">Ver projeto <span class="arr">↗</span></span>
      </div>
      <div class="proj-info">
        <div class="proj-meta"><span>${esc(p.category ? p.category.name : 'Sem categoria')}</span><span>${esc(p.year || '')}</span></div>
        <h3 class="proj-title">${esc(p.title)}</h3>
        <p class="proj-desc">${esc(p.description || '')}</p>
      </div>
    </a>`;
  }

  const ml = (t) => esc(t || '').replace(/\n/g, '<br>');
  function aboutHTML(s) {
    const a = s.about || {};
    const stats = a.stats || [];
    return `
    <section class="about" id="about">
      <div class="container about-grid">
        <div class="about-media reveal">
          ${a.photo ? '<img loading="lazy" src="' + esc(a.photo) + '" alt="' + esc(a.name || '') + '">' : '<div class="about-placeholder"><span class="brand-mark big">' + esc((a.name || 'A')[0]) + '</span></div>'}
          <div class="about-role">${esc(a.role || '')}</div>
        </div>
        <div class="about-copy">
          <p class="eyebrow reveal">03 — Sobre mim</p>
          <h2 class="section-title reveal">${esc(a.name || '')}</h2>
          <p class="about-bio reveal">${ml(a.bio)}</p>
          <div class="about-blocks">
            <div class="about-block reveal">
              <p class="about-block-label">Experiência</p>
              <p>${ml(a.experience)}</p>
            </div>
            <div class="about-block reveal">
              <p class="about-block-label">Formação</p>
              <p>${ml(a.education)}</p>
            </div>
            <div class="about-block reveal">
              <p class="about-block-label">Sobre mim</p>
              <p>${ml(a.philosophy)}</p>
            </div>
          </div>
          <div class="about-stats reveal">
            ${stats.map((st) => '<div class="stat"><span class="stat-value">' + esc(st.value) + '</span><span class="stat-label">' + esc(st.label) + '</span></div>').join('')}
          </div>
          <div class="about-cta reveal">
            <a class="btn btn-ghost btn-lg" href="#skills">Ver minhas habilidades <span class="arr">↓</span></a>
          </div>
        </div>
      </div>
    </section>`;
  }

  function skillsHTML(s) {
    const all = (s.skills || []).slice();
    const order = {};
    const groups = [];
    all.forEach((k) => {
      let g = (k.grp || '').trim();
      if (!g) g = k.kind === 'software' ? 'Softwares' : 'Habilidades';
      if (!(g in order)) {
        order[g] = groups.length;
        groups.push({ name: g, items: [] });
      }
      groups[order[g]].items.push(k);
    });
    return `
    <section class="skills" id="skills">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">04 — Ferramentas & habilidades</p>
            <h2 class="section-title">Habilidades</h2>
          </div>
        </div>
        <div class="skills-groups">
          ${groups.map((g, i) => `
            <div class="skill-group reveal" style="transition-delay:${i * 60}ms">
              <p class="software-title">${esc(g.name)}</p>
              <div class="software-chips">
                ${g.items.map((k) => '<span class="chip">' + esc(k.name) + '</span>').join('')}
              </div>
            </div>`).join('')}
        </div>
        <div class="skills-note reveal">
          <span class="brand-mark">✦</span>
          <p>Cada projeto é executado em processo aberto — estratégia primeiro, depois o ofício, e por fim a entrega pronta para o mundo.</p>
        </div>
      </div>
    </section>`;
  }

  function servicesHTML(s) {
    return `
    <section class="services" id="services">
      <div class="container">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">05 — Serviços</p>
            <h2 class="section-title">O que posso fazer por você</h2>
          </div>
          <a class="btn btn-ghost btn-sm" href="#contact">Pedir orçamento <span class="arr">↗</span></a>
        </div>
        <div class="services-grid">
          ${(s.services || []).map((sv, i) => `
            <a class="service-card reveal" href="#contact" data-service="${esc(sv.name)}">
              <div class="service-top">
                <span class="service-icon">${esc(sv.icon || '✦')}</span>
                <span class="service-idx">${String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3>${esc(sv.name)}</h3>
              <p>${esc(sv.description || '')}</p>
              <div class="service-foot">
                <span class="service-price">${esc(sv.price || '')}</span>
                <span class="service-cta">${esc(sv.cta_text || 'Pedir orçamento')} <span class="arr">→</span></span>
              </div>
            </a>`).join('')}
        </div>
      </div>
    </section>`;
  }

  function contactHTML(d, services) {
    const c = (d.settings && d.settings.contact) || {};
    return `
    <section class="contact" id="contact">
      <div class="container">
        <div class="contact-info">
          <p class="eyebrow reveal">06 — Contato</p>
          <h2 class="section-title reveal">Vamos trabalhar juntos</h2>
          <p class="contact-sub reveal">${esc(c.availability || '')}</p>
          <div class="contact-lines reveal">
            <div class="contact-line">
              <span class="contact-ico">${window.S.icon('mail', 20)}</span>
              <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
            </div>
            <div class="contact-line">
              <span class="contact-ico">${window.S.icon('pin', 20)}</span>
              <span>${esc(c.location || '')}</span>
            </div>
            <div class="contact-line">
              <span class="contact-ico">${window.S.icon('clock', 20)}</span>
              <span>${esc(c.availability || '')}</span>
            </div>
            ${c.whatsapp ? `<div class="contact-line">
              <span class="contact-ico">${window.S.icon('chat', 20)}</span>
              <a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
            </div>` : ''}
          </div>
          <div class="contact-social reveal">
            ${(d.socials || []).map((so) => '<a class="social-pill" href="' + esc(so.url) + '" target="_blank" rel="noopener">' + esc(so.platform) + '</a>').join('')}
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- project detail ---------- */

  function detailHTML(p, s, prev, next) {
    const imgs = p.images || [];
    const isCase = p.type === 'case-study';
    const caseSections = [
      ['challenge', 'O Desafio'],
      ['research', 'Pesquisa'],
      ['concept', 'Desenvolvimento do Conceito'],
      ['moodboard', 'Moodboard'],
      ['typography', 'Tipografia'],
      ['color_palette', 'Paleta de Cores'],
      ['process', 'Processo Criativo'],
      ['result', 'Resultado Final'],
      ['applications', 'Aplicações & Mockups']
    ];
    return `
    <main class="detail">
      <div class="container">
        <a class="back-link" href="#/"><span class="arr">←</span> Voltar ao portfólio</a>
        <header class="detail-head">
          <div class="detail-meta">
            <span>${esc(p.category ? p.category.name : 'Projeto')}</span>
            ${p.year ? '<span>' + esc(p.year) + '</span>' : ''}
            ${p.client ? '<span>Cliente · ' + esc(p.client) + '</span>' : ''}
            ${p.type === 'case-study' ? '<span class="tag-case">Estudo de caso</span>' : ''}
          </div>
          <h1 class="detail-title">${esc(p.title)}</h1>
          ${p.description ? '<p class="detail-desc">' + esc(p.description) + '</p>' : ''}
          ${p.external_link ? '<a class="btn btn-solid btn-sm" href="' + esc(p.external_link) + '" target="_blank" rel="noopener">Ver projeto ao vivo <span class="arr">↗</span></a>' : ''}
        </header>

        ${imgs[0] ? '<div class="detail-hero"><img src="' + esc(imgs[0].filename) + '" alt="' + esc(p.title) + '" fetchpriority="high"></div>' : ''}

        <div class="detail-grid">
          <aside class="detail-side">
            <div class="side-block">
              <p class="side-label">Ano</p>
              <p>${esc(p.year || '—')}</p>
            </div>
            <div class="side-block">
              <p class="side-label">Cliente</p>
              <p>${esc(p.client || '—')}</p>
            </div>
            <div class="side-block">
              <p class="side-label">Ferramentas</p>
              <p>${(p.tools || []).map((t) => esc(t)).join('<br>') || '—'}</p>
            </div>
            ${(p.tags || []).length ? '<div class="side-block"><p class="side-label">Tags</p><p>' + p.tags.map((t) => esc(t)).join(' · ') + '</p></div>' : ''}
            <div class="side-block">
              <p class="side-label">Visualizações</p>
              <p>${Number(p.views || 0).toLocaleString('pt-BR')}</p>
            </div>
          </aside>
          <div class="detail-body">
            ${p.overview ? bodySection('Visão Geral do Projeto', p.overview) : ''}
            ${isCase ? caseSections.filter(([k]) => p[k]).map(([k, label]) => bodySection(label, p[k])).join('') : (p.challenge ? bodySection('O Desafio', p.challenge) : '') + (p.process ? bodySection('Processo Criativo', p.process) : '') + (p.result ? bodySection('Resultado Final', p.result) : '')}
          </div>
        </div>

        ${imgs.length > 1 ? '<div class="detail-gallery">' + imgs.slice(1).map((img, i) => '<figure class="reveal"><img loading="lazy" src="' + esc(img.filename) + '" alt="' + esc(p.title) + ' ' + (i + 2) + '"><figcaption>' + esc(img.original_name || '') + '</figcaption></figure>').join('') + '</div>' : ''}

        <nav class="detail-nav">
          ${prev ? '<a class="dn-prev" href="#/project/' + prev.id + '"><span class="arr">←</span><span><small>Anterior</small>' + esc(prev.title) + '</span></a>' : '<span></span>'}
          ${next ? '<a class="dn-next" href="#/project/' + next.id + '"><span><small>Próximo</small>' + esc(next.title) + '</span><span class="arr">→</span></a>' : ''}
        </nav>

        <div class="detail-cta">
          <h2>Tem um projeto em mente?</h2>
          <a class="btn btn-solid btn-lg" href="#contact">Vamos Trabalhar Juntos <span class="arr">→</span></a>
        </div>
      </div>
    </main>`;
  }

  function bodySection(label, text) {
    return '<div class="body-section reveal"><h3>' + esc(label) + '</h3><p>' + esc(text) + '</p></div>';
  }

  /* ---------- router ---------- */

  function parseHash() {
    const h = location.hash || '#/';
    const match = h.match(/^#\/project\/(\d+)/);
    if (match) return { view: 'project', id: Number(match[1]) };
    return { view: 'home' };
  }

  async function route() {
    const { view, id } = parseHash();
    const s = data.settings;
    if (view === 'project') {
      let p;
      try {
        const res = await api('/api/public/projects/' + id);
        p = res.project;
      } catch (_) {
        p = state.projects.find((x) => x.id === id) || null;
      }
      if (!p) { mount('#app', '<div class="container notfound"><h1>Projeto não encontrado</h1><a class="btn btn-solid" href="#/">Voltar ao portfólio</a></div>'); return; }
      const idx = state.projects.findIndex((x) => x.id === p.id);
      const prev = state.projects[idx - 1] || null;
      const next = state.projects[(idx + 1) % state.projects.length] || null;
      mount('#app', detailHTML(p, s, prev, next));
      window.scrollTo(0, 0);
      observeReveal();
    } else {
      mount('#app', homeHTML());
      navOnce();
      bindFilters();
      bindContact();
      updateFilterArrows();
      observeReveal();
      const raw = (location.hash || '#/').replace(/^#\/?/, '');
      if (['about', 'portfolio', 'skills', 'services', 'contact'].includes(raw)) {
        const el = document.getElementById(raw);
        if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } else {
        window.scrollTo(0, 0);
      }
    }
  }

  /* Section links scroll smoothly when already on the home page (no re-render). */
  function bindSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#/')) return;
      const el = document.getElementById(href.slice(1));
      if (el) {
        e.preventDefault();
        if (href.slice(1) === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (location.hash !== href) history.replaceState(null, '', href);
      }
    });
  }

  function homeHTML() {
    const s = data.settings;
    return `
      ${headerHTML(s.site)}
      <main>
        ${heroHTML(s)}
        ${marqueeHTML()}
        ${featuredHTML()}
        ${portfolioHTML()}
        ${aboutHTML(s)}
        ${skillsHTML(data)}
        ${servicesHTML(data)}
        ${contactHTML(data, data.services)}
      </main>
      ${footerHTML(s.site, s.footer, data.socials, s.contact)}`;
  }

  /* ---------- interactions ---------- */

  function bindFilters() {
    qsa('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.cat = Number(btn.dataset.cat);
        const grid = qs('#projectGrid');
        if (grid) grid.innerHTML = renderGrid();
        observeReveal();
        const f = qs('#portfolio');
        if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    const bar = qs('#filterBar');
    if (bar) {
      bar.addEventListener('scroll', updateFilterArrows);
      window.addEventListener('resize', updateFilterArrows);
    }
  }

  function bindContact() {
    const form = qs('#contactForm');
    if (!form) return;

    // service cards prefill the contact subject
    qsa('.service-card').forEach((card) => {
      card.addEventListener('click', () => {
        const svc = card.dataset.service;
        if (svc) {
          const subject = qs('#contactForm [name=subject]');
          if (subject) subject.value = svc;
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const note = qs('#formNote');
      const whatsapp = (data.settings && data.settings.contact && data.settings.contact.whatsapp) || '';
      if (!whatsapp) {
        note.textContent = 'Contato por WhatsApp não configurado.';
        note.className = 'form-note err';
        return;
      }
      const subject = String(fd.get('subject') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const text = (subject ? 'Assunto: ' + subject + '\n\n' : '') + message;
      const a = document.createElement('a');
      a.href = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(text);
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      form.reset();
      note.textContent = 'Abrindo o WhatsApp com sua mensagem...';
      note.className = 'form-note ok';
      setTimeout(() => {
        note.textContent = '';
        note.className = 'form-note';
      }, 4000);
    });
  }

  function observeReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    qsa('.reveal').forEach((n) => io.observe(n));
  }

  /* ---------- public helpers used in inline handlers ---------- */

  window.S.pub = {
    toggleNav() {
      qs('#mobileNav').classList.toggle('open');
    },
    resetFilter() {
      state.cat = 0;
      qsa('.filter-btn').forEach((b) => b.classList.toggle('active', Number(b.dataset.cat) === 0));
      const grid = qs('#projectGrid'); if (grid) grid.innerHTML = renderGrid();
      const nr = qs('#noResults'); if (nr) nr.classList.add('hidden');
      observeReveal();
    },
    scrollFilters(dir) {
      const cats = [{ id: 0, name: 'Todos os projetos' }].concat(
        state.categories.filter((c) => state.projects.some((p) => p.category && p.category.id === c.id))
      );
      let idx = cats.findIndex((c) => c.id === state.cat);
      if (idx === -1) idx = 0;
      idx = (idx + dir + cats.length) % cats.length;
      state.cat = cats[idx].id;
      qsa('.filter-btn').forEach((b) => b.classList.toggle('active', Number(b.dataset.cat) === state.cat));
      const grid = qs('#projectGrid'); if (grid) grid.innerHTML = renderGrid();
      observeReveal();
      const btn = qs('.filter-btn[data-cat="' + state.cat + '"]');
      if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    },
    toggleTheme
  };

  function updateFilterArrows() {
    const prev = qs('#filterPrev'); if (prev) prev.classList.remove('disabled');
    const next = qs('#filterNext'); if (next) next.classList.remove('disabled');
  }

  /* ---------- boot ---------- */

  async function boot() {
    try {
      const res = await api('/api/public/boot');
      data = res;
      state.projects = res.projects.slice(0, 6);
      state.categories = res.categories;
      state.featured = res.featured;
      applyTheme(res.settings);
      applyStoredTheme();
      window.addEventListener('hashchange', route);
      bindSmoothAnchors();
      await route();
    } catch (err) {
      mount('#app', '<div class="container notfound"><h1>Não foi possível carregar o portfólio</h1><p>' + esc(err.message) + '</p><a class="btn btn-solid" href="#/">Tentar novamente</a></div>');
    }
  }

  boot();
})();