import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://happyuky7.com';
const LANGS = ['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil'];

function normalizeSiteUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function escapeXml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function readJson(rel) {
  const raw = await fs.readFile(path.join(PUBLIC, rel), 'utf8');
  return JSON.parse(raw);
}

function uniqueByLoc(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (!e?.loc) continue;
    if (seen.has(e.loc)) continue;
    seen.add(e.loc);
    out.push(e);
  }
  return out;
}

function toCanonicalUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

async function generate() {
  const base = normalizeSiteUrl(SITE_URL);

  const blogPosts = await readJson('jsons/blogPosts.json');
  const projects = await readJson('jsons/projects-real.json');

  const entries = [];

  // Root landing (unprefixed). Canonical is /en/, but the URL exists.
  entries.push({ loc: `${base}/` });

  for (const lang of LANGS) {
    entries.push({ loc: `${base}/${lang}/` });
    entries.push({ loc: `${base}/${lang}/blog/` });
    entries.push({ loc: `${base}/${lang}/projects/` });
    entries.push({ loc: `${base}/${lang}/contact/` });

    for (const post of Array.isArray(blogPosts) ? blogPosts : []) {
      if (post?.draft || post?.private || post?.unlisted || post?.localExample) continue;
      const supportedLangs = Array.isArray(post.languages) && post.languages.length ? post.languages : LANGS;
      if (!supportedLangs.includes(lang)) continue;

      const year = post.year || '';
      const month = post.month || '';
      const slug = post.slug || post.id;
      if (!slug) continue;

      const loc = year && month
        ? `${base}/${lang}/blog/${year}/${month}/${slug}/`
        : `${base}/${lang}/blog/${slug}/`;

      entries.push({ loc, lastmod: post.date });
    }

    for (const proj of Array.isArray(projects) ? projects : []) {
      const slug = proj.name;
      if (!slug) continue;
      entries.push({ loc: `${base}/${lang}/project/${encodeURIComponent(slug)}/` });
    }
  }

  const unique = uniqueByLoc(entries)
    .map((e) => ({ ...e, loc: toCanonicalUrl(e.loc) }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const urlset = unique
    .map(({ loc, lastmod }) => {
      const lm = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lm}\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;
  await fs.writeFile(path.join(PUBLIC, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
  await fs.writeFile(path.join(PUBLIC, 'robots.txt'), robots, 'utf8');

  console.log('[seo:source] Wrote public/sitemap.xml and public/robots.txt');
}

generate().catch((err) => {
  console.error('[seo:source] Failed:', err);
  process.exitCode = 1;
});
