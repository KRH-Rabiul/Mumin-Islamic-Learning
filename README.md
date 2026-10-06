# Mumin — শিখি • বুঝি • আমল করি

সহজ, পরিচ্ছন্ন ও উৎস-সচেতন বাংলা ইসলামিক শিক্ষা ওয়েবসাইট (PWA)। Plain HTML/CSS/JavaScript — কোনো build step লাগে না।

*Mumin is a Bangla Islamic-learning PWA built with plain HTML, CSS and JavaScript (no framework, no build step).*

## মডিউল
ইসলামের মৌলিক বিষয় · নামাজ ও ওযু শিক্ষা · কুরআন (জুযউ আম্মা) · দোয়া ও যিকির · রমজান · হাদিস · দৈনন্দিন জীবন · গভীর শিক্ষা

## ফোল্ডার structure
```
mumin/
├── index.html, quran.html, salah.html, ...   সব পেজ (root-এ)
├── css/
│   ├── base.css, nav.css, theme.css          সব পেজে load হয়
│   ├── hero-images.css                       সব পেজের hero/banner ছবি এক জায়গায়
│   └── pages/                                প্রতিটা পেজের নিজস্ব CSS
├── js/
│   ├── common-nav.js                         সব পেজ: header, menu, dark/light theme
│   ├── common.js                             content পেজের ছোট helper (toast, reveal, search)
│   └── script.js, quran.js, salah.js, ...    প্রতিটা পেজের নিজস্ব script
├── data/dua-data.js                          সব দোয়ার ডেটা
├── data/hadith-data.js                       হাদিস গ্রন্থ ও অধ্যায়ের সূচি (পাঠ অনলাইনে আসে)
├── assets/images/
│   ├── brand/    logo, icon, profile
│   ├── heroes/   hero ও banner ছবি
│   ├── scenes/   section-এর illustration
│   └── namaz/, wudu/                         নামাজ ও ওযুর ধাপের ছবি
├── sw.js, manifest.webmanifest               PWA (root-এ থাকতে হবে)
├── tools/                                    CSS report ও minify script
└── docs/                                     CSS-GUIDE, content audit, পুরোনো notes
```

## কোথায় কী বদলাবেন
| কাজ | ফাইল |
|---|---|
| লেখা / কনটেন্ট | সংশ্লিষ্ট `*.html` (সবার উপরে comment আছে) |
| রঙ | `css/theme.css` (শুরুর `--color-*` token) |
| ছবি বদলানো | `css/hero-images.css` (url) আর `assets/images/` |
| নতুন দোয়া | `data/dua-data.js` (ফাইলের উপরের comment দেখুন) |
| হাদিস গ্রন্থ/অধ্যায় সূচি | `data/hadith-data.js` (উপরের comment দেখুন) |
| মেনুর লিংক | `js/common-nav.js` → `PAGES` |
| নামাজ / ওযুর ধাপ | `js/salah.js` |
| সূরা / ভূমিকা | `js/quran.js` → `SURAH`, `INTRO` |

## Local-এ চালানো
```bash
python3 -m http.server 8000
# তারপর http://localhost:8000 খুলুন
```
Service worker শুধু `https` বা `localhost`-এ কাজ করে, তাই `file://` দিয়ে না খুলে server দিয়ে চালান।

## নতুন ফাইল যোগ করলে
1. `sw.js`-এর `CORE` তালিকায় path যোগ করুন।
2. `CACHE_NAME` বদলান (যেমন `mumin-v51` → `mumin-v52`), নাহলে ফিরে আসা ইউজার পুরোনো cache দেখবে।

## ইন্টারনেট লাগে যেখানে
- নামাজের সময়: `api.aladhan.com` (fail করলে "আনুমানিক সময়" লেখা দেখায়)
- হাদিসের আরবি/বাংলা পাঠ: jsDelivr (`hadith-api`), নেট না থাকলে "আবার চেষ্টা করুন" দেখায়
- কুরআনের আরবি: jsDelivr (`quran-json`), বাংলা উচ্চারণ ছবি: `quran.gov.bd`
- ফিডব্যাক ফর্ম: `formsubmit.co`
- ফন্ট: Google Fonts

## কনটেন্ট নীতি
শুধু কুরআন ও হাদিস-ভিত্তিক, উৎস উল্লেখসহ কনটেন্ট। দোয়া বা আয়াত যোগ করার আগে আরবি ও সূত্র (যেমন sunnah.com-এ) মিলিয়ে নিন।

লাইসেন্স: `LICENSE`
