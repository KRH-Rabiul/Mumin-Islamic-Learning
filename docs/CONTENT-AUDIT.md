# Mumin UI Audit (historical, written for v38)

## Current status

This document supersedes older audit notes. Kept for reference; the current release is v51 (see CHANGELOG.md).

### Shared UI contract
- One top navigation bar is used across every page.
- No global left sidebar is rendered.
- Brand stays on the left, navigation stays centered on desktop, and the theme control stays on the right.
- Mobile navigation becomes a horizontal scroll strip without introducing a second sidebar.
- Light theme uses the shared blue/cyan + white palette.
- Dark theme uses the shared deep-blue + cyan palette.
- Image heroes use a consistent dark blue overlay so text remains readable in both themes.
- Shared page-enter, page-leave and scroll-reveal motion is controlled by `common-nav.js` and `css/theme.css`.
- `prefers-reduced-motion` disables the motion system safely.

### Static verification
- JavaScript syntax: pass.
- CSS brace balance: pass.
- Duplicate HTML IDs: none found during v38 audit.
- Local HTML/CSS asset references: no missing references found.
- Service-worker cache version: `mumin-v38-final-ui`.

### Notes
- Quran text/pronunciation architecture remains external-source + IndexedDB based as documented in `QURAN-SOURCE-VERIFICATION.md`.
- Module-specific content and internal navigation are intentionally kept scoped to their own modules.
