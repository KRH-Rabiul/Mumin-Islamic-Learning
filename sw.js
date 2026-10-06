/* ==========================================================================
   sw.js — service worker (offline support)
   Caches the app files so pages open without internet.
   IMPORTANT: when you change ANY file, increase CACHE_NAME (e.g. v52 -> v53), otherwise
   returning visitors keep seeing the old cached files.
   ========================================================================== */

/* Mumin PWA service worker — cache version is bumped whenever the shipped UI changes. */
const CACHE_NAME = 'mumin-v55';

// Files stored on first visit so the app opens offline. Other images (wudu / namaz /
// scenes) are cached automatically the first time they are viewed.
const CORE = [
  './about.html',
  './daily-life.html',
  './deep-learning.html',
  './dua.html',
  './hadith.html',
  './index.html',
  './islam-basics.html',
  './islam-know.html',
  './learning-path.html',
  './quran-loading.html',
  './quran.html',
  './ramadan.html',
  './salah.html',
  './css/base.css',
  './css/hero-images.css',
  './css/nav.css',
  './css/theme.css',
  './css/pages/about.css',
  './css/pages/daily-life.css',
  './css/pages/dua-page.css',
  './css/pages/hadith.css',
  './css/pages/home.css',
  './css/pages/islam-know.css',
  './css/pages/learning-path.css',
  './css/pages/quran.css',
  './css/pages/ramadan.css',
  './css/pages/salah.css',
  './js/about.js',
  './js/common-nav.js',
  './js/common.js',
  './js/daily-life.js',
  './js/dua-page.js',
  './js/hadith.js',
  './js/islam-know.js',
  './js/quran.js',
  './js/ramadan.js',
  './js/salah.js',
  './js/script.js',
  './data/dua-data.js',
  './data/hadith-data.js',
  './assets/images/brand/icon-192.png',
  './assets/images/brand/icon-512.png',
  './assets/images/brand/logo-mark.png',
  './assets/images/brand/profile.webp',
  './assets/images/heroes/daily-life.webp',
  './assets/images/heroes/daily-sunset.webp',
  './assets/images/heroes/hadith.webp',
  './assets/images/heroes/home-hero.webp',
  './assets/images/heroes/quran-study.webp',
  './assets/images/heroes/ramadan.webp',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

// Delete app caches left by older versions (mumin-v*). The hadith cache has its own name and stays.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('mumin-v') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isCode = (request) =>
  request.mode === 'navigate' || /\.(html|css|js)$/.test(new URL(request.url).pathname);

// Pages, CSS and JS: network first (always fresh), cache when offline.
// Images and everything else: cache first (fast, works offline).
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const save = (response) => {
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  event.respondWith(
    isCode(request)
      ? fetch(request)
          .then(save)
          .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
      : caches.match(request).then(
          (hit) =>
            hit ||
            fetch(request)
              .then(save)
              .catch(() => caches.match('./index.html'))
        )
  );
});
