// Renders src/pages/*.njk with content/*.json (the files Sveltia CMS edits) into public/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';
import sizeOf from 'image-size';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
const escapeHtml = nunjucks.lib.escape;

const toRelative = (p) => (p || '').replace(/^\/+/, '');

// Grid photos with a pre-made "-thumb" file (480px) get a srcset; new uploads simply don't.
function srcset(image) {
  const rel = toRelative(image);
  const thumb = rel.replace(/(\.[a-z0-9]+)$/i, '-thumb$1');
  const abs = path.join(ROOT, rel);
  if (!rel || !fs.existsSync(path.join(ROOT, thumb)) || !fs.existsSync(abs)) return '';
  return `${thumb} 480w, ${rel} ${sizeOf(fs.readFileSync(abs)).width}w`;
}

function telHref(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? '1' + digits : digits}`;
}

const env = nunjucks.configure(path.join(ROOT, 'src'), { autoescape: true, throwOnUndefined: false });
env.addFilter('asset', toRelative);
env.addFilter('srcset', srcset);
env.addFilter('telHref', telHref);
env.addFilter('twoDigit', (n) => String(n).padStart(2, '0'));
env.addFilter('slug', (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
env.addFilter('lines', (s) => new nunjucks.runtime.SafeString(
  escapeHtml(s || '').split(/\r?\n/).join('<br>')));
// FAQ answers can say {email} / {phone} so they follow the Contact Page details.
env.addFilter('contactTokens', (s, contact) => new nunjucks.runtime.SafeString(
  escapeHtml(s || '')
    .replaceAll('{email}', `<a href="mailto:${escapeHtml(contact.email)}" class="link-underline">${escapeHtml(contact.email)}</a>`)
    .replaceAll('{phone}', `<a href="${escapeHtml(telHref(contact.phone))}" class="link-underline">${escapeHtml(contact.phone)}</a>`)));

const projects = fs.readdirSync(path.join(ROOT, 'content/projects'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ slug: f.replace(/\.json$/, ''), ...readJson(`projects/${f}`) }))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

const home = readJson('home.json');
// A featured project that was later deleted is dropped rather than failing the deploy.
const featuredProjects = (home.featured?.projects || []).flatMap((card) => {
  const project = projects.find((p) => p.slug === card.project);
  if (!project) console.warn(`Skipping featured project "${card.project}": no such project`);
  return project ? [{ ...card, slug: project.slug, name: project.name }] : [];
});

const context = {
  home,
  featuredProjects,
  projects,
  site: readJson('site.json'),
  services: readJson('services.json'),
  about: readJson('about.json'),
  gallery: readJson('gallery.json'),
  contact: readJson('contact.json'),
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const page of ['index', 'services', 'gallery', 'about', 'contact']) {
  fs.writeFileSync(path.join(OUT, `${page}.html`), env.render(`pages/${page}.njk`, context));
}

// Raw camera originals live in spaced folders (git-ignored, never deployed).
const RAW = /^images\/(Cove beach|Lawrence Way|Older work pictures|Paula Dhillion deck and bath|Riding arena|Wende New west RENO|Renova_New_Images_To_Add)(\/|$)/;
for (const dir of ['css', 'js', 'images', 'videos', 'admin']) {
  fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(ROOT, src);
      return !RAW.test(rel) && path.basename(src) !== '.DS_Store';
    },
  });
}
console.log(`Built ${projects.length} projects into public/`);
