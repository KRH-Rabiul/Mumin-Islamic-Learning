// Optional: writes minified copies to css-min/ (does not touch your source CSS).  npm run build:min
import fs from 'fs'; import path from 'path'; import { transform } from 'lightningcss';
const out = 'css-min'; fs.mkdirSync(out + '/pages', { recursive: true });
const all = ['base.css','nav.css','theme.css',...fs.readdirSync('css/pages').map(f=>'pages/'+f)];
let before = 0, after = 0;
for (const f of all) {
  const code = fs.readFileSync('css/' + f); before += code.length;
  const { code: min } = transform({ filename: f, code, minify: true });
  fs.writeFileSync(path.join(out, f), min); after += min.length;
}
console.log(`minified ${all.length} files: ${(before/1024).toFixed(0)} KB -> ${(after/1024).toFixed(0)} KB (written to ${out}/)`);
