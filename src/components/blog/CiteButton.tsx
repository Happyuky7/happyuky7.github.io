import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiCheck, HiClipboardCopy, HiDocumentText, HiX } from 'react-icons/hi';

import { useLanguage } from '@i18n/LanguageContext';

type CiteButtonProps = {
    path: string;
    title: string;
    date: string;
    author?: string;
    slug?: string;
};

function normalizePath(path: string) {
    const trimmed = (path || '').trim();
    if (!trimmed) return '/';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function splitName(name: string) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: '', middle: '', last: '' };
    if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
    const last = parts[parts.length - 1];
    const first = parts[0];
    const middle = parts.slice(1, -1).join(' ');
    return { first, middle, last };
}

function initials(text: string) {
    return (text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => `${p[0]?.toUpperCase()}.`)
        .join(' ');
}

function formatMonthDayYear(date: Date, locale: string) {
    try {
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return date.toISOString().slice(0, 10);
    }
}

function formatDayMonthYear(date: Date, locale: string) {
    try {
        // Many citation styles expect day month year.
        const day = date.toLocaleDateString(locale, { day: '2-digit' });
        const month = date.toLocaleDateString(locale, { month: 'long' });
        const year = date.toLocaleDateString(locale, { year: 'numeric' });
        return `${day} ${month} ${year}`;
    } catch {
        return date.toISOString().slice(0, 10);
    }
}

export default function CiteButton({ path, title, date, author, slug }: CiteButtonProps) {
    const { t, language } = useLanguage();
    const [open, setOpen] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!open) return;

        const body = document.body;
        const scrollY = window.scrollY;

        const prevOverflow = body.style.overflow;
        const prevPosition = body.style.position;
        const prevTop = body.style.top;
        const prevWidth = body.style.width;

        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.width = '100%';

        return () => {
            body.style.overflow = prevOverflow;
            body.style.position = prevPosition;
            body.style.top = prevTop;
            body.style.width = prevWidth;
            window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        };
    }, [open]);

    const citeUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const baseUrl = window.location.origin;
        const normalized = normalizePath(path);
        return normalized.startsWith('http') ? normalized : `${baseUrl}${normalized}`;
    }, [path]);

    const siteName = useMemo(() => {
        if (typeof window === 'undefined') return 'Website';
        return window.location.hostname;
    }, []);

    const dateObj = useMemo(() => {
        const d = new Date(date);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [date]);

    const authorName = (author || '').trim() || 'Happyuky7';
    const authorParts = useMemo(() => splitName(authorName), [authorName]);

    const citationLocale = language === 'es' ? 'en-US' : 'en-US';

    const apa7 = useMemo(() => {
        const y = dateObj ? String(dateObj.getFullYear()) : 'n.d.';
        const md = dateObj ? formatMonthDayYear(dateObj, citationLocale) : date;
        const last = authorParts.last || authorParts.first || authorName;
        const firstInitials = initials([authorParts.first, authorParts.middle].filter(Boolean).join(' '));
        const authorApa = authorParts.last ? `${last}, ${firstInitials}`.trim() : last;
        // APA 7: Author. (Year, Month Day). Title. Site. URL
        return `${authorApa} (${y}, ${md}). ${title}. ${siteName}. ${citeUrl}`.replace(/\s+/g, ' ').trim();
    }, [authorName, authorParts.first, authorParts.last, authorParts.middle, citationLocale, citeUrl, date, dateObj, siteName, title]);

    const mla = useMemo(() => {
        const dmy = dateObj ? formatDayMonthYear(dateObj, citationLocale) : date;
        const last = authorParts.last || authorParts.first || authorName;
        const first = authorParts.last ? authorParts.first : '';
        const authorMla = authorParts.last ? `${last}, ${first}`.trim() : last;
        // MLA: Last, First. "Title." Site Name, Day Month Year, URL.
        return `${authorMla}. "${title}." ${siteName}, ${dmy}, ${citeUrl}.`;
    }, [authorName, authorParts.first, authorParts.last, citationLocale, citeUrl, date, dateObj, siteName, title]);

    const chicago = useMemo(() => {
        const mdy = dateObj ? formatMonthDayYear(dateObj, citationLocale) : date;
        const last = authorParts.last || authorParts.first || authorName;
        const first = authorParts.last ? authorParts.first : '';
        const authorChicago = authorParts.last ? `${last}, ${first}`.trim() : last;
        // Chicago: Last, First. "Title." Site Name. Month Day, Year. URL.
        return `${authorChicago}. "${title}." ${siteName}. ${mdy}. ${citeUrl}.`;
    }, [authorName, authorParts.first, authorParts.last, citationLocale, citeUrl, date, dateObj, siteName, title]);

    const bibtex = useMemo(() => {
        const now = new Date();
        const urldate = now.toISOString().slice(0, 10);
        const year = dateObj ? dateObj.getFullYear() : now.getFullYear();
        const month = dateObj ? String(dateObj.getMonth() + 1).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
        const day = dateObj ? String(dateObj.getDate()).padStart(2, '0') : String(now.getDate()).padStart(2, '0');
        const safeSlug = (slug || title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 32);
        const key = `${safeSlug || 'post'}-${year}`;
        const escapedTitle = title.replace(/[{}]/g, '');
        const escapedAuthor = authorName.replace(/[{}]/g, '');
        return [
            `@online{${key},`,
            `  title = {${escapedTitle}},`,
            `  author = {${escapedAuthor}},`,
            `  year = {${year}},`,
            `  month = {${month}},`,
            `  day = {${day}},`,
            `  url = {${citeUrl}},`,
            `  urldate = {${urldate}},`,
            `  note = {${siteName}}`,
            `}`,
        ].join('\n');
    }, [authorName, citeUrl, dateObj, siteName, slug, title]);

    const blocks = useMemo(
        () => [
            { id: 'apa7', label: t('blog.cite.apa7'), value: apa7 },
            { id: 'mla', label: t('blog.cite.mla'), value: mla },
            { id: 'chicago', label: t('blog.cite.chicago'), value: chicago },
            { id: 'bibtex', label: t('blog.cite.bibtex'), value: bibtex },
        ],
        [apa7, bibtex, chicago, mla, t],
    );

    const copyText = useCallback(async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            window.setTimeout(() => setCopiedKey(null), 1600);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedKey(key);
            window.setTimeout(() => setCopiedKey(null), 1600);
        }
    }, []);

    const close = useCallback(() => setOpen(false), []);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-lighter hover:bg-primary/20 text-gray-200 rounded-lg transition-all duration-300 border border-primary/20"
                aria-label={t('blog.cite.buttonAriaLabel')}
            >
                <HiDocumentText className="text-lg text-primary" />
                <span className="font-medium">{t('blog.cite.button')}</span>
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={close}
                        aria-hidden="true"
                    />
                    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 pb-10 sm:px-6 sm:pt-28 overflow-y-auto overscroll-contain">
                        <div
                            className="w-full max-w-2xl rounded-2xl border border-primary/20 bg-dark-lighter shadow-2xl max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)] overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label={t('blog.cite.modalTitle')}
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                                        <HiDocumentText className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-lg font-semibold text-white">{t('blog.cite.modalTitle')}</p>
                                        <p className="text-[11px] leading-tight text-gray-400">{t('blog.cite.modalSubtitle')}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    aria-label={t('blog.cite.close')}
                                    title={t('blog.cite.close')}
                                >
                                    <HiX className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-5 py-5 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem-5.5rem)] sm:max-h-[calc(100vh-10rem-5.5rem)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-primary/50">
                                {blocks.map((b) => (
                                    <div key={b.id} className="rounded-xl border border-primary/10 bg-dark/40 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
                                            <p className="text-sm font-semibold text-gray-200">{b.label}</p>
                                            <button
                                                type="button"
                                                onClick={() => copyText(b.id, b.value)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
                                                aria-label={t('blog.cite.copyAriaLabel')}
                                            >
                                                {copiedKey === b.id ? (
                                                    <>
                                                        <HiCheck className="h-4 w-4 text-green-500" />
                                                        <span className="text-xs font-semibold text-green-500">{t('blog.cite.copied')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <HiClipboardCopy className="h-4 w-4" />
                                                        <span className="text-xs font-semibold">{t('blog.cite.copy')}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="px-4 py-3">
                                            <pre className="whitespace-pre-wrap wrap-break-word text-sm text-gray-300 leading-relaxed">
                                                {b.value}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
