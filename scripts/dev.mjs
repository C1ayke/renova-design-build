// Local preview + CMS testing: builds the site, serves public/ on localhost, and rebuilds
// whenever content, templates or assets change. No dependencies.
//
//   npm run dev  ->  http://localhost:8080          (the site)
//                    http://localhost:8080/admin/   (Sveltia CMS -> "Work with Local Repository")
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.yml': 'text/yaml', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

function build() {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit' });
  } catch {
    console.error('Build failed — fix the error above; the server keeps the last good output.');
  }
}

build();

let timer;
for (const dir of ['content', 'src', 'admin', 'css', 'js', 'images', 'videos']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, (_, file) => {
    if (file && path.basename(file) === '.DS_Store') return;
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.join(OUT, rel);
  if (!file.startsWith(OUT)) { res.writeHead(403).end(); return; }
  // Also serve /about as about.html, like Vercel does.
  if (!fs.existsSync(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`;
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, 'localhost', () => {
  console.log(`\nSite:  http://localhost:${PORT}\nAdmin: http://localhost:${PORT}/admin/  (Chrome/Edge → "Work with Local Repository" → pick this folder)\n`);
});
