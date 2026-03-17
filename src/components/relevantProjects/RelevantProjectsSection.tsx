import { useEffect, useMemo, useState } from "react";
import { HiArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';

import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import ProjectCard from '@/components/projects/ProjectCard';
import { publicPath } from '@/utils/publicPath';

type ProjectTag = { name: string; readable: boolean };
type ProjectLike = {
    name?: string;
    displayName?: string;
    description?: any;
    image?: string | null;
    link?: string;
    tags?: ProjectTag[];
    [key: string]: any;
};

const FEATURED_PROJECT_NAMES = [
    'anime-codes',
    'theserverjars',
    'Kaory Network',
    'Convert Minecraft Server Icon',
    'SEPARE-WORLD-ITEMS',
    
];

const pickFeatured = (projects: ProjectLike[], count: number) => {
    const valid = (projects || [])
        .filter((p) => p && typeof p === 'object')
        .filter((p) => !!p.name)
        .filter((p) => !((p as any)?.hidden))
        .filter((p) => (p.name || '').toLowerCase() !== 'example')
        .map((p) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [] }));

    const byName = FEATURED_PROJECT_NAMES
        .map((n) => valid.find((p) => p.name === n))
        .filter(Boolean) as ProjectLike[];

    if (byName.length >= count) return byName.slice(0, count);

    const used = new Set(byName.map((p) => p.name));
    const remainder = valid.filter((p) => !used.has(p.name));
    return [...byName, ...remainder].slice(0, count);
};

export default function RelevantProjectsSection() {
    const { t, language } = useLanguage();
    const [projects, setProjects] = useState<ProjectLike[]>([]);
    const [loading, setLoading] = useState(true);

    const featuredCount = 6;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Uses the “real” portfolio dataset with local images.
                const response = await fetch(publicPath('/jsons/projects-real.json'));
                if (!response.ok) throw new Error('Failed to load projects');
                const data = await response.json();
                if (cancelled) return;
                setProjects(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Error loading featured projects:', e);
                if (!cancelled) setProjects([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const featured = useMemo(() => pickFeatured(projects, featuredCount), [projects, featuredCount]);
    const viewMoreTo = useMemo(() => withLang(language, '/projects'), [language]);

    return (
        <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        <span className="bg-linear-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                            {t('relevantProjects.title')}
                        </span>
                    </h2>
                    <p className="mt-3 max-w-3xl mx-auto text-lg text-white/80">
                        {t('relevantProjects.subtitle')}
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: featuredCount }).map((_, idx) => (
                            <div key={idx} className="card h-[420px] animate-pulse bg-dark-lighter/40" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featured.map((project) => (
                            <ProjectCard
                                key={project.name}
                                name={(project.displayName || project.name) as string}
                                tags={(project.tags || []) as ProjectTag[]}
                                proyectData={project}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-10 flex justify-center">
                    <Link
                        to={viewMoreTo}
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-semibold text-dark transition hover:scale-[1.02] hover:bg-primary/90"
                        aria-label={t('relevantProjects.viewMore')}
                    >
                        {t('relevantProjects.viewMore')}
                        <HiArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
