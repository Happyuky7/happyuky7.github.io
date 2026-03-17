import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

import VideoBackground from '@components/videoBackground/VideoBackground';
import BlogMarkdown from '@components/blog/BlogMarkdown';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type LocalizedText = Record<string, string | undefined>;

const SUPPORTED_LANGS = ['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];
function isSupportedLang(v: unknown): v is SupportedLang {
    return typeof v === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(v);
}

type PersonDraft = {
    name: string;
    url?: string;
    avatar?: string;
    language?: SupportedLang;
    role?: LocalizedText;
};

type Suggestions = {
    tags: string[];
    categories: string[];
    categoryIds: string[];
    images: string[];
    translators: PersonDraft[];
    collaborators: PersonDraft[];
};

type LogoAsset = { file: string; url: string };

type CodeLang =
    | ''
    | 'tsx'
    | 'ts'
    | 'js'
    | 'jsx'
    | 'json'
    | 'bash'
    | 'sh'
    | 'powershell'
    | 'python'
    | 'java'
    | 'c'
    | 'cpp'
    | 'go'
    | 'rust'
    | 'sql'
    | 'css'
    | 'html'
    | 'yaml'
    | 'toml'
    | 'dockerfile'
    | 'md'
    | 'txt';
type ImageLayout = 'inline' | 'right' | 'left' | 'center';
type ImageInsertType = 'simple' | 'caption' | 'dimensions';

const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'pl', label: 'Polski' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '简体中文' },
    { code: 'ko', label: '한국어' },
    { code: 'th', label: 'ไทย' },
    { code: 'fil', label: 'Filipino' },
] as const;

type Draft = {
    slug: string;
    date: string; // yyyy-mm-dd
    time: string; // HH:mm

    isDraft: boolean;
    isPrivate: boolean;
    isArchived: boolean;
    isUnlisted: boolean;
    supersededBy: string; // slug of newer post (optional)

    defaultLanguage: SupportedLang;
    languages: SupportedLang[];

    title: LocalizedText;
    excerpt: LocalizedText;
    description: LocalizedText;

    tags: string; // csv
    categoryId: string;
    categories: string; // csv
    image: string;
    readTime: string;

    authorName: string;
    authorUrl: string;
    authorAvatar: string;
    authorRole: LocalizedText;

    translators: PersonDraft[];
    collaborators: PersonDraft[];

    contentByLang: LocalizedText;
};

const BASE_STORAGE_KEY = 'dev.blogEditor.draft.v2';
const SHOW_LOCAL_EXAMPLES_KEY = 'dev.blogEditor.showLocalExamples';
const DEV_TAGS_BLOG_KEY = 'dev.tags.blog.v1';

const DEFAULT_AUTHOR = {
    name: 'Happyuky7',
    url: 'https://happyuky7.com',
    avatar: publicPath('/assets/img/logo.png'),
} as const;

function makeBaseDraft(uiLang: SupportedLang): Draft {
    return {
        slug: '',
        date: todayISODate(),
        time: nowTimeHHmm(),
        isDraft: true,
        isPrivate: false,
        isArchived: false,
        isUnlisted: false,
        supersededBy: '',
        defaultLanguage: uiLang,
        languages: [uiLang],
        title: {},
        excerpt: {},
        description: {},
        tags: '',
        categoryId: '',
        categories: '',
        image: '',
        readTime: '',
        authorName: DEFAULT_AUTHOR.name,
        authorUrl: DEFAULT_AUTHOR.url,
        authorAvatar: DEFAULT_AUTHOR.avatar,
        authorRole: {},
        translators: [],
        collaborators: [],
        contentByLang: {
            [uiLang]: '# Título\n\nEscribe tu post aquí.\n',
        },
    };
}

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function todayISODate() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nowTimeHHmm() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function composeDateTime(datePart: string, timePart: string) {
    const d = (datePart || '').trim();
    const t = (timePart || '').trim();
    if (!d) return '';
    if (!t) return d;
    return `${d}T${t}:00`;
}

function normalizeSlug(input: string) {
    return (input || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['"`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
}

function safeJsonParse<T>(text: string | null): T | null {
    if (!text) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function toCsvArray(csv: string) {
    return (csv || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function appendCsvToken(csv: string, token: string) {
    const t = (token || '').trim();
    if (!t) return csv;
    const parts = toCsvArray(csv);
    if (parts.some((x) => x.toLowerCase() === t.toLowerCase())) return parts.join(', ');
    return [...parts, t].join(', ');
}

function uniqSorted(values: string[]) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function omitEmptyLocalized(obj: LocalizedText) {
    const entries = Object.entries(obj).filter(([, v]) => (v || '').trim());
    if (entries.length === 0) return undefined;
    return Object.fromEntries(entries) as LocalizedText;
}

function cleanPersonDraft(p: PersonDraft): PersonDraft | null {
    const name = (p?.name || '').trim();
    if (!name) return null;

    const url = (p?.url || '').trim();
    const avatar = (p?.avatar || '').trim();
    const language = (p?.language || undefined) as PersonDraft['language'];
    const role = p?.role && typeof p.role === 'object' ? omitEmptyLocalized(p.role) : undefined;

    const out: PersonDraft = { name };
    if (url) out.url = url;
    if (avatar) out.avatar = avatar;
    if (isSupportedLang(language)) out.language = language;
    if (role) out.role = role;
    return out;
}

function normalizePeople(people: PersonDraft[]) {
    const cleaned = (Array.isArray(people) ? people : []).map(cleanPersonDraft).filter(Boolean) as PersonDraft[];
    const seen = new Set<string>();
    const uniq: PersonDraft[] = [];
    for (const p of cleaned) {
        const key = `${p.name}::${p.url || ''}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(p);
    }
    return uniq;
}

export default function BlogEditor() {
    const { language } = useLanguage();
    const uiLang = (isSupportedLang(language) ? language : 'en') as SupportedLang;

    const navigate = useNavigate();
    const { slug: routeSlugRaw } = useParams();
    const [searchParams] = useSearchParams();
    const draftId = (searchParams.get('draftId') || '').trim();
    const routeSlug = (routeSlugRaw || '').trim();

    const storageKey = useMemo(() => {
        if (routeSlug) return `${BASE_STORAGE_KEY}::slug::${normalizeSlug(routeSlug)}`;
        if (draftId) return `${BASE_STORAGE_KEY}::draft::${draftId}`;
        return BASE_STORAGE_KEY;
    }, [routeSlug, draftId]);

    const mdTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const loadedRouteSlugRef = useRef<string>('');

    const [suggestions, setSuggestions] = useState<Suggestions>({
        tags: [],
        categories: [],
        categoryIds: [],
        images: [],
        translators: [],
        collaborators: [],
    });

    const [blogTagPool, setBlogTagPool] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(DEV_TAGS_BLOG_KEY);
            if (!raw) return [];
            const parsed = safeJsonParse<unknown>(raw);
            if (!Array.isArray(parsed)) return [];
            return uniqSorted(parsed.map(String).map((s) => s.trim()).filter(Boolean));
        } catch {
            return [];
        }
    });

    const [newBlogTag, setNewBlogTag] = useState<string>('');

    useEffect(() => {
        try {
            localStorage.setItem(DEV_TAGS_BLOG_KEY, JSON.stringify(uniqSorted(blogTagPool.map(String).map((s) => s.trim()).filter(Boolean))));
        } catch {
            // ignore
        }
    }, [blogTagPool]);

    const [postsIndex, setPostsIndex] = useState<any[]>([]);
    const [selectedPostSlug, setSelectedPostSlug] = useState<string>(() => routeSlug || '');

    const [showLocalExamples, setShowLocalExamples] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SHOW_LOCAL_EXAMPLES_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(SHOW_LOCAL_EXAMPLES_KEY, showLocalExamples ? '1' : '0');
        } catch {
            // ignore
        }
    }, [showLocalExamples]);

    const initialDraft: Draft = useMemo(() => {
        const loaded = safeJsonParse<Partial<Draft>>(localStorage.getItem(storageKey));

        const loadedDateRaw = String((loaded as any)?.date || '').trim();
        const loadedTimeRaw = String((loaded as any)?.time || '').trim();
        const hasT = loadedDateRaw.includes('T');
        const datePart = hasT ? loadedDateRaw.split('T')[0] : loadedDateRaw;
        const timePart = hasT ? (loadedDateRaw.split('T')[1] || '').slice(0, 5) : loadedTimeRaw;

        const base: Draft = makeBaseDraft(uiLang);

        if (!loaded) return base;

        const languages = (Array.isArray(loaded.languages) && loaded.languages.length
            ? (loaded.languages.filter((l) => isSupportedLang(l)) as SupportedLang[])
            : base.languages);

        const defaultLanguage = isSupportedLang(loaded.defaultLanguage)
            ? loaded.defaultLanguage
            : base.defaultLanguage;

        return {
            ...base,
            ...loaded,
            date: datePart || base.date,
            time: timePart || base.time,
            languages,
            defaultLanguage,
            title: { ...base.title, ...(loaded.title || {}) },
            excerpt: { ...base.excerpt, ...(loaded.excerpt || {}) },
            description: { ...base.description, ...(loaded.description || {}) },
            authorRole: { ...base.authorRole, ...((loaded as any).authorRole || {}) },
            translators: normalizePeople((loaded as any)?.translators || []),
            collaborators: normalizePeople((loaded as any)?.collaborators || (loaded as any)?.colaborators || []),
            contentByLang: { ...base.contentByLang, ...(loaded.contentByLang || {}) },
        };
    }, [uiLang, storageKey]);

    const [draft, setDraft] = useState<Draft>(initialDraft);
    const [editLang, setEditLang] = useState<SupportedLang>(initialDraft.defaultLanguage);
    const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'saving' | 'ok' | 'error'; message?: string }>({ type: 'idle' });
    const [lastSaved, setLastSaved] = useState<{ slug: string; year: string; month: string } | null>(null);

    const [codeLang, setCodeLang] = useState<CodeLang>('tsx');
    const [imageLayout, setImageLayout] = useState<ImageLayout>('inline');
    const [imageType, setImageType] = useState<ImageInsertType>('caption');
    const [imageWidth, setImageWidth] = useState('420');
    const [imageHeight, setImageHeight] = useState('');
    const [tableSize, setTableSize] = useState<'2x2' | '3x3' | '4x4'>('2x2');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageAlt, setImageAlt] = useState('alt text');
    const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'uploading' | 'ok' | 'error'; message?: string; url?: string }>(
        { type: 'idle' },
    );

    const [logosOpen, setLogosOpen] = useState(false);
    const [logos, setLogos] = useState<LogoAsset[]>([]);
    const [logosBusy, setLogosBusy] = useState(false);
    const [logosError, setLogosError] = useState<string | null>(null);
    const [logoUploadBusy, setLogoUploadBusy] = useState(false);

    useEffect(() => {
        // When navigation changes (draftId/slug) or language changes, re-hydrate from the current storage key.
        setDraft(initialDraft);
        setEditLang(initialDraft.defaultLanguage);
        setLastSaved(null);
        setSaveStatus({ type: 'idle' });
        if (routeSlug) setSelectedPostSlug(routeSlug);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDraft, routeSlug]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(draft));
        } catch {
            // ignore
        }
    }, [draft, storageKey]);

    useEffect(() => {
        const selected = Array.from(new Set(draft.languages)).filter((l) => isSupportedLang(l)) as SupportedLang[];
        const safeSelected = selected.length ? selected : [draft.defaultLanguage];
        const safeDefault = safeSelected.includes(draft.defaultLanguage) ? draft.defaultLanguage : (safeSelected[0] || 'en');

        const currentContent = draft.contentByLang || {};
        const nextContent: LocalizedText = { ...currentContent };
        for (const l of safeSelected) {
            if (!String(nextContent[l] || '').trim()) {
                nextContent[l] = nextContent[safeDefault] || nextContent[uiLang] || '';
            }
        }

        const needsDraftUpdate =
            safeDefault !== draft.defaultLanguage ||
            JSON.stringify(safeSelected) !== JSON.stringify(draft.languages) ||
            JSON.stringify(nextContent) !== JSON.stringify(currentContent);

        if (needsDraftUpdate) {
            setDraft((d) => ({
                ...d,
                defaultLanguage: safeDefault,
                languages: safeSelected,
                contentByLang: nextContent,
            }));
        }

        if (!safeSelected.includes(editLang)) setEditLang(safeDefault);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.languages, draft.defaultLanguage]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(publicPath('/jsons/blogPosts.json'), { cache: 'no-store' });
                if (!res.ok) return;
                const data: unknown = await res.json();
                const posts = Array.isArray(data) ? (data as any[]) : [];

                const usablePosts = showLocalExamples ? posts : posts.filter((p) => !p?.localExample);

                const index = usablePosts
                    .filter((p) => p && typeof p.slug === 'string' && typeof p.date === 'string')
                    .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());

                const tagsFromPosts = usablePosts.flatMap((p) => (Array.isArray(p?.tags) ? p.tags : [])).map(String);
                const tags = uniqSorted([...tagsFromPosts, ...blogTagPool].map(String));
                const categories = uniqSorted(usablePosts.flatMap((p) => (Array.isArray(p?.categories) ? p.categories : [])).map(String));
                const categoryIds = uniqSorted(
                    usablePosts
                        .flatMap((p) => [p?.categoryId, ...(Array.isArray(p?.categories) ? p.categories : [])])
                        .filter(Boolean)
                        .map(String),
                );
                const images = uniqSorted(usablePosts.map((p) => p?.image).filter(Boolean).map(String));
                const translators = normalizePeople(usablePosts.flatMap((p) => (Array.isArray(p?.translators) ? p.translators : [])).map((x) => x as PersonDraft));
                const collaborators = normalizePeople(
                    usablePosts
                        .flatMap((p) => (Array.isArray(p?.collaborators) ? p.collaborators : Array.isArray(p?.colaborators) ? p.colaborators : []))
                        .map((x) => x as PersonDraft),
                );

                if (!mounted) return;
                setSuggestions({ tags, categories, categoryIds, images, translators, collaborators });
                setPostsIndex(index);
                // Don't auto-select the first post; it makes "Nuevo" look like it's editing an old post.
                setSelectedPostSlug((prev) => {
                    if (prev && index.some((p) => String(p?.slug || p?.id || '') === prev)) return prev;
                    return '';
                });
            } catch {
                // ignore
            }
        })();
        return () => {
            mounted = false;
        };
    }, [showLocalExamples, blogTagPool]);

    const resetDraft = () => {
        localStorage.removeItem(storageKey);
        setDraft(makeBaseDraft(uiLang));
        setEditLang(uiLang);
        setLastSaved(null);
        setSaveStatus({ type: 'idle' });
        setSelectedPostSlug('');
    };

    const loadExistingPost = async (slug: string) => {
        const item = (postsIndex || []).find((p) => String(p?.slug || p?.id) === slug);
        if (!item) return;

        const date = String(item?.date || '').trim();
        const dt = new Date(date);
        const year = String(item?.year || (Number.isNaN(dt.getTime()) ? '' : dt.getFullYear()));
        const monthRaw = String(item?.month || (Number.isNaN(dt.getTime()) ? '' : dt.getMonth() + 1));
        const month = monthRaw ? String(Number(monthRaw)).padStart(2, '0') : '';

        const datePart = date.includes('T') ? date.split('T')[0] : (date || todayISODate());
        const timePart = date.includes('T') ? (date.split('T')[1] || '').slice(0, 5) : nowTimeHHmm();

        const languages = Array.isArray(item?.languages)
            ? (item.languages.filter((l: any) => isSupportedLang(l)) as SupportedLang[])
            : [];
        const defaultLanguage: SupportedLang = isSupportedLang(item?.defaultLanguage)
            ? item.defaultLanguage
            : ((languages[0] || 'en') as SupportedLang);
        const safeLanguages: SupportedLang[] = (languages.length ? languages : [defaultLanguage]);

        const mdByLang: LocalizedText = {};
        for (const l of safeLanguages) {
            try {
                const url = `/blog-content/${year}/${month}/${slug}/${l}.md`;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) continue;
                mdByLang[l] = await res.text();
            } catch {
                // ignore
            }
        }

        setDraft((d) => ({
            ...d,
            slug: String(item?.slug || ''),
            date: datePart,
            time: timePart,
            isDraft: Boolean(item?.draft),
            isPrivate: Boolean(item?.private),
            isArchived: Boolean(item?.archived),
            isUnlisted: Boolean(item?.unlisted),
            supersededBy: String(item?.supersededBy || ''),
            defaultLanguage,
            languages: safeLanguages,
            title: { ...(item?.title || {}) },
            excerpt: { ...(item?.excerpt || {}) },
            description: { ...(item?.description || {}) },
            tags: Array.isArray(item?.tags) ? item.tags.join(', ') : (d.tags || ''),
            categoryId: String(item?.categoryId || ''),
            categories: Array.isArray(item?.categories) ? item.categories.join(', ') : (d.categories || ''),
            image: String(item?.image || ''),
            readTime: typeof item?.readTime === 'number' ? String(item.readTime) : String(item?.readTime || ''),
            authorName: String(item?.author?.name || DEFAULT_AUTHOR.name),
            authorUrl: String(item?.author?.url || DEFAULT_AUTHOR.url),
            authorAvatar: String(item?.author?.avatar || DEFAULT_AUTHOR.avatar),
            authorRole: { ...(item?.author?.role || {}) },
            translators: normalizePeople(Array.isArray(item?.translators) ? item.translators : []),
            collaborators: normalizePeople(Array.isArray(item?.collaborators) ? item.collaborators : Array.isArray(item?.colaborators) ? item.colaborators : []),
            contentByLang: { ...d.contentByLang, ...mdByLang },
        }));

        setEditLang(defaultLanguage);
        if (year && month) setLastSaved({ slug, year, month });
        setSaveStatus({ type: 'idle' });
    };

    useEffect(() => {
        if (!routeSlug) return;
        const normalized = normalizeSlug(routeSlug);
        if (!normalized) return;
        if (loadedRouteSlugRef.current === normalized) return;
        if ((postsIndex || []).length === 0) return;

        // If local storage already contains a real draft for this slug (slug/title), don't overwrite it.
        const raw = localStorage.getItem(storageKey);
        const stored = safeJsonParse<any>(raw);
        const storedSlug = typeof stored?.slug === 'string' ? normalizeSlug(stored.slug) : '';
        const hasSlug = storedSlug && storedSlug === normalized;
        const hasTitle =
            stored?.title &&
            typeof stored.title === 'object' &&
            Object.values(stored.title).some((v: any) => String(v || '').trim());

        loadedRouteSlugRef.current = normalized;
        setSelectedPostSlug(normalized);
        if (hasSlug || hasTitle) return;

        void loadExistingPost(normalized);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeSlug, postsIndex, storageKey]);

    const derived = useMemo(() => {
        const slug = normalizeSlug(draft.slug || draft.title?.[draft.defaultLanguage] || '');
        const dateTime = composeDateTime(draft.date, draft.time);
        const date = new Date(dateTime || draft.date);
        const year = Number.isNaN(date.getTime()) ? '' : String(date.getFullYear());
        const month = Number.isNaN(date.getTime()) ? '' : pad2(date.getMonth() + 1);

        const languages = Array.from(new Set(draft.languages)).filter((l) => isSupportedLang(l)) as SupportedLang[];
        const defaultLanguage: SupportedLang = (draft.defaultLanguage && languages.includes(draft.defaultLanguage))
            ? draft.defaultLanguage
            : ((languages[0] || 'en') as SupportedLang);

        const tags = toCsvArray(draft.tags);
        const categories = toCsvArray(draft.categories);
        const readTime = draft.readTime.trim() ? Number(draft.readTime) : undefined;

        const title = omitEmptyLocalized(draft.title);
        const excerpt = omitEmptyLocalized(draft.excerpt);
        const description = omitEmptyLocalized(draft.description);

        const meta: Record<string, unknown> = {
            id: slug || 'post',
            slug: slug || 'post',
            date: dateTime || draft.date || todayISODate(),
        };
        meta.draft = Boolean(draft.isDraft);
        // "Private" and "Archived" are separate from draft. Always send booleans so saving can turn them off.
        meta.private = Boolean(draft.isPrivate);
        meta.archived = Boolean(draft.isArchived);
        meta.unlisted = Boolean(draft.isUnlisted);
        // Allow clearing by sending null.
        meta.supersededBy = (draft.supersededBy || '').trim() || null;
        if (year) meta.year = year;
        if (month) meta.month = month;
        if (typeof readTime === 'number' && Number.isFinite(readTime)) meta.readTime = readTime;
        if ((draft.image || '').trim()) meta.image = draft.image.trim();

        meta.languages = languages.length ? languages : [defaultLanguage];
        meta.defaultLanguage = defaultLanguage;

        if (title) meta.title = title;
        if (excerpt) meta.excerpt = excerpt;
        if (description) meta.description = description;
        if (tags.length) meta.tags = tags;
        if ((draft.categoryId || '').trim()) meta.categoryId = draft.categoryId.trim();
        if (categories.length) meta.categories = categories;

        const authorName = (draft.authorName || DEFAULT_AUTHOR.name).trim() || DEFAULT_AUTHOR.name;
        const authorRole = omitEmptyLocalized(draft.authorRole);
        meta.author = {
            name: authorName,
            url: (draft.authorUrl || DEFAULT_AUTHOR.url).trim() || DEFAULT_AUTHOR.url,
            avatar: (draft.authorAvatar || DEFAULT_AUTHOR.avatar).trim() || DEFAULT_AUTHOR.avatar,
            ...(authorRole ? { role: authorRole } : null),
        };

        const translators = normalizePeople(draft.translators);
        if (translators.length) meta.translators = translators;

        const collaborators = normalizePeople(draft.collaborators);
        if (collaborators.length) {
            meta.collaborators = collaborators;
            meta.colaborators = collaborators;
        }

        const markdownByLang: Record<string, string> = {};
        for (const lang of (meta.languages as string[])) {
            const md = (draft.contentByLang?.[lang] || draft.contentByLang?.[defaultLanguage] || '').toString();
            markdownByLang[lang] = md.trimEnd() + '\n';
        }

        return {
            slug,
            year,
            month,
            dateTime,
            meta,
            metaJson: JSON.stringify(meta, null, 2),
            markdownByLang,
            languages: meta.languages as string[],
            defaultLanguage,
        };
    }, [draft]);

    const suggestedPaths = useMemo(() => {
        const parts: Array<{ lang: string; path: string }> = [];
        for (const lang of derived.languages) {
            if (derived.year && derived.month) {
                parts.push({ lang, path: `blog-content/${derived.year}/${derived.month}/${derived.slug}/${lang}.md` });
            }
        }
        return parts;
    }, [derived.languages, derived.year, derived.month, derived.slug]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // ignore
        }
    };

    const smallBtn =
        'px-3 py-1.5 rounded-full border border-primary/20 bg-dark-lighter/70 text-white/80 text-xs ' +
        'hover:bg-primary/10 hover:border-primary/40 transition-colors ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';
    const smallField =
        'px-3 py-1.5 rounded-full bg-dark-lighter/80 text-white border border-primary/20 text-xs ' +
        'focus:outline-none focus:border-primary/40';

    const applyMdInsert = (before: string, after = '') => {
        const el = mdTextareaRef.current;
        if (!el) return;
        const value = el.value;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const selected = value.slice(start, end);
        const next = value.slice(0, start) + before + selected + after + value.slice(end);

        setDraft((d) => ({
            ...d,
            contentByLang: {
                ...(d.contentByLang || {}),
                [editLang]: next,
            },
        }));

        requestAnimationFrame(() => {
            el.focus();
            const cursor = start + before.length + selected.length;
            el.setSelectionRange(cursor, cursor);
        });
    };

    const insertLinePrefix = (prefix: string) => {
        const el = mdTextareaRef.current;
        if (!el) return;
        const value = el.value;
        const start = el.selectionStart ?? value.length;

        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);

        setDraft((d) => ({
            ...d,
            contentByLang: { ...(d.contentByLang || {}), [editLang]: next },
        }));

        requestAnimationFrame(() => {
            el.focus();
            const cursor = lineStart + prefix.length;
            el.setSelectionRange(cursor, cursor);
        });
    };

    const insertCodeBlock = () => {
        const lang = (codeLang || '').trim();
        const header = `\n\n\`\`\`${lang}\n`;
        const footer = `\n\`\`\`\n\n`;
        applyMdInsert(header, footer);
    };

    const insertTable = (cols: number, rows: number) => {
        const safeCols = Math.max(2, Math.min(8, Math.floor(cols)));
        const safeRows = Math.max(1, Math.min(20, Math.floor(rows)));

        const header = `| ${Array.from({ length: safeCols }, (_, i) => `Col${i + 1}`).join(' | ')} |`;
        const sep = `| ${Array.from({ length: safeCols }, () => '----').join(' | ')} |`;
        const body = Array.from({ length: safeRows }, () => `| ${Array.from({ length: safeCols }, () => '...').join(' | ')} |`).join('\n');
        applyMdInsert(`\n\n${header}\n${sep}\n${body}\n\n`);
    };

    const insertAlignBlock = (align: 'left' | 'center' | 'right') => {
        const el = mdTextareaRef.current;
        if (!el) return;
        const value = el.value;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const selected = value.slice(start, end);
        const hasSelection = selected.trim().length > 0;

        const before = `\n\n<div style="text-align:${align}">\n\n`;
        const after = `\n\n</div>\n\n`;
        const inner = hasSelection ? selected : 'Texto aquí';
        const next = value.slice(0, start) + before + inner + after + value.slice(end);

        setDraft((d) => ({
            ...d,
            contentByLang: {
                ...(d.contentByLang || {}),
                [editLang]: next,
            },
        }));

        requestAnimationFrame(() => {
            el.focus();
            if (hasSelection) {
                const cursor = start + before.length + inner.length;
                el.setSelectionRange(cursor, cursor);
            } else {
                const selStart = start + before.length;
                const selEnd = selStart + inner.length;
                el.setSelectionRange(selStart, selEnd);
            }
        });
    };

    const insertImageWithUrl = (url: string) => {
        const width = Number(imageWidth);
        const safeWidth = Number.isFinite(width) && width > 50 ? Math.min(1200, Math.max(120, width)) : 420;

        const height = Number(imageHeight);
        const safeHeight =
            imageType === 'dimensions' && Number.isFinite(height) && height > 50
                ? Math.min(2000, Math.max(120, height))
                : null;

        const alt = (imageAlt || 'alt text').trim() || 'alt text';

        if (imageType === 'simple' && imageLayout === 'inline') {
            applyMdInsert(`![${alt}](${url})\n\n`);
            return;
        }
        if (imageType === 'caption' && imageLayout === 'inline') {
            applyMdInsert(`![${alt}](${url})\n\n*Caption*\n\n`);
            return;
        }

        const effectiveLayout: ImageLayout = imageLayout === 'inline' ? 'center' : imageLayout;
        const float = effectiveLayout === 'right' ? 'right' : effectiveLayout === 'left' ? 'left' : 'none';
        const margin = float === 'right' ? '0 0 1rem 1rem' : float === 'left' ? '0 1rem 1rem 0' : '0 auto 1rem auto';
        const figureStyle = float === 'none'
            ? `display:block;margin:${margin};max-width:100%;width:${safeWidth}px;`
            : `float:${float};margin:${margin};max-width:100%;width:${safeWidth}px;`;

        const imgStyle =
            'width:100%;display:block;' +
            (safeHeight ? `height:${safeHeight}px;object-fit:cover;` : 'height:auto;');

        // Wrap in <figure> and clear floats afterwards so the rest of the post doesn't stay in a narrow column.
        applyMdInsert(
            `\n\n<figure style="${figureStyle}">\n` +
            `  <img src="${url}" alt="${alt}" style="${imgStyle}" />\n` +
            (imageType === 'caption' ? `  <figcaption>Caption</figcaption>\n` : '') +
            `</figure>\n` +
            `<div style="clear:both"></div>\n\n`
        );
    };

    const insertImage = () => {
        insertImageWithUrl('https://example.com/image.png');
    };

    const uploadImageToPostFolder = async () => {
        if (!imageFile) {
            setUploadStatus({ type: 'error', message: 'Selecciona una imagen primero.' });
            return;
        }

        if (!derived.slug || !derived.year || !derived.month) {
            setUploadStatus({
                type: 'error',
                message: 'No se puede subir imagen: falta un slug válido y/o una fecha válida (año/mes).',
            });
            return;
        }

        try {
            setUploadStatus({ type: 'uploading', message: 'Subiendo…' });

            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                reader.onload = () => resolve(String(reader.result || ''));
                reader.readAsDataURL(imageFile);
            });

            const res = await fetch('/__dev/blog-editor/upload-image', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ meta: derived.meta, fileName: imageFile.name, dataUrl }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.ok || !json?.url) {
                setUploadStatus({ type: 'error', message: json?.error || `Error HTTP ${res.status}` });
                return;
            }

            const url = String(json.url);
            setUploadStatus({ type: 'ok', message: 'Subida OK', url });
            await copyToClipboard(url);
            insertImageWithUrl(url);
        } catch (e: any) {
            setUploadStatus({ type: 'error', message: e?.message || String(e) });
        }
    };

    const loadLogos = async () => {
        try {
            setLogosBusy(true);
            setLogosError(null);
            const res = await fetch('/__dev/blog-editor/list-asset-images', { cache: 'no-store' });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
            const list = Array.isArray(data?.images) ? (data.images as LogoAsset[]) : [];
            setLogos(list.filter((i) => i && typeof i === 'object' && typeof (i as any).url === 'string' && typeof (i as any).file === 'string'));
        } catch (e: any) {
            setLogosError(e?.message || String(e));
            setLogos([]);
        } finally {
            setLogosBusy(false);
        }
    };

    const uploadLogoToGlobalPool = async (file: File | null) => {
        if (!file) return;
        try {
            setLogoUploadBusy(true);
            setLogosError(null);

            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                reader.onload = () => resolve(String(reader.result || ''));
                reader.readAsDataURL(file);
            });

            const res = await fetch('/__dev/blog-editor/upload-logo', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, dataUrl }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

            await loadLogos();
        } catch (e: any) {
            setLogosError(e?.message || String(e));
        } finally {
            setLogoUploadBusy(false);
        }
    };

    const saveToRepo = async () => {
        if (!derived.slug || !derived.year || !derived.month) {
            setSaveStatus({
                type: 'error',
                message: 'No se puede guardar: falta un slug válido y/o una fecha válida (año/mes). Revisa Título/Slug y Fecha.',
            });
            return;
        }
        try {
            setSaveStatus({ type: 'saving', message: 'Guardando…' });
            const res = await fetch('/__dev/blog-editor/save', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ meta: derived.meta, markdownByLang: derived.markdownByLang }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
                setSaveStatus({ type: 'error', message: data?.error || `Error HTTP ${res.status}` });
                return;
            }
            setSaveStatus({ type: 'ok', message: `Guardado: ${data.slug}` });
            setLastSaved({ slug: derived.slug, year: derived.year, month: derived.month });

            // Lock the slug after the first successful save so changing the title doesn't create a new post.
            setDraft((d) => ({
                ...d,
                slug: (d.slug || derived.slug || '').trim(),
            }));

            // Keep the hub selection in sync when the saved post already exists in the current index.
            // (For brand-new posts, we don't auto-select to avoid a blank <select> until the index is reloaded.)
            if ((postsIndex || []).some((p) => String(p?.slug || p?.id || '') === derived.slug)) {
                setSelectedPostSlug(derived.slug);
            }

            // If this started as an unsaved draft (draftId flow), migrate storage and move to /editor/:slug.
            if (draftId && !routeSlug) {
                const fromKey = storageKey;
                const toKey = `${BASE_STORAGE_KEY}::slug::${normalizeSlug(derived.slug)}`;
                try {
                    const raw = localStorage.getItem(fromKey);
                    if (raw) localStorage.setItem(toKey, raw);
                    localStorage.removeItem(fromKey);
                } catch {
                    // ignore
                }
                navigate(withLang(uiLang, `/blogeditor/editor/${derived.slug}`), { replace: true });
            }
        } catch (e: any) {
            setSaveStatus({ type: 'error', message: e?.message || String(e) });
        }
    };

    return (
        <>
            <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
            <div className="relative z-10">
                <div className="min-h-screen pt-24 pb-16">
                    <div className="container mx-auto px-4 max-w-7xl">
                        {/* HEADER */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Blog Post Editor (DEV)</h1>
                                    <p className="text-white/60 mt-1 text-sm">Ruta oculta. En producción no existe.</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Link to={withLang(uiLang, '/hubdev')} className="btn-primary">Volver al DEV hub</Link>
                                    <Link to={withLang(uiLang, '/hubdev/tags')} className="btn-primary">Tags Manager</Link>
                                    <Link to={withLang(uiLang, '/blogeditor')} className="btn-primary">Volver al hub</Link>
                                    <Link to={withLang(uiLang, '/blog')} className="btn-primary">Volver al blog</Link>
                                    <button type="button" className="btn-primary" onClick={() => void saveToRepo()} disabled={saveStatus.type === 'saving'}>
                                        Guardar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={resetDraft}
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>

                            {saveStatus.type !== 'idle' ? (
                                <div
                                    className={
                                        'mt-4 rounded-lg px-4 py-3 text-sm border ' +
                                        (saveStatus.type === 'ok'
                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                            : saveStatus.type === 'error'
                                              ? 'border-red-500/30 bg-red-500/10 text-red-200'
                                              : 'border-white/10 bg-white/5 text-white/70')
                                    }
                                >
                                    {saveStatus.message}
                                    {saveStatus.type === 'ok' ? (
                                        <div className="text-white/60 text-xs mt-1">
                                            Se escribieron archivos en <span className="font-mono">public/blog-content</span> y se actualizó{' '}
                                            <span className="font-mono">public/jsons/blogPosts.json</span>.
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {lastSaved ? (
                                <div className="mt-4 rounded-lg px-4 py-3 text-sm border border-white/10 bg-white/5 text-white/70">
                                    Preview completo disponible: <span className="font-mono">/{uiLang}/blog/{lastSaved.year}/{lastSaved.month}/{lastSaved.slug}</span>
                                </div>
                            ) : null}
                        </div>

                        {/* POSTS HUB */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <h2 className="text-xl font-bold text-white">Posts</h2>
                                <div className="flex gap-2 flex-wrap">
                                    <label className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/80 text-sm">
                                        <input
                                            type="checkbox"
                                            className="accent-primary"
                                            checked={showLocalExamples}
                                            onChange={(e) => setShowLocalExamples(e.target.checked)}
                                        />
                                        Mostrar ejemplos locales
                                    </label>
                                    <button type="button" className="btn-primary" onClick={resetDraft}>Nuevo</button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => void loadExistingPost(selectedPostSlug)}
                                        disabled={!selectedPostSlug}
                                    >
                                        Cargar
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-white/70 text-sm">Selecciona un post</span>
                                    <select
                                        aria-label="Select existing post"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={selectedPostSlug}
                                        onChange={(e) => setSelectedPostSlug(e.target.value)}
                                    >
                                        <option value="">— Selecciona un post —</option>
                                        {(postsIndex || []).map((p) => {
                                            const slug = String(p?.slug || p?.id || '');
                                            const date = String(p?.date || '');
                                            const d = new Date(date);
                                            const yyyyMmDd = Number.isNaN(d.getTime()) ? date : d.toISOString().slice(0, 10);
                                            const title = (p?.title && (p.title[uiLang] || p.title[p.defaultLanguage] || p.title.en || '')) || slug;
                                            const isDraft = Boolean(p?.draft);
                                            return (
                                                <option key={slug} value={slug}>
                                                    {yyyyMmDd} — {title}{isDraft ? ' [DRAFT]' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>

                                <div className="rounded border border-white/10 bg-white/5 p-3">
                                    <div className="text-white/70 text-sm font-semibold">Estado</div>
                                    <div className="text-white/50 text-xs mt-1">
                                        Draft y Privado no se muestran al público. Archivado se oculta del listado público.
                                    </div>
                                    <div className="mt-2">
                                        <select
                                            aria-label="Post status"
                                            className="w-full px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                            value={
                                                draft.isDraft
                                                    ? 'draft'
                                                    : draft.isPrivate
                                                      ? 'private'
                                                      : draft.isUnlisted
                                                        ? 'unlisted'
                                                      : draft.isArchived
                                                        ? 'archived'
                                                        : 'published'
                                            }
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setDraft((d) => ({
                                                    ...d,
                                                    isDraft: v === 'draft',
                                                    isPrivate: v === 'private',
                                                    isUnlisted: v === 'unlisted',
                                                    isArchived: v === 'archived',
                                                }));
                                            }}
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="private">Private (hidden)</option>
                                            <option value="unlisted">Unlisted (no listado, pero visible por URL)</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* METADATA (TOP BLOCK) */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <h2 className="text-xl font-bold text-white">Metadata</h2>
                                <div className="text-white/50 text-xs">
                                    Guardará: <span className="font-mono">{derived.dateTime || draft.date}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="block">
                                    <span className="text-white/70 text-sm">Fecha</span>
                                    <input
                                        aria-label="Fecha"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.date}
                                        onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-white/70 text-sm">Hora</span>
                                    <input
                                        aria-label="Hora"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.time}
                                        onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                                    />
                                    <p className="text-white/40 text-xs mt-1">Para ordenar posts del mismo día.</p>
                                </label>
                                <label className="block">
                                    <span className="text-white/70 text-sm">Slug</span>
                                    <input
                                        aria-label="Slug"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.slug}
                                        onChange={(e) => setDraft((d) => ({ ...d, slug: normalizeSlug(e.target.value) }))}
                                        placeholder="mi-post"
                                    />
                                    <p className="text-white/40 text-xs mt-1">Normalizado: {derived.slug || '(vacío)'}</p>
                                </label>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="block">
                                    <span className="text-white/70 text-sm">Default language</span>
                                    <select
                                        aria-label="Default language"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.defaultLanguage}
                                        onChange={(e) =>
                                            setDraft((d) => {
                                                const nextDefault = e.target.value as any;
                                                const nextLangs = Array.from(new Set([...(d.languages || []), nextDefault]));
                                                return {
                                                    ...d,
                                                    defaultLanguage: nextDefault,
                                                    languages: nextLangs.length ? (nextLangs as any) : [nextDefault],
                                                };
                                            })
                                        }
                                    >
                                        {LANGS.map((l) => (
                                            <option key={l.code} value={l.code}>
                                                {l.code} — {l.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="block">
                                    <span className="text-white/70 text-sm">Languages</span>
                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
                                        {LANGS.map((l) => (
                                            <label key={l.code} className="inline-flex items-center gap-2 text-white/80" title={l.label}>
                                                <input
                                                    aria-label={`Language ${l.code}`}
                                                    type="checkbox"
                                                    checked={draft.languages.includes(l.code as any)}
                                                    disabled={l.code === draft.defaultLanguage}
                                                    onChange={(e) => {
                                                        setDraft((d) => {
                                                            const code = l.code as any;
                                                            const next = e.target.checked
                                                                ? Array.from(new Set([...d.languages, code]))
                                                                : d.languages.filter((x) => x !== code);
                                                            return { ...d, languages: next.length ? next : [d.defaultLanguage] };
                                                        });
                                                    }}
                                                />
                                                {l.code}
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">
                                        Si un texto no existe en un idioma, se usará el default.
                                    </p>
                                </div>

                                <label className="block">
                                    <span className="text-white/70 text-sm">Read time (min)</span>
                                    <input
                                        aria-label="Read time"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.readTime}
                                        onChange={(e) => setDraft((d) => ({ ...d, readTime: e.target.value }))}
                                        placeholder="5"
                                    />
                                </label>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-white/70 text-sm">Más actualizado (slug)</span>
                                    <input
                                        aria-label="Superseded by slug"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.supersededBy}
                                        onChange={(e) => setDraft((d) => ({ ...d, supersededBy: normalizeSlug(e.target.value) }))}
                                        placeholder="mi-post-nuevo"
                                    />
                                    <p className="text-white/40 text-xs mt-1">Si existe, el post mostrará un aviso con link a la versión nueva.</p>
                                </label>
                                <div className="rounded border border-white/10 bg-white/5 p-3">
                                    <div className="text-white/70 text-sm font-semibold">Notas</div>
                                    <div className="text-white/50 text-xs mt-1">
                                        Usa <span className="font-mono">Private</span> para ocultar al público (por URL se verá un aviso).<br />
                                        Usa <span className="font-mono">Archived</span> para sacar del listado principal.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/70 text-sm">Tags (csv)</span>
                                        <details>
                                            <summary className="cursor-pointer select-none text-white/70 text-sm px-2 py-1 rounded border border-white/10 bg-white/5">+</summary>
                                            <div className="mt-2 rounded border border-white/10 bg-dark-lighter p-2 max-h-40 overflow-auto">
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.tags.map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70 text-xs hover:bg-white/10"
                                                            onClick={() => setDraft((d) => ({ ...d, tags: appendCsvToken(d.tags, t) }))}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                    <input
                                        aria-label="Tags"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.tags}
                                        onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                                        placeholder="react, vite, portfolio"
                                    />

                                    <div className="mt-2 rounded border border-white/10 bg-white/5 p-2">
                                        <div className="text-white/60 text-xs mb-2">Pool global (DEV) · crear/eliminar independiente de los posts</div>

                                        <div className="flex gap-2 flex-wrap items-center">
                                            <input
                                                aria-label="Nuevo tag global"
                                                className="flex-1 min-w-[180px] px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                value={newBlogTag}
                                                onChange={(e) => setNewBlogTag(e.target.value)}
                                                placeholder="Nuevo tag (ej: Devlog)"
                                            />
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                disabled={!String(newBlogTag).trim()}
                                                onClick={() => {
                                                    const name = String(newBlogTag || '').trim();
                                                    if (!name) return;
                                                    const next = uniqSorted([...blogTagPool, name]);
                                                    setBlogTagPool(next);
                                                    setNewBlogTag('');
                                                }}
                                            >
                                                Crear
                                            </button>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {blogTagPool.map((t) => (
                                                <div key={t} className="inline-flex items-center gap-1 rounded border border-white/10 bg-dark-lighter px-2 py-1">
                                                    <button
                                                        type="button"
                                                        className="text-white/70 text-xs hover:text-white"
                                                        onClick={() => setDraft((d) => ({ ...d, tags: appendCsvToken(d.tags, t) }))}
                                                        title="Asignar al post"
                                                    >
                                                        {t}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-white/50 text-xs hover:text-red-200 px-1"
                                                        onClick={() => setBlogTagPool(blogTagPool.filter((x) => x !== t))}
                                                        title="Eliminar del pool (no quita de posts)"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            {!blogTagPool.length ? <div className="text-white/40 text-xs">(vacío)</div> : null}
                                        </div>
                                    </div>
                                </label>

                                <label className="block">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/70 text-sm">Categories (csv)</span>
                                        <details>
                                            <summary className="cursor-pointer select-none text-white/70 text-sm px-2 py-1 rounded border border-white/10 bg-white/5">+</summary>
                                            <div className="mt-2 rounded border border-white/10 bg-dark-lighter p-2 max-h-40 overflow-auto">
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.categories.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70 text-xs hover:bg-white/10"
                                                            onClick={() => setDraft((d) => ({ ...d, categories: appendCsvToken(d.categories, c) }))}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                    <input
                                        aria-label="Categories"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.categories}
                                        onChange={(e) => setDraft((d) => ({ ...d, categories: e.target.value }))}
                                        placeholder="tutorial, development"
                                    />
                                </label>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/70 text-sm">CategoryId</span>
                                        <details>
                                            <summary className="cursor-pointer select-none text-white/70 text-sm px-2 py-1 rounded border border-white/10 bg-white/5">+</summary>
                                            <div className="mt-2 rounded border border-white/10 bg-dark-lighter p-2 max-h-40 overflow-auto">
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.categoryIds.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70 text-xs hover:bg-white/10"
                                                            onClick={() => setDraft((d) => ({ ...d, categoryId: c }))}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                    <input
                                        aria-label="CategoryId"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.categoryId}
                                        onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
                                        placeholder="devlog"
                                    />
                                </label>

                                <label className="block">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/70 text-sm">Image</span>
                                        <details>
                                            <summary className="cursor-pointer select-none text-white/70 text-sm px-2 py-1 rounded border border-white/10 bg-white/5">+</summary>
                                            <div className="mt-2 rounded border border-white/10 bg-dark-lighter p-2 max-h-40 overflow-auto">
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestions.images.map((img) => (
                                                        <button
                                                            key={img}
                                                            type="button"
                                                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70 text-xs hover:bg-white/10"
                                                            onClick={() => setDraft((d) => ({ ...d, image: img }))}
                                                        >
                                                            {img}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                    <input
                                        aria-label="Image"
                                        className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={draft.image}
                                        onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
                                        placeholder="/assets/img/..."
                                    />
                                </label>
                            </div>

                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <details className="rounded border border-white/10 bg-white/5 p-3" open>
                                    <summary className="cursor-pointer text-white/80 font-semibold">Textos por idioma</summary>
                                    <div className="mt-3 grid grid-cols-1 gap-3">
                                        {draft.languages.map((l) => {
                                            const titleFallback = draft.title?.[draft.defaultLanguage] || '';
                                            const excerptFallback = draft.excerpt?.[draft.defaultLanguage] || '';
                                            const descriptionFallback = draft.description?.[draft.defaultLanguage] || '';
                                            const missingTitle = !String(draft.title?.[l] || '').trim() && Boolean(titleFallback.trim()) && l !== draft.defaultLanguage;
                                            const missingExcerpt = !String(draft.excerpt?.[l] || '').trim() && Boolean(excerptFallback.trim()) && l !== draft.defaultLanguage;
                                            const missingDescription = !String(draft.description?.[l] || '').trim() && Boolean(descriptionFallback.trim()) && l !== draft.defaultLanguage;

                                            return (
                                                <div key={l} className="rounded border border-primary/15 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-white/70 text-sm font-mono">{l}</div>
                                                        {l !== draft.defaultLanguage ? (
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70 text-xs hover:bg-white/10"
                                                                onClick={() =>
                                                                    setDraft((d) => ({
                                                                        ...d,
                                                                        title: { ...d.title, [l]: d.title?.[l] || d.title?.[d.defaultLanguage] || '' },
                                                                        excerpt: { ...d.excerpt, [l]: d.excerpt?.[l] || d.excerpt?.[d.defaultLanguage] || '' },
                                                                        description: { ...d.description, [l]: d.description?.[l] || d.description?.[d.defaultLanguage] || '' },
                                                                    }))
                                                                }
                                                            >
                                                                Copiar default
                                                            </button>
                                                        ) : null}
                                                    </div>

                                                    <label className="block mt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/60 text-xs">Title</span>
                                                            {missingTitle ? <span className="text-white/40 text-xs">(fallback default)</span> : null}
                                                        </div>
                                                        <input
                                                            aria-label={`Title ${l}`}
                                                            className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                            value={draft.title?.[l] || ''}
                                                            placeholder={l === draft.defaultLanguage ? '' : titleFallback}
                                                            onChange={(e) => setDraft((d) => ({ ...d, title: { ...d.title, [l]: e.target.value } }))}
                                                        />
                                                    </label>

                                                    <label className="block mt-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/60 text-xs">Excerpt</span>
                                                            {missingExcerpt ? <span className="text-white/40 text-xs">(fallback default)</span> : null}
                                                        </div>
                                                        <textarea
                                                            aria-label={`Excerpt ${l}`}
                                                            className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20 min-h-16"
                                                            value={draft.excerpt?.[l] || ''}
                                                            placeholder={l === draft.defaultLanguage ? '' : excerptFallback}
                                                            onChange={(e) => setDraft((d) => ({ ...d, excerpt: { ...d.excerpt, [l]: e.target.value } }))}
                                                        />
                                                    </label>

                                                    <label className="block mt-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/60 text-xs">Description</span>
                                                            {missingDescription ? <span className="text-white/40 text-xs">(fallback default)</span> : null}
                                                        </div>
                                                        <textarea
                                                            aria-label={`Description ${l}`}
                                                            className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20 min-h-16"
                                                            value={draft.description?.[l] || ''}
                                                            placeholder={l === draft.defaultLanguage ? '' : descriptionFallback}
                                                            onChange={(e) => setDraft((d) => ({ ...d, description: { ...d.description, [l]: e.target.value } }))}
                                                        />
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </details>

                                <details className="rounded border border-white/10 bg-white/5 p-3" open>
                                    <summary className="cursor-pointer text-white/80 font-semibold">Autor + personas</summary>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="text-white/70 text-sm">Author name</span>
                                            <input
                                                aria-label="Author name"
                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                value={draft.authorName}
                                                onChange={(e) => setDraft((d) => ({ ...d, authorName: e.target.value }))}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-white/70 text-sm">Author URL</span>
                                            <input
                                                aria-label="Author url"
                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                value={draft.authorUrl}
                                                onChange={(e) => setDraft((d) => ({ ...d, authorUrl: e.target.value }))}
                                            />
                                        </label>
                                        <label className="block md:col-span-2">
                                            <span className="text-white/70 text-sm">Author avatar</span>
                                            <input
                                                aria-label="Author avatar"
                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                value={draft.authorAvatar}
                                                onChange={(e) => setDraft((d) => ({ ...d, authorAvatar: e.target.value }))}
                                            />
                                        </label>

                                        <div className="md:col-span-2 rounded border border-white/10 bg-white/5 p-3">
                                            <div className="text-white/70 text-sm font-semibold">Author role</div>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {LANGS.map((l) => (
                                                    <label key={l.code} className="block">
                                                        <span className="text-white/60 text-xs">Role ({l.code})</span>
                                                        <input
                                                            aria-label={`Author role ${l.code}`}
                                                            className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                            value={draft.authorRole?.[l.code] || ''}
                                                            onChange={(e) =>
                                                                setDraft((d) => ({
                                                                    ...d,
                                                                    authorRole: { ...(d.authorRole || {}), [l.code]: e.target.value },
                                                                }))
                                                            }
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">Por defecto: <span className="font-mono">{DEFAULT_AUTHOR.name}</span>.</p>

                                    {/* Translators */}
                                    <div className="mt-4 rounded border border-primary/15 p-3">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="text-white/80 font-semibold">Translators</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {suggestions.translators.length ? (
                                                    <select
                                                        aria-label="Add existing translator"
                                                        className="px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            const idx = Number(e.target.value);
                                                            if (!Number.isFinite(idx) || idx < 0) return;
                                                            const p = suggestions.translators[idx];
                                                            if (!p) return;
                                                            setDraft((d) => ({ ...d, translators: normalizePeople([...(d.translators || []), p]) }));
                                                            e.currentTarget.value = '';
                                                        }}
                                                    >
                                                        <option value="">+ Añadir existente…</option>
                                                        {suggestions.translators.map((p, i) => (
                                                            <option key={`${p.name}-${p.url || i}`} value={i}>
                                                                {p.name}{p.language ? ` (${p.language})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    onClick={() => setDraft((d) => ({ ...d, translators: [...(d.translators || []), { name: '', language: d.defaultLanguage }] }))}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3">
                                            {(draft.translators || []).length ? null : (
                                                <div className="text-white/50 text-sm">No hay translators.</div>
                                            )}
                                            {(draft.translators || []).map((p, idx) => (
                                                <div key={idx} className="rounded border border-white/10 bg-white/5 p-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Name</span>
                                                            <input
                                                                aria-label={`Translator name ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.name || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], name: e.target.value };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Language</span>
                                                            <select
                                                                aria-label={`Translator language ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.language || draft.defaultLanguage}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], language: e.target.value as SupportedLang };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            >
                                                                {(derived.languages as SupportedLang[]).map((l) => (
                                                                    <option key={l} value={l}>
                                                                        {l}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">URL</span>
                                                            <input
                                                                aria-label={`Translator url ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.url || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], url: e.target.value };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Avatar</span>
                                                            <input
                                                                aria-label={`Translator avatar ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.avatar || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], avatar: e.target.value };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>

                                                        <label className="block md:col-span-2">
                                                            <span className="text-white/60 text-xs">Role (en)</span>
                                                            <input
                                                                aria-label={`Translator role en ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.en || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), en: e.target.value } };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Role (es)</span>
                                                            <input
                                                                aria-label={`Translator role es ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.es || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), es: e.target.value } };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Role (ja)</span>
                                                            <input
                                                                aria-label={`Translator role ja ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.ja || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.translators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), ja: e.target.value } };
                                                                        return { ...d, translators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="mt-2 flex justify-end">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-200 text-sm"
                                                            onClick={() =>
                                                                setDraft((d) => ({
                                                                    ...d,
                                                                    translators: (d.translators || []).filter((_, i) => i !== idx),
                                                                }))
                                                            }
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Collaborators */}
                                    <div className="mt-3 rounded border border-primary/15 p-3">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="text-white/80 font-semibold">Collaborators</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {suggestions.collaborators.length ? (
                                                    <select
                                                        aria-label="Add existing collaborator"
                                                        className="px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            const idx = Number(e.target.value);
                                                            if (!Number.isFinite(idx) || idx < 0) return;
                                                            const p = suggestions.collaborators[idx];
                                                            if (!p) return;
                                                            setDraft((d) => ({ ...d, collaborators: normalizePeople([...(d.collaborators || []), p]) }));
                                                            e.currentTarget.value = '';
                                                        }}
                                                    >
                                                        <option value="">+ Añadir existente…</option>
                                                        {suggestions.collaborators.map((p, i) => (
                                                            <option key={`${p.name}-${p.url || i}`} value={i}>
                                                                {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    onClick={() => setDraft((d) => ({ ...d, collaborators: [...(d.collaborators || []), { name: '', role: {} }] }))}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3">
                                            {(draft.collaborators || []).length ? null : (
                                                <div className="text-white/50 text-sm">No hay collaborators.</div>
                                            )}
                                            {(draft.collaborators || []).map((p, idx) => (
                                                <div key={idx} className="rounded border border-white/10 bg-white/5 p-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Name</span>
                                                            <input
                                                                aria-label={`Collaborator name ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.name || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], name: e.target.value };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">URL</span>
                                                            <input
                                                                aria-label={`Collaborator url ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.url || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], url: e.target.value };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block md:col-span-2">
                                                            <span className="text-white/60 text-xs">Avatar</span>
                                                            <input
                                                                aria-label={`Collaborator avatar ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.avatar || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], avatar: e.target.value };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Role (en)</span>
                                                            <input
                                                                aria-label={`Collaborator role en ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.en || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), en: e.target.value } };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="text-white/60 text-xs">Role (es)</span>
                                                            <input
                                                                aria-label={`Collaborator role es ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.es || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), es: e.target.value } };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block md:col-span-2">
                                                            <span className="text-white/60 text-xs">Role (ja)</span>
                                                            <input
                                                                aria-label={`Collaborator role ja ${idx}`}
                                                                className="w-full mt-1 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                                                value={p.role?.ja || ''}
                                                                onChange={(e) =>
                                                                    setDraft((d) => {
                                                                        const next = [...(d.collaborators || [])];
                                                                        next[idx] = { ...next[idx], role: { ...(next[idx].role || {}), ja: e.target.value } };
                                                                        return { ...d, collaborators: next };
                                                                    })
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="mt-2 flex justify-end">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-200 text-sm"
                                                            onClick={() =>
                                                                setDraft((d) => ({
                                                                    ...d,
                                                                    collaborators: (d.collaborators || []).filter((_, i) => i !== idx),
                                                                }))
                                                            }
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* MARKDOWN + PREVIEW (SECOND BLOCK) */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="text-xl font-bold text-white">Markdown + Preview</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/60 text-sm">Idioma:</span>
                                    <select
                                        aria-label="Language to edit"
                                        className="px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20"
                                        value={editLang}
                                        onChange={(e) => setEditLang(e.target.value as SupportedLang)}
                                    >
                                        {(derived.languages as SupportedLang[]).map((l) => (
                                            <option key={l} value={l}>
                                                {l}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-primary/15 bg-dark-lighter/30 p-3 space-y-3">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Hn</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('# ')}>H1</button>
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('## ')}>H2</button>
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('### ')}>H3</button>
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('#### ')}>H4</button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Tipo de letra</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('**', '**')}>Bold</button>
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('*', '*')}>Italic</button>
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('~~', '~~')}>Strike</button>
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('`', '`')}>Inline code</button>
                                            <button type="button" className={smallBtn} onClick={() => insertAlignBlock('left')}>Left</button>
                                            <button type="button" className={smallBtn} onClick={() => insertAlignBlock('center')}>Center</button>
                                            <button type="button" className={smallBtn} onClick={() => insertAlignBlock('right')}>Right</button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Tipos de listas</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('- ')}>• List</button>
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('1. ')}>1. List</button>
                                            <button type="button" className={smallBtn} onClick={() => insertLinePrefix('> ')}>Quote</button>
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('\n\n---\n\n')}>HR</button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Tablas</div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <select
                                                aria-label="Table size"
                                                className={smallField}
                                                value={tableSize}
                                                onChange={(e) => setTableSize(e.target.value as any)}
                                            >
                                                <option value="2x2">2x2</option>
                                                <option value="3x3">3x3</option>
                                                <option value="4x4">4x4</option>
                                            </select>
                                            <button
                                                type="button"
                                                className={smallBtn}
                                                onClick={() => {
                                                    const [c, r] = tableSize.split('x').map((n) => Number(n));
                                                    insertTable(c, r);
                                                }}
                                            >
                                                Insert table
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Codeblock</div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <select
                                                aria-label="Code language"
                                                className={smallField}
                                                value={codeLang}
                                                onChange={(e) => setCodeLang(e.target.value as any)}
                                            >
                                                <option value="tsx">tsx</option>
                                                <option value="ts">ts</option>
                                                <option value="jsx">jsx</option>
                                                <option value="js">js</option>
                                                <option value="json">json</option>
                                                <option value="bash">bash</option>
                                                <option value="sh">sh</option>
                                                <option value="powershell">powershell</option>
                                                <option value="python">python</option>
                                                <option value="java">java</option>
                                                <option value="c">c</option>
                                                <option value="cpp">cpp</option>
                                                <option value="go">go</option>
                                                <option value="rust">rust</option>
                                                <option value="sql">sql</option>
                                                <option value="yaml">yaml</option>
                                                <option value="toml">toml</option>
                                                <option value="dockerfile">dockerfile</option>
                                                <option value="css">css</option>
                                                <option value="html">html</option>
                                                <option value="md">md</option>
                                                <option value="txt">txt</option>
                                                <option value="">(none)</option>
                                            </select>
                                            <button type="button" className={smallBtn} onClick={insertCodeBlock}>Insert</button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Links</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={smallBtn} onClick={() => applyMdInsert('[texto](https://)', '')}>Insert link</button>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/60 text-xs mb-2">Image</div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <select
                                                aria-label="Image layout"
                                                className={smallField}
                                                value={imageLayout}
                                                onChange={(e) => setImageLayout(e.target.value as any)}
                                            >
                                                <option value="inline">inline</option>
                                                <option value="right">right</option>
                                                <option value="left">left</option>
                                                <option value="center">center</option>
                                            </select>

                                            <select
                                                aria-label="Image insert type"
                                                className={smallField}
                                                value={imageType}
                                                onChange={(e) => setImageType(e.target.value as any)}
                                            >
                                                <option value="simple">simple</option>
                                                <option value="caption">caption</option>
                                                <option value="dimensions">dimensions</option>
                                            </select>

                                            <input
                                                aria-label="Image alt"
                                                className={smallField + ' min-w-40'}
                                                value={imageAlt}
                                                onChange={(e) => setImageAlt(e.target.value)}
                                                placeholder="alt"
                                            />

                                            <input
                                                aria-label="Image width"
                                                className={smallField + ' w-24'}
                                                value={imageWidth}
                                                onChange={(e) => setImageWidth(e.target.value)}
                                                placeholder="w"
                                            />

                                            <input
                                                aria-label="Image height"
                                                className={smallField + ' w-24'}
                                                value={imageHeight}
                                                onChange={(e) => setImageHeight(e.target.value)}
                                                placeholder="h"
                                                disabled={imageType !== 'dimensions'}
                                            />

                                            <button type="button" className={smallBtn} onClick={insertImage}>Insert sample</button>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                                            <input
                                                aria-label="Select image file"
                                                type="file"
                                                accept="image/*"
                                                className="text-white/70 text-xs"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] || null;
                                                    setImageFile(f);
                                                    setUploadStatus({ type: 'idle' });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={smallBtn}
                                                onClick={() => void uploadImageToPostFolder()}
                                                disabled={uploadStatus.type === 'uploading'}
                                            >
                                                {uploadStatus.type === 'uploading' ? 'Uploading…' : 'Upload to post folder'}
                                            </button>

                                            <button
                                                type="button"
                                                className={smallBtn}
                                                onClick={() => {
                                                    const next = !logosOpen;
                                                    setLogosOpen(next);
                                                    if (next && !logos.length) void loadLogos();
                                                }}
                                            >
                                                {logosOpen ? 'Hide images' : 'Show images'}
                                            </button>

                                            {uploadStatus.type !== 'idle' ? (
                                                <span
                                                    className={
                                                        'text-xs ' +
                                                        (uploadStatus.type === 'ok'
                                                            ? 'text-primary'
                                                            : uploadStatus.type === 'error'
                                                              ? 'text-red-200'
                                                              : 'text-white/60')
                                                    }
                                                >
                                                    {uploadStatus.message}
                                                    {uploadStatus.url ? ` (${uploadStatus.url})` : ''}
                                                </span>
                                            ) : null}
                                        </div>

                                        {logosOpen ? (
                                            <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="text-white/60 text-xs">Public images: <span className="font-mono">public/**</span></div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button type="button" className={smallBtn} onClick={() => void loadLogos()} disabled={logosBusy}>
                                                            {logosBusy ? 'Loading…' : 'Reload'}
                                                        </button>
                                                        <label className={smallBtn + ' cursor-pointer'}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const f = e.target.files?.[0] || null;
                                                                    void uploadLogoToGlobalPool(f);
                                                                    if (e.currentTarget) e.currentTarget.value = '';
                                                                }}
                                                                disabled={logoUploadBusy}
                                                            />
                                                            {logoUploadBusy ? 'Uploading…' : 'Upload image'}
                                                        </label>
                                                    </div>
                                                </div>

                                                {logosError ? <div className="mt-2 text-xs text-red-200">{logosError}</div> : null}

                                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                    {logos.map((img) => (
                                                        <button
                                                            key={img.file}
                                                            type="button"
                                                            className="rounded-lg border border-white/10 bg-black/20 hover:bg-white/5 transition p-2 text-left"
                                                            onClick={() => {
                                                                const url = String(img.url || '');
                                                                if (!url) return;
                                                                if (!imageAlt || imageAlt === 'alt text') {
                                                                    const base = String(img.file || '').split('/').pop()?.replace(/\.[^.]+$/, '') || '';
                                                                    setImageAlt(base || 'image');
                                                                }
                                                                void copyToClipboard(url);
                                                                insertImageWithUrl(url);
                                                            }}
                                                            title={img.file}
                                                        >
                                                            <img
                                                                src={publicPath(img.url)}
                                                                alt={img.file}
                                                                className="h-12 w-full object-contain bg-black/30 rounded"
                                                                loading="lazy"
                                                            />
                                                            <div className="mt-1 text-[10px] text-white/50 truncate">{img.file}</div>
                                                        </button>
                                                    ))}
                                                    {!logosBusy && !logos.length ? <div className="text-white/50 text-xs">No images found.</div> : null}
                                                </div>
                                                <div className="mt-2 text-white/40 text-xs">Click en una imagen: copia URL + inserta en el markdown.</div>
                                            </div>
                                        ) : null}

                                        <p className="text-white/40 text-xs mt-2">
                                            Sube a <span className="font-mono">public/blog-content/&lt;yyyy&gt;/&lt;mm&gt;/{derived.slug || 'slug'}/img/</span> y se inserta la URL automáticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                                <div className="rounded border border-primary/15 p-3">
                                    <textarea
                                        ref={mdTextareaRef}
                                        aria-label="Markdown content"
                                        className="w-full px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20 min-h-[560px]"
                                        value={draft.contentByLang?.[editLang] || ''}
                                        onChange={(e) =>
                                            setDraft((d) => ({
                                                ...d,
                                                contentByLang: {
                                                    ...(d.contentByLang || {}),
                                                    [editLang]: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="rounded border border-primary/15 p-3">
                                    <div className="text-white/80 font-bold text-lg">
                                        {(draft.title?.[editLang] || draft.title?.[derived.defaultLanguage] || derived.slug) as string}
                                    </div>
                                    <div className="text-white/50 text-sm mt-1">
                                        {(derived.dateTime || draft.date)} · {draft.readTime || '—'} min
                                    </div>
                                    <div className="text-white/50 text-sm mt-1">
                                        {toCsvArray(draft.tags).length ? toCsvArray(draft.tags).join(' · ') : 'Sin tags'}
                                    </div>
                                    <article className="prose prose-invert prose-lg max-w-none mt-5 text-left">
                                        <BlogMarkdown markdown={draft.contentByLang?.[editLang] || draft.contentByLang?.[derived.defaultLanguage] || ''} />
                                    </article>
                                </div>
                            </div>
                        </div>

                        {/* FULL ROUTE PREVIEW */}
                        {lastSaved ? (
                            <div className="card mb-4">
                                <h2 className="text-xl font-bold text-white mb-3">Preview completo (ruta real)</h2>
                                <div className="rounded border border-primary/15 overflow-hidden">
                                    <iframe
                                        title="Full blog post preview"
                                        className="w-full h-[720px] bg-black"
                                        src={
                                            withLang(uiLang, `/blog/${lastSaved.year}/${lastSaved.month}/${lastSaved.slug}`) +
                                            `?contentLang=${encodeURIComponent(editLang)}&__preview=${Date.now()}`
                                        }
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* OUTPUTS (THIRD BLOCK) */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-white mb-3">JSON + archivos (copiar)</h2>

                            <div className="rounded border border-primary/15 p-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="text-white/70 text-sm">Entrada para <span className="font-mono">jsons/blogPosts.json</span></div>
                                    <button type="button" className="btn-primary" onClick={() => void copyToClipboard(derived.metaJson)}>
                                        Copiar JSON
                                    </button>
                                </div>
                                <textarea
                                    aria-label="Blog post metadata JSON"
                                    className="w-full mt-2 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20 min-h-40 font-mono text-xs"
                                    value={derived.metaJson}
                                    readOnly
                                />
                            </div>

                            <div className="mt-4 rounded border border-primary/15 p-3">
                                <div className="text-white/70 text-sm">Markdown por idioma</div>

                                <div className="mt-3 grid grid-cols-1 gap-4">
                                    {suggestedPaths.map(({ lang, path }) => (
                                        <details key={lang} className="rounded border border-primary/10 p-3" open>
                                            <summary className="cursor-pointer select-none text-white/80">
                                                <span className="font-mono">{lang}</span> → <span className="font-mono">{path}</span>
                                            </summary>
                                            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                                                <div className="text-white/60 text-xs">Archivo destino</div>
                                                <div className="flex gap-2">
                                                    <button type="button" className="btn-primary" onClick={() => void copyToClipboard(path)}>
                                                        Copiar ruta
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-primary"
                                                        onClick={() => void copyToClipboard(derived.markdownByLang[lang] || '')}
                                                    >
                                                        Copiar MD
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea
                                                aria-label={`Markdown output (${lang})`}
                                                className="w-full mt-2 px-3 py-2 rounded bg-dark-lighter text-white border border-primary/20 min-h-[180px] font-mono text-xs"
                                                value={derived.markdownByLang[lang] || ''}
                                                readOnly
                                            />
                                        </details>
                                    ))}
                                </div>

                                <p className="text-white/40 text-xs mt-3">
                                    Nota: el render del sitio usa el contenido del .md (sin frontmatter). El JSON define title/excerpt/tags.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
