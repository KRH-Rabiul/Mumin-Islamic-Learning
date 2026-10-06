// Prints CSS health metrics so regressions are easy to spot:  npm run report:css
import fs from 'fs'; import path from 'path'; import postcss from 'postcss';
const files = ['css/base.css','css/nav.css','css/theme.css',...fs.readdirSync('css/pages').map(f=>'css/pages/'+f)];
let bytes=0, rules=0, important=0; const bps=new Set(), hex=new Set();
for (const f of files) {
  const src = fs.readFileSync(f,'utf8'); bytes += Buffer.byteLength(src);
  postcss.parse(src).walk(n => {
    if (n.type==='rule') rules++;
    if (n.type==='atrule' && n.name==='media') for (const m of n.params.matchAll(/(?:max|min)-width:\s*([\d.]+px)/g)) bps.add(m[1]);
    if (n.type==='decl') { if (n.important) important++; for (const m of n.value.matchAll(/#[0-9a-f]{3,8}\b/gi)) hex.add(m[0].toLowerCase()); }
  });
}
console.table({ files: files.length, 'size (KB)': (bytes/1024).toFixed(0), rules, '!important': important, 'distinct breakpoints': bps.size, 'raw hex colours (outside palette)': hex.size });
console.log('breakpoints:', [...bps].sort((a,b)=>parseFloat(a)-parseFloat(b)).join(' '));
