/* ==========================================================================
   common.js — small helpers shared by the content pages
   --------------------------------------------------------------------------
   Loaded (after common-nav.js) by: hadith, ramadan, daily-life, islam-know.
   Provides: $, $$, loadBackgrounds, revealOnScroll, showToast, searchSections.
   Page scripts must NOT redeclare these names.
   ========================================================================== */

/** Short DOM helpers: first match / all matches as a real array. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Background images are written in HTML as data-bg="url('assets/...')" and
 * applied here, so the URL is resolved relative to the page (not the CSS file).
 */
function loadBackgrounds() {
  $$('[data-bg]').forEach((el) => {
    if (el.dataset.bg) el.style.backgroundImage = el.dataset.bg;
  });
}

/**
 * Fade-in on scroll: adds the `visible` class the first time an element enters
 * the viewport. Shows everything at once for users who prefer reduced motion.
 * @param {Element[]} items   elements that carry the `.reveal` class
 * @param {object}   options  IntersectionObserver options (threshold, rootMargin)
 */
function revealOnScroll(items, options = { threshold: 0.08 }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reducedMotion) {
    items.forEach((item) => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, options);
  items.forEach((item) => observer.observe(item));
}

/** Small message at the bottom of the screen (needs <div id="toast"> in the page). */
function showToast(message, duration = 1800) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/**
 * Press Enter in a search box -> scroll to the first section/FAQ containing the
 * text and flash it (class `search-hit`). Calls onNotFound() when nothing matches.
 */
function searchSections(inputSelector, onNotFound) {
  $(inputSelector)?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const query = event.target.value.trim().toLowerCase();
    if (!query) return;
    const target = $$('.content-section,.faq-list details').find((el) =>
      el.innerText.toLowerCase().includes(query)
    );
    if (!target) return onNotFound();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('search-hit');
    setTimeout(() => target.classList.remove('search-hit'), 900);
  });
}
