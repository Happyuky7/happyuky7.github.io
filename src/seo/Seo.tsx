import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useLanguage } from '@i18n/LanguageContext';
import { publicPath } from '@/utils/publicPath';

const SUPPORTED = ['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil'] as const;
type SupportedLang = (typeof SUPPORTED)[number];

const OG_LOCALE: Record<SupportedLang, string> = {
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

let cachedBlogPosts: any[] | null = null;
let cachedProjects: any[] | null = null;
let cachePromiseBlog: Promise<any[] | null> | null = null;
let cachePromiseProjects: Promise<any[] | null> | null = null;

function stripLangPrefix(pathname: string) {
  return (pathname || '/').replace(/^\/(en|es|ja|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/, '/');
}

function normalizePath(pathname: string) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p;
}

function makeUrl(baseUrl: string, pathname: string) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

function langPath(lang: SupportedLang, cleanPath: string) {
  const path = normalizePath(cleanPath);
  return normalizePath(`/${lang}${path}`);
}

function routeLabel(pathnameClean: string, t: (k: string) => string) {
  const p = normalizePath(pathnameClean);
  if (p === '/') return t('nav.home');
  if (p === '/projects' || p.startsWith('/project/')) return t('nav.projects');
  if (p === '/blog' || p.startsWith('/blog/')) return t('nav.blog');
  if (p === '/contact') return t('nav.contact');
  return 'Happyuky7';
}

function pickLocalized(value: any, lang: SupportedLang, fallback: SupportedLang = 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return '';
  return value[lang] || value[fallback] || value.en || value.es || value.ja || value[Object.keys(value)[0] ?? ''] || '';
}

async function loadBlogPosts(): Promise<any[] | null> {
  if (cachedBlogPosts) return cachedBlogPosts;
  if (cachePromiseBlog) return cachePromiseBlog;
  cachePromiseBlog = (async () => {
    try {
      const res = await fetch(publicPath('/jsons/blogPosts.json'), { cache: 'force-cache' as RequestCache });
      if (!res.ok) return null;
      const json = await res.json();
      cachedBlogPosts = Array.isArray(json) ? json : null;
      return cachedBlogPosts;
    } catch {
      return null;
    } finally {
      cachePromiseBlog = null;
    }
  })();
  return cachePromiseBlog;
}

async function loadProjects(): Promise<any[] | null> {
  if (cachedProjects) return cachedProjects;
  if (cachePromiseProjects) return cachePromiseProjects;
  cachePromiseProjects = (async () => {
    try {
      const res = await fetch(publicPath('/jsons/projects-real.json'), { cache: 'force-cache' as RequestCache });
      if (!res.ok) return null;
      const json = await res.json();
      cachedProjects = Array.isArray(json) ? json : null;
      return cachedProjects;
    } catch {
      return null;
    } finally {
      cachePromiseProjects = null;
    }
  })();
  return cachePromiseProjects;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  el.setAttribute('data-seo', '1');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

function upsertLink(selector: string, attrs: Record<string, string>) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  el.setAttribute('data-seo', '1');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export default function Seo() {
  const location = useLocation();
  const { language, t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const cleanPath = stripLangPrefix(location.pathname);
      const normalizedClean = normalizePath(cleanPath);

      const baseUrl = (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
      const uiLang: SupportedLang = (SUPPORTED.includes(language as any) ? (language as SupportedLang) : 'en');

      const siteName = t('seo.siteName') !== 'seo.siteName' ? t('seo.siteName') : 'Happyuky7';
      const baseDescription = t('seo.description') !== 'seo.description'
        ? t('seo.description')
        : 'Website, Blog, Projects and more. GitHub: https://github.com/Happyuky7';

      let title = siteName;
      let description = baseDescription;
      let ogImage = makeUrl(baseUrl, publicPath('/assets/img/logo.png'));
      let ogType: 'website' | 'article' = 'website';
      let publishedTime: string | null = null;

      // Route-specific enrichment (blog posts + project details)
      const blogMatch = normalizedClean.match(/^\/blog\/(\d{4})\/(\d{2})\/([^\/]+)$/) || normalizedClean.match(/^\/blog\/([^\/]+)$/);
      const projectMatch = normalizedClean.match(/^\/(project|projects)\/([^\/]+)$/);

      if (blogMatch) {
        const slug = blogMatch[3] || blogMatch[1];
        const year = blogMatch[3] ? blogMatch[1] : null;
        const month = blogMatch[3] ? blogMatch[2] : null;

        const posts = await loadBlogPosts();
        const found = (posts || []).find((p) => {
          if (!p) return false;
          if (String(p.slug || p.id) !== String(slug)) return false;
          if (year && String(p.year || '') !== String(year)) return false;
          if (month && String(p.month || '') !== String(month)) return false;
          return true;
        });

        if (found) {
          const postTitle = pickLocalized(found.title, uiLang, (found.defaultLanguage || 'en') as SupportedLang) || String(found.slug || found.id || slug);
          const postDesc =
            pickLocalized(found.excerpt, uiLang, (found.defaultLanguage || 'en') as SupportedLang) ||
            pickLocalized(found.description, uiLang, (found.defaultLanguage || 'en') as SupportedLang) ||
            baseDescription;
          title = `${siteName} | ${postTitle}`;
          description = postDesc;
          ogType = 'article';
          if (found.image) {
            const raw = String(found.image);
            if (/^https?:\/\//i.test(raw)) ogImage = raw;
            else ogImage = makeUrl(baseUrl, raw.startsWith('/') ? publicPath(raw) : raw);
          }
          if (found.date) publishedTime = String(found.date);
        } else {
          title = `${siteName} | ${t('nav.blog')}`;
        }
      } else if (projectMatch) {
        const rawSlug = projectMatch[2];
        const decoded = (() => {
          try {
            return decodeURIComponent(rawSlug);
          } catch {
            return rawSlug;
          }
        })();

        const projects = await loadProjects();
        const found = (projects || []).find((p) => String(p?.name || '') === String(decoded));
        if (found) {
          const projTitle = String(found.displayName || found.name || decoded);
          const projDesc = pickLocalized(found.description, uiLang, 'en') || baseDescription;
          title = `${siteName} | ${projTitle}`;
          description = projDesc;
          if (found.image) {
            const raw = String(found.image);
            if (/^https?:\/\//i.test(raw)) ogImage = raw;
            else ogImage = makeUrl(baseUrl, raw.startsWith('/') ? publicPath(raw) : raw);
          }
        } else {
          title = `${siteName} | ${t('nav.projects')}`;
        }
      } else {
        const section = routeLabel(normalizedClean, t);
        title = section && section !== 'Happyuky7' ? `${siteName} | ${section}` : siteName;
      }

      if (cancelled) return;

      // Canonical uses visible language prefix, even if user landed on an unprefixed URL.
      const canonicalPath = langPath(uiLang, normalizedClean);
      const canonical = makeUrl(baseUrl, canonicalPath);

      document.title = title;

      upsertMeta('meta[name="description"]', { name: 'description', content: description });
      upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#27F59F' });
      upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow' });

      upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });

      // Clear previous alternates that we manage.
      document.head.querySelectorAll('link[rel="alternate"][data-seo="1"]').forEach((n) => n.remove());
      const xDefault = document.createElement('link');
      xDefault.setAttribute('rel', 'alternate');
      xDefault.setAttribute('hrefLang', 'x-default');
      xDefault.setAttribute('href', makeUrl(baseUrl, '/en'));
      xDefault.setAttribute('data-seo', '1');
      document.head.appendChild(xDefault);

      for (const lang of SUPPORTED) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hrefLang', lang);
        link.setAttribute('href', makeUrl(baseUrl, langPath(lang, normalizedClean)));
        link.setAttribute('data-seo', '1');
        document.head.appendChild(link);
      }

      upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: OG_LOCALE[uiLang] });
      // Refresh alternates for og:locale:alternate
      document.head.querySelectorAll('meta[property="og:locale:alternate"][data-seo="1"]').forEach((n) => n.remove());
      for (const alt of SUPPORTED.filter((l) => l !== uiLang)) {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:locale:alternate');
        m.setAttribute('content', OG_LOCALE[alt]);
        m.setAttribute('data-seo', '1');
        document.head.appendChild(m);
      }

      upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
      upsertMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });

      if (publishedTime && ogType === 'article') {
        upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: publishedTime });
      }

      upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
      upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
      upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [language, location.pathname, t]);

  return null;
}
