import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import VideoBackground from '@/components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type Project = {
  name: string;
  displayName?: string;
  [key: string]: any;
};

function toSlug(value: string) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeDraftId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ProjectsEditorHub() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hubUrl = useMemo(() => withLang(language, '/projectseditor'), [language]);
  const backTo = useMemo(() => withLang(language, '/hubdev'), [language]);
  const startNew = () => {
    const id = makeDraftId();
    navigate(withLang(language, `/projectseditor/editor?draftId=${encodeURIComponent(id)}`));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(publicPath('/jsons/projects-real.json'), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? (data as Project[]).filter((p) => p && typeof p === 'object' && (p as any).name) : [];
        if (!cancelled) setProjects(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />

      <div className="relative z-10">
        <div className="min-h-screen pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Projects Editor Hub (DEV)</h1>
                <div className="mt-2 text-white/70 text-sm">Selecciona un proyecto para editar, o crea uno nuevo.</div>
                <div className="mt-1 text-white/50 text-xs">Ruta: <span className="font-mono">{hubUrl}</span></div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={backTo} className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white hover:bg-black/40 transition">
                  Volver
                </Link>
                <button type="button" className="btn-primary" onClick={startNew}>+ Nuevo</button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 card p-6 bg-dark-lighter/40">Cargando…</div>
            ) : error ? (
              <div className="mt-6 card p-6 bg-red-500/15 border border-red-500/30 text-white">{error}</div>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => {
                  const slug = toSlug(String(p?.id || p?.name || ''));
                  const to = withLang(language, `/projectseditor/editor/${encodeURIComponent(slug)}`);
                  return (
                    <Link key={slug || p.name} to={to} className="card p-4 bg-dark-lighter/40 hover:scale-[1.01] transition">
                      <div className="text-white font-semibold">{String(p.displayName || p.name)}</div>
                      <div className="mt-1 text-white/60 text-xs font-mono">{slug}</div>
                    </Link>
                  );
                })}
                {!projects.length ? <div className="text-white/70">No hay proyectos.</div> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
