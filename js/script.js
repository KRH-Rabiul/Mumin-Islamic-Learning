/* ==========================================================================
   script.js — Home page (index.html)
   Reveal animation, learning progress, saved items, prayer times, install prompt, service worker.
   Prayer times: api.aladhan.com (method=1, school=1). Today's copy is cached in localStorage
   ('mumin-prayer-cache'); if the network fails the built-in estimate is shown WITH a notice.
   ========================================================================== */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const toast = (message) => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__muminToast);
    window.__muminToast = setTimeout(() => el.classList.remove('show'), 2300);
  };
  window.showToast = toast;

  /* ---------- reveal-on-scroll ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- learning progress ---------- */
  const currentStep = Math.min(5, Math.max(1, Number(localStorage.getItem('mumin-step') || 1)));
  const progress = $('#progressPct');
  if (progress) progress.textContent = `${currentStep * 20}%`;
  $$('.path-step').forEach((step) => {
    const n = Number(step.dataset.step);
    step.classList.toggle('active', n === currentStep);
    step.classList.toggle('done', n < currentStep);
    step.addEventListener('click', () => {
      try {
        localStorage.setItem('mumin-step', String(n));
      } catch {
        /* storage blocked: fall back to defaults */
      }
    });
  });

  /* ---------- saved content indicator ---------- */
  const savedCount = (() => {
    try {
      return JSON.parse(localStorage.getItem('mumin-saved') || '[]').length;
    } catch {
      return 0;
    }
  })();
  const savedLink = document.querySelector('[data-page="saved"]');
  if (savedLink && savedCount) {
    savedLink.setAttribute('aria-label', `সংরক্ষিত (${savedCount})`);
  }

  const renderSavedHome = () => {
    const section = $('#saved');
    const grid = $('#savedHomeGrid');
    if (!section || !grid) return;

    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem('mumin-saved') || '[]');
    } catch {
      ids = [];
    }

    if (!Array.isArray(ids) || !ids.length) {
      section.hidden = true;
      return;
    }

    const surahNames = {
      fatiha: 'সূরা আল-ফাতিহা',
      ikhlas: 'সূরা আল-ইখলাস',
      falaq: 'সূরা আল-ফালাক',
      nas: 'সূরা আন-নাস',
    };

    grid.innerHTML = ids
      .slice(0, 6)
      .map((id) => {
        const isSurah = String(id).startsWith('surah-');
        const key = isSurah ? String(id).slice(6) : String(id);
        const dua = typeof DUA_BY_ID !== 'undefined' ? DUA_BY_ID[key] : null;
        const title = isSurah ? surahNames[key] || 'সংরক্ষিত সূরা' : dua?.title || 'সংরক্ষিত দোয়া';
        const href = isSurah ? 'quran.html' : 'dua.html';
        const type = isSurah ? 'কুরআন' : 'দোয়া ও যিকির';
        return `<a class="saved-home-card" href="${href}">
        <div><strong>${title}</strong><small>${type}</small></div><span>→</span>
      </a>`;
      })
      .join('');

    section.hidden = false;
  };
  renderSavedHome();

  /* ---------- prayer times ---------- */
  let prayerData = [
    ['ফজর', '04:50', 'sunrise'],
    ['যোহর', '12:12', 'sun'],
    ['আসর', '15:45', 'sun-half'],
    ['মাগরিব', '18:14', 'sunset'],
    ['এশা', '19:30', 'moon'],
  ];
  let countdownTimer;

  // Times are "live" once they came from the API (or from today's saved copy).
  // Until then the built-in list above is only an estimate and the card says so.
  let prayerIsLive = false;
  const PRAYER_CACHE_KEY = 'mumin-prayer-cache';
  const todayKey = () => new Date().toLocaleDateString('en-CA'); // e.g. 2026-10-02

  /** Today's saved times, or null when nothing was saved today. */
  const readPrayerCache = () => {
    try {
      const cache = JSON.parse(localStorage.getItem(PRAYER_CACHE_KEY));
      return cache && cache.date === todayKey() ? cache : null;
    } catch {
      return null; // storage blocked or data corrupted
    }
  };
  const savePrayerCache = (city, country, data) => {
    try {
      localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ date: todayKey(), city, country, data }));
    } catch {
      /* storage unavailable: the app still works, it just refetches next time */
    }
  };
  /** Show or hide the "আনুমানিক সময়" notice under the city name. */
  const showEstimateNotice = (visible) => {
    const note = $('#prayerNote');
    if (note) note.hidden = !visible;
  };

  const format12 = (hm) => {
    const [hh, mm] = hm.split(':').map(Number);
    const ap = hh >= 12 ? 'PM' : 'AM';
    const h = hh % 12 || 12;
    return `${h}:${String(mm).padStart(2, '0')} ${ap}`;
  };

  const updateDate = () => {
    const el = $('#prayerDate');
    if (!el) return;
    const d = new Date();
    const text = new Intl.DateTimeFormat('bn-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
    el.textContent = text;
  };

  const renderPrayer = () => {
    const box = $('#prayers');
    if (!box) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    let next = null;

    box.innerHTML = prayerData
      .map((p, i) => {
        const [h, m] = p[1].split(':').map(Number);
        const minutes = h * 60 + m;
        if (!next && minutes > currentMinutes) next = { name: p[0], hm: p[1], i };
        return `
        <div class="prayer-row ${next && next.i === i ? 'active' : ''}">
          <span class="pr-ic" aria-hidden="true">${window.muminIcon ? window.muminIcon(p[2]) : ''}</span>
          <span>${p[0]}</span>
          <time>${format12(p[1])}</time>
        </div>`;
      })
      .join('');

    if (!next) next = { name: prayerData[0][0], hm: prayerData[0][1], i: 0, nextDay: true };

    const target = new Date();
    const [h, m] = next.hm.split(':').map(Number);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const seconds = Math.max(0, Math.floor((target - now) / 1000));
    const nextName = $('#nextName');
    const countdown = $('#countdown');
    if (nextName) nextName.textContent = next.name;
    if (countdown) {
      countdown.textContent =
        `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:` +
        `${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:` +
        `${String(seconds % 60).padStart(2, '0')}`;
    }
  };

  const fetchPrayer = async (city = 'Dhaka', country = 'Bangladesh', quiet = false) => {
    try {
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1&school=1`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error('Prayer API error');
      const json = await response.json();
      const t = json?.data?.timings;
      if (!t) throw new Error('Prayer data missing');

      prayerData = [
        ['ফজর', t.Fajr.slice(0, 5), 'sunrise'],
        ['যোহর', t.Dhuhr.slice(0, 5), 'sun'],
        ['আসর', t.Asr.slice(0, 5), 'sun-half'],
        ['মাগরিব', t.Maghrib.slice(0, 5), 'sunset'],
        ['এশা', t.Isha.slice(0, 5), 'moon'],
      ];
      if ($('#cityName')) $('#cityName').textContent = `${city}, ${country}`;
      prayerIsLive = true;
      savePrayerCache(city, country, prayerData);
      showEstimateNotice(false);
      renderPrayer();
      if (!quiet) toast('আজকের নামাজের সময় আপডেট হয়েছে');
    } catch {
      showEstimateNotice(!prayerIsLive); // keep the notice while only the built-in estimate is shown
      renderPrayer();
      if (!quiet) toast('অনলাইনে সময় পাওয়া যায়নি, আনুমানিক সময় দেখানো হচ্ছে');
    }
  };

  updateDate();
  const savedPrayer = readPrayerCache(); // today's copy from the last successful fetch
  if (savedPrayer) {
    prayerData = savedPrayer.data;
    prayerIsLive = true;
    if ($('#cityName')) $('#cityName').textContent = `${savedPrayer.city}, ${savedPrayer.country}`;
  }
  renderPrayer();
  fetchPrayer(savedPrayer?.city || 'Dhaka', savedPrayer?.country || 'Bangladesh', true);
  clearInterval(countdownTimer);
  countdownTimer = setInterval(renderPrayer, 1000);

  const prayerCityModal = $('#prayerCityModal');
  const prayerCityInput = $('#prayerCityInput');
  const prayerCountryInput = $('#prayerCountryInput');
  const openPrayerCityModal = () => {
    if (!prayerCityModal) return;
    prayerCityModal.classList.add('open');
    prayerCityModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => prayerCityInput?.focus(), 30);
  };
  const closePrayerCityModal = () => {
    prayerCityModal?.classList.remove('open');
    prayerCityModal?.setAttribute('aria-hidden', 'true');
  };
  $('#locBtn')?.addEventListener('click', openPrayerCityModal);
  prayerCityModal
    ?.querySelectorAll('[data-prayer-city-close]')
    .forEach((el) => el.addEventListener('click', closePrayerCityModal));
  $('#prayerCityApply')?.addEventListener('click', async () => {
    const city = prayerCityInput?.value.trim();
    const country = prayerCountryInput?.value.trim();
    if (!city || !country) {
      toast('শহর ও দেশের নাম দিন');
      return;
    }
    closePrayerCityModal();
    await fetchPrayer(city, country);
  });
  [prayerCityInput, prayerCountryInput].forEach((input) =>
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#prayerCityApply')?.click();
      if (e.key === 'Escape') closePrayerCityModal();
    })
  );

  /* ---------- PWA install ---------- */
  let deferredInstall = null;
  const installButtons = $$('.install-app');
  const installModal = $('#installModal');
  const installText = $('#installText');
  const installAction = $('#installAction');

  const openInstallModal = () => {
    if (!installModal) return;
    installModal.classList.add('open');
    installModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeInstallModal = () => {
    if (!installModal) return;
    installModal.classList.remove('open');
    installModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  installButtons.forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (deferredInstall) {
        deferredInstall.prompt();
        const choice = await deferredInstall.userChoice;
        deferredInstall = null;
        if (choice?.outcome === 'accepted') toast('Mumin App ইনস্টল হচ্ছে…');
        return;
      }
      if (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) {
        toast('Mumin App ইতিমধ্যে চালু আছে');
        return;
      }
      if (installText) {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        installText.textContent = isIOS
          ? 'Safari-এর Share মেনু খুলে “Add to Home Screen” নির্বাচন করুন। তারপর Mumin হোমস্ক্রিন থেকেই অ্যাপের মতো খুলতে পারবেন।'
          : 'ব্রাউজারের মেনু থেকে “Install app” বা “Add to Home Screen” নির্বাচন করুন। এরপর Mumin হোমস্ক্রিন থেকে দ্রুত খুলতে পারবেন।';
      }
      openInstallModal();
    })
  );

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    closeInstallModal();
    toast('Mumin App সফলভাবে ইনস্টল হয়েছে');
  });

  $$('[data-install-close]').forEach((el) => el.addEventListener('click', closeInstallModal));
  installAction?.addEventListener('click', async () => {
    if (!deferredInstall) {
      closeInstallModal();
      return;
    }
    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    if (choice?.outcome === 'accepted') toast('Mumin App ইনস্টল হচ্ছে…');
    closeInstallModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInstallModal();
  });

  /* ---------- service worker ---------- */
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
