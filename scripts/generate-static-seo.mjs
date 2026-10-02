import fs from 'node:fs/promises';
import path from 'node:path';
import { projectSlug } from '../src/utils/projectSlug.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://happyuky7.com';
const PROFILE_NAME = 'Happy7';
const PROFILE_ALIAS = 'Happyuky7';
const SITE_TITLE_PREFIX = `${PROFILE_NAME} (${PROFILE_ALIAS})`;
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

// Mirrors src/components/elsewhere/elsewhereData.tsx (name + url + tagline only).
// Keep both in sync when adding a site.
const ELSEWHERE_SITES = [
  { id: 'whatever', name: 'Whatever', url: 'https://whatever.happyuky7.com/' },
  { id: 'links', name: 'All My Links', url: 'https://happyuky7.com/links/' },
];

let publicProjects = [];
let publicPosts = [];
const locales = {};

function staticBody(lang, urlPath, title, description) {
  const labels = locales[lang]?.nav || locales.en.nav;
  const link = (href, text) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
  const route = urlPath.replace(/^\/[^/]+/, '').replace(/\/$/, '') || '/';
  const nav = ['home', 'projects', 'blog', 'contact', 'elsewhere'].map((key) =>
    link(`/${lang}/${key === 'home' ? '' : `${key}/`}`, labels[key])).join(' · ');
  let content = `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>`;
  const projects = publicProjects.map((p) => `<li>${link(`/${lang}/project/${projectSlug(p)}/`, p.displayName || p.name)}<p>${escapeHtml(pickLocalized(p.description, lang))}</p></li>`).join('');
  if (route === '/') {
    content += (locales[lang]?.home?.['about-paragraphs'] || locales.en.home['about-paragraphs'])
      .map((text) => `<p>${escapeHtml(text.replaceAll('**', ''))}</p>`).join('');
    content += `<h2>${escapeHtml(labels.projects)}</h2><ul>${projects}</ul>`;
  } else if (route === '/projects') {
    content += `<ul>${projects}</ul>`;
  } else if (route.startsWith('/project/')) {
    const project = publicProjects.find((p) => projectSlug(p) === route.split('/')[2]);
    if (project) {
      content += `<ul>${(project.tags || []).map((tag) => `<li>${escapeHtml(tag.name)}</li>`).join('')}</ul>`;
      content += [project.github, project.demo, project.link].filter((url) => /^https?:\/\//i.test(url || ''))
        .map((url) => `<p>${link(url, url)}</p>`).join('');
    }
  } else if (route === '/contact') {
    content += `<p>${link('mailto:happyrogelio7developer@gmail.com', 'happyrogelio7developer@gmail.com')}</p>`;
    content += `<p>${link('https://github.com/Happyuky7', 'GitHub')} · ${link('https://x.com/happyuky7', 'X (Twitter)')}</p>`;
  } else if (route === '/elsewhere') {
    content += `<ul>${ELSEWHERE_SITES.map((site) => {
      const copy = locales[lang]?.elsewhere?.sites?.[site.id] || locales.en.elsewhere.sites[site.id];
      return `<li>${link(site.url, site.name)}<p>${escapeHtml(copy.tagline)}</p></li>`;
    }).join('')}</ul>`;
  } else if (route === '/blog') {
    content += `<ul>${publicPosts.filter((p) => !p.languages?.length || p.languages.includes(lang)).map((p) => {
      const route = p.year && p.month ? `${p.year}/${p.month}/${p.slug || p.id}` : p.slug || p.id;
      return `<li>${link(`/${lang}/blog/${route}/`, pickLocalized(p.title, lang))}<p>${escapeHtml(pickLocalized(p.excerpt || p.description, lang))}</p></li>`;
    }).join('')}</ul>`;
  }
  return `<main style="max-width:72rem;margin:auto;padding:2rem"><nav>${nav}</nav>${content}</main>`;
}

async function writeRedirect(from, to) {
  const target = `${normalizeSiteUrl(SITE_URL)}${to}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page moved</title><link rel="canonical" href="${escapeHtml(target)}"><meta http-equiv="refresh" content="0; url=${escapeHtml(target)}"></head><body><a href="${escapeHtml(target)}">Continue to the project</a></body></html>`;
  // HTTP paths are decoded by static hosts before looking up files.
  await writeHtml(path.join(DIST, decodeURIComponent(from).replace(/^\//, ''), 'index.html'), html);
}

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

function serializeJsonLd(jsonLd) {
  return JSON.stringify(jsonLd)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function baseDescription(lang) {
  return {
    en: `Official website of ${PROFILE_NAME}, also known as ${PROFILE_ALIAS}: portfolio, blog, projects, GitHub work and contact links.`,
    es: `Sitio oficial de ${PROFILE_NAME}, también conocido como ${PROFILE_ALIAS}: portafolio, blog, proyectos, GitHub y enlaces de contacto.`,
    ja: `${PROFILE_NAME}（${PROFILE_ALIAS}）の公式サイト。ポートフォリオ、ブログ、プロジェクト、GitHub、連絡先リンク。`,
  }[lang] || `Official website of ${PROFILE_NAME}, also known as ${PROFILE_ALIAS}: portfolio, blog, projects, GitHub work and contact links.`;
}

function profileJsonLd(lang) {
  const base = normalizeSiteUrl(SITE_URL);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: `${base}/`,
        name: PROFILE_NAME,
        alternateName: [PROFILE_ALIAS, `${PROFILE_ALIAS}.com`],
        inLanguage: lang,
        publisher: { '@id': `${base}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${base}/#person`,
        name: PROFILE_NAME,
        alternateName: [PROFILE_ALIAS, `${PROFILE_ALIAS}.com`],
        url: `${base}/`,
        image: `${base}/assets/img/logo.png`,
        sameAs: [
          'https://github.com/Happyuky7',
          'https://x.com/happyuky7',
          'https://www.youtube.com/@Happyuky7',
          'https://www.twitch.tv/happyuky7',
        ],
        knowsAbout: ['Web development', 'Full-stack development', 'Minecraft servers', 'JavaScript', 'TypeScript', 'React'],
      },
    ],
  };
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

function applySeo(html, { lang, title, description, urlPath, image, ogType, languages = LANGS, noindex = false }) {
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
  const clean = urlPath.replace(/^\/(en|es|ja|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/, '/').replace(/\/$/, '');
  const alternateUrl = (l) => `${normalizeSiteUrl(SITE_URL)}/${l}${clean}/`;
  const alternates = [
    `    <link rel="alternate" hreflang="x-default" href="${alternateUrl(languages.includes('en') ? 'en' : languages[0])}" />`,
    ...languages.map((l) => `    <link rel="alternate" hreflang="${l}" href="${alternateUrl(l)}" />`),
  ].join('\n');
  html = html.replace('</head>', `${alternates}\n  </head>`);

  // og
  html = replaceOrInsert(html, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:type" content="${ogType || 'website'}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/>/i, `    <meta property="og:site_name" content="${SITE_TITLE_PREFIX}" />`);
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

  html = replaceOrInsert(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}" />`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${staticBody(lang, urlPath, title, description)}</div>`);
  return html;
}

function insertOrReplaceJsonLd(html, jsonLd) {
  if (!jsonLd) return html;
  const block = `    <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`;
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
  publicPosts = blogPosts.filter((p) => !p.draft && !p.private && !p.unlisted && !p.localExample);
  const projects = await readJson('jsons/projects-real.json');
  publicProjects = projects.filter((p) => p.name && !p.hidden);
  for (const lang of LANGS) {
    locales[lang] = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'locales', `${lang}.json`), 'utf8'));
  }

  for (const lang of LANGS) {
    const template = await readTemplate(lang);

    const baseDesc = baseDescription(lang);

    const pageLabel = locales[lang].nav;

    // Home pages also need useful HTML before JavaScript loads.
    const home = applySeo(template, {
      lang, title: `${SITE_TITLE_PREFIX} | ${locales[lang].nav.home}`,
      description: baseDesc, urlPath: `/${lang}/`, image: '/assets/img/logo.png',
    });
    await writeHtml(path.join(DIST, lang, 'index.html'), insertOrReplaceJsonLd(home, profileJsonLd(lang)));
    if (lang === 'en') await writeHtml(path.join(DIST, 'index.html'), insertOrReplaceJsonLd(home, profileJsonLd(lang)));

    // Contact
    {
      const urlPath = `/${lang}/contact`;
      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${pageLabel.contact}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      const htmlWithRich = insertOrReplaceJsonLd(html, profileJsonLd(lang));
      await writeHtml(path.join(DIST, lang, 'contact', 'index.html'), htmlWithRich);
      if (lang === 'en') await writeHtml(path.join(DIST, 'contact', 'index.html'), htmlWithRich);
    }

    // Elsewhere (my other sites - not code projects)
    {
      const urlPath = `/${lang}/elsewhere`;
      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${locales[lang]?.elsewhere?.pageTitle || locales.en.elsewhere.pageTitle}`,
        description: locales[lang]?.elsewhere?.pageDescription || locales.en.elsewhere.pageDescription,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      const htmlWithRich = insertOrReplaceJsonLd(html, profileJsonLd(lang));
      await writeHtml(path.join(DIST, lang, 'elsewhere', 'index.html'), htmlWithRich);
      if (lang === 'en') await writeHtml(path.join(DIST, 'elsewhere', 'index.html'), htmlWithRich);
    }

    // Blog index
    {
      const urlPath = `/${lang}/blog`;
      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${pageLabel.blog}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
        noindex: publicPosts.length === 0,
      });
      const htmlWithRich = insertOrReplaceJsonLd(html, profileJsonLd(lang));
      await writeHtml(path.join(DIST, lang, 'blog', 'index.html'), htmlWithRich);
      // unprefixed alias (English assumed)
      if (lang === 'en') await writeHtml(path.join(DIST, 'blog', 'index.html'), htmlWithRich);
    }

    // Projects index
    {
      const urlPath = `/${lang}/projects`;
      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${pageLabel.projects}`,
        description: baseDesc,
        urlPath,
        image: '/assets/img/logo.png',
        ogType: 'website',
      });
      const htmlWithRich = insertOrReplaceJsonLd(html, profileJsonLd(lang));
      await writeHtml(path.join(DIST, lang, 'projects', 'index.html'), htmlWithRich);
      if (lang === 'en') await writeHtml(path.join(DIST, 'projects', 'index.html'), htmlWithRich);
    }

    // Blog posts
    for (const post of Array.isArray(blogPosts) ? blogPosts : []) {
      if (post?.draft || post?.private || post?.unlisted || post?.localExample) continue;
      const year = post.year || '';
      const month = post.month || '';
      const slug = post.slug || post.id;
      if (!slug) continue;

      const title = pickLocalized(post.title, lang, post.defaultLanguage || 'en') || slug;
      const desc = pickLocalized(post.description || post.excerpt, lang, post.defaultLanguage || 'en') || baseDesc;
      const img = post.image || '/assets/img/logo.png';

      const supportedLangs = Array.isArray(post.languages) && post.languages.length ? post.languages : LANGS;
      if (!supportedLangs.includes(lang)) continue;

      const urlPath = year && month
        ? `/${lang}/blog/${year}/${month}/${slug}`
        : `/${lang}/blog/${slug}`;

      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${title}`,
        description: desc,
        urlPath,
        image: img,
        ogType: 'article',
        languages: supportedLangs,
      });

      const canonical = `${normalizeSiteUrl(SITE_URL)}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}/`;
      const authorName = post.author?.name || PROFILE_NAME;
      const authorUrl = post.author?.url || normalizeSiteUrl(SITE_URL);
      const authorAvatar = post.author?.avatar || '/assets/img/logo.png';
      const published = post.date && !Number.isNaN(Date.parse(post.date)) ? new Date(post.date).toISOString() : undefined;
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
          alternateName: PROFILE_ALIAS,
          url: authorUrl,
          image: toAbsUrl(authorAvatar),
        },
        publisher: {
          '@type': 'Person',
          name: PROFILE_NAME,
          alternateName: PROFILE_ALIAS,
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
      if (proj?.hidden) continue;
      const slug = projectSlug(proj);
      if (!slug) continue;

      const name = proj.displayName || proj.name || 'Project';
      const desc = pickLocalized(proj.description, lang, 'en') || baseDesc;
      const img = proj.image || '/assets/img/logo.png';

      const urlPath = `/${lang}/project/${encodeURIComponent(slug)}`;
      const html = applySeo(template, {
        lang,
        title: `${SITE_TITLE_PREFIX} | ${name}`,
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
        author: { '@type': 'Person', name: PROFILE_NAME, alternateName: PROFILE_ALIAS, url: normalizeSiteUrl(SITE_URL) },
        sameAs: [proj.github, proj.link, proj.demo].filter(Boolean),
      };

      const htmlWithRich = insertOrReplaceJsonLd(html, jsonLd);

      await writeHtml(path.join(DIST, lang, 'project', slug, 'index.html'), htmlWithRich);
      const aliases = [
        `/${lang}/projects/${slug}/`,
        `/${lang}/project/${encodeURIComponent(proj.name)}/`,
        `/${lang}/projects/${encodeURIComponent(proj.name)}/`,
      ];
      if (lang === 'en') aliases.push(`/project/${slug}/`, `/projects/${slug}/`,
        `/project/${encodeURIComponent(proj.name)}/`, `/projects/${encodeURIComponent(proj.name)}/`);
      for (const alias of new Set(aliases)) {
        if (alias === `${urlPath}/`) continue;
        // NTFS is case-insensitive; the Linux deployment emits these aliases.
        if (process.platform === 'win32' && alias.toLowerCase() === `${urlPath}/`.toLowerCase()) continue;
        await writeRedirect(alias, `${urlPath}/`);
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
