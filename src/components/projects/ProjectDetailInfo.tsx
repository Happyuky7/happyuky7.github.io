import type React from 'react';
import { FaGithub, FaGlobe } from 'react-icons/fa';
import { HiTag, HiStar, HiCode, HiEye, HiUser, HiExternalLink } from 'react-icons/hi';
import { useLanguage } from '@i18n/LanguageContext';
import { publicPath } from '@/utils/publicPath';

const ProjectDetailInfo: React.FC<{
    project: any,
    githubData?: any
}> = ({ project, githubData }) => {

    const { t, language } = useLanguage();

    const title = project?.displayName || project?.name || 'Project';
    const tags = Array.isArray(project?.tags) ? project.tags : [];

    const isHttpUrl = (value: any) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());

    const resolvePublicImg = (value: any) => {
        if (typeof value !== 'string') return '';
        const s = value.trim();
        if (!s) return '';
        if (isHttpUrl(s)) return s;
        return s.startsWith('/') ? publicPath(s) : s;
    };

    const getDescription = (value: any): string => {
        if (!value) return 'Description not available';

        if (typeof value.description === 'object' && value.description !== null) {
            return value.description[language] ||
                value.description['en'] ||
                Object.values(value.description)[0] ||
                'Description not available';
        }

        return value.description || 'Description not available';
    };

    return (
        <>
            <div className="card mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="aspect-video lg:aspect-square rounded-lg overflow-hidden bg-dark-lighter">
                            <img
                                src={resolvePublicImg(project?.image) || 'https://c.tenor.com/iZqfL67xsjkAAAAC/tenor.gif'}
                                alt={title}
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2 min-w-0 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 wrap-break-word bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                {title}
                            </h1>
                            <p className="text-xl text-gray-300 leading-relaxed wrap-break-word">
                                {getDescription(project)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag: any, index: number) => (
                                <span
                                    key={`${tag?.name ?? 'tag'}-${index}`}
                                    className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full border border-primary/30"
                                >
                                    <HiTag className="inline mr-1" />
                                    {tag?.name}
                                </span>
                            ))}
                        </div>

                        {githubData && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                                    <HiStar className="text-yellow-500 text-2xl mx-auto mb-1" />
                                    <div className="text-xl font-bold">{githubData.stargazers_count}</div>
                                    <div className="text-xs text-gray-400">Stars</div>
                                </div>
                                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                                    <HiCode className="text-primary text-2xl mx-auto mb-1" />
                                    <div className="text-xl font-bold">{githubData.forks_count}</div>
                                    <div className="text-xs text-gray-400">Forks</div>
                                </div>
                                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                                    <HiEye className="text-green-500 text-2xl mx-auto mb-1" />
                                    <div className="text-xl font-bold">{githubData.watchers_count}</div>
                                    <div className="text-xs text-gray-400">Watchers</div>
                                </div>
                                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                                    <HiUser className="text-blue-500 text-2xl mx-auto mb-1" />
                                    <div className="text-xl font-bold">{githubData.open_issues_count}</div>
                                    <div className="text-xs text-gray-400">Issues</div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-4">
                            {project?.github && (
                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-dark-lighter hover:bg-dark border border-primary/30 hover:border-primary text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                                >
                                    <FaGithub className="text-xl" />
                                    {t('projectsDetails.viewOnGithub')}
                                </a>
                            )}

                            {isHttpUrl(project?.link) && (
                                <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-primary/50 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
                                >
                                    <HiExternalLink className="text-xl" />
                                    {t('projectsDetails.visitProject')}
                                </a>
                            )}

                            {project?.demo && (
                                <a
                                    href={project.demo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-dark-lighter hover:bg-dark border border-blue-500/30 hover:border-blue-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                                >
                                    <FaGlobe className="text-xl" />
                                    {t('projectsDetails.viewDemo')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectDetailInfo;
