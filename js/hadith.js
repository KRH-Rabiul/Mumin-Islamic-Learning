/* ==========================================================================
   hadith.js — "হাদিস" page: book list + in-page chapter reader
   --------------------------------------------------------------------------
   Needs (loaded before this file): common.js ($, $$, showToast)
   and data/hadith-data.js (HADITH_BOOKS, HADITH_API).

   How it works
   * The address bar decides what is shown, WITHOUT reloading the page:
       hadith.html                 -> list of books
       hadith.html#bukhari/3       -> book "bukhari", chapter 3
       hadith.html#bukhari/3/125   -> same, and scroll to hadith no. 125
     The browser's Back button therefore works as expected.
   * A chapter is fetched on demand (Arabic + Bengali, plus grades for the four
     Sunan books), merged by hadith number and cached in memory.
   * Everything from the dataset is inserted with textContent (never innerHTML).
   ========================================================================== */

/* ---------- Settings ---------- */
const PAGE_SIZE = 30; // hadiths drawn per "আরও দেখান" click
const FETCH_TIMEOUT = 20000; // ms before a chapter request is given up

/* ---------- Page elements ---------- */
const searchInput = $('#hadithSearch');
const bookSection = $('#books');
const bookGrid = $('#bookGrid');
const chapterResults = $('#chapterResults');
const noResult = $('#noResult');
const reader = $('#reader');
const chapterSelect = $('#chapterSelect');
const jumpInput = $('#jumpInput');
const filterInput = $('#filterInput');
const hadithList = $('#hadithList');
const statusBox = $('#readerStatus');
const moreBtn = $('#moreBtn');
const gradeNote = $('#gradeNote');

/* ---------- Reader state ---------- */
const chapterCache = new Map(); // "bukhari/3" -> array of merged hadiths
const state = { book: null, row: null, all: [], visible: [], shown: 0, token: 0, focus: 0 };

/* ---------- Small helpers ---------- */
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[d]);
const findBook = (id) => HADITH_BOOKS.find((book) => book.id === id);
const findRow = (book, no) => book.sections.find((row) => row[0] === no);

/** Create an element with a class and (safe) text. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The dataset sometimes starts Bengali text with a stray "।" — remove it. */
const cleanBangla = (text) =>
  String(text || '')
    .replace(/^[\s।]+/, '')
    .trim();

/* ==========================================================================
   1. Book list + search
   ========================================================================== */

/** Draw the six book cards. Each card is a button (no navigation, no reload). */
function renderBooks() {
  bookGrid.replaceChildren(
    ...HADITH_BOOKS.map((book, index) => {
      const card = el('button', 'book-card');
      card.type = 'button';
      card.dataset.book = book.id;
      card.dataset.search = `${book.nameBn} ${book.nameEn} ${book.keywords}`.toLowerCase();

      const copy = el('div', 'book-copy');
      copy.append(
        el('span', '', bn(String(index + 1).padStart(2, '0'))),
        el('h3', '', book.nameBn),
        el('p', '', `${book.nameEn} · ${bn(book.sections.length)}টি অধ্যায়`)
      );
      card.append(el('div', 'book-icon', book.icon), copy, el('b', 'arrow', '→'));
      card.addEventListener('click', () => goTo(book.id, book.sections[0][0]));
      return card;
    })
  );
}

/** Show only the books and chapters that match the search words. */
function applySearch(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  let matchedBooks = 0;
  $$('.book-card', bookGrid).forEach((card) => {
    const match = !query || card.dataset.search.includes(query);
    card.hidden = !match;
    if (match) matchedBooks++;
  });

  // Chapter names are English in the dataset, so they are searched too.
  const hits = [];
  if (query.length >= 2) {
    HADITH_BOOKS.forEach((book) =>
      book.sections.forEach((row) => {
        if (row[1].toLowerCase().includes(query)) hits.push({ book, row });
      })
    );
  }
  chapterResults.replaceChildren();
  chapterResults.hidden = hits.length === 0;
  if (hits.length) {
    chapterResults.append(el('h3', '', `অধ্যায়ের ফলাফল (${bn(hits.length)})`));
    hits.slice(0, 40).forEach(({ book, row }) => {
      const item = el('button', 'chapter-hit');
      item.type = 'button';
      item.append(el('b', '', book.nameBn), el('span', '', `${row[0]}. ${row[1]}`));
      item.addEventListener('click', () => goTo(book.id, row[0]));
      chapterResults.append(item);
    });
  }
  noResult.hidden = matchedBooks > 0 || hits.length > 0 || !query;
}

searchInput?.addEventListener('input', () => {
  if (!reader.hidden) location.hash = ''; // searching always starts from the book list
  applySearch(searchInput.value);
});
$('#searchBtn')?.addEventListener('click', () => {
  if (!reader.hidden) location.hash = '';
  applySearch(searchInput.value);
  bookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('#searchBtn').click();
});

/* ==========================================================================
   2. Loading one chapter
   ========================================================================== */

const CACHE_NAME = 'mumin-hadith-v1'; // browser Cache Storage: chapters already read work offline
const fileCache = new Map(); // url -> Promise of the parsed JSON (one request per file)

/** GET a JSON file: saved copy first, otherwise the network (with a time limit). */
async function fetchJson(url) {
  let cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(url);
    if (saved) return await saved.json();
  } catch {
    cache = null; // Cache Storage is not available (e.g. plain http): just use the network
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (cache) cache.put(url, response.clone()).catch(() => {});
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** One dataset file ("ara" / "ben" / "eng" for a chapter number), requested only once. */
function getFile(lang, bookId, chapterNo) {
  const url = `${HADITH_API}/${lang}-${bookId}/sections/${chapterNo}.json`;
  if (!fileCache.has(url)) {
    fileCache.set(
      url,
      fetchJson(url).catch((error) => {
        fileCache.delete(url); // allow a retry later
        throw error;
      })
    );
  }
  return fileCache.get(url);
}

/**
 * Load Arabic + Bengali (+ grades) of one chapter and merge them by hadith number.
 * Two kinds of source are read:
 *   1. the chapter's own file (numbers between its lowest and highest number), and
 *   2. for Bukhari / Muslim / Tirmidhi the "extra" file that holds hadiths the dataset
 *      filed in the wrong place (see data/hadith-data.js).
 * Entries with neither Arabic nor Bengali text are dropped.
 */
async function loadChapter(book, row) {
  const key = `${book.id}/${row[0]}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  const [low, high] = [row[2], row[3]];
  const sources = [{ file: row[0], accept: (n) => n >= low && n <= high }];
  const extraNumbers = book.extra?.chapters?.[row[0]];
  if (extraNumbers) {
    const wanted = new Set(extraNumbers);
    sources.push({ file: book.extra.from, accept: (n) => wanted.has(n) });
  }

  const byNumber = new Map();
  await Promise.all(
    sources.map(async ({ file, accept }) => {
      const [ara, ben, eng] = await Promise.allSettled([
        getFile('ara', book.id, file),
        getFile('ben', book.id, file),
        book.mode === 'graded' ? getFile('eng', book.id, file) : Promise.resolve(null),
      ]);
      if (ara.status !== 'fulfilled' && ben.status !== 'fulfilled') {
        throw new Error('chapter could not be loaded');
      }
      const take = (result, field) => {
        if (result.status !== 'fulfilled' || !result.value) return;
        result.value.hadiths.forEach((item) => {
          if (!accept(item.hadithnumber)) return;
          const entry = byNumber.get(item.hadithnumber) || {
            number: item.hadithnumber,
            arabic: '',
            bangla: '',
            grades: [],
          };
          if (field === 'grades') entry.grades = item.grades || [];
          else entry[field] = field === 'bangla' ? cleanBangla(item.text) : String(item.text || '').trim();
          byNumber.set(item.hadithnumber, entry);
        });
      };
      take(ara, 'arabic');
      take(ben, 'bangla');
      take(eng, 'grades');
    })
  );

  const list = [...byNumber.values()]
    .filter((entry) => entry.arabic || entry.bangla) // the dataset has some empty entries
    .sort((a, b) => a.number - b.number);
  chapterCache.set(key, list);
  return list;
}

/* ==========================================================================
   3. Drawing the reader
   ========================================================================== */

/** Translate the most common grade words; anything else stays as written. */
function gradeText(grade) {
  return String(grade)
    .replace(/Sahih/gi, 'সহীহ')
    .replace(/Hasan/gi, 'হাসান')
    .replace(/Da['’]?if|Daif/gi, 'য‘ঈফ');
}
function gradeTone(grade) {
  const g = String(grade).toLowerCase();
  if (/(da['’]?if|daif|weak|munkar|mawdu)/.test(g)) return 'weak';
  if (g.includes('hasan')) return 'hasan';
  if (g.includes('sahih')) return 'sahih';
  return 'other';
}

/** Build one hadith card. */
function hadithCard(item) {
  const card = el('article', 'hadith-item');
  card.id = `h-${item.number}`;
  card.dataset.number = item.number;

  const top = el('header', 'h-top');
  top.append(el('span', 'h-no', `হাদিস নং ${bn(item.number)}`));
  const chips = el('span', 'h-grades');
  item.grades.forEach((g) => {
    chips.append(el('span', `grade-chip ${gradeTone(g.grade)}`, `${g.name}: ${gradeText(g.grade)}`));
  });
  top.append(chips);

  const copy = el('button', 'h-copy', 'কপি');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    const source = `— ${state.book.nameBn}, হাদিস নং ${bn(item.number)} (${state.row[1]})`;
    const text = [item.arabic, item.bangla, source].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('হাদিস কপি হয়েছে');
    } catch {
      showToast('কপি করা যায়নি'); // clipboard blocked (e.g. non-https page)
    }
  });
  top.append(copy);
  card.append(top);

  if (item.arabic) {
    const arabic = el('p', 'h-ar', item.arabic);
    arabic.lang = 'ar';
    arabic.dir = 'rtl';
    card.append(arabic);
  }
  if (item.bangla) card.append(el('p', 'h-bn', item.bangla));
  // The dataset is incomplete for some hadiths: say so instead of showing a blank gap.
  if (!item.bangla) card.append(el('p', 'h-note', 'এই হাদিসের বাংলা অনুবাদ ডেটাসেটে নেই।'));
  if (!item.arabic) card.append(el('p', 'h-note', 'এই হাদিসের আরবি পাঠ ডেটাসেটে নেই।'));
  return card;
}

/** Draw the next PAGE_SIZE hadiths (or draw until `upTo` items are visible). */
function drawMore(upTo) {
  const target = Math.min(state.visible.length, Math.max(upTo || 0, state.shown + PAGE_SIZE));
  const fragment = document.createDocumentFragment();
  state.visible.slice(state.shown, target).forEach((item) => fragment.append(hadithCard(item)));
  hadithList.append(fragment);
  state.shown = target;
  moreBtn.hidden = state.shown >= state.visible.length;
  if (!moreBtn.hidden) {
    moreBtn.textContent = `আরও দেখান (${bn(state.visible.length - state.shown)}টি বাকি)`;
  }
}

/** Re-draw the list for the current filter text. */
function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  state.visible = q
    ? state.all.filter((item) => `${item.bangla} ${item.arabic} ${item.number}`.toLowerCase().includes(q))
    : state.all;
  state.shown = 0;
  hadithList.replaceChildren();
  statusBox.textContent = state.visible.length ? '' : 'এই শব্দে এই অধ্যায়ে কিছু পাওয়া যায়নি।';
  drawMore();
}

/** Update chapter title, dropdown, previous/next buttons and the grade note. */
function renderHeader() {
  const { book, row } = state;
  $('#readerIcon').textContent = book.icon;
  $('#readerTitle').textContent = book.nameBn;
  $('#readerSub').textContent = `${book.nameEn} · অধ্যায় ${bn(row[0])}: ${row[1]} · ${bn(row[4])}টি হাদিস`;
  $('#sunnahLink').href = `${book.sunnah}/${row[0] === 0 ? 'introduction' : row[0]}`;

  chapterSelect.replaceChildren(
    ...book.sections.map((r) => {
      const option = el('option', '', `${r[0]}. ${r[1]} (${bn(r[4])})`);
      option.value = r[0];
      option.selected = r[0] === row[0];
      return option;
    })
  );

  const index = book.sections.findIndex((r) => r[0] === row[0]);
  $$('.reader-nav').forEach((nav) => {
    $('.ch-info', nav).textContent = `${bn(index + 1)} / ${bn(book.sections.length)}`;
    $('[data-step="-1"]', nav).disabled = index === 0;
    $('[data-step="1"]', nav).disabled = index === book.sections.length - 1;
  });

  gradeNote.textContent =
    book.mode === 'consensus'
      ? 'এই ডেটাসেটে প্রতিটি হাদিসের আলাদা মান দেওয়া নেই। গ্রন্থটি সহীহ সংকলন হিসেবে পরিচিত।'
      : 'প্রতিটি হাদিসের নিচে বিভিন্ন মুহাদ্দিসের মান (যেমন আলবানী) দেখানো হয়েছে; মতভেদ থাকতে পারে।';
}

/** Show the error state with a retry button and an outside link. */
function showError(book, row) {
  const actions = el('div', 'status-actions');
  const retry = el('button', 'more-btn', 'আবার চেষ্টা করুন');
  retry.type = 'button';
  retry.addEventListener('click', () => openChapter(book, row, state.focus));
  const link = el('a', 'outline-btn', 'Sunnah.com-এ পড়ুন ↗');
  link.href = book.sunnah;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  actions.append(retry, link);
  statusBox.replaceChildren(
    el('p', '', 'হাদিস লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।'),
    actions
  );
}

/* ==========================================================================
   4. Opening a chapter and routing
   ========================================================================== */

/** Load and show one chapter. `focus` is an optional hadith number to scroll to. */
async function openChapter(book, row, focus) {
  const token = ++state.token; // ignore answers of older, slower requests
  Object.assign(state, { book, row, all: [], visible: [], shown: 0, focus });
  filterInput.value = '';
  hadithList.replaceChildren();
  moreBtn.hidden = true;
  renderHeader();
  statusBox.textContent = 'লোড হচ্ছে…';
  statusBox.classList.add('loading');

  try {
    const list = await loadChapter(book, row);
    if (token !== state.token) return;
    state.all = list;
    statusBox.classList.remove('loading');
    applyFilter();
    if (!list.length) statusBox.textContent = 'এই অধ্যায়ে দেখানোর মতো হাদিস পাওয়া যায়নি।';
    if (focus) scrollToHadith(focus);
  } catch {
    if (token !== state.token) return;
    statusBox.classList.remove('loading');
    showError(book, row);
  }
}

/**
 * Scroll to a hadith number, drawing more cards first if it is further down.
 * behavior 'instant' is needed: the site CSS sets smooth scrolling, which would crawl
 * through thousands of pixels of hadiths.
 */
function scrollToHadith(number) {
  const index = state.visible.findIndex((item) => item.number === number);
  if (index < 0) {
    showToast('এই অধ্যায়ে সেই নম্বর পাওয়া যায়নি');
    return;
  }
  if (index >= state.shown) drawMore(index + 1);
  const card = $(`#h-${number}`);
  if (!card) return;
  card.scrollIntoView({ block: 'start', behavior: 'instant' }); // top-aligned: long hadiths can be taller than the screen
  card.classList.add('flash');
  setTimeout(() => card.classList.remove('flash'), 1800);
}

/** Change the address (this triggers route() — no page reload). */
const goTo = (bookId, chapterNo, hadithNo) => {
  location.hash = `${bookId}/${chapterNo}${hadithNo ? `/${hadithNo}` : ''}`;
};

/** Read the address and show either the book list or a chapter. */
function route() {
  const [bookId, chapterText, hadithText] = location.hash.replace(/^#/, '').split('/');
  const book = findBook(bookId);
  const row = book && findRow(book, Number(chapterText));

  if (!book || !row) {
    state.token++; // cancel any chapter still loading
    reader.hidden = true;
    bookSection.hidden = false;
    document.title = 'Mumin | হাদিস';
    return;
  }
  const sameChapter = state.book === book && state.row === row && !reader.hidden;
  bookSection.hidden = true;
  reader.hidden = false;
  document.title = `${book.nameBn} | Mumin`;
  if (sameChapter && hadithText) {
    scrollToHadith(Number(hadithText));
  } else {
    openChapter(book, row, hadithText ? Number(hadithText) : 0);
    if (!hadithText) reader.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

/* ==========================================================================
   5. Reader controls
   ========================================================================== */

$('#backBtn').addEventListener('click', () => {
  location.hash = ''; // back to the list (route() shows it)
  bookSection.scrollIntoView({ block: 'start', behavior: 'instant' });
});

chapterSelect.addEventListener('change', () => goTo(state.book.id, Number(chapterSelect.value)));

$$('.reader-nav button').forEach((button) =>
  button.addEventListener('click', () => {
    const { book, row } = state;
    const index = book.sections.findIndex((r) => r[0] === row[0]) + Number(button.dataset.step);
    if (book.sections[index]) goTo(book.id, book.sections[index][0]);
  })
);

filterInput.addEventListener('input', applyFilter);

/** Which chapter holds this hadith number? (Some chapters share number ranges.) */
async function findChapter(book, number) {
  const extra = Object.entries(book.extra?.chapters || {}).find(([, numbers]) => numbers.includes(number));
  if (extra) return Number(extra[0]);
  const candidates = book.sections.filter((r) => number >= r[2] && number <= r[3]);
  if (candidates.length <= 1) return candidates[0]?.[0];
  for (const row of candidates) {
    const list = await loadChapter(book, row);
    if (list.some((item) => item.number === number)) return row[0];
  }
  return undefined;
}

/** "নম্বরে যান": find the chapter that contains the number, then scroll to it. */
async function jumpToNumber() {
  const number = Number(String(jumpInput.value).replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d)));
  if (!Number.isFinite(number) || number < 1) {
    showToast('একটি সঠিক হাদিস নম্বর লিখুন');
    return;
  }
  let chapter;
  try {
    chapter = await findChapter(state.book, number);
  } catch {
    showToast('লোড করা যায়নি, ইন্টারনেট সংযোগ দেখুন');
    return;
  }
  if (chapter === undefined) {
    showToast('এই গ্রন্থে সেই নম্বর নেই');
    return;
  }
  goTo(state.book.id, chapter, number);
}
$('#jumpBtn').addEventListener('click', jumpToNumber);
jumpInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') jumpToNumber();
});

moreBtn.addEventListener('click', () => drawMore());

/* ---------- Start ---------- */
renderBooks();
window.addEventListener('hashchange', route);
route();
