/* ==========================================================================
   quran.js — "কুরআন" reader (Juz Amma, surah 78–114)
   Surah list, ayah reader, bookmarks, progress and offline copy of every surah.
   Data flow: IndexedDB (local copy) -> CDN quran-json package -> shown in the page.
   Bengali pronunciation images come from quran.gov.bd (needs internet).
   To add more surahs, extend SURAH and INTRO below.
   ========================================================================== */

(() => {
  // ---- Surah list: id, names, ayah count, place of revelation ----
  const SURAH = [
    [78, 'আন-নাবা', 'An-Naba', 'النَّبَإِ', 40, 'meccan'],
    [79, 'আন-নাযিআত', 'An-Naziat', 'النَّازِعَاتِ', 46, 'meccan'],
    [80, 'আবাসা', 'Abasa', 'عَبَسَ', 42, 'meccan'],
    [81, 'আত-তাকভীর', 'At-Takwir', 'التَّكْوِيرِ', 29, 'meccan'],
    [82, 'আল-ইনফিতার', 'Al-Infitar', 'الانفِطَارِ', 19, 'meccan'],
    [83, 'আল-মুতাফফিফীন', 'Al-Mutaffifin', 'الْمُطَفِّفِينَ', 36, 'meccan'],
    [84, 'আল-ইনশিকাক', 'Al-Inshiqaq', 'الانشِقَاقِ', 25, 'meccan'],
    [85, 'আল-বুরুজ', 'Al-Buruj', 'الْبُرُوجِ', 22, 'meccan'],
    [86, 'আত-তারিক', 'At-Tariq', 'الطَّارِقِ', 17, 'meccan'],
    [87, 'আল-আ‘লা', 'Al-Ala', 'الأَعْلَى', 19, 'meccan'],
    [88, 'আল-গাশিয়াহ', 'Al-Ghashiyah', 'الْغَاشِيَةِ', 26, 'meccan'],
    [89, 'আল-ফজর', 'Al-Fajr', 'الْفَجْرِ', 30, 'meccan'],
    [90, 'আল-বালাদ', 'Al-Balad', 'الْبَلَدِ', 20, 'meccan'],
    [91, 'আশ-শামস', 'Ash-Shams', 'الشَّمْسِ', 15, 'meccan'],
    [92, 'আল-লাইল', 'Al-Lail', 'اللَّيْلِ', 21, 'meccan'],
    [93, 'আদ-দুহা', 'Ad-Duha', 'الضُّحَى', 11, 'meccan'],
    [94, 'আশ-শারহ', 'Ash-Sharh', 'الشَّرْحِ', 8, 'meccan'],
    [95, 'আত-তীন', 'At-Tin', 'التِّينِ', 8, 'meccan'],
    [96, 'আল-আলাক', 'Al-Alaq', 'الْعَلَقِ', 19, 'meccan'],
    [97, 'আল-কদর', 'Al-Qadr', 'الْقَدْرِ', 5, 'meccan'],
    [98, 'আল-বাইয়্যিনাহ', 'Al-Bayyinah', 'الْبَيِّنَةِ', 8, 'medinan'],
    [99, 'আয-যিলযাল', 'Az-Zalzalah', 'الزَّلْزَلَةِ', 8, 'medinan'],
    [100, 'আল-আদিয়াত', 'Al-Adiyat', 'الْعَادِيَاتِ', 11, 'meccan'],
    [101, 'আল-কারিআহ', 'Al-Qariah', 'الْقَارِعَةِ', 11, 'meccan'],
    [102, 'আত-তাকাসুর', 'At-Takathur', 'التَّكَاثُرِ', 8, 'meccan'],
    [103, 'আল-আসর', 'Al-Asr', 'الْعَصْرِ', 3, 'meccan'],
    [104, 'আল-হুমাযাহ', 'Al-Humazah', 'الْهُمَزَةِ', 9, 'meccan'],
    [105, 'আল-ফীল', 'Al-Fil', 'الْفِيلِ', 5, 'meccan'],
    [106, 'কুরাইশ', 'Quraysh', 'قُرَيْشٍ', 4, 'meccan'],
    [107, 'আল-মাউন', 'Al-Maun', 'الْمَاعُونَ', 7, 'meccan'],
    [108, 'আল-কাওসার', 'Al-Kawthar', 'الْكَوْثَرَ', 3, 'meccan'],
    [109, 'আল-কাফিরুন', 'Al-Kafirun', 'الْكَافِرُونَ', 6, 'meccan'],
    [110, 'আন-নাসর', 'An-Nasr', 'النَّصْرِ', 3, 'medinan'],
    [111, 'আল-মাসাদ', 'Al-Masad', 'الْمَسَدِ', 5, 'meccan'],
    [112, 'আল-ইখলাস', 'Al-Ikhlas', 'الإِخْلَاصِ', 4, 'meccan'],
    [113, 'আল-ফালাক', 'Al-Falaq', 'الْفَلَقِ', 5, 'meccan'],
    [114, 'আন-নাস', 'An-Nas', 'النَّاسِ', 6, 'meccan'],
  ].map((x) => ({ id: x[0], bn: x[1], en: x[2], ar: x[3], ayahs: x[4], type: x[5] }));
  // ---- Page elements and reader state ----
  const byId = new Map(SURAH.map((s) => [s.id, s]));
  const list = document.getElementById('surahList');
  const search = document.getElementById('surahSearch');
  const select = document.getElementById('surahSelect');
  const ayahSelect = document.getElementById('ayahJump');
  const ayahList = document.getElementById('ayahList');
  // The Quran module uses the same shared top bar as every other Mumin page.
  const state = {
    id: 78,
    filter: 'all',
    data: null,
    requestToken: 0,
    bookmarks: new Set(JSON.parse(localStorage.getItem('mumin-quran-bookmarks') || '[]')),
    surahBookmarks: new Set(JSON.parse(localStorage.getItem('mumin-quran-surah-bookmarks') || '[]')),
  };
  // ---- Settings: data sources and local database ----
  const digits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  const officialPronunciationRoot = 'https://quran.gov.bd/quran/bengaliP';
  const apiRoot = 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist';
  const DB_NAME = 'MuminQuranLocalDB';
  const DB_VERSION = 3;
  const STORE_NAME = 'surahs';

  // ---- IndexedDB: keep downloaded surahs so they work offline ----
  function openQuranDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Local database unavailable'));
    });
  }
  async function getLocalSurah(id) {
    try {
      const db = await openQuranDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }
  async function saveLocalSurah(payload) {
    try {
      const db = await openQuranDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(payload);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch {
      return false;
    }
  }
  async function fetchJson(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('Source unavailable');
    return r.json();
  }
  // ---- Small helpers ----
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }

  // ---- Surah introductions (text shown above the ayahs) ----
  // Verified, source-attributed surah introductions. Only established information is shown.
  // If a specific occasion of revelation is not established in a reliable report, the UI says so.
  const INTRO = {
    78: {
      when: 'মক্কী; প্রাথমিক মক্কী যুগের সূরাগুলোর অন্তর্ভুক্ত।',
      context:
        'মুশরিকরা পুনরুত্থান ও হিসাবের দিন নিয়ে প্রশ্ন ও অস্বীকার করছিল। সূরাটি আল্লাহর সৃষ্টির নিদর্শন দেখিয়ে পুনরুত্থানের সত্যতা স্পষ্ট করে।',
      themes: 'পুনরুত্থান, কিয়ামত, আল্লাহর সৃষ্টিশক্তি, জাহান্নাম ও মুত্তাকীদের পুরস্কার।',
      asbab: 'নির্দিষ্ট কোনো সহিহ হাদিসভিত্তিক নাজিলের ঘটনা এখানে নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    79: {
      when: 'মক্কী; প্রাথমিক মক্কী যুগ।',
      context:
        'পুনরুত্থান অস্বীকারকারীদের সামনে কিয়ামত ও আল্লাহর ক্ষমতার প্রমাণ তুলে ধরা হয়েছে এবং ফিরআউনের পরিণতি স্মরণ করানো হয়েছে।',
      themes: 'কিয়ামত, পুনরুত্থান, ফিরআউনের ঘটনা, আল্লাহভীতি ও দুনিয়ার স্বল্পস্থায়িত্ব।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    80: {
      when: 'মক্কী; প্রাথমিক মক্কী যুগ।',
      context:
        'ইবন উম্মে মাকতূম (রাঃ) সত্য জানতে এসে উপস্থিত হলে রাসূল ﷺ-এর দৃষ্টি মক্কার প্রভাবশালী ব্যক্তিদের দিকে থাকায় এই সূরার শুরুতে সংশোধনমূলক নির্দেশ আসে।',
      themes: 'সত্যসন্ধানীর মর্যাদা, দাওয়াতে আন্তরিকতা, মানুষের প্রকৃত মূল্য, কিয়ামত ও আল্লাহর নিয়ামত।',
      asbab:
        'ইবন উম্মে মাকতূম (রাঃ)-এর ঘটনার বর্ণনা তাফসিরে প্রসিদ্ধ; সূরার ১–১০ আয়াতের প্রেক্ষাপট হিসেবে উল্লেখ করা হয়।',
    },
    81: {
      when: 'মক্কী; প্রাথমিক মক্কী যুগ।',
      context: 'কিয়ামতের ভয়াবহ পরিবর্তন ও ওহির সত্যতা স্পষ্ট করে রাসূল ﷺ-এর দাওয়াতকে সমর্থন করা হয়েছে।',
      themes: 'কিয়ামত, ওহির সত্যতা, জিবরীল (আ.) ও রাসূল ﷺ-এর সত্যবাদিতা।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    82: {
      when: 'মক্কী।',
      context: 'কিয়ামতের দিন আকাশ বিদীর্ণ হওয়া এবং মানুষের আমল ও হিসাবের পরিণতি স্মরণ করানো হয়েছে।',
      themes: 'কিয়ামত, আমলনামা, হিসাব, জান্নাত ও জাহান্নাম।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    83: {
      when: 'মক্কী; অধিকাংশ আলেমের মতে মক্কী।',
      context: 'মাপ ও ওজনে কম দেওয়া এবং মানুষের অধিকার নষ্ট করার বিরুদ্ধে কঠোর সতর্কতা দেওয়া হয়েছে।',
      themes: 'ন্যায়বিচার, ব্যবসায় সততা, আমলনামা, কিয়ামত ও নেককারদের মর্যাদা।',
      asbab:
        'নাজিলের নির্দিষ্ট ঘটনা নিয়ে বিভিন্ন বর্ণনা আছে; নিশ্চিত সহিহ রিপোর্ট ছাড়া কোনো নির্দিষ্ট ঘটনাকে চূড়ান্তভাবে বলা হয়নি।',
    },
    84: {
      when: 'মক্কী।',
      context: 'কিয়ামতের সময় আকাশ ও পৃথিবীর পরিবর্তন এবং মানুষের আমল অনুযায়ী পরিণতি বর্ণিত হয়েছে।',
      themes: 'কিয়ামত, আমলনামা, হিসাব ও আল্লাহর সামনে প্রত্যাবর্তন।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    85: {
      when: 'মক্কী।',
      context:
        'ঈমানদারদের ওপর নির্যাতন এবং সত্যের জন্য অবিচল থাকার শিক্ষা এসেছে; খন্দকের অধিপতিদের ঘটনা স্মরণ করানো হয়েছে।',
      themes: 'ঈমানের দৃঢ়তা, নির্যাতন, আল্লাহর প্রতিশোধ ও আখিরাত।',
      asbab: 'আসহাবুল উখদূদের ঘটনা সূরায় নিজেই বর্ণিত; নির্দিষ্ট বাহ্যিক নাজিল-ঘটনা আলাদাভাবে নিশ্চিত নয়।',
    },
    86: {
      when: 'মক্কী।',
      context: 'মানুষের সৃষ্টি ও পুনরুত্থানের ক্ষমতা এবং কুরআনের সত্যতা স্মরণ করানো হয়েছে।',
      themes: 'মানুষের সৃষ্টি, পুনরুত্থান, আল্লাহর ক্ষমতা ও ওহির সত্যতা।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    87: {
      when: 'মক্কী।',
      context: 'আল্লাহর মহিমা, ওহি ও তাযকিয়ার শিক্ষা দিয়ে রাসূল ﷺ-কে স্মরণ করিয়ে দেওয়া হয়েছে।',
      themes: 'তাসবিহ, তাযকিয়া, আখিরাতের সাফল্য ও আল্লাহর বাণী।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    88: {
      when: 'মক্কী।',
      context:
        'কিয়ামতের ভয়াবহতা ও মানুষের দুই পরিণতি বর্ণনা করে আল্লাহর সৃষ্টির নিদর্শনের দিকে দৃষ্টি দিতে বলা হয়েছে।',
      themes: 'কিয়ামত, জান্নাত-জাহান্নাম, সৃষ্টির নিদর্শন ও নসিহত।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    89: {
      when: 'মক্কী।',
      context:
        'অতীতের অত্যাচারী জাতিগুলোর পরিণতি স্মরণ করিয়ে মানুষের অহংকার ও সম্পদপ্রেমের ভুল দেখানো হয়েছে।',
      themes: 'আদ, সামূদ, ফিরআউন, মানব-পরীক্ষা, নফস ও আখিরাত।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    90: {
      when: 'মক্কী।',
      context: 'মক্কার পবিত্র নগরীর শপথের মাধ্যমে মানুষের সংগ্রাম ও নৈতিক দায়িত্বের কথা বলা হয়েছে।',
      themes: 'মানবজীবনের পরীক্ষা, দাসমুক্তি, দান, ধৈর্য ও ঈমান।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    91: {
      when: 'মক্কী।',
      context: 'সূরাটি সূর্য ও তার আলোকে সাক্ষী রেখে আত্মশুদ্ধি ও নৈতিকতার শিক্ষা দেয়।',
      themes: 'নফসের পরিশুদ্ধি, তাকওয়া ও সামূদের পরিণতি।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    92: {
      when: 'মক্কী।',
      context: 'মানুষের ভিন্ন ভিন্ন চেষ্টা ও পথের পরিণতি বোঝাতে দানশীলতা ও কৃপণতার বিপরীত ফল দেখানো হয়েছে।',
      themes: 'দান, তাকওয়া, কৃপণতা, সৎপথ ও আখিরাত।',
      asbab:
        'নাজিলের কারণ সম্পর্কে কিছু বর্ণনা আছে; নিশ্চিত সহিহ রিপোর্ট ছাড়া নির্দিষ্ট ব্যক্তিকে চূড়ান্ত কারণ বলা হয়নি।',
    },
    93: {
      when: 'মক্কী।',
      context:
        'এক সময় ওহি বিলম্বিত হওয়ায় বিরোধীদের কথার প্রেক্ষিতে আল্লাহ রাসূল ﷺ-কে আশ্বস্ত করেন যে তাঁর রব তাঁকে পরিত্যাগ করেননি।',
      themes: 'আল্লাহর অনুগ্রহ, এতিম-দরিদ্রের প্রতি দায়িত্ব, কৃতজ্ঞতা ও সান্ত্বনা।',
      asbab: 'ওহি কিছু সময় বিলম্বিত হওয়ার প্রেক্ষাপট তাফসিরে বর্ণিত হয়েছে; সূরাটি রাসূল ﷺ-কে সান্ত্বনা দেয়।',
    },
    94: {
      when: 'মক্কী।',
      context: 'রাসূল ﷺ-এর দায়িত্ব ও কষ্টের মাঝে আল্লাহর সাহায্য ও স্বস্তির বার্তা দেওয়া হয়েছে।',
      themes: 'কষ্টের সাথে স্বস্তি, আল্লাহর অনুগ্রহ, ইবাদতে মনোযোগ ও আশা।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    95: {
      when: 'মক্কী।',
      context: 'মানুষের সৃষ্টির মর্যাদা, নৈতিক পতন এবং ঈমান-সৎকর্মের মাধ্যমে মর্যাদা রক্ষার কথা বলা হয়েছে।',
      themes: 'মানুষের সৃষ্টি, ঈমান, সৎকর্ম ও আল্লাহর ন্যায়বিচার।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    96: {
      when: 'মক্কী; প্রথম ওহির সূচনা-পর্বের সূরা।',
      context:
        'প্রথম পাঁচ আয়াতে জ্ঞান, সৃষ্টি ও রবের নামে পাঠের নির্দেশ আসে; পরবর্তী অংশে অহংকারী মানুষের বিরোধিতা নিন্দিত হয়েছে।',
      themes: 'প্রথম ওহি, জ্ঞান, সৃষ্টি, অহংকার, নামাজ ও আল্লাহর নৈকট্য।',
      asbab: 'প্রথম পাঁচ আয়াত হেরা গুহায় প্রথম ওহির ঘটনার সঙ্গে সম্পর্কিত বলে সহিহ হাদিসে প্রতিষ্ঠিত।',
    },
    97: {
      when: 'মক্কী।',
      context: 'লাইলাতুল কদরের মহিমা এবং কুরআন নাজিলের মর্যাদা বর্ণনা করা হয়েছে।',
      themes: 'লাইলাতুল কদর, কুরআন নাজিল ও ফেরেশতাদের অবতরণ।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা এখানে নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    98: {
      when: 'মাদানী।',
      context:
        'আহলে কিতাব ও মুশরিকদের মধ্যে যারা সত্য অস্বীকার করেছিল এবং রাসূল ﷺ-এর স্পষ্ট প্রমাণ আসার পরও অবিশ্বাসে থেকেছিল তাদের অবস্থা বর্ণিত হয়েছে।',
      themes: 'বাইয়্যিনা, রাসূলের আগমন, খালেস ইবাদত, সালাত-যাকাত ও শ্রেষ্ঠ সৃষ্টির পরিণতি।',
      asbab:
        'নির্দিষ্ট নাজিলের ঘটনা নিয়ে বর্ণনা আছে; নিশ্চিত সহিহ সূত্র ছাড়া কোনো নির্দিষ্ট ঘটনা এখানে চূড়ান্তভাবে বলা হয়নি।',
    },
    99: {
      when: 'মাদানী বলে প্রসিদ্ধ; মক্কী বলেও মত আছে।',
      context: 'কিয়ামতের দিন পৃথিবী তার সংবাদ প্রকাশ করবে এবং ক্ষুদ্রতম আমলও মানুষের সামনে উপস্থিত হবে।',
      themes: 'কিয়ামত, পৃথিবীর সাক্ষ্য ও আমলের ক্ষুদ্রতম হিসাব।',
      asbab: 'নাজিলের স্থান নিয়ে আলেমদের মধ্যে মতভেদ আছে; নির্দিষ্ট সহিহ নাজিল-ঘটনা নিশ্চিত নয়।',
    },
    100: {
      when: 'মক্কী।',
      context:
        'মানুষের অকৃতজ্ঞতা ও সম্পদের প্রতি অতিরিক্ত আসক্তির বিপরীতে আল্লাহর সামনে আমল প্রকাশের সতর্কতা এসেছে।',
      themes: 'মানুষের অকৃতজ্ঞতা, সম্পদপ্রেম, কবর থেকে উত্থান ও অন্তরের গোপন প্রকাশ।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    101: {
      when: 'মক্কী।',
      context: 'কিয়ামতের মহাসংকট ও মানুষের আমলের ওজনের ভিত্তিতে পরিণতি বর্ণিত হয়েছে।',
      themes: 'কিয়ামত, আমলের পাল্লা ও জান্নাত-জাহান্নাম।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    102: {
      when: 'মক্কী বলে প্রসিদ্ধ; মাদানী মতও বর্ণিত।',
      context: 'দুনিয়াবি প্রাচুর্য ও সংখ্যার প্রতিযোগিতা মানুষকে আখিরাত থেকে গাফেল করে দেয়।',
      themes: 'দুনিয়ার মোহ, কবর, জাহান্নাম ও নিয়ামতের জিজ্ঞাসা।',
      asbab:
        'দুই গোত্রের পারস্পরিক গৌরবের একটি বর্ণনা তাফসিরে এসেছে, কিন্তু তা নাজিলের নিশ্চিত কারণ প্রমাণ করে না।',
    },
    103: {
      when: 'মক্কী।',
      context: 'অল্প কয়েক আয়াতে মানুষের সার্বিক ক্ষতির কারণ এবং ঈমান ও সৎকর্মের পথ সংক্ষেপে দেওয়া হয়েছে।',
      themes: 'সময়, ঈমান, সৎকর্ম, সত্যের উপদেশ ও ধৈর্য।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    104: {
      when: 'মক্কী।',
      context: 'অন্যের দোষচর্চা, বিদ্রূপ ও সম্পদের অহংকারের পরিণতি সম্পর্কে সতর্ক করা হয়েছে।',
      themes: 'গীবত-নিন্দা, বিদ্রূপ, সম্পদের অহংকার ও হুতামাহ।',
      asbab: 'নির্দিষ্ট কোনো সহিহ নাজিলের ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।',
    },
    105: {
      when: 'মক্কী।',
      context: 'হাতির বাহিনী নিয়ে মক্কা আক্রমণের ঐতিহাসিক ঘটনা স্মরণ করিয়ে কাবার রবের ক্ষমতা দেখানো হয়েছে।',
      themes: 'আল্লাহর সুরক্ষা, হাতির বাহিনী ও মক্কার ঐতিহাসিক নিদর্শন।',
      asbab: 'হাতির বাহিনীর ঘটনা সূরায় নিজেই স্মরণ করানো হয়েছে; আলাদা কোনো সহিহ নাজিল-ঘটনা প্রয়োজনীয় নয়।',
    },
    106: {
      when: 'মক্কী।',
      context: 'কুরাইশের সফর, নিরাপত্তা ও জীবিকার নিয়ামতের বিনিময়ে কাবার রবের ইবাদতের আহ্বান এসেছে।',
      themes: 'নিয়ামত, নিরাপত্তা, রিজিক ও একমাত্র আল্লাহর ইবাদত।',
      asbab: 'সূরা ফীলের সঙ্গে বিষয়গতভাবে সম্পর্কিত; নির্দিষ্ট সহিহ নাজিল-ঘটনা নিশ্চিত নয়।',
    },
    107: {
      when: 'মক্কী।',
      context:
        'দীন অস্বীকারের বাস্তব লক্ষণ হিসেবে এতিমকে তাড়ানো, মিসকিনকে খাবার না দেওয়া এবং লোক দেখানো ইবাদতের নিন্দা এসেছে।',
      themes: 'এতিম-মিসকিনের অধিকার, সালাতের আন্তরিকতা ও সামাজিক দায়িত্ব।',
      asbab:
        'নাজিলের কারণ সম্পর্কে বিভিন্ন নামভিত্তিক বর্ণনা আছে; নিশ্চিত সহিহ রিপোর্ট ছাড়া নির্দিষ্ট ব্যক্তির নাম চূড়ান্ত করা হয়নি।',
    },
    108: {
      when: 'মক্কী।',
      context:
        'রাসূল ﷺ-কে আল-কাওসার দান ও তাঁর বিরোধীদের পরিণতির ঘোষণা দিয়ে সালাত ও কুরবানির নির্দেশ দেওয়া হয়েছে।',
      themes: 'আল্লাহর অনুগ্রহ, সালাত, কুরবানি ও শত্রুর পরিণতি।',
      asbab:
        'রাসূল ﷺ-কে সান্ত্বনা ও বিরোধীদের জবাবের প্রেক্ষাপট তাফসিরে উল্লেখিত; নির্দিষ্ট ঘটনার বর্ণনায় মতভেদ আছে।',
    },
    109: {
      when: 'মক্কী।',
      context: 'মুশরিকদের সঙ্গে আকীদাগত আপসের প্রস্তাবের জবাবে তাওহিদের স্বচ্ছ অবস্থান ঘোষণা করা হয়েছে।',
      themes: 'তাওহিদ, আকীদাগত স্বাতন্ত্র্য ও ইবাদতে আপসহীনতা।',
      asbab: 'কুরাইশের পারস্পরিক আপসের প্রস্তাবের প্রেক্ষাপট তাফসিরে বর্ণিত।',
    },
    110: {
      when: 'মাদানী।',
      context:
        'আল্লাহর সাহায্য ও বিজয় আসার পর মানুষ দলে দলে ইসলামে প্রবেশের সংবাদ এবং বিজয়ের পর তাসবিহ-ইস্তিগফারের নির্দেশ এসেছে।',
      themes: 'আল্লাহর সাহায্য, বিজয়, মানুষের ইসলাম গ্রহণ ও ইস্তিগফার।',
      asbab:
        'বিজয়ের সময়ের সঙ্গে সম্পর্কিত; রাসূল ﷺ-এর জীবনের শেষ পর্যায়ের ইঙ্গিত হিসেবেও সহিহ হাদিসে ব্যাখ্যা পাওয়া যায়।',
    },
    111: {
      when: 'মক্কী।',
      context: 'আবু লাহাব ও তার স্ত্রীর ইসলামবিরোধী অবস্থান ও পরিণতি স্পষ্টভাবে ঘোষণা করা হয়েছে।',
      themes: 'কুফর, অহংকার, সত্যের বিরোধিতা ও আল্লাহর শাস্তি।',
      asbab: 'আবু লাহাবের প্রকাশ্য বিরোধিতার প্রেক্ষাপট সূরার বক্তব্যে প্রতিফলিত।',
    },
    112: {
      when: 'মক্কী।',
      context: 'আল্লাহর একত্ব ও অদ্বিতীয়তার সংক্ষিপ্ত ও সুস্পষ্ট ঘোষণা।',
      themes: 'তাওহিদ, আল্লাহর অদ্বিতীয়তা, অমুখাপেক্ষিতা ও সন্তানহীনতা।',
      asbab:
        'আল্লাহর গুণ ও পরিচয় সম্পর্কে প্রশ্নের জবাবে নাজিলের বর্ণনা তাফসিরে পাওয়া যায়; নির্দিষ্ট বর্ণনার মান যাচাই করে তবেই দাবি করা উচিত।',
    },
    113: {
      when: 'মক্কী বলে প্রসিদ্ধ; মাদানী মতও বর্ণিত।',
      context: 'সৃষ্টির অনিষ্ট, রাতের অন্ধকার, জাদু ও হিংসুকের অনিষ্ট থেকে আল্লাহর আশ্রয় চাওয়ার শিক্ষা।',
      themes: 'আল্লাহর আশ্রয়, বাহ্যিক অনিষ্ট, হিংসা ও জাদুর ক্ষতি থেকে সুরক্ষা।',
      asbab: 'মু‘আউইযাতাইন সম্পর্কিত কিছু হাদিসে আমল বর্ণিত হয়েছে; নির্দিষ্ট নাজিল-ঘটনা নিয়ে মতভেদ আছে।',
    },
    114: {
      when: 'মক্কী বলে প্রসিদ্ধ; মাদানী মতও বর্ণিত।',
      context: 'অন্তরের কুমন্ত্রণা ও শয়তানের ওয়াসওয়াসা থেকে আল্লাহর আশ্রয় চাওয়ার শিক্ষা।',
      themes: 'রব, মালিক ও ইলাহ হিসেবে আল্লাহর আশ্রয়; ওয়াসওয়াসা ও শয়তানের অনিষ্ট থেকে সুরক্ষা।',
      asbab: 'মু‘আউইযাতাইন সম্পর্কিত আমলের হাদিস আছে; নির্দিষ্ট নাজিল-ঘটনা নিয়ে মতভেদ রয়েছে।',
    },
  };
  // ---- Filters, list and ayah rendering ----
  function introHtml(s) {
    const d = INTRO[s.id] || {};
    return `<div class="intro-detail-grid"><div><b>নাজিলের সময়</b><p>${escapeHtml(d.when || 'নির্ভরযোগ্য সংক্ষিপ্ত তথ্য পাওয়া যায়নি।')}</p></div><div><b>নাজিলের প্রেক্ষাপট</b><p>${escapeHtml(d.context || 'নির্দিষ্ট প্রেক্ষাপট নিশ্চিতভাবে উল্লেখ করা হয়নি।')}</p></div><div><b>মূল বিষয়</b><p>${escapeHtml(d.themes || 'সূরার আয়াতসমূহের মূল বক্তব্য অধ্যয়ন করুন।')}</p></div><div><b>নাজিলের কারণ</b><p>${escapeHtml(d.asbab || 'নির্দিষ্ট সহিহ নাজিল-ঘটনা নিশ্চিতভাবে উল্লেখ করা হয়নি।')}</p></div></div>`;
  }

  function virtueFor(id) {
    if (id === 112)
      return `<h3>সূরা আল-ইখলাসের ফজিলত</h3><p>সহিহ বুখারি ৫০১৩-এ রাসূল ﷺ সূরা আল-ইখলাসকে কুরআনের এক-তৃতীয়াংশের সমতুল্য বলেছেন।</p><small>Reference: Sahih al-Bukhari 5013</small>`;
    if (id === 113 || id === 114)
      return `<h3>সূরা আল-ফালাক ও আন-নাস</h3><p>জামি‘ আত-তিরমিযি ৩৫৭৫-এ সূরা আল-ইখলাস এবং আল-মু‘আউইযাতাইন (আল-ফালাক ও আন-নাস) সকাল ও সন্ধ্যায় তিনবার পাঠের বর্ণনা রয়েছে।</p><small>Reference: Jami‘ at-Tirmidhi 3575</small>`;
    return `<h3>নির্দিষ্ট সহিহ ফজিলত</h3><p>এই সূরার জন্য নির্দিষ্ট সহিহ ফজিলতের প্রমাণ নিশ্চিতভাবে না পাওয়া পর্যন্ত কোনো বিশেষ ফজিলতের দাবি এখানে যোগ করা হয়নি।</p>`;
  }

  select.innerHTML = SURAH.map((s) => `<option value="${s.id}">${digits(s.id)} — ${s.bn}</option>`).join('');
  function isLong(s) {
    return s.ayahs >= 20;
  }
  function isShort(s) {
    return s.ayahs <= 8;
  }
  function filtered() {
    const q = (search.value || '').trim().toLowerCase();
    return SURAH.filter((s) => {
      const f = state.filter;
      if (f === 'meccan' && s.type !== 'meccan') return false;
      if (f === 'medinan' && s.type !== 'medinan') return false;
      if (f === 'short' && !isShort(s)) return false;
      if (f === 'long' && !isLong(s)) return false;
      return !q || `${s.id} ${s.bn} ${s.en}`.toLowerCase().includes(q);
    });
  }
  function renderList() {
    const rows = filtered();
    list.innerHTML = rows.length
      ? rows
          .map(
            (s) =>
              `<button class="surah-item ${s.id === state.id ? 'active' : ''}" data-id="${s.id}"><span class="surah-num">${digits(s.id)}</span><span><b class="ar">${escapeHtml(s.ar)}</b><br><b class="bn">সূরা ${escapeHtml(s.bn)}</b><br><small class="en">${escapeHtml(s.en)}</small></span><span class="count">${digits(s.ayahs)} আয়াত<br><span class="type">${s.type === 'meccan' ? 'মাক্কী' : 'মাদানী'}</span></span><span class="arrow">›</span></button>`
          )
          .join('')
      : '<div class="no-results">কোনো সূরা পাওয়া যায়নি।</div>';
    list
      .querySelectorAll('[data-id]')
      .forEach((b) => b.addEventListener('click', () => loadSurah(Number(b.dataset.id))));
  }

  // ---- Loading a surah (local copy first, then network) ----
  async function downloadSurahFromSources(s) {
    const [arabic, bn] = await Promise.all([
      fetchJson(`${apiRoot}/chapters/${s.id}.json`),
      fetchJson(`${apiRoot}/chapters/bn/${s.id}.json`),
    ]);
    const verses = arabic.verses || [],
      trans = bn.verses || [];
    if (verses.length !== s.ayahs || trans.length !== s.ayahs)
      throw new Error(`Ayah count mismatch for ${s.id}`);
    const data = {
      id: s.id,
      ayahs: s.ayahs,
      sourceVersion: 4,
      verses: verses.map((v, i) => ({
        verseNumber: v.verseNumber || i + 1,
        arabic: v.text || '',
        meaning: trans[i]?.translation || '',
        pronunciation: '',
      })),
    };
    if (data.verses.some((v) => !v.arabic || !v.meaning))
      throw new Error(`Incomplete Quran text for ${s.id}`);
    await saveLocalSurah(data);
    return data;
  }
  async function prefetchRemaining() {
    for (const s of SURAH) {
      if (s.id === state.id) continue;
      const cached = await getLocalSurah(s.id);
      if (cached && cached.sourceVersion === 4 && cached.verses?.length === s.ayahs) continue;
      try {
        await downloadSurahFromSources(s);
      } catch {
        /* optional step failed: ignore, the reader still works */
      }
    }
  }
  function renderAyahs(s, data) {
    if (!data || data.id !== s.id || !Array.isArray(data.verses) || data.verses.length !== s.ayahs)
      throw new Error('Local Quran data validation failed');
    ayahList.innerHTML = data.verses
      .map((v, i) => {
        const n = v.verseNumber || i + 1,
          key = `${s.id}:${n}`;
        return `<article class="ayah-card" id="ayah-${n}"><div class="ayah-top"><span class="ayah-no">${digits(n)}</span><button class="ayah-book" data-book="${key}" aria-label="আয়াত সংরক্ষণ">${state.bookmarks.has(key) ? '★' : '☆'}</button></div><div class="ayah-ar" lang="ar">${escapeHtml(v.arabic || '')}</div>${officialPronunciationHtml(s, n)}<div class="ayah-meaning"><span class="meaning-label">বাংলা অর্থ</span><p>${escapeHtml(v.meaning || '')}</p></div></article>`;
      })
      .join('');
    ayahList
      .querySelectorAll('[data-book]')
      .forEach((btn) => btn.addEventListener('click', () => toggleBookmark(btn)));
    updateProgress();
  }
  function officialPronunciationHtml(s, n) {
    const url = `${officialPronunciationRoot}/${s.id}/${s.id}-${n}.png`;
    return `<div class="pronunciation-box pronunciation-official"><div class="pronunciation-head"><span class="pronunciation-label">বাংলা উচ্চারণ</span><a href="https://quran.gov.bd/" target="_blank" rel="noopener">সরকারি উৎস</a></div><img class="pronunciation-image" src="${url}" alt="সূরা ${escapeHtml(s.bn)}, আয়াত ${digits(n)}-এর সরকারি বাংলা উচ্চারণ" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="pronunciation-fallback" hidden>সরকারি উচ্চারণের ছবি এখন লোড করা যাচ্ছে না। <a href="${url}" target="_blank" rel="noopener">উৎসটি খুলুন</a></span></div>`;
  }

  async function loadSurah(id) {
    const s = byId.get(id);
    if (!s) return;
    const token = ++state.requestToken;
    state.id = id;
    select.value = String(id);
    renderList();
    document.getElementById('heroNumber').textContent = digits(id);
    document.getElementById('heroArabic').textContent = s.ar;
    document.getElementById('heroBangla').textContent = `সূরা ${s.bn}`;
    document.getElementById('heroEnglish').textContent = s.en;
    document.getElementById('readerMeta').innerHTML =
      `<span>${window.muminIcon('list')} আয়াত সংখ্যা: ${digits(s.ayahs)}</span><span>${window.muminIcon('pin')} ${s.type === 'meccan' ? 'মাক্কী' : 'মাদানী'}</span><span>${window.muminIcon('quran')} ৩০তম পারা</span>`;
    document.getElementById('introTitle').textContent = `সূরা ${s.bn} পরিচিতি`;
    document.getElementById('introText').innerHTML = introHtml(s);
    document.getElementById('lessonText').textContent =
      INTRO[s.id]?.themes || 'সূরার আয়াতসমূহের মূল বক্তব্য অধ্যয়ন করুন।';
    const virtue = virtueFor(id);
    document.getElementById('virtueTabContent').innerHTML = virtue;
    ayahSelect.innerHTML = Array.from(
      { length: s.ayahs },
      (_, i) => `<option value="${i + 1}">আয়াত ${digits(i + 1)}</option>`
    ).join('');
    ayahList.innerHTML = '<div class="no-results">আয়াতগুলো লোড হচ্ছে…</div>';
    try {
      let data = await getLocalSurah(id);
      if (token !== state.requestToken) return;
      if (!data || data.sourceVersion !== 4 || data.verses?.length !== s.ayahs) {
        data = await downloadSurahFromSources(s);
      }
      if (token !== state.requestToken) return;
      state.data = data;
      renderAyahs(s, data);
      if (!window.__muminQuranPrefetchStarted) {
        window.__muminQuranPrefetchStarted = true;
        prefetchRemaining();
      }
    } catch {
      if (token !== state.requestToken) return;
      ayahList.innerHTML =
        '<div class="no-results">এই সূরার আয়াত এখন লোড করা যাচ্ছে না। Internet connection যাচাই করে আবার চেষ্টা করুন।</div>';
    }
  }
  // ---- Bookmarks and reading progress ----
  function toggleBookmark(btn) {
    const key = btn.dataset.book;
    if (state.bookmarks.has(key)) state.bookmarks.delete(key);
    else state.bookmarks.add(key);
    localStorage.setItem('mumin-quran-bookmarks', JSON.stringify([...state.bookmarks]));
    btn.textContent = state.bookmarks.has(key) ? '★' : '☆';
    updateProgress();
  }
  function updateProgress() {
    const done = new Set([...state.bookmarks].map((x) => x.split(':')[0]));
    const pct = Math.round((done.size / SURAH.length) * 100);
    document.getElementById('progressText').textContent =
      `${digits(done.size)} / ${digits(SURAH.length)} সূরা`;
    document.getElementById('progressBar').style.width = `${pct}%`;
    document.getElementById('surahBookmark').textContent = state.surahBookmarks.has(String(state.id))
      ? '★'
      : '☆';
  }
  // ---- Event wiring ----
  document.querySelectorAll('.surah-filter button').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.surah-filter button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      state.filter = b.dataset.filter;
      renderList();
    })
  );
  search.addEventListener('input', renderList);
  select.addEventListener('change', (e) => loadSurah(Number(e.target.value)));
  document.getElementById('prevSurah').addEventListener('click', () => loadSurah(Math.max(78, state.id - 1)));
  document
    .getElementById('nextSurah')
    .addEventListener('click', () => loadSurah(Math.min(114, state.id + 1)));
  document.getElementById('surahBookmark').addEventListener('click', () => {
    const key = String(state.id);
    if (state.surahBookmarks.has(key)) state.surahBookmarks.delete(key);
    else state.surahBookmarks.add(key);
    localStorage.setItem('mumin-quran-surah-bookmarks', JSON.stringify([...state.surahBookmarks]));
    updateProgress();
    renderList();
  });
  document.querySelectorAll('.reader-tabs button').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.reader-tabs button').forEach((x) => x.classList.remove('active'));
      document.querySelectorAll('.reader-tab-content').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('tab-' + b.dataset.tab).classList.add('active');
    })
  );
  ayahSelect.addEventListener('change', (e) =>
    document.getElementById('ayah-' + e.target.value)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  );
  let bookmarkOnly = false;
  document.getElementById('bookmarkView').addEventListener('click', () => {
    bookmarkOnly = !bookmarkOnly;
    document.querySelector('[data-tab="ayahs"]').click();
    document.getElementById('bookmarkView').textContent = bookmarkOnly ? '★' : '☆';
    document.querySelectorAll('.ayah-card').forEach((x) => {
      const key = state.id + ':' + x.id.replace('ayah-', '');
      x.style.display = !bookmarkOnly || state.bookmarks.has(key) ? '' : 'none';
    });
  });
  document.getElementById('firstAyah').addEventListener('click', () => {
    document.querySelector('[data-tab="ayahs"]').click();
    document.getElementById('ayah-1')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  renderList();
  loadSurah(78);
})();
