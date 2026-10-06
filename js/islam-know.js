/* ==========================================================================
   islam-know.js — "ইসলামকে জানুন" page
   Uses helpers from common.js ($, $$, loadBackgrounds, revealOnScroll).
   ========================================================================== */

loadBackgrounds(); // apply data-bg images

// Fade sections in while scrolling (starts a little before the bottom edge).
revealOnScroll($$('.reveal'), { threshold: 0.08, rootMargin: '0px 0px -30px' });

/* Topic navigation: active section follows the reading position. */
const topicLinks = $$('.ik-topic-nav a');
const sections = topicLinks
  .map((link) => document.getElementById(link.getAttribute('href')?.slice(1)))
  .filter(Boolean);

const setTopicActive = (id) => {
  topicLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
};

if ('IntersectionObserver' in window && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setTopicActive(visible.target.id);
    },
    { rootMargin: '-24% 0px -62% 0px', threshold: [0.01, 0.15, 0.35, 0.6] }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

topicLinks.forEach((link) => {
  link.addEventListener('click', () => {
    setTopicActive(link.getAttribute('href').slice(1));
  });
});

/* Keep the shared top navigation's search hidden on this learning page. */
$('.mumin-search')?.remove();
