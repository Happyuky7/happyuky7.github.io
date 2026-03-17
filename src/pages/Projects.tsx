// Imports Libraries
import React, { useState, useEffect } from 'react';
import { HiFilter, HiSearch, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';

// Imports Components
import VideoBackground from '@/components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import ProjectCard from '@/components/projects/ProjectCard';
import { publicPath } from '@/utils/publicPath';

function normalizeText(value: string) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

const Projects: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { pageNum } = useParams();

    const [projects, setProjects] = useState<any[]>([]);
    const [tags, setTags] = useState<{ [key: string]: string }>({});
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    //const [errorMsg, setErrorMsg] = useState<any>(''); // Uncommented for Dev Mode

    const projectsPerPage = 12;

    useEffect(() => {
        loadProyects();
    }, []);

    const loadProyects = async () => {
        try {

            const response = await fetch(publicPath('/jsons/projects-real.json'));
            if (!response.ok) {
                throw new Error('Network response was not ok');
            };

            const data = await response.json();
            // Filter only valid projects that have a name
            const validProjects = data.filter((project: any) => project.name).filter((project: any) => !project?.hidden);
            setProjects(validProjects);
            generateTags(validProjects);
            setLoading(false);
            setError(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            //setErrorMsg(error); // Uncommented for Dev Mode
            setError(true);
            setLoading(false);
        }
    };

    const generateTags = (projectsData: any[]) => {
        const tagsObj: { [key: string]: string } = {};
        projectsData.forEach(project => {
            project.tags.forEach((tag: any) => {
                if (!tagsObj[tag.name]) {
                    tagsObj[tag.name] = tag.readable;
                }
            });
        });
        setTags(tagsObj);
    };

    const toggleFilter = (tag: string) => {
        setActiveFilters(prevFilters =>
            prevFilters.includes(tag)
                ? prevFilters.filter(f => f !== tag)
                : [...prevFilters, tag]
        );
    };

    const clearFilters = () => {
        setActiveFilters([]);
    };

    const filteredProjects = (() => {
        const q = normalizeText(searchTerm);
        const qCompact = q.replace(/\s+/g, '');

        const byTags = activeFilters.length === 0
            ? projects
            : projects.filter(project =>
                project.tags.some((tag: any) => activeFilters.includes(tag.name))
            );

        if (!q) return byTags;

        return byTags.filter((project: any) => {
            const name = project?.name || '';
            const displayName = project?.displayName || '';
            const desc = project?.description ? (typeof project.description === 'string'
                ? project.description
                : (project.description?.en || project.description?.es || Object.values(project.description)[0] || '')) : '';
            const tagNames = (project?.tags || []).map((t: any) => `${t?.name || ''} ${t?.readable || ''}`).join(' ');

            const hay = normalizeText([name, displayName, desc, tagNames].join(' '));
            const hayCompact = hay.replace(/\s+/g, '');
            return hay.includes(q) || hayCompact.includes(qCompact);
        });
    })();

    const totalProjects = filteredProjects.length;
    const totalPages = Math.max(1, Math.ceil(totalProjects / projectsPerPage));

    const requestedPageRaw = Number.parseInt(pageNum ?? '1', 10);
    const requestedPage = Number.isFinite(requestedPageRaw) && requestedPageRaw > 0 ? requestedPageRaw : 1;
    const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

    useEffect(() => {
        if (requestedPage === currentPage) return;
        const to = currentPage === 1
            ? withLang(language, '/projects')
            : withLang(language, `/projects/page/${currentPage}`);
        navigate(to, { replace: true });
    }, [requestedPage, currentPage, totalPages, language, navigate]);

    useEffect(() => {
        const currentPageFromUrl = Number.parseInt(pageNum ?? '1', 10);
        if (!Number.isFinite(currentPageFromUrl) || currentPageFromUrl <= 1) return;
        navigate(withLang(language, '/projects'), { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, activeFilters]);

    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

    const paginate = (pageNumber: number) => {
        const safeTarget = Math.min(Math.max(1, pageNumber), totalPages);
        const to = safeTarget === 1
            ? withLang(language, '/projects')
            : withLang(language, `/projects/page/${safeTarget}`);

        navigate(to);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pageNumbers: Array<number | '...'> = [];
        const maxPageButtons = 5;

        if (totalPages <= maxPageButtons) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
            return pageNumbers;
        }

        if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pageNumbers.push(i);
            pageNumbers.push('...');
            pageNumbers.push(totalPages);
            return pageNumbers;
        }

        if (currentPage >= totalPages - 2) {
            pageNumbers.push(1);
            pageNumbers.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
            return pageNumbers;
        }

        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
        return pageNumbers;
    };

    if (loading) {
        return (
            <>
                <VideoBackground videoSrc='/assets/video/background9.gif' overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className='text-center'>
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-xl text-gray-300">{t('projects.loading')}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <VideoBackground videoSrc='/assets/video/background9.gif' overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className="text-center card-custom bg-dark-lighter/85 max-w-md ">
                            <img
                                src={publicPath('/assets/img/error-image-logo1.png')}
                                alt="Error"
                                className="mx-auto mb-4 w-64 h-64 object-cover object-[50%_15%] rounded-lg"
                                loading="eager"
                                decoding="async"
                            />
                            <h2 className="text-2xl font-bold mb-2">{t('projects.error.loading')}</h2>
                            <p className="text-gray-300 mb-6">
                                {t('projects.error.description')}
                                {/* Only in Dev Mode (Uncomment for Dev Mode) */}
                                {/*(<>
                                    <br />
                                    <span className="text-sm text-yellow-400">{JSON.stringify(error)}</span>
                                    <br />
                                    <span className="text-sm text-red-400">
                                        Error Message: {errorMsg ? errorMsg.toString() : 'Unknown error'}
                                    </span>
                                </>)*/}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                            >
                                {t('projects.refreshPage')}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }




    return (

        <>

            <VideoBackground videoSrc='/assets/video/background9.gif' overlay={true} />

            <div className="relative z-10">

                {/* Header Section */}
                <section className='pt-32 pb-5 px-4'>
                    <div className='max-w-7xl mx-auto'>
                        {/* Title and Description */}
                        <div className='text-center mb-12'>
                            <h1 className='section-title mb-4'>{t('projects.title')}</h1>
                            <p className='text-xl text-gray-300 max-w-2xl mx-auto'>
                                {t('projects.description')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Filters Section */}
                <section className='pb-3 px-4'>
                    <div className='max-w-7xl mx-auto'>
                        <div className="mb-3">
                            <div className="card">
                                <div className="flex items-center gap-3 mb-4">
                                    <HiFilter className="text-2xl text-primary" />
                                    <h3 className="text-xl font-bold">{t('projects.filter.title')}</h3>
                                </div>

                                <p className="text-gray-300 mb-6">
                                    {t('projects.filter.description')}
                                </p>

                                <div className="relative mb-6">
                                    <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={t('projects.searchPlaceholder')}
                                        className="w-full pl-12 pr-4 py-3 bg-dark-lighter border border-primary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={clearFilters}
                                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${activeFilters.length === 0
                                            ? 'bg-primary text-dark'
                                            : 'bg-dark-lighter text-gray-300 hover:bg-dark border border-primary/30'
                                            }`}
                                    >
                                        {t('projects.filter.allProjects')} ({projects.length})
                                    </button>

                                    {Object.keys(tags).map(tag => (
                                        tags[tag] && (
                                            <button
                                                key={tag}
                                                onClick={() => toggleFilter(tag)}
                                                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${activeFilters.includes(tag)
                                                    ? 'bg-primary text-dark shadow-lg shadow-primary/50'
                                                    : 'bg-dark-lighter text-gray-300 hover:bg-dark border border-primary/30'
                                                    }`}
                                            >
                                                {tag}
                                                {activeFilters.includes(tag) && (
                                                    <HiX className="inline ml-1" />
                                                )}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {activeFilters.length > 0 && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <span className="text-gray-400">{t('projects.filter.activeFilters')}</span>
                                        <button
                                            onClick={clearFilters}
                                            className="text-primary hover:underline font-semibold"
                                        >
                                            {t('projects.filter.clearAllFilters')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>


                {/* Projects Grid Section */}
                <section className='pb-20 px-4'>
                    <div className='max-w-7xl mx-auto'>
                        {filteredProjects.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="card-custom bg-dark-lighter/85 max-w-md mx-auto">
                                    <img
                                        src={publicPath('/assets/img/noprojects-image-logo1.png')}
                                        alt="No Projects"
                                        className="mx-auto mb-4 w-64 h-64 object-cover object-[50%_15%] rounded-lg"
                                        loading="eager"
                                        decoding="async"
                                    />
                                    <h2 className="text-2xl font-bold mb-2">
                                        {activeFilters.length > 0
                                            ? t('projects.noProjectsWithFilters')
                                            : t('projects.noProjects')}
                                    </h2>
                                    <p className="text-gray-300 mb-6">
                                        {activeFilters.length > 0
                                            ? t('projects.tryDifferentFilters')
                                            : t('projects.noProjectsDescription')}
                                    </p>
                                    {activeFilters.length > 0 ? (
                                        <button
                                            onClick={clearFilters}
                                            className="btn-primary"
                                        >
                                            {t('projects.filter.clearAllFilters')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="btn-primary"
                                        >
                                            {t('projects.refreshPage')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentProjects.map((project, index) => (
                                    <ProjectCard
                                        key={`${project.name}-${index}`}
                                        name={project.displayName || project.name}
                                        tags={project.tags}
                                        proyectData={project}
                                    />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            aria-label="Previous page"
                                            title="Previous page"
                                            className={`p-2 rounded-lg border transition-all ${
                                                currentPage === 1
                                                    ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                                                    : 'border-primary/30 text-primary hover:bg-primary hover:text-dark'
                                            }`}
                                        >
                                            <HiChevronLeft className="text-xl" />
                                        </button>

                                        {getPageNumbers().map((number, index) =>
                                            number === '...' ? (
                                                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                                            ) : (
                                                <button
                                                    key={number}
                                                    onClick={() => paginate(number)}
                                                    className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                                                        currentPage === number
                                                            ? 'bg-primary text-dark border-primary'
                                                            : 'border-primary/30 text-gray-300 hover:bg-primary/20'
                                                    }`}
                                                >
                                                    {number}
                                                </button>
                                            )
                                        )}

                                        <button
                                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            aria-label="Next page"
                                            title="Next page"
                                            className={`p-2 rounded-lg border transition-all ${
                                                currentPage === totalPages
                                                    ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                                                    : 'border-primary/30 text-primary hover:bg-primary hover:text-dark'
                                            }`}
                                        >
                                            <HiChevronRight className="text-xl" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Result Count */}
                <section className='pb-20 px-4'>
                    <div className='max-w-7xl mx-auto text-center'>
                        {filteredProjects.length > 0 && (
                            <div className="text-center mt-12">
                                <p className="text-gray-400">
                                    {t('projects.showing')} <span className="text-primary font-bold">{filteredProjects.length}</span> {t('projects.of')}{' '}
                                    <span className="text-primary font-bold">{projects.length}</span> {t('projects.projectsText')}
                                </p>
                            </div>
                        )}
                    </div>
                </section>


            </div>


        </>

    );

};

export default Projects;