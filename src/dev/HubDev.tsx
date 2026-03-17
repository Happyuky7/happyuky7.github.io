import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import VideoBackground from '@/components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';

export default function HubDev() {
  const { language } = useLanguage();
  const blogTo = useMemo(() => withLang(language, '/blogeditor'), [language]);
  const projectsTo = useMemo(() => withLang(language, '/projectseditor'), [language]);
  const tagsTo = useMemo(() => withLang(language, '/hubdev/tags'), [language]);

  return (
    <div className="relative min-h-screen">
      <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />

      <div className="relative z-10">
        <div className="min-h-screen pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white">DEV Hub</h1>
            <p className="mt-2 text-white/70">Accesos rápidos a herramientas DEV (solo en modo dev).</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to={projectsTo} className="card p-6 bg-dark-lighter/40 hover:scale-[1.01] transition">
                <div className="text-white font-semibold text-xl">Projects Editor</div>
                <div className="mt-2 text-white/70 text-sm">Crear/editar proyectos, tags y README.</div>
              </Link>

              <Link to={blogTo} className="card p-6 bg-dark-lighter/40 hover:scale-[1.01] transition">
                <div className="text-white font-semibold text-xl">Blog Editor</div>
                <div className="mt-2 text-white/70 text-sm">Hub/editor de posts del blog.</div>
              </Link>

              <Link to={tagsTo} className="card p-6 bg-dark-lighter/40 hover:scale-[1.01] transition">
                <div className="text-white font-semibold text-xl">Tags Manager</div>
                <div className="mt-2 text-white/70 text-sm">Crear/eliminar tags globales (blog y projects).</div>
              </Link>
            </div>

            <div className="mt-8 text-white/50 text-xs">Ruta: <span className="font-mono">/hubdev</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
