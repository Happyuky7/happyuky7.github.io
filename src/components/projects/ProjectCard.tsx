import React, { useMemo, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

const ProjectCard: React.FC<{
    name: string;
    tags: { name: string; readable: boolean }[];
    proyectData: any;
}> = ({ name, tags, proyectData}) => {

    const { t, language } = useLanguage();

    const [showModal, setShowModal] = useState(false);
    let imageSrc: any = proyectData.image;
    const projectLink: string = proyectData.link;
    const description: any = proyectData.description;
    const normalizeDirectLink = (v: any): boolean | null | undefined => {
        if (v === null || v === undefined) return v;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : undefined;
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase();
            if (!s) return undefined;
            if (s === 'true' || s === '1' || s === 'yes') return true;
            if (s === 'false' || s === '0' || s === 'no') return false;
            if (s === 'unset' || s === 'null' || s === 'undefined') return undefined;
        }
        return undefined;
    };

    const directLink: boolean | null | undefined = normalizeDirectLink(proyectData.directLink); // NO usar ?? false
    const toSlug = (value: any) => {
        if (!value || typeof value !== 'string') return '';
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const projectId: string = toSlug(proyectData.id || proyectData.name) || 'unknown';

    const getDescription = () => {
        if (!description) return t('projects.noDescriptionAvailable');
        if (typeof description === 'string') return description;
        return description[language] || description['en'] || Object.values(description)[0] || t('projects.noDescriptionAvailable');
    };

    const isValidImage = (src: string) => {
        return src && src.trim() !== "";
    };

    const isValidLink = (link: string) => {
        return link && link.trim() !== "" && link !== "null";
    };

    const getProjectUrl = () => {
        // Si el link NO es válido, mostrar modal
        if (!isValidLink(projectLink)) {
            return "#";
        }

        // Si directLink es null/undefined y el link es válido:
        // - si parece un path local ("/algo"), lo tratamos como navegación interna
        //   (mucha data antigua usa "/slug" en vez de "/projects/slug").
        if (directLink === null || directLink === undefined) {
            const raw = (projectLink || '').trim();
            if (raw.startsWith('/')) {
                const pathOnly = raw.split(/[?#]/)[0];
                if (pathOnly.startsWith('/project/')) return withLang(language, pathOnly);

                const slugFromLink = pathOnly.replace(/^\/+/, '').split('/')[0];
                if (slugFromLink) return withLang(language, `/project/${slugFromLink}`);
            }

            return projectLink;
        }

        // Si directLink es true y el link es válido, ir al link externo
        if (directLink === true) {
            return projectLink;
        }

        // Si directLink es false y el link es válido, ir a la página interna del proyecto
        if (directLink === false) {
            return withLang(language, `/project/${projectId}`);
        }

        // Fallback por si acaso
        return "#";
    };

    const resolvedUrl = useMemo(() => getProjectUrl(), [projectLink, directLink, language, projectId]);
    const isExternal = useMemo(() => /^https?:\/\//i.test(resolvedUrl), [resolvedUrl]);
    const isInternal = useMemo(() => resolvedUrl !== "#" && !isExternal, [isExternal, resolvedUrl]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Mostrar modal si el link NO es válido (sin importar directLink)
        if (!isValidLink(projectLink)) {
            e.preventDefault();
            setShowModal(true);
            return;
        }
        // Si hay link válido, la navegación continúa según directLink
    };

    if (!isValidImage(imageSrc)) {
        imageSrc = "/assets/img/noimage-logo1.png";
    }

    const resolveImgSrc = (src: any) => {
        const s = typeof src === 'string' ? src : '';
        if (!s) return '';
        return s.startsWith('/') ? publicPath(s) : s;
    };

    return (
        <>
            {isInternal ? (
                <Link
                    to={resolvedUrl}
                    className="card group hover:scale-105 cursor-pointer overflow-hidden"
                >
                    <div className="relative overflow-hidden rounded-lg mb-4 h-64 bg-dark-lighter">
                        <img
                            src={resolveImgSrc(imageSrc)}
                            alt={name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-4 right-4">
                                <FaExternalLinkAlt className="text-primary text-2xl" />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{getDescription()}</p>

                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag, tagIndex: number) => (
                            <span key={tagIndex} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                {tag.name}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="px-2 py-1 bg-dark-lighter text-gray-400 text-xs rounded-full">
                                +{tags.length - 3} more
                            </span>
                        )}
                    </div>
                </Link>
            ) : (
                <a
                    href={resolvedUrl}
                    target={isExternal ? "_blank" : "_self"}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    onClick={handleClick}
                    className="card group hover:scale-105 cursor-pointer overflow-hidden"
                >
            <div className="relative overflow-hidden rounded-lg mb-4 h-64 bg-dark-lighter">
                    <img 
                                            src={resolveImgSrc(imageSrc)}
                      alt={name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                            decoding="async"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 right-4">
                        <FaExternalLinkAlt className="text-primary text-2xl" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {getDescription()}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="px-2 py-1 bg-dark-lighter text-gray-400 text-xs rounded-full">
                        +{tags.length - 3} more
                      </span>
                    )}
                  </div>
                </a>
            )}

        {/* Modal de Error */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                 onClick={() => setShowModal(false)}>
                 <div className="relative card-custom bg-dark-lighter/95 max-w-md w-full"
                     onClick={(e) => e.stopPropagation()}>
                    <img
                        src={publicPath('/assets/img/error-image-logo1.png')}
                        alt="Error"
                        className="mx-auto mb-4 w-48 h-48 object-cover object-[50%_15%] rounded-lg"
                        loading="eager"
                        decoding="async"
                    />
                    <h2 className="text-2xl font-bold mb-2 text-center">{t('projects.card.nolinkavailable.title')}</h2>
                    <p className="text-gray-300 mb-6 text-center">
                        {t('projects.card.nolinkavailable.description')}
                    </p>
                    <button
                        onClick={() => setShowModal(false)}
                        className="btn-primary w-full"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

export default ProjectCard;
