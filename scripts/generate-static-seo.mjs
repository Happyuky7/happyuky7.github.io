import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://happyuky7.com';
const LANGS = ['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil'];

const OG_LOCALE = {
  en: 'en_US',
  es: 'es_ES',
  ja: 'ja_JP',
  fr: 'fr_FR',
  de: 'de_DE',
  pt: 'pt_PT',
  pl: 'pl_PL',
  ru: 'ru_RU',
  zh: 'zh_CN',
  ko: 'ko_KR',
  th: 'th_TH',
  fil: 'fil_PH',
};

function normalizeSiteUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function ensureLeadingSlash(p) {
  return p.startsWith('/') ? p : `/${p}`;
}

function toAbsUrl(value) {
  if (!value) return `${normalizeSiteUrl(SITE_URL)}/assets/img/logo.png`;
  const s = String(value).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${normalizeSiteUrl(SITE_URL)}${ensureLeadingSlash(s)}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pickLocalized(obj, lang, fallback = 'en') {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return '';
  return obj[lang] || obj[fallback] || obj.en || obj.es || obj.ja || Object.values(obj)[0] || '';
}

async function readJson(rel) {
  const raw = await fs.readFile(path.join(PUBLIC, rel), 'utf8');
  return JSON.parse(raw);
}

async function readTemplate(lang) {
  const candidates = [
    path.join(DIST, lang, 'index.html'),
    path.join(DIST, 'index.html'),
  ];
  for (const file of candidates) {
    try {
      return await fs.readFile(file, 'utf8');
    } catch {
      // ignore
    }
  }
  throw new Error(`No template found in dist for lang=${lang}`);
}

function replaceOrInsert(html, regex, replacement, insertBefore = '</head>') {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html.replace(insertBefore, `${replacement}\n  ${insertBefore}`);
}

function applySeo(html, { lang, title, description, urlPath, image, ogType }) {
  const absUrl = `${normalizeSiteUrl(SITE_URL)}${ensureLeadingSlash(urlPath)}`;
  const canonical = absUrl.endsWith('/') ? absUrl : `${absUrl}/`;

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const absImg = escapeHtml(toAbsUrl(image));

  // html lang
  html = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);

  // title
  html = replaceOrInsert(html, /<title>[^<]*<\/title>/i, `    <title>${safeTitle}</title>`);

  // description
  html = replaceOrInsert(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i,
    `    <meta name="description" content="${safeDesc}" />`,
  );

  // canonical
  html = replaceOrInsert(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i,
    `    <link rel="canonical" href="${canonical}" />`,
  );

  // hreflang alternates: remove existing ones (simple) then add fresh block
  html = html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/>\s*/gi, '\n');
  const alternates = [
    `    <link rel="alternate" hreflang="x-default" href="${normalizeSiteUrl(SITE_URL)}/en${ensureLeadingSlash(urlPath.replace(/^\/(en|es|ja|zh|pt|pl|de|ru|th|fil|fr|ko)/, ''))}/" />`,
    ...LANGS.map((l) => {
      const clean = urlPath.replace(/^\/(en|es|ja|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/, '/');
      return `    <link rel="alternate" hreflang="${l}" href="${normalizeSiteUrl(SITE_URL)}/${l}${clean}${clean.endsWith('/') ? '' : '/'}" />`;
    }),
  ].join('\n');
  html = html.replace('</head>', `${alternates}\n  </head>`);

  // og
  html = replaceOrInsert(html, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:type" content="${ogType || 'website'}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:title" content="${safeTitle}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:description" content="${safeDesc}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:url" content="${canonical}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:image" content="${absImg}" />`);

  // og locale
  const ogLocale = OG_LOCALE[lang] || 'en_US';
  html = replaceOrInsert(html, /<meta\s+property="og:locale"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:locale" content="${ogLocale}" />`);
  // remove existing alternates then add fresh ones
  html = html.replace(/\s*<meta\s+property="og:locale:alternate"\s+content="[^"]*"\s*\/>\s*/gi, '\n');
  const altLocales = LANGS
    .filter((l) => l !== lang)
    .map((l) => `    <meta property="og:locale:alternate" content="${OG_LOCALE[l] || 'en_US'}" />`)
    .join('\n');
  if (altLocales) html = html.replace('</head>', `${altLocales}\n  </head>`);

  // twitter
  html = replaceOrInsert(html, /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/>/i, `    <meta name="twitter:card" content="summary_large_image" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, `    <meta name="twitter:title" content="${safeTitle}" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, `    <meta name="twitter:description" content="${safeDesc}" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/i, `    <meta name="twitter:image" content="${absImg}" />`);

  return html;
}

function insertOrReplaceJsonLd(html, jsonLd) {
  if (!jsonLd) return html;
  const block = `    <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLd))}</script>`;
  // Replace first existing ld+json script if present; otherwise insert.
  const re = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
  return replaceOrInsert(html, re, block);
}

function insertOrReplaceArticlePublishedTime(html, isoDate) {
  if (!isoDate) return html;
  const safe = escapeHtml(isoDate);
  return replaceOrInsert(
    html,
    /<meta\s+property="article:published_time"\s+content="[^"]*"\s*\/>/i,
    `    <meta property="article:published_time" content="${safe}" />`,
  );
}

async function writeHtml(outPath, html) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, 'utf8');
}

async function generate() {
  const blogPosts = await readJson('jsons/blogPosts.json');
  const projects = await readJson('jsons/projects-real.json');

  for (const lang of LANGS) {
    const template = await readTemplate(lang);

    const baseDesc = {
      en: 'Website, Blog, Projects and more. GitHub: https://github.com/Happyuky7',
      es: 'Sitio web, blog, proyectos y más. GitHub: https://github.com/Happyuky7',
      ja: 'ウェブサイト、ブログ、プロジェクトなど。GitHub: https://github.com/Happyuky7',
    }[lang] || 'Website, Blog, Projects and more. GitHub: https://github.com/Happyuky7';

    const pageLabel = {
      en: { blog: 'Blog', projects: 'Projects', contact: 'Contact' },
      es: { blog: 'Blog', projects: 'Proyectos', contact: 'Contacto' },
      ja: { blog: 'ブログ', projects: 'プロジェクト', contact: 'お問い合わせ' },
    }[lang] || { blog: 'Blog', projects: 'Projects', contact: 'Contact' };

    // Contact
    {
      const urlPath = `/${lang}/contact`;
      const html = applySeo(template, {
        lang,
        title: `Happyuky7 | ${pageLabel.contact}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      await writeHtml(path.join(DIST, lang, 'contact', 'index.html'), html);
      if (lang === 'en') await writeHtml(path.join(DIST, 'contact', 'index.html'), html);
    }

    // Blog index
    {
      const urlPath = `/${lang}/blog`;
      const html = applySeo(template, {
        lang,
        title: `Happyuky7 | ${pageLabel.blog}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      await writeHtml(path.join(DIST, lang, 'blog', 'index.html'), html);
      // unprefixed alias (English assumed)
      if (lang === 'en') await writeHtml(path.join(DIST, 'blog', 'index.html'), html);
    }

    // Projects index
    {
      const urlPath = `/${lang}/projects`;
      const html = applySeo(template, {
        lang,
        title: `Happyuky7 | ${pageLabel.projects}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      await writeHtml(path.join(DIST, lang, 'projects', 'index.html'), html);
      if (lang === 'en') await writeHtml(path.join(DIST, 'projects', 'index.html'), html);
    }

    // Blog posts
    for (const post of Array.isArray(blogPosts) ? blogPosts : []) {
      if (post?.draft || post?.private || post?.unlisted || post?.localExample) continue;
      const year = post.year || '';
      const month = post.month || '';
      const slug = post.slug || post.id;
      if (!slug) continue;

      const title = pickLocalized(post.title, lang, post.defaultLanguage || 'en') || slug;
      const desc = pickLocalized(post.description, lang, post.defaultLanguage || 'en') || baseDesc;
      const img = post.image || '/assets/img/logo.png';

      const supportedLangs = Array.isArray(post.languages) && post.languages.length ? post.languages : LANGS;
      if (!supportedLangs.includes(lang)) continue;

      const urlPath = year && month
        ? `/${lang}/blog/${year}/${month}/${slug}`
        : `/${lang}/blog/${slug}`;

      const html = applySeo(template, {
        lang,
        title: `Happyuky7 | ${title}`,
        description: desc,
        urlPath,
        image: img,
        ogType: 'article',
      });

      const canonical = `${normalizeSiteUrl(SITE_URL)}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}/`;
      const authorName = post.author?.name || 'Happyuky7';
      const authorUrl = post.author?.url || normalizeSiteUrl(SITE_URL);
      const authorAvatar = post.author?.avatar || '/assets/img/logo.png';
      const published = post.date ? `${post.date}T00:00:00.000Z` : undefined;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: desc,
        image: [toAbsUrl(img)],
        datePublished: published,
        dateModified: published,
        inLanguage: lang,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        author: {
          '@type': 'Person',
          name: authorName,
          url: authorUrl,
          image: toAbsUrl(authorAvatar),
        },
        publisher: {
          '@type': 'Person',
          name: 'Happyuky7',
          url: normalizeSiteUrl(SITE_URL),
          logo: { '@type': 'ImageObject', url: `${normalizeSiteUrl(SITE_URL)}/assets/img/logo.png` },
        },
      };

      let htmlWithRich = insertOrReplaceArticlePublishedTime(html, published);
      htmlWithRich = insertOrReplaceJsonLd(htmlWithRich, jsonLd);

      const out = year && month
        ? path.join(DIST, lang, 'blog', String(year), String(month), String(slug), 'index.html')
        : path.join(DIST, lang, 'blog', String(slug), 'index.html');

      await writeHtml(out, htmlWithRich);


      if (lang === 'en') {
        const outAlias = year && month
          ? path.join(DIST, 'blog', String(year), String(month), String(slug), 'index.html')
          : path.join(DIST, 'blog', String(slug), 'index.html');
        await writeHtml(outAlias, htmlWithRich);
      }
    }

    // Project details
    for (const proj of Array.isArray(projects) ? projects : []) {
      const slug = proj.name || '';
      if (!slug) continue;

      const name = proj.displayName || proj.name || 'Project';
      const desc = pickLocalized(proj.description, lang, 'en') || baseDesc;
      const img = proj.image || '/assets/img/logo.png';

      const urlPath = `/${lang}/project/${encodeURIComponent(slug)}`;
      const html = applySeo(template, {
        lang,
        title: `Happyuky7 | ${name}`,
        description: desc,
        urlPath,
        image: img,
        ogType: 'website',
      });

      const canonical = `${normalizeSiteUrl(SITE_URL)}${urlPath}/`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name,
        description: desc,
        image: [toAbsUrl(img)],
        url: canonical,
        inLanguage: lang,
        author: { '@type': 'Person', name: 'Happyuky7', url: normalizeSiteUrl(SITE_URL) },
        sameAs: [proj.github, proj.link, proj.demo].filter(Boolean),
      };

      const htmlWithRich = insertOrReplaceJsonLd(html, jsonLd);

      await writeHtml(path.join(DIST, lang, 'project', encodeURIComponent(slug), 'index.html'), htmlWithRich);
      // alias route in your router: /projects/:slug
      await writeHtml(path.join(DIST, lang, 'projects', encodeURIComponent(slug), 'index.html'), htmlWithRich);


      if (lang === 'en') {
        await writeHtml(path.join(DIST, 'project', encodeURIComponent(slug), 'index.html'), htmlWithRich);
        await writeHtml(path.join(DIST, 'projects', encodeURIComponent(slug), 'index.html'), htmlWithRich);
      }
    }

  }
}

generate()
  .then(() => {
    console.log('[static-seo] Generated blog/project SEO HTML files');
  })
  .catch((err) => {
    console.error('[static-seo] Failed:', err);
    process.exitCode = 1;
  });
