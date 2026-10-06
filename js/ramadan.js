/* ==========================================================================
   ramadan.js — "রমজান" page
   Uses helpers from common.js (loadBackgrounds, revealOnScroll, showToast, searchSections).
   ========================================================================== */

loadBackgrounds(); // apply data-bg images
revealOnScroll($$('.reveal')); // fade sections in while scrolling

// "আরবি কপি" buttons: copy the text stored in data-copy to the clipboard.
$$('[data-copy]').forEach((button) =>
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast('আরবি কপি হয়েছে');
    } catch {
      showToast('কপি করা যায়নি'); // clipboard blocked (e.g. non-https page)
    }
  })
);

// Search box: Enter jumps to the first matching section or FAQ.
searchSections('#ramadanSearch', () => showToast('এই শব্দের জন্য কোনো অংশ পাওয়া যায়নি'));
