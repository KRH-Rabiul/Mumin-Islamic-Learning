/* ==========================================================================
   dua-page.js — "দোয়া ও যিকির" page
   Category grid + dua list + detail panel with search, save (bookmark) and copy.
   Data comes from data/dua-data.js (DUA_CATEGORIES, DUA_BY_ID). Saved ids live in
   localStorage under 'mumin-saved'.
   ========================================================================== */

// Makes url('...') absolute so a CSS variable can use it from any stylesheet.
const absUrl = (v) =>
  String(v).replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => `url('${new URL(u, document.baseURI).href}')`);
// Short DOM helpers and a toast (small bottom message).
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = (m) => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 2200);
};
// Saved duas: a list of ids kept in localStorage.
const saved = () => JSON.parse(localStorage.getItem('mumin-saved') || '[]');
const isSaved = (id) => saved().includes(id);
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]
  );
// Current selection.
let activeDuaCategory = 'morning';
let activeDuaId = DUA_CATEGORIES[0].ids[0];

// ---- Which duas are visible (category + search box) ----
function categoryItems(cat) {
  return cat.ids.map((id) => DUA_BY_ID[id]).filter(Boolean);
}
function currentItems() {
  const cat = DUA_CATEGORIES.find((c) => c.id === activeDuaCategory) || DUA_CATEGORIES[0];
  const q = $('#duaSearch').value.trim().toLowerCase();
  let items = categoryItems(cat);
  if (q)
    items = items.filter((d) =>
      [d.title, d.arabic, d.pron, d.meaning, d.when, d.source, d.benefit, d.grade]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  return items;
}
// ---- Rendering: category cards, dua list, detail panel ----
function renderDuaCategories() {
  const box = $('#duaCategoryGrid');
  box.innerHTML = DUA_CATEGORIES.map(
    (c) =>
      `<button class="dua-category-card category-animate ${c.id === activeDuaCategory ? 'active' : ''}" data-dua-cat="${c.id}"><span class="dua-cat-photo" style="--bg:${absUrl(`url('${c.image}')`)}"></span><span class="dua-cat-overlay"></span><span class="dua-cat-icon">${c.icon}</span><span class="dua-cat-name">${esc(c.name)}</span><span class="dua-cat-count">${c.ids.length}টি দোয়া <b>›</b></span></button>`
  ).join('');
  $$('[data-dua-cat]').forEach(
    (b) =>
      (b.onclick = () => {
        activeDuaCategory = b.dataset.duaCat;
        const items = currentItems();
        activeDuaId =
          items[0]?.id || categoryItems(DUA_CATEGORIES.find((c) => c.id === activeDuaCategory))[0]?.id;
        renderDuaCategories();
        renderDuaList();
        renderDuaDetail();
      })
  );
}
function renderDuaList() {
  const cat = DUA_CATEGORIES.find((c) => c.id === activeDuaCategory) || DUA_CATEGORIES[0];
  const items = currentItems();
  $('#duaCategoryTitle').textContent = cat.name;
  $('#duaCategoryDesc').textContent = cat.desc;
  $('#duaCount').textContent = `${items.length}টি`;
  $('#duaList').innerHTML = items.length
    ? items
        .map(
          (d, i) =>
            `<button class="dua-list-item ${d.id === activeDuaId ? 'active' : ''}" data-dua-select="${d.id}"><span class="dua-list-num">${String(i + 1).padStart(2, '0')}</span><span><span class="dua-list-title">${esc(d.title)}</span><small class="dua-list-sub">${esc(d.when)}</small></span><span class="dua-bookmark">${isSaved(d.id) ? '▮' : '♡'}</span></button>`
        )
        .join('')
    : `<div class="empty-state"><div><strong>কোনো দোয়া পাওয়া যায়নি</strong><p>অন্য শব্দ দিয়ে খুঁজুন অথবা অন্য ক্যাটাগরি নির্বাচন করুন।</p></div></div>`;
  $$('[data-dua-select]').forEach(
    (b) =>
      (b.onclick = () => {
        activeDuaId = b.dataset.duaSelect;
        renderDuaList();
        renderDuaDetail();
      })
  );
}
// ---- Previous / next, save and copy actions ----
function navIds() {
  return currentItems().map((d) => d.id);
}
function moveDua(dir) {
  const ids = navIds();
  let i = ids.indexOf(activeDuaId);
  if (i < 0) i = 0;
  let next = i + dir;
  if (next < 0) next = ids.length - 1;
  if (next >= ids.length) next = 0;
  if (ids[next]) {
    activeDuaId = ids[next];
    renderDuaList();
    renderDuaDetail();
  }
}
function toggleSave(id) {
  let a = saved();
  a = a.includes(id) ? a.filter((x) => x !== id) : [...a, id];
  localStorage.setItem('mumin-saved', JSON.stringify(a));
  renderDuaList();
  renderDuaDetail();
  toast(a.includes(id) ? 'সংরক্ষিত হয়েছে' : 'সংরক্ষণ থেকে সরানো হয়েছে');
}
async function copyText(text, label = 'কপি করা হয়েছে') {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    toast('কপি করা যায়নি');
  }
}
function renderDuaDetail() {
  const d = DUA_BY_ID[activeDuaId];
  const cat = DUA_CATEGORIES.find((c) => c.ids.includes(activeDuaId));
  const ids = navIds();
  const index = Math.max(0, ids.indexOf(activeDuaId));
  if (!d) {
    $('#duaDetailPanel').innerHTML =
      '<div class="empty-state"><div><strong>একটি দোয়া নির্বাচন করুন</strong><p>বাম পাশের তালিকা থেকে একটি দোয়া বেছে নিন।</p></div></div>';
    return;
  }
  $('#duaDetailPanel').innerHTML =
    `<div class="detail-animate"><div class="detail-top"><div class="detail-title-wrap"><span class="detail-number">${String(index + 1).padStart(2, '0')}</span><div class="detail-title"><h2>${esc(d.title)}</h2><p>${cat ? esc(cat.name) : 'দোয়া ও যিকির'} • ${esc(d.grade)}</p></div></div><div class="detail-nav"><button data-prev>← পূর্ববর্তী</button><button data-next>পরবর্তী →</button><button class="detail-save ${isSaved(d.id) ? 'saved' : ''}" data-save-detail>${isSaved(d.id) ? '★' : '♡'}</button></div></div>
  <div class="detail-arabic" lang="ar" dir="rtl">${esc(d.arabic)}</div>
  <div class="detail-main-grid"><section class="detail-box"><h4>বাংলা উচ্চারণ</h4><p>${esc(d.pron)}</p></section><section class="detail-box"><h4>বাংলা অর্থ</h4><p>${esc(d.meaning)}</p></section><section class="detail-box benefit"><h4>${window.muminIcon('sparkle')} ফজিলত / গুরুত্ব</h4><p>${esc(d.benefit)}</p></section><section class="detail-box source"><h4>${window.muminIcon('link')} রেফারেন্স</h4><p>${esc(d.source)}</p><small>${esc(d.grade)}</small></section></div>
  <div class="detail-meta-grid"><section class="meta-box"><h5>◷ কখন পড়বেন</h5><p>${esc(d.when)}</p></section><section class="meta-box"><h5>↻ কতবার</h5><p>${esc(d.count)}</p></section><section class="meta-box"><h5>⌁ উৎসের ধরন</h5><p>${esc(d.grade)}</p></section></div>
  <div class="detail-actions"><button class="copy-btn" data-copy-arabic>${window.muminIcon('copy')} আরবি কপি করুন</button><button data-copy-pron>${window.muminIcon('copy')} বাংলা উচ্চারণ কপি করুন</button><button data-copy-meaning>${window.muminIcon('copy')} বাংলা অর্থ কপি করুন</button><button class="save-btn" data-save-detail>${isSaved(d.id) ? '★ সংরক্ষিত' : '♡ সংরক্ষণ করুন'}</button></div>
  <div class="detail-policy">উৎসে সরাসরি বর্ণিত ফজিলতকে আলাদা রাখা হয়েছে। সাধারণ শিক্ষামূলক ব্যাখ্যাকে নির্দিষ্ট হাদিসের ফজিলত হিসেবে উপস্থাপন করা হয়নি।</div></div>`;
  $('[data-prev]').onclick = () => moveDua(-1);
  $('[data-next]').onclick = () => moveDua(1);
  $$('[data-save-detail]').forEach((b) => (b.onclick = () => toggleSave(d.id)));
  $('[data-copy-arabic]').onclick = () => copyText(d.arabic, 'আরবি কপি হয়েছে');
  $('[data-copy-pron]').onclick = () => copyText(d.pron, 'বাংলা উচ্চারণ কপি হয়েছে');
  $('[data-copy-meaning]').onclick = () => copyText(d.meaning, 'বাংলা অর্থ কপি হয়েছে');
}
// ---- Wiring: search boxes and the clear button ----
function renderAll() {
  const items = currentItems();
  if (!items.some((d) => d.id === activeDuaId)) activeDuaId = items[0]?.id || '';
  renderDuaCategories();
  renderDuaList();
  renderDuaDetail();
}

$('#duaSearch').addEventListener('input', () => {
  const items = currentItems();
  activeDuaId = items[0]?.id || '';
  renderDuaList();
  renderDuaDetail();
});
$('#muminTopDuaSearch')?.addEventListener('input', (e) => {
  $('#duaSearch').value = e.target.value;
  $('#duaSearch').dispatchEvent(new Event('input'));
});
$('#duaClear').onclick = () => {
  activeDuaCategory = 'morning';
  $('#duaSearch').value = '';
  activeDuaId = DUA_CATEGORIES[0].ids[0];
  renderAll();
};

// Lazy-load card pictures (data-bg) shortly before they scroll into view.
(function initLazyBackgrounds() {
  const items = [...document.querySelectorAll('[data-bg]')];
  const load = (el) => {
    if (!el.dataset.bgLoaded) {
      el.style.setProperty('--bg', absUrl(el.dataset.bg));
      el.dataset.bgLoaded = '1';
    }
  };
  if (!('IntersectionObserver' in window)) {
    items.forEach(load);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          load(entry.target);
          observer.unobserve(entry.target);
        }
      }),
    { rootMargin: '350px 0px' }
  );
  items.forEach((el) => observer.observe(el));
})();
renderAll();
