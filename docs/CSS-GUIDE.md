# Mumin CSS Guide

## ফাইল structure
```
css/
├── base.css      reset, typography, shared layout ও shared component
├── nav.css       উপরের navigation bar
├── theme.css     রঙের palette, font-size scale, light/dark token, shared page shell
├── hero-images.css  সব hero/banner/card ছবির background (একমাত্র layer-ছাড়া ফাইল)
└── pages/        প্রতিটা পেজের নিজস্ব CSS (home, quran, salah, dua-page, ...)
```
প্রতিটা পেজ load করে: `base.css`, `nav.css`, `theme.css`, `hero-images.css` আর নিজের `pages/*.css`।

**ছবি বদলাতে চাইলে:** `hero-images.css`-এ `url("../assets/images/...")` বদলান। path সবসময় `css/` ফোল্ডার থেকে হিসাব করা হয়। HTML-এর inline `style="--image:..."` ব্যবহার করবেন না, কারণ সেটা CSS ফাইলের location থেকে resolve হয়ে 404 দেয়।

## Cascade layers
প্রতিটা ফাইলের শুরুতে `@layer main, overrides;` আছে।
- `main`: সাধারণ স্টাইল।
- `overrides`: আগে যেসব স্টাইল `!important` দিয়ে জোর করা ছিল, সেগুলো। `overrides` layer সবসময় `main`-কে হারায়, তাই `!important` লাগে না।

নিয়ম: নতুন স্টাইল `main`-এ লিখুন। কোনো স্টাইল অন্য স্টাইলকে হারাতে না পারলে `overrides` layer-এ রাখুন, `!important` ব্যবহার করবেন না।

## রঙ
- `theme.css`-এর শুরুতে `--color-<নাম>-<উজ্জ্বলতা>` palette আছে (যেমন `--color-teal-40`)।
- নতুন রঙ দরকার হলে আগে palette-এ আছে কিনা দেখুন, না থাকলে সেখানে যোগ করে `var(--color-...)` ব্যবহার করুন।

## Font size
- Root font-size `106.25%` (= 17px), তাই `1rem = 17px`। সব font-size `rem`-এ, ফলে ইউজারের ব্রাউজারের font setting মানা হয়।

## Breakpoint
শুধু এই ৬টা ব্যবহার করুন: `520px`, `640px`, `760px`, `900px`, `1050px`, `1240px` (সবই `max-width`)।

## Dark mode
`body.dark` class দিয়ে চলে (JS বসায়)। `:root:has(body.dark)` এ `color-scheme: dark` দেওয়া আছে, তাই native button, input ও scrollbar-ও dark হয়।

## Focus
`theme.css`-এ একটা সাধারণ `:focus-visible` রিং আছে (`:where(...)` দিয়ে, specificity ০)। কোনো component নিজের focus স্টাইল দিলে সেটাই জিতবে।

## কমান্ড
```bash
npm install            # একবার
npm run lint:css       # স্টাইল নিয়ম যাচাই (!important নিষেধ, ডুপ্লিকেট property ইত্যাদি)
npm run report:css     # সাইজ, rule, !important, breakpoint, রঙের হিসাব
npm run build:min      # css-min/ ফোল্ডারে minified কপি (source CSS বদলায় না)
```
