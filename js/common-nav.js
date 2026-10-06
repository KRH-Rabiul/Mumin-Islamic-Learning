/* ==========================================================================
   common-nav.js — shared header, navigation, page transition and theme
   Loaded on EVERY page. Builds the same top bar everywhere; edit PAGES to add or rename a menu item.
   Theme choice is stored in localStorage under 'mumin-theme' (dark / light).
   ========================================================================== */

/* ==========================================================================
   Mumin — shared top navigation
   v38: one header system for every page.
   - No global sidebar.
   - Same brand, centered navigation and theme control everywhere.
   - Module-specific search controls stay inside their own page content.
   ========================================================================== */
(() => {
  const PAGES = [
    { id: 'home', label: 'হোম', href: 'index.html', icon: 'home' },
    { id: 'learn', label: 'শিক্ষাপথ', href: 'learning-path.html', icon: 'learn' },
    { id: 'salah', label: 'নামাজ শিক্ষা', href: 'salah.html', icon: 'salah' },
    { id: 'quran', label: 'কুরআন', href: 'quran.html', icon: 'quran' },
    { id: 'dua', label: 'দোয়া ও যিকির', href: 'dua.html', icon: 'dua' },
    { id: 'life', label: 'দৈনন্দিন জীবন', href: 'daily-life.html', icon: 'life' },
    { id: 'ramadan', label: 'রমজান', href: 'ramadan.html', icon: 'ramadan' },
    { id: 'hadith', label: 'হাদিস', href: 'hadith.html', icon: 'hadith' },
    { id: 'about', label: 'আমাদের সম্পর্কে', href: 'about.html', icon: 'about' },
  ];

  const SECTION_PAGE = {
    'learning-path.html': 'learn',
    'islam-know.html': 'learn',
    'islam-basics.html': 'learn',
    'deep-learning.html': 'learn',
    'salah.html': 'salah',
    'quran.html': 'quran',
    'dua.html': 'dua',
    'daily-life.html': 'life',
    'ramadan.html': 'ramadan',
    'hadith.html': 'hadith',
    'about.html': 'about',
  };

  const file = location.pathname.split('/').pop() || 'index.html';
  const isHome = file === 'index.html';
  const main = document.querySelector('main');
  if (!main || document.querySelector('.mumin-topbar')) return;

  /* ---------- Shared icon sprite ---------- */
  const ICON_PATHS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    learn:
      '<path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z"/><path d="M6.5 11.8V16c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.2"/><path d="M21.5 9.5V15"/>',
    salah:
      '<path d="M12 2.5v3"/><path d="M5.5 20v-6.5a6.5 6.5 0 0 1 13 0V20"/><path d="M10 20v-3a2 2 0 0 1 4 0v3"/><path d="M3 20h18"/><path d="M3.5 20v-8M20.5 20v-8"/>',
    quran:
      '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z"/><path d="M12 6.5v13"/>',
    dua: '<circle cx="18.5" cy="10.5" r="1.5"/><circle cx="16.6" cy="15.1" r="1.5"/><circle cx="12" cy="17" r="1.5"/><circle cx="7.4" cy="15.1" r="1.5"/><circle cx="5.5" cy="10.5" r="1.5"/><circle cx="7.4" cy="5.9" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="16.6" cy="5.9" r="1.5"/><path d="M12 18.5v1.6"/><circle cx="12" cy="21.6" r="1.2"/>',
    life: '<path d="M3 18.5h18"/><path d="M6.5 18.5a5.5 5.5 0 0 1 11 0"/><path d="M12 6v2.5M4.6 10.6l1.8 1.8M19.4 10.6l-1.8 1.8M2 15.5h2M20 15.5h2"/>',
    ramadan:
      '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/><path d="m17 3.5.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z"/>',
    hadith: '<path d="M6 3.5h9l4 4v13H6Z"/><path d="M15 3.5v4h4"/><path d="M9.5 12h6M9.5 15.5h6"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.9" r=".7"/>',
    'arrow-ur': '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
    'arrow-r': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    app: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 8v6"/><path d="m9.5 11.8 2.5 2.5 2.5-2.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sparkle:
      '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="m18.5 15 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    quote:
      '<path d="M9.5 7.5C7 8.3 5.5 10.2 5.5 13v3.5h5V12H8c0-1.6.8-2.6 2-3.2ZM18.5 7.5c-2.5.8-4 2.7-4 5.5v3.5h5V12H17c0-1.6.8-2.6 2-3.2Z"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
  };

  const svgIcon = (name, cls = '') =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  window.muminIcon = svgIcon;
  if (!document.getElementById('mumin-icons')) {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<svg id="mumin-icons" width="0" height="0" style="position:absolute" aria-hidden="true">' +
        Object.entries(ICON_PATHS)
          .map(([key, path]) => `<symbol id="i-${key}" viewBox="0 0 24 24">${path}</symbol>`)
          .join('') +
        '</svg>'
    );
  }

  document.body.classList.add('mumin-top-only-shell');
  document.body.classList.toggle('mumin-home-shell', isHome);
  document.body.classList.add('mumin-has-shell');

  /* ---------- One identical header structure on every page ---------- */
  const top = document.createElement('header');
  top.className = 'mumin-topbar';
  top.setAttribute('role', 'banner');
  top.innerHTML = `
    <a class="mumin-top-brand" href="index.html" aria-label="Mumin — হোম">
      <img src="assets/images/brand/logo-mark.png" alt="Mumin লোগো">
      <span><strong>Mumin</strong><small>শিখি • বুঝি • আমল করি</small></span>
    </a>
    <nav class="mumin-topnav" aria-label="প্রধান নেভিগেশন">
      ${PAGES.map((page) => `<a data-page="${page.id}" href="${page.href}">${page.label}</a>`).join('')}
    </nav>
    <div class="mumin-top-actions">
      <button class="mumin-theme" id="theme" type="button" title="থিম বদলান" aria-label="থিম বদলান">${svgIcon('moon')}</button>
    </div>`;

  const app = document.createElement('div');
  app.className = 'mumin-app';
  main.before(app);
  app.append(top, main);

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = 'manifest.webmanifest';
    document.head.appendChild(manifest);
  }

  /* ---------- Motion: one shared page/scroll system ---------- */
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    document.documentElement.classList.add('mumin-motion-ready');
    requestAnimationFrame(() => document.documentElement.classList.add('mumin-page-ready'));
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const selectors = [
      'main > section',
      'main > .section-title',
      'main > .section-heading',
      'main > .about-section',
      'main > .content-section:not(.reveal)',
      'main > .book-section',
      'main > .category-section',
      'main > .study-layout',
      'main > .quran-layout',
      'main > .salah-wrap',
      'main > .learn-main',
    ];
    const items = [
      ...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)])),
    ].filter((el) => !el.classList.contains('reveal') && !el.classList.contains('mumin-no-reveal'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('mumin-scroll-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    items.forEach((el) => {
      el.classList.add('mumin-scroll-reveal');
      observer.observe(el);
    });
  }

  /* Same-origin page transition. External links and downloads are untouched. */
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || reduceMotion || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    event.preventDefault();
    document.documentElement.classList.add('mumin-page-leaving');
    window.setTimeout(() => {
      location.href = url.href;
    }, 190);
  });
  window.addEventListener('pageshow', () => document.documentElement.classList.remove('mumin-page-leaving'));

  /* ---------- Active navigation ---------- */
  const setActive = (id) =>
    document
      .querySelectorAll('[data-page]')
      .forEach((el) => el.classList.toggle('active', el.dataset.page === id));

  const currentId = () => {
    if (!isHome) return SECTION_PAGE[file] || 'home';
    return 'home';
  };
  setActive(currentId());

  /* ---------- Shared theme ---------- */
  const themeBtn = document.getElementById('theme');
  const store = {
    get() {
      try {
        return localStorage.getItem('mumin-theme');
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem('mumin-theme', value);
      } catch {
        /* storage blocked (private mode): the choice just is not remembered */
      }
    },
  };
  const applyTheme = (dark) => {
    document.body.classList.toggle('dark', dark);
    themeBtn.innerHTML = svgIcon(dark ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-label', dark ? 'লাইট থিম চালু করুন' : 'ডার্ক থিম চালু করুন');
  };
  applyTheme(store.get() !== 'light');
  themeBtn.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    applyTheme(dark);
    store.set(dark ? 'dark' : 'light');
  });
})();
