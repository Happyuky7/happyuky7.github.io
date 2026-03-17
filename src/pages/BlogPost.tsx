import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import matter from 'gray-matter';
import { Buffer } from 'buffer';
import { HiArrowLeft, HiCalendar, HiClock, HiGlobeAlt, HiTag, HiUser, HiUserGroup } from 'react-icons/hi';

import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

import VideoBackground from '@components/videoBackground/VideoBackground';
import ShareButton from '@components/blog/ShareButton';
import CiteButton from '@components/blog/CiteButton';
import BlogMarkdown from '@components/blog/BlogMarkdown';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type LocalizedText = Record<string, string | undefined>;

type Person = {
    name: string;
    url?: string;
    avatar?: string;
    role?: LocalizedText;
    language?: string;
    languages?: string[];
};

type BlogPostMeta = {
    id: string;
    slug: string;
    date: string;
    draft?: boolean;
    private?: boolean;
    archived?: boolean;
    unlisted?: boolean;
    supersededBy?: string | null;
    year?: string;
    month?: string;
    readTime?: number;
    image?: string | null;
    languages?: string[];
    defaultLanguage?: string;
    author?: Person;
    translators?: Person[];
    collaborators?: Person[];
    colaborators?: Person[];
    title?: LocalizedText;
    excerpt?: LocalizedText;
    description?: LocalizedText;
    tags?: string[];
    categoryId?: string;
    categories?: string[];
};

type TocItem = {
    id: string;
    text: string;
    level: number;
};

type HeadingEntry = {
    id: string;
    text: string;
    level: number;
};

function titleizeId(id: string) {
    return id
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function initialsFromName(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PersonAvatar({ name, avatar, sizeClassName }: { name: string; avatar?: string; sizeClassName: string }) {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(avatar) && !failed;
    const resolvedAvatar = (avatar && avatar.startsWith('/')) ? publicPath(avatar) : avatar;

    if (showImage) {
        return (
            <img
                src={resolvedAvatar}
                alt={name}
                onError={() => setFailed(true)}
                className={`${sizeClassName} rounded-full border-2 border-primary/30 group-hover:border-primary object-cover transition-all shrink-0`}
                loading="lazy"
                decoding="async"
            />
        );
    }

    return (
        <div
            className={`${sizeClassName} rounded-full bg-primary/15 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0`}
            aria-label={name}
            title={name}
        >
            {initialsFromName(name)}
        </div>
    );
}

function normalizeMonth(m?: string) {
    if (!m) return undefined;
    const n = Number(m);
    if (!Number.isFinite(n)) return m;
    return String(n).padStart(2, '0');
}

function postPathFromMeta(uiLang: string, meta: { slug: string; year?: string; month?: string }) {
    const yyyy = (meta.year || '').trim();
    const mm = normalizeMonth(meta.month) || '';
    if (yyyy && mm) return withLang(uiLang, `/blog/${yyyy}/${mm}/${meta.slug}`);
    return withLang(uiLang, `/blog/${meta.slug}`);
}

function StatusPill({ children, className }: { children: React.ReactNode; className: string }) {
    return (
        <span className={
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ' +
            className
        }>
            {children}
        </span>
    );
}

function processMarkdown(text: string) {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();
    // Missing static files in Vite dev can return index.html (200 OK). Treat those as "not markdown".
    if (
        lower.startsWith('<!doctype') ||
        lower.startsWith('<html') ||
        lower.startsWith('<head') ||
        lower.startsWith('<body') ||
        lower.includes('</html>') ||
        lower.includes('<meta ') ||
        lower.includes('src="/@vite/client"') ||
        lower.includes("src='/@vite/client'") ||
        lower.includes('injectintoglobalhook') ||
        lower.includes('<div id="root"')
    ) {
        return null;
    }

    let cleaned = trimmed;
    if (cleaned.startsWith('````markdown')) {
        cleaned = cleaned.replace(/^````markdown\s*\n/, '');
    }
    if (cleaned.endsWith('````')) {
        cleaned = cleaned.replace(/\n````\s*$/, '');
    }

    const parsed = matter(cleaned);
    return parsed.content;
}

function slugifyHeading(text: string) {
    return (text || '')
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 64);
}

function createHeadingIdFactory() {
    const seen = new Map<string, number>();
    return (text: string) => {
        const base = slugifyHeading(text) || 'section';
        const next = (seen.get(base) || 0) + 1;
        seen.set(base, next);
        return next === 1 ? base : `${base}-${next}`;
    };
}

function normalizeHeadingText(raw: string) {
    return (raw || '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[`*_~]/g, '')
        .trim();
}

function parseHeadings(markdown: string): { headings: HeadingEntry[]; toc: TocItem[] } {
    const headings: HeadingEntry[] = [];
    const toc: TocItem[] = [];
    const lines = (markdown || '').split(/\r?\n/);
    let inFence = false;
    let fenceMarker: '```' | '~~~' | null = null;
    let pendingSetextText: string | null = null;

    const getId = createHeadingIdFactory();

    for (const line of lines) {
        // Normalize leading blockquote markers so quoted headings/fences stay in sync with rendered output.
        const normalized = line.replace(/^\s{0,3}(?:>\s*)+/, '');

        // Fenced code blocks (``` or ~~~), with optional leading spaces.
        const fence = normalized.trim().match(/^(```+|~~~+)/);
        if (fence) {
            const marker = fence[1].startsWith('~') ? '~~~' : '```';
            if (!inFence) {
                inFence = true;
                fenceMarker = marker;
            } else if (fenceMarker === marker) {
                inFence = false;
                fenceMarker = null;
            }

            pendingSetextText = null;
            continue;
        }
        if (inFence) continue;

        // ATX headings allow up to 3 leading spaces in Markdown.
        const m = normalized.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
        if (m) {
            pendingSetextText = null;
            const level = m[1].length;
            const raw = m[2].replace(/\s*#+\s*$/, '').trim();
            const text = normalizeHeadingText(raw);
            const id = getId(text);

            headings.push({ id, text, level });

            if (level === 2 || level === 3) {
                toc.push({ id, text, level });
            }
            continue;
        }

        // Setext headings:
        //   Title
        //   =====
        // or
        //   Title
        //   -----
        const underline = normalized.trim();
        const isH1 = /^=+$/.test(underline);
        const isH2 = /^-+$/.test(underline);
        if ((isH1 || isH2) && pendingSetextText) {
            const level = isH1 ? 1 : 2;
            const raw = pendingSetextText;
            const text = normalizeHeadingText(raw);
            const id = getId(text);

            headings.push({ id, text, level });

            if (level === 2) {
                toc.push({ id, text, level });
            }

            pendingSetextText = null;
            continue;
        }

        // Track last non-empty line for possible setext heading.
        if (normalized.trim()) pendingSetextText = normalized.trim();
        else pendingSetextText = null;
    }

    return { headings, toc };
}

export default function BlogPost() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { year, month, slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const uiLang = (language || 'en').trim().toLowerCase();
    const contentLangParamRaw = (searchParams.get('contentLang') || '').trim().toLowerCase();
    const requestedContentLang = contentLangParamRaw || uiLang;

    const [postMeta, setPostMeta] = useState<BlogPostMeta | null>(null);
    const [allPosts, setAllPosts] = useState<BlogPostMeta[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [metaError, setMetaError] = useState(false);
    const [contentError, setContentError] = useState(false);
    const [isPrivateView, setIsPrivateView] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [fallbackNotice, setFallbackNotice] = useState<{ from: string; to: string } | null>(null);
    const [resolvedContentLang, setResolvedContentLang] = useState<string>(requestedContentLang);
    const [activeHeadingId, setActiveHeadingId] = useState<string>('');

    const setContentLangParam = (next: string, opts?: { replace?: boolean }) => {
        const normalized = (next || '').trim().toLowerCase();
        const params = new URLSearchParams(searchParams);
        // If content language matches UI language, omit param for cleaner URLs.
        if (!normalized || normalized === uiLang) params.delete('contentLang');
        else params.set('contentLang', normalized);
        setSearchParams(params, { replace: opts?.replace ?? false });
    };

    useEffect(() => {
        // When user selects a new content language, reset resolved language and clear previous fallback notice.
        setResolvedContentLang(requestedContentLang);
        setFallbackNotice(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestedContentLang]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).Buffer = (window as any).Buffer ?? Buffer;
        }
    }, []);

    const getLanguageName = (code: string) => {
        const normalized = code.trim().toLowerCase();
        try {
            const displayNames = new Intl.DisplayNames([language === 'es' ? 'es' : 'en'], { type: 'language' });
            const name = displayNames.of(normalized);
            if (!name) return normalized.toUpperCase();
            return name.charAt(0).toUpperCase() + name.slice(1);
        } catch {
            const fallback: Record<string, string> = {
                en: language === 'es' ? 'Inglés' : 'English',
                es: language === 'es' ? 'Español' : 'Spanish',
                jp: language === 'es' ? 'Japonés' : 'Japanese',
                ja: language === 'es' ? 'Japonés' : 'Japanese',
            };
            return fallback[normalized] || normalized.toUpperCase();
        }
    };

    const getLocalized = (obj?: LocalizedText, fallbackLang?: string) => {
        if (!obj) return '';
        const fb = fallbackLang || 'en';
        // Prefer content language for post content, then UI language, then fallbacks.
        return (
            obj[resolvedContentLang] ||
            obj[requestedContentLang] ||
            obj[uiLang] ||
            obj[fb] ||
            obj.en ||
            obj.es ||
            obj[Object.keys(obj)[0] ?? ''] ||
            ''
        );
    };

    const getCategoryLabel = (categoryId: string) => {
        const translated = t(`categories.${categoryId}`);
        return translated !== `categories.${categoryId}` ? translated : titleizeId(categoryId);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();

        const localizedDate = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `${localizedDate} (${day}/${mm}/${yyyy})`;
    };

    useEffect(() => {
        const loadMeta = async () => {
            try {
                setLoading(true);
                setMetaError(false);

                const response = await fetch(publicPath('/jsons/blogPosts.json'));
                if (!response.ok) throw new Error('Network response was not ok');

                const data: unknown = await response.json();
                const posts = Array.isArray(data) ? (data as BlogPostMeta[]) : [];
                setAllPosts(posts);

                const matchYear = year;
                const matchMonth = normalizeMonth(month);

                const found = posts.find((p) => {
                    if (!p || typeof p.slug !== 'string') return false;
                    if (slug && p.slug !== slug) return false;

                    if (matchYear && p.year && p.year !== matchYear) return false;
                    if (matchMonth && p.month && normalizeMonth(p.month) !== matchMonth) return false;
                    return true;
                }) ?? posts.find((p) => p?.slug === slug) ?? null;

                if (!found) {
                    setPostMeta(null);
                    setMetaError(true);
                    setLoading(false);
                    return;
                }

                // Hide drafts in production builds.
                if (found.draft && !import.meta.env.DEV) {
                    setPostMeta(null);
                    setMetaError(true);
                    setLoading(false);
                    return;
                }

                // Private posts: hide content in production, but show a friendly message if accessed via URL.
                if (found.private && !import.meta.env.DEV) {
                    setIsPrivateView(true);
                } else {
                    setIsPrivateView(false);
                }

                setPostMeta(found);

                // Canonicalize URL shape (prefer /blog/:year/:month/:slug when meta has them)
                const canonicalYear = found.year || year;
                const canonicalMonth = normalizeMonth(found.month || month);
                const canonicalSlug = found.slug;
                const canonicalPath = canonicalYear && canonicalMonth
                    ? withLang(uiLang, `/blog/${canonicalYear}/${canonicalMonth}/${canonicalSlug}`)
                    : withLang(uiLang, `/blog/${canonicalSlug}`);

                const currentMonthNorm = normalizeMonth(month);
                const shouldCanonicalize =
                    (canonicalYear && canonicalMonth && (!year || !month)) ||
                    (canonicalYear && year && canonicalYear !== year) ||
                    (canonicalMonth && currentMonthNorm && canonicalMonth !== currentMonthNorm);

                if (shouldCanonicalize) {
                    navigate(canonicalPath + location.search + location.hash, { replace: true });
                }
            } catch (err) {
                console.error('Error loading post meta:', err);
                setMetaError(true);
            } finally {
                setLoading(false);
            }
        };

        void loadMeta();
    }, [slug, year, month, uiLang, navigate, location.search, location.hash]);

    useEffect(() => {
        const loadContent = async () => {
            if (!postMeta) return;
            if (isPrivateView) return;

            try {
                setLoading(true);
                setContentError(false);
                setFallbackNotice(null);

                const availableRaw = postMeta.languages && postMeta.languages.length ? postMeta.languages : [postMeta.defaultLanguage || 'en'];
                const available = Array.from(new Set(availableRaw.map((l) => l.trim().toLowerCase()).filter(Boolean)));
                const defaultLang = (postMeta.defaultLanguage || available[0] || 'en').trim().toLowerCase();
                const requestedLang = (requestedContentLang || defaultLang).trim().toLowerCase();

                const languagesToTry = Array.from(
                    new Set([
                        requestedLang,
                        defaultLang,
                        uiLang,
                        ...available,
                    ].filter(Boolean)),
                );

                const y = postMeta.year || year;
                const m = normalizeMonth(postMeta.month || month);
                const s = postMeta.slug;

                const candidates: Array<{ url: string; language: string }> = [];
                for (const languageToTry of languagesToTry) {
                    if (y && m) candidates.push({ url: `/blog-content/${y}/${m}/${s}/${languageToTry}.md`, language: languageToTry });
                    candidates.push({ url: `/blog-content/${s}/${languageToTry}.md`, language: languageToTry });
                }

                let lastError: unknown = null;
                for (const candidate of candidates) {
                    try {
                        const res = await fetch(candidate.url);
                        if (!res.ok) {
                            lastError = new Error(`Not found: ${candidate.url}`);
                            continue;
                        }

                        const text = await res.text();
                        const processed = processMarkdown(text);
                        if (!processed) {
                            lastError = new Error(`Invalid markdown (HTML?): ${candidate.url}`);
                            continue;
                        }

                        if (candidate.language !== requestedLang) {
                            setFallbackNotice({ from: requestedLang, to: candidate.language });
                            setResolvedContentLang(candidate.language);
                            setContent(processed);
                            setLoading(false);
                            // Keep the user's requested contentLang in the URL so the selection doesn't flip.
                            return;
                        }

                        setResolvedContentLang(candidate.language);
                        setContent(processed);

                        setLoading(false);
                        return;
                    } catch (e) {
                        lastError = e;
                    }
                }

                console.error('Error loading post content:', lastError);
                setContentError(true);
                setLoading(false);
            } catch (err) {
                console.error('Error loading post content:', err);
                setContentError(true);
                setLoading(false);
            }
        };

        void loadContent();
    }, [postMeta, isPrivateView, year, month, retryCount, requestedContentLang, uiLang]);

    const derived = useMemo(() => {
        const cat = postMeta?.categoryId || postMeta?.categories?.[0] || '';
        const collaborators = postMeta?.collaborators || postMeta?.colaborators || [];
        const translators = postMeta?.translators || [];
        const author = postMeta?.author || null;
        const availableLangs = postMeta?.languages && postMeta.languages.length ? postMeta.languages : [];
        return { cat, collaborators, translators, author, availableLangs };
    }, [postMeta]);

    const parsed = useMemo(() => parseHeadings(content), [content]);
    const toc = useMemo(() => parsed.toc, [parsed]);

    // Important: this resolver must be stable across re-renders.
    // Using useMemo with a mutable cursor can drift in dev (StrictMode) and whenever state updates,
    // causing heading ids to change and breaking both TOC and scrollspy.
    let headingResolveIdx = 0;
    const resolveHeadingId = (level: number, rawText: string) => {
        const list = parsed.headings;
        const text = normalizeHeadingText(rawText);

        for (let i = headingResolveIdx; i < list.length; i += 1) {
            const h = list[i];
            if (h.level === level && h.text === text) {
                headingResolveIdx = i + 1;
                return h.id;
            }
        }

        // Fallback: if markdown parsing missed something, still produce a stable-ish id.
        return slugifyHeading(text) || 'section';
    };

    const tocView = useMemo(() => {
        const h2Indexes = toc
            .map((it, i) => ({ it, i }))
            .filter(({ it }) => it.level === 2)
            .map(({ i }) => i);

        const findParentH2Index = (idx: number) => {
            for (let j = idx; j >= 0; j -= 1) {
                if (toc[j]?.level === 2) return j;
            }
            return -1;
        };

        return toc.map((it, idx) => {
            if (it.level === 2) {
                const nextH2 = h2Indexes.find((x) => x > idx);
                const isLastH2 = nextH2 == null;
                const prefix = `${isLastH2 ? '└──' : '├──'} `;
                return { ...it, prefix };
            }

            // level 3 (child of nearest previous H2)
            const parentIdx = findParentH2Index(idx);
            const nextH2 = h2Indexes.find((x) => x > parentIdx);
            const parentHasNext = nextH2 != null;

            // Determine if this is the last level-3 item before the next H2 (or end).
            const end = nextH2 ?? toc.length;
            let isLastChild = true;
            for (let k = idx + 1; k < end; k += 1) {
                if (toc[k]?.level === 3) {
                    isLastChild = false;
                    break;
                }
            }

            const lead = parentHasNext ? '│   ' : '    ';
            const branch = isLastChild ? '└──' : '├──';
            const prefix = `${lead}${branch} `;
            return { ...it, prefix };
        });
    }, [toc]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!toc.length) return;

        const ids = toc.map((t) => t.id).filter(Boolean);
        if (!ids.length) return;

        // More reliable than IntersectionObserver for long/complex markdown.
        // Also: this app often scrolls inside an overflow container, so listen
        // to the nearest scroll parent instead of only `window`.
        const offset = 120; // accounts for navbar + scroll-mt
        let raf = 0;

        const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
            if (!node || typeof window === 'undefined') return window;
            let parent = node.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                const canScroll = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
                    parent.scrollHeight > parent.clientHeight + 1;
                if (canScroll) return parent;
                parent = parent.parentElement;
            }
            return window;
        };

        const firstEl = document.getElementById(ids[0] ?? '') as HTMLElement | null;
        const scrollTarget = getScrollParent(firstEl);

        const computeActive = () => {
            raf = 0;
            // Re-query elements each time: ReactMarkdown can re-render and replace nodes.
            const candidates = ids
                .map((id) => {
                    const el = document.getElementById(id);
                    return el ? ({ id, top: el.getBoundingClientRect().top } as const) : null;
                })
                .filter((x): x is { id: string; top: number } => Boolean(x));

            // Prefer the heading that is closest to (but above) the offset line.
            const above = candidates
                .filter((x) => x.top - offset <= 0)
                .sort((a, b) => b.top - a.top)[0];

            if (above?.id) {
                setActiveHeadingId(above.id);
                return;
            }

            // If none are above, fall back to the first visible.
            const firstVisible = candidates
                .filter((x) => x.top >= 0)
                .sort((a, b) => a.top - b.top)[0];
            if (firstVisible?.id) setActiveHeadingId(firstVisible.id);
        };

        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(computeActive);
        };

        // Always listen to window (most pages scroll the viewport). Also listen to a nested
        // scroll container if we detect one.
        window.addEventListener('scroll', onScroll, { passive: true });
        if (scrollTarget !== window) {
            (scrollTarget as HTMLElement).addEventListener('scroll', onScroll, { passive: true } as any);
        }
        window.addEventListener('resize', onScroll);
        computeActive();

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (scrollTarget !== window) {
                (scrollTarget as HTMLElement).removeEventListener('scroll', onScroll as any);
            }
            window.removeEventListener('resize', onScroll);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, [toc]);

    if (loading && !postMeta) {
        return (
            <>
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-xl text-gray-300">{t('blog.loading')}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (metaError || !postMeta) {
        return (
            <>
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20 px-4">
                        <div className="text-center card max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-linear-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                                {t('blog.postNotFound')}
                            </h2>
                            <p className="text-gray-400 mb-8">{t('blog.noResultsDesc')}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link to={withLang(uiLang, '/blog')} className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto">
                                    <HiArrowLeft />
                                    {t('blog.backToBlog')}
                                </Link>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-dark-lighter text-gray-300 rounded-lg hover:bg-dark border border-primary/30 transition-all w-full sm:w-auto"
                                >
                                    {t('blog.tryAgain')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isPrivateView) {
        const title = getLocalized(postMeta.title, postMeta.defaultLanguage) || postMeta.slug;
        const newerSlug = String(postMeta.supersededBy || '').trim();
        const newer = newerSlug ? (allPosts.find((p) => p?.slug === newerSlug) || null) : null;
        const newerPath = newerSlug ? (newer ? postPathFromMeta(uiLang, { slug: newer.slug, year: newer.year, month: newer.month }) : withLang(uiLang, `/blog/${newerSlug}`)) : null;

        return (
            <>
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20 px-4">
                        <div className="text-center card max-w-2xl">
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                <StatusPill className="border-red-500/30 bg-red-500/10 text-red-200">
                                    {language === 'es' ? 'Privado' : 'Private'}
                                </StatusPill>
                                {newerSlug ? (
                                    <StatusPill className="border-sky-400/30 bg-sky-400/10 text-sky-100">
                                        {language === 'es' ? 'Desactualizado' : 'Outdated'}
                                    </StatusPill>
                                ) : null}
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-linear-to-r from-primary to-sky-400 bg-clip-text text-transparent">
                                {title}
                            </h2>
                            <p className="text-gray-300 mb-3">
                                {language === 'es' ? 'Este post está actualmente en privado.' : 'This post is currently private.'}
                            </p>
                            <p className="text-gray-400 mb-8">
                                {language === 'es'
                                    ? 'Si llegaste acá por un link, puede que se publique más adelante.'
                                    : 'If you arrived here via a link, it may be published later.'}
                            </p>

                            {newerPath ? (
                                <Link to={newerPath} className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center mb-4">
                                    {language === 'es' ? 'Ver la versión más actualizada' : 'View the newest version'}
                                </Link>
                            ) : null}

                            <Link to={withLang(uiLang, '/blog')} className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center">
                                <HiArrowLeft />
                                {t('blog.backToBlog')}
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (contentError) {
        return (
            <>
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20 px-4">
                        <div className="text-center card max-w-2xl">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                                <span className="text-red-400 text-2xl font-bold">!</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-red-300">
                                {t('blog.contentNotAvailableTitle')}
                            </h2>
                            <p className="text-gray-400 mb-8">{t('blog.contentNotAvailableDesc')}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link to={withLang(uiLang, '/blog')} className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto">
                                    <HiArrowLeft />
                                    {t('blog.viewAllArticles')}
                                </Link>
                                <button
                                    onClick={() => setRetryCount((c) => c + 1)}
                                    className="px-6 py-3 bg-dark-lighter text-gray-300 rounded-lg hover:bg-dark border border-primary/30 transition-all w-full sm:w-auto"
                                >
                                    {t('blog.retry')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const title = getLocalized(postMeta.title, postMeta.defaultLanguage) || postMeta.slug;
    const excerpt = getLocalized(postMeta.excerpt, postMeta.defaultLanguage) || getLocalized(postMeta.description, postMeta.defaultLanguage);
    const shareYear = postMeta.year || year;
    const shareMonth = normalizeMonth(postMeta.month || month);
    const postPath = shareYear && shareMonth
        ? `/blog/${shareYear}/${shareMonth}/${postMeta.slug}`
        : `/blog/${postMeta.slug}`;
    const shareBase = withLang(uiLang, postPath);
    const shareParams = new URLSearchParams();
    if (requestedContentLang && requestedContentLang !== uiLang) shareParams.set('contentLang', requestedContentLang);
    const toShare = shareParams.toString() ? `${shareBase}?${shareParams.toString()}` : shareBase;

    const archived = Boolean(postMeta.archived);
    const unlisted = Boolean(postMeta.unlisted);
    const newerSlug = String(postMeta.supersededBy || '').trim();
    const newer = newerSlug ? (allPosts.find((p) => p?.slug === newerSlug) || null) : null;
    const newerPath = newerSlug ? (newer ? postPathFromMeta(uiLang, { slug: newer.slug, year: newer.year, month: newer.month }) : withLang(uiLang, `/blog/${newerSlug}`)) : null;

    return (
        <>
            <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
            <div className="relative z-10">
                <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {import.meta.env.DEV && postMeta.draft ? (
                                <StatusPill className="border-yellow-400/30 bg-yellow-400/10 text-yellow-100">
                                    {language === 'es' ? 'Borrador (DEV)' : 'Draft (DEV)'}
                                </StatusPill>
                            ) : null}
                            {import.meta.env.DEV && postMeta.private ? (
                                <StatusPill className="border-red-500/30 bg-red-500/10 text-red-200">
                                    {language === 'es' ? 'Privado (DEV)' : 'Private (DEV)'}
                                </StatusPill>
                            ) : null}
                            {archived ? (
                                <StatusPill className="border-primary/30 bg-primary/10 text-primary">
                                    {language === 'es' ? 'Archivado' : 'Archived'}
                                </StatusPill>
                            ) : null}
                            {unlisted ? (
                                <StatusPill className="border-white/15 bg-white/5 text-white/80">
                                    {language === 'es' ? 'No listado' : 'Unlisted'}
                                </StatusPill>
                            ) : null}
                            {newerSlug ? (
                                <StatusPill className="border-sky-400/30 bg-sky-400/10 text-sky-100">
                                    {language === 'es' ? 'Desactualizado' : 'Outdated'}
                                </StatusPill>
                            ) : null}
                        </div>

                        {archived ? (
                            <div className="card mb-4 border border-primary/20 bg-primary/10">
                                <div className="text-white font-semibold">{language === 'es' ? 'Post archivado' : 'Archived post'}</div>
                                <div className="text-white/70 text-sm mt-1">
                                    {language === 'es'
                                        ? 'Este post está archivado y puede estar desactualizado.'
                                        : 'This post is archived and may be outdated.'}
                                </div>
                            </div>
                        ) : null}

                        {newerPath ? (
                            <div className="card mb-4 border border-sky-400/20 bg-sky-400/10">
                                <div className="text-white font-semibold">{language === 'es' ? 'Hay una versión más actualizada' : 'A newer version is available'}</div>
                                <div className="text-white/70 text-sm mt-1">
                                    <Link to={newerPath} className="underline text-white hover:text-primary transition">
                                        {language === 'es' ? 'Abrir versión nueva' : 'Open newer version'}
                                    </Link>
                                </div>
                            </div>
                        ) : null}

                        <Link
                            to={withLang(uiLang, '/blog')}
                            className="inline-flex items-center gap-2 text-primary hover:underline mb-8 transition-all"
                        >
                            <HiArrowLeft /> {t('blog.backToBlog')}
                        </Link>

                        <article className="card mb-8">
                            {postMeta.image && (
                                <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden">
                                    <img
                                        src={String(postMeta.image).startsWith('/') ? publicPath(String(postMeta.image)) : String(postMeta.image)}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                        loading="eager"
                                        decoding="async"
                                        fetchPriority="high"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-dark via-transparent to-transparent" />
                                </div>
                            )}

                            {derived.availableLangs.length > 1 && (
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-primary/20">
                                    <HiGlobeAlt className="text-primary text-xl" />
                                    <span className="text-gray-400">{t('blog.availableLanguages')}:</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {derived.availableLangs.map((code) => (
                                            <button
                                                key={code}
                                                onClick={() => {
                                                    setFallbackNotice(null);
                                                    setContentLangParam(code, { replace: true });
                                                }}
                                                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                                                    requestedContentLang === code
                                                        ? 'bg-primary text-dark'
                                                        : 'bg-dark-lighter text-gray-400 hover:bg-dark border border-primary/30'
                                                }`}
                                                title={getLanguageName(code)}
                                                aria-label={`Select language ${code}`}
                                            >
                                                {getLanguageName(code)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {fallbackNotice && (
                                <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
                                    <div className="flex items-start gap-3">
                                        <p className="text-sm flex-1">
                                            {t('blog.languageNotAvailable')} {getLanguageName(fallbackNotice.from)}. {t('blog.showingInstead')} {getLanguageName(fallbackNotice.to)}.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setFallbackNotice(null)}
                                            className="text-yellow-200/70 hover:text-yellow-100 transition-colors"
                                            aria-label="Dismiss"
                                            title="Dismiss"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}

                            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                {title}
                            </h1>

                            <div className="flex flex-wrap gap-4 text-gray-400 mb-6">
                                <span className="flex items-center gap-2">
                                    <HiCalendar className="text-primary" />
                                    {formatDate(postMeta.date)}
                                </span>
                                {typeof postMeta.readTime === 'number' && (
                                    <span className="flex items-center gap-2">
                                        <HiClock className="text-primary" />
                                        {postMeta.readTime} {t('blog.minuteRead')}
                                    </span>
                                )}
                                {(derived.cat) && (
                                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                                        {getCategoryLabel(derived.cat)}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {(postMeta.tags ?? []).map((tag, index) => (
                                    <span
                                        key={`${postMeta.id}-tag-${index}`}
                                        className="px-3 py-1 bg-dark-lighter text-gray-300 rounded-full text-sm flex items-center gap-1 border border-primary/20"
                                    >
                                        <HiTag className="text-primary text-xs" />
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {excerpt && (
                                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                                    {excerpt}
                                </p>
                            )}

                            <div className="border-t border-primary/20 pt-6">
                                {derived.author && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                                            <HiUser className="text-primary" />
                                            <span className="text-sm font-semibold">{t('blog.mainAuthor')}</span>
                                        </div>

                                        {derived.author.url ? (
                                            <a
                                                href={derived.author.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 group hover:bg-dark-lighter/30 p-3 rounded-lg transition-all"
                                            >
                                                <PersonAvatar name={derived.author.name} avatar={derived.author.avatar} sizeClassName="w-16 h-16" />
                                                <div>
                                                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                        {derived.author.name}
                                                    </h4>
                                                    {derived.author.role && (
                                                        <p className="text-sm text-gray-400">
                                                            {getLocalized(derived.author.role, postMeta.defaultLanguage)}
                                                        </p>
                                                    )}
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-4 p-3 rounded-lg bg-dark-lighter/30">
                                                <PersonAvatar name={derived.author.name} avatar={derived.author.avatar} sizeClassName="w-16 h-16" />
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">{derived.author.name}</h4>
                                                    {derived.author.role && (
                                                        <p className="text-sm text-gray-400">{getLocalized(derived.author.role, postMeta.defaultLanguage)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {derived.collaborators.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                                            <HiUserGroup className="text-primary" />
                                            <span className="text-sm font-semibold">{t('blog.collaborators')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {derived.collaborators.map((c, idx) => (
                                                <a
                                                    key={`collab-${idx}`}
                                                    href={c.url || '#'}
                                                    target={c.url ? '_blank' : undefined}
                                                    rel={c.url ? 'noopener noreferrer' : undefined}
                                                    className={`flex items-center gap-3 bg-dark-lighter/50 hover:bg-dark-lighter rounded-lg p-3 border border-primary/10 hover:border-primary/30 transition-all group ${c.url ? '' : 'pointer-events-none opacity-80'}`}
                                                >
                                                    <PersonAvatar name={c.name} avatar={c.avatar} sizeClassName="w-12 h-12" />
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                                            {c.name}
                                                        </h5>
                                                        {c.role && (
                                                            <p className="text-xs text-gray-400">
                                                                {getLocalized(c.role, postMeta.defaultLanguage)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {derived.translators.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                                            <HiGlobeAlt className="text-primary" />
                                            <span className="text-sm font-semibold">{t('blog.translators')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {derived.translators.map((tr, idx) => (
                                                <a
                                                    key={`translator-${idx}`}
                                                    href={tr.url || '#'}
                                                    target={tr.url ? '_blank' : undefined}
                                                    rel={tr.url ? 'noopener noreferrer' : undefined}
                                                    className={`flex items-center gap-3 bg-dark-lighter/50 hover:bg-dark-lighter rounded-lg p-3 border border-primary/10 hover:border-primary/30 transition-all group ${tr.url ? '' : 'pointer-events-none opacity-80'}`}
                                                >
                                                    <PersonAvatar name={tr.name} avatar={tr.avatar} sizeClassName="w-12 h-12" />
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                                            {tr.name}
                                                        </h5>
                                                        {tr.role && (
                                                            <p className="text-xs text-gray-400">
                                                                {getLocalized(tr.role, postMeta.defaultLanguage)}
                                                            </p>
                                                        )}
                                                        {(() => {
                                                            const codes = (tr.languages && tr.languages.length > 0)
                                                                ? tr.languages
                                                                : (tr.language ? [tr.language] : []);
                                                            if (codes.length === 0) return null;
                                                            const names = codes.map(getLanguageName).join(', ');
                                                            return (
                                                                <p className="text-xs text-primary/90 mt-1">
                                                                    {t('blog.translatorOf')} {names}
                                                                </p>
                                                            );
                                                        })()}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-primary/20 flex flex-wrap justify-end gap-3">
                                    <CiteButton
                                        path={toShare}
                                        title={title}
                                        date={postMeta.date}
                                        author={derived.author?.name}
                                        slug={postMeta.slug}
                                    />
                                    <ShareButton path={toShare} title={title} />
                                </div>
                            </div>
                        </article>

                        <div
                            className={
                                'grid grid-cols-1 gap-8 ' +
                                (toc.length > 0 ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : '')
                            }
                        >
                            {toc.length > 0 && (
                                <aside className="hidden lg:block">
                                    <div className="sticky top-28 rounded-2xl border border-primary/15 bg-dark-lighter/60 backdrop-blur-lg p-4">
                                        <p className="text-base font-bold text-white/90 mb-3">{t('blog.tocTitle')}</p>
                                        <nav aria-label="Table of contents">
                                            <ul className="space-y-1">
                                                <li className="px-2 py-1">
                                                    <button
                                                        type="button"
                                                        className="group w-full text-left text-sm rounded-lg px-2 py-1 text-gray-300 hover:bg-primary/10 hover:text-primary transition-colors select-none"
                                                        aria-label="Go to top"
                                                        onClick={() => {
                                                            navigate(location.pathname + location.search, { replace: false });
                                                            setActiveHeadingId('');
                                                            requestAnimationFrame(() => {
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            });
                                                        }}
                                                    >
                                                        <span className="whitespace-pre font-mono text-primary/90">{title}/</span>
                                                    </button>
                                                </li>
                                                {tocView.map((it) => (
                                                    <li key={it.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Use hash navigation so the URL can be shared/copied.
                                                                const hash = `#${encodeURIComponent(it.id)}`;
                                                                navigate(location.pathname + location.search + hash, { replace: false });
                                                                setActiveHeadingId(it.id);
                                                            }}
                                                            className={
                                                                'group w-full text-left text-sm rounded-lg px-2 py-1 transition-colors ' +
                                                                (activeHeadingId === it.id
                                                                    ? 'bg-primary/15 text-primary'
                                                                    : 'text-gray-300 hover:bg-primary/10 hover:text-primary')
                                                            }
                                                        >
                                                            <span
                                                                className={
                                                                    'whitespace-pre font-mono ' +
                                                                    (activeHeadingId === it.id ? 'text-primary/90' : 'text-white/35 group-hover:text-primary/80')
                                                                }
                                                                aria-hidden="true"
                                                            >
                                                                {it.prefix}
                                                            </span>
                                                            <span className="font-sans">{it.text}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </nav>
                                    </div>
                                </aside>
                            )}

                            <article className="card prose prose-invert prose-lg max-w-none text-left">
                                <BlogMarkdown markdown={content} resolveHeadingId={resolveHeadingId} />
                            </article>
                        </div>

                        <div className="text-center mt-12">
                            <Link to={withLang(uiLang, '/blog')} className="btn-primary inline-flex items-center gap-2">
                                <HiArrowLeft /> {t('blog.backToBlog')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
