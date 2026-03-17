import { useMemo } from 'react';

import { useLanguage } from '@i18n/LanguageContext';

import { languageData, type LanguageId } from './languagesData';

type I18nLanguageItem = {
    id?: unknown;
    name?: unknown;
    note?: unknown;
};

type LanguageItem = {
    id: LanguageId;
    name: string;
    flag?: string;
    level: number;
    note?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function clamp01(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function normalizeI18nLanguageMap(raw: unknown): Record<string, { name?: string; note?: string }> {
    // New preferred shape: { "en": { name, note }, ... }
    if (isRecord(raw) && !Array.isArray(raw)) {
        const out: Record<string, { name?: string; note?: string }> = {};
        for (const [id, value] of Object.entries(raw)) {
            if (!isRecord(value)) continue;
            const maybeName = (value as Record<string, unknown>).name;
            const maybeNote = (value as Record<string, unknown>).note;
            out[id] = {
                name: typeof maybeName === 'string' ? maybeName : undefined,
                note: typeof maybeNote === 'string' ? maybeNote : undefined,
            };
        }
        return out;
    }

    // Backwards-compat: legacy array shape.
    if (Array.isArray(raw)) {
        const out: Record<string, { name?: string; note?: string }> = {};
        for (const item of raw) {
            if (!isRecord(item)) continue;
            const i = item as I18nLanguageItem;
            const id = typeof i.id === 'string' ? i.id : '';
            if (!id) continue;
            out[id] = {
                name: typeof i.name === 'string' ? i.name : undefined,
                note: typeof i.note === 'string' ? i.note : undefined,
            };
        }
        return out;
    }

    return {};
}

function formatPercent(value: number) {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0%';
    if (value > 0 && value < 1) return `${value.toFixed(1)}%`;
    if (!Number.isInteger(value)) return `${value.toFixed(1)}%`;
    return `${value}%`;
}

export default function LanguagesSection() {
    const { t, tr } = useLanguage();

    const items = useMemo(() => {
        const i18nMap = normalizeI18nLanguageMap(tr('home.languages.items'));
        return languageData
            .map<LanguageItem | null>((base) => {
                const translated = i18nMap[base.id];
                const name = translated?.name ?? '';
                if (!name) return null;
                return {
                    id: base.id,
                    name,
                    flag: base.flag,
                    level: clamp01(base.level),
                    note: translated?.note,
                };
            })
            .filter((v): v is LanguageItem => v !== null);
    }, [tr]);

    return (
        <section className="relative z-10 w-full px-4 pb-20">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                        <span className="text-primary">{t('home.languages.title')}</span>
                    </h2>
                    <p className="max-w-2xl text-lg text-white/80">{t('home.languages.subtitle')}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.length ? (
                        items.map((it) => (
                            <div
                                key={it.id}
                                className="group rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur transition hover:bg-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl text-xl" aria-hidden="true">
                                        {it.flag ? (
                                            it.flag.startsWith('/') || it.flag.startsWith('data:') || it.flag.startsWith('http') ? (
                                                <img
                                                    src={it.flag}
                                                    alt=""
                                                    className="h-6 w-6 object-contain"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <span>{it.flag}</span>
                                            )
                                        ) : (
                                            <span className="text-sm font-semibold text-white/85">{it.name.slice(0, 1).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold text-white">{it.name}</div>
                                        {it.note ? <div className="mt-1 text-xs text-white/70 md:text-sm">{it.note}</div> : null}
                                    </div>
                                    <div className="tabular-nums text-sm font-semibold text-white/85">{formatPercent(it.level)}</div>
                                </div>

                                <div className="mt-3">
                                    <progress
                                        className="skill-progress h-2 w-full overflow-hidden rounded-full"
                                        value={it.level}
                                        max={100}
                                        aria-label={`${it.name} level`}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-white/60">—</div>
                    )}
                </div>
            </div>
        </section>
    );
}
