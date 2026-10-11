// 게임 파일(index.html · css · js · vendor)을 app/www 로 복사 — 앱이 이 폴더를 그대로 담아요
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'www');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(ROOT)) if (f === 'index.html' || f.endsWith('.css')) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
for (const d of ['js', 'vendor']) fs.cpSync(path.join(ROOT, d), path.join(OUT, d), { recursive: true });
console.log('copied game into', OUT);
