import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiCalendar, HiClock, HiPencilAlt, HiPlus, HiRefresh, HiExternalLink, HiTrash } from 'react-icons/hi';

import VideoBackground from '@components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type LocalizedText = Record<string, string | undefined>;

type BlogPostIndexEntry = {
    id: string;
    slug: string;
    date: string;
    draft?: boolean;
    private?: boolean;
    archived?: boolean;
    unlisted?: boolean;
    supersededBy?: string | null;
    localExample?: boolean;
    year?: string;
    month?: string;
    title?: LocalizedText;
    defaultLanguage?: string;
};

type DraftStorageItem = {
    storageKey: string;
    draftId: string;
    slug?: string;
    date?: string;
    title?: string;
    isDraft?: boolean;
};

const BASE_STORAGE_KEY = 'dev.blogEditor.draft.v2';
const DRAFT_PREFIX = `${BASE_STORAGE_KEY}::draft::`;
const SHOW_LOCAL_EXAMPLES_KEY = 'dev.blogEditor.showLocalExamples';

function safeJsonParse<T>(text: string | null): T | null {
    if (!text) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function pickLocalized(obj: LocalizedText | undefined, lang: string, fallbackLang?: string) {
    if (!obj) return '';
    const fb = (fallbackLang || 'en').trim().toLowerCase();
    const l = (lang || 'en').trim().toLowerCase();
    return obj[l] || obj[fb] || obj.en || obj.es || obj[Object.keys(obj)[0] ?? ''] || '';
}

function normalizeMonthStr(m?: string) {
    if (!m) return '';
    const n = Number(m);
    if (Number.isFinite(n)) return String(n).padStart(2, '0');
    return m;
}

function formatIsoDate(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toISOString().slice(0, 10);
}

function makeDraftId() {
    try {
        const anyCrypto = (globalThis as any).crypto as Crypto | undefined;
        if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
    } catch {
        // ignore
    }
    return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function BlogEditorHub() {
    const { language } = useLanguage();
    const navigate = useNavigate();

    const uiLang = (language || 'en').trim().toLowerCase();

    const [allPosts, setAllPosts] = useState<BlogPostIndexEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [drafts, setDrafts] = useState<DraftStorageItem[]>([]);

    const [deleteStatus, setDeleteStatus] = useState<{ type: 'idle' | 'deleting' | 'ok' | 'error'; message?: string }>({ type: 'idle' });

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

    const refreshPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(publicPath('/jsons/blogPosts.json'), { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: unknown = await res.json();
            const parsed = Array.isArray(data) ? (data as BlogPostIndexEntry[]) : [];

            const valid = parsed.filter((p) => p && typeof p.slug === 'string' && typeof p.date === 'string');
            const sorted = [...valid].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAllPosts(sorted);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await refreshPosts();
            if (!mounted) return;
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const posts = useMemo(() => {
        return showLocalExamples ? allPosts : allPosts.filter((p) => !p.localExample);
    }, [allPosts, showLocalExamples]);

    const refreshDrafts = () => {
        try {
            const next: DraftStorageItem[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith(DRAFT_PREFIX)) continue;

                const draftId = k.slice(DRAFT_PREFIX.length);
                const raw = localStorage.getItem(k);
                const parsed = safeJsonParse<any>(raw);

                const dateRaw = String(parsed?.date || '').trim();
                const datePart = dateRaw.includes('T') ? dateRaw.split('T')[0] : dateRaw;
                const titleObj = parsed?.title as LocalizedText | undefined;
                const defaultLanguage = String(parsed?.defaultLanguage || 'en');

                next.push({
                    storageKey: k,
                    draftId,
                    slug: String(parsed?.slug || '').trim() || undefined,
                    date: datePart || undefined,
                    title: pickLocalized(titleObj, uiLang, defaultLanguage) || undefined,
                    isDraft: Boolean(parsed?.isDraft ?? true),
                });
            }

            next.sort((a, b) => {
                const at = new Date(a.date || 0).getTime();
                const bt = new Date(b.date || 0).getTime();
                return bt - at;
            });

            setDrafts(next);
        } catch {
            setDrafts([]);
        }
    };

    const deleteDraft = (storageKey: string) => {
        if (!storageKey) return;
        if (!window.confirm('¿Eliminar este draft local?')) return;
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // ignore
        }
        refreshDrafts();
    };

    const deleteAllDrafts = () => {
        if (!window.confirm('¿Eliminar TODOS los drafts locales?')) return;
        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(DRAFT_PREFIX)) keys.push(k);
            }
            for (const k of keys) localStorage.removeItem(k);
        } catch {
            // ignore
        }
        refreshDrafts();
    };

    const deletePost = async (slug: string) => {
        const s = String(slug || '').trim();
        if (!s) return;
        if (!window.confirm(`¿Eliminar el post "${s}"?\n\nEsto borrará la entrada en public/jsons/blogPosts.json y la carpeta en public/blog-content/**.`)) return;

        try {
            setDeleteStatus({ type: 'deleting', message: 'Eliminando…' });
            const res = await fetch('/__dev/blog-editor/delete-post', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug: s }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

            try {
                localStorage.removeItem(`${BASE_STORAGE_KEY}::slug::${s}`);
            } catch {
                // ignore
            }

            setDeleteStatus({ type: 'ok', message: `Eliminado: ${s}` });
            await refreshPosts();
        } catch (e: any) {
            setDeleteStatus({ type: 'error', message: e?.message || String(e) });
        }
    };

    useEffect(() => {
        refreshDrafts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const actions = useMemo(() => {
        const newDraft = () => {
            const draftId = makeDraftId();
            const base = withLang(uiLang, '/blogeditor/editor');
            navigate(`${base}?draftId=${encodeURIComponent(draftId)}`);
        };

        return {
            newDraft,
            refreshDrafts,
        };
    }, [navigate, uiLang]);

    return (
        <>
            <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
            <div className="relative z-10">
                <div className="min-h-screen pt-24 pb-16">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Blog Editor (DEV)</h1>
                                    <p className="text-white/60 mt-1 text-sm">Hub para ver posts y crear nuevos. En producción no existe.</p>
                                </div>
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
                                    <Link to={withLang(uiLang, '/hubdev')} className="btn-primary">Volver al hub</Link>
                                    <Link to={withLang(uiLang, '/hubdev/tags')} className="btn-primary">Tags Manager</Link>
                                    <Link to={withLang(uiLang, '/blog')} className="btn-primary">Volver al blog</Link>
                                    <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={actions.newDraft}>
                                        <HiPlus /> Nuevo
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card mb-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <h2 className="text-xl font-bold text-white">Drafts locales</h2>
                                <div className="flex gap-2 flex-wrap">
                                    <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={actions.refreshDrafts}>
                                        <HiRefresh /> Refrescar
                                    </button>
                                    <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={deleteAllDrafts}>
                                        <HiTrash /> Eliminar todos
                                    </button>
                                </div>
                            </div>

                            {drafts.length === 0 ? (
                                <div className="text-white/60 text-sm">No hay drafts locales (todavía).</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {drafts.map((d) => (
                                        <div key={d.storageKey} className="rounded border border-white/10 bg-white/5 p-3">
                                            <div className="text-white font-semibold">
                                                {d.title || d.slug || d.draftId}
                                                {d.isDraft ? <span className="text-white/50"> · DRAFT</span> : null}
                                            </div>
                                            <div className="text-white/50 text-xs mt-1">{d.date || '—'}</div>

                                            <div className="mt-3 flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    className="btn-primary inline-flex items-center gap-2"
                                                    onClick={() => {
                                                        const base = withLang(uiLang, '/blogeditor/editor');
                                                        navigate(`${base}?draftId=${encodeURIComponent(d.draftId)}`);
                                                    }}
                                                >
                                                    <HiPencilAlt /> Continuar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn-primary inline-flex items-center gap-2"
                                                    onClick={() => deleteDraft(d.storageKey)}
                                                    title="Eliminar draft local"
                                                >
                                                    <HiTrash /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <h2 className="text-xl font-bold text-white mb-3">Posts</h2>

                            {deleteStatus.type !== 'idle' ? (
                                <div
                                    className={
                                        'mb-3 rounded-lg px-4 py-3 text-sm border ' +
                                        (deleteStatus.type === 'ok'
                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                            : deleteStatus.type === 'error'
                                              ? 'border-red-500/30 bg-red-500/10 text-red-200'
                                              : 'border-white/10 bg-white/5 text-white/70')
                                    }
                                >
                                    {deleteStatus.message}
                                </div>
                            ) : null}

                            {loading ? <div className="text-white/60 text-sm">Cargando…</div> : null}
                            {error ? (
                                <div className="text-red-200 text-sm">Error cargando blogPosts.json: {error}</div>
                            ) : null}

                            {!loading && !error ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {posts.map((p) => {
                                        const title = pickLocalized(p.title, uiLang, p.defaultLanguage) || p.slug;
                                        const yyyyMmDd = formatIsoDate(p.date);
                                        const year = String(p.year || '').trim();
                                        const month = normalizeMonthStr(String(p.month || '').trim());

                                        const blogPath = year && month
                                            ? withLang(uiLang, `/blog/${year}/${month}/${p.slug}`)
                                            : withLang(uiLang, `/blog/${p.slug}`);

                                        return (
                                            <div key={p.slug} className="rounded border border-white/10 bg-white/5 p-3">
                                                <div className="text-white font-semibold">
                                                    {title}{p.draft ? <span className="text-white/50"> · DRAFT</span> : null}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {p.private ? (
                                                        <span className="px-2 py-1 bg-red-500/15 text-red-200 text-xs rounded-full border border-red-500/20">
                                                            PRIVATE
                                                        </span>
                                                    ) : null}
                                                    {p.unlisted ? (
                                                        <span className="px-2 py-1 bg-white/5 text-white/80 text-xs rounded-full border border-white/15">
                                                            UNLISTED
                                                        </span>
                                                    ) : null}
                                                    {p.archived ? (
                                                        <span className="px-2 py-1 bg-primary/15 text-primary text-xs rounded-full border border-primary/20">
                                                            ARCHIVED
                                                        </span>
                                                    ) : null}
                                                    {String(p.supersededBy || '').trim() ? (
                                                        <span className="px-2 py-1 bg-sky-400/15 text-sky-100 text-xs rounded-full border border-sky-400/20">
                                                            OUTDATED
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-3 text-white/60 text-xs">
                                                    <span className="inline-flex items-center gap-1"><HiCalendar /> {yyyyMmDd}</span>
                                                    {year && month ? (
                                                        <span className="inline-flex items-center gap-1"><HiClock /> {year}/{month}</span>
                                                    ) : null}
                                                    <span className="text-white/40">{p.slug}</span>
                                                </div>

                                                <div className="mt-3 flex gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        className="btn-primary inline-flex items-center gap-2"
                                                        onClick={() => navigate(withLang(uiLang, `/blogeditor/editor/${p.slug}`))}
                                                    >
                                                        <HiPencilAlt /> Editar
                                                    </button>

                                                    <Link
                                                        to={blogPath}
                                                        className="btn-primary inline-flex items-center gap-2"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <HiExternalLink /> Ver
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="btn-primary inline-flex items-center gap-2"
                                                        onClick={() => void deletePost(p.slug)}
                                                        title="Eliminar post"
                                                    >
                                                        <HiTrash /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
