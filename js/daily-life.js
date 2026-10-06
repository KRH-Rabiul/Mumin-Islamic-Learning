/* ==========================================================================
   daily-life.js — "দৈনন্দিন জীবন" page
   Uses helpers from common.js (loadBackgrounds, revealOnScroll, searchSections).
   ========================================================================== */

loadBackgrounds(); // apply data-bg hero image
revealOnScroll($$('.reveal')); // fade sections in while scrolling

// Search box: Enter jumps to the first matching section or FAQ.
searchSections('#lifeSearch', () => alert('এই শব্দের জন্য কোনো অংশ পাওয়া যায়নি।'));
