// Imports Libraries
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiSearch, HiClock, HiCalendar, HiTag, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

// Imports Components
import VideoBackground from '@components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type LocalizedText = Record<string, string | undefined>;

type BlogPost = {
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
    readTime?: number;
    image?: string | null;
    languages?: string[];
    defaultLanguage?: string;
    title?: LocalizedText;
    excerpt?: LocalizedText;
    description?: LocalizedText;
    tags?: string[];
    categoryId?: string;
    categories?: string[];
};

const SHOW_LOCAL_EXAMPLES_KEY = 'dev.blogEditor.showLocalExamples';

function normalizeText(value: string) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function normalizeMonthStr(m?: string) {
    if (!m) return '';
    const n = Number(m);
    if (Number.isFinite(n)) return String(n).padStart(2, '0');
    return m;
}

function monthNames(monthIndex0: number) {
    // monthIndex0: 0..11
    const date = new Date(Date.UTC(2026, monthIndex0, 1));
    const esLong = date.toLocaleDateString('es-ES', { month: 'long' });
    const esShort = date.toLocaleDateString('es-ES', { month: 'short' });
    const enLong = date.toLocaleDateString('en-US', { month: 'long' });
    const enShort = date.toLocaleDateString('en-US', { month: 'short' });
    return [esLong, esShort, enLong, enShort].map((s) => s.replace('.', ''));
}

function uniqSorted(values: string[]) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function titleizeId(id: string) {
    return id
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

const Blog: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { pageNum } = useParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');

    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [postsPerPage, setPostsPerPage] = useState(9);

    useEffect(() => {
        void loadPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const currentPageFromUrl = Number.parseInt(pageNum ?? '1', 10);
        if (!Number.isFinite(currentPageFromUrl) || currentPageFromUrl <= 1) return;
        navigate(withLang(language, '/blog'), { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedCategory, selectedTag, selectedYear, selectedMonth, postsPerPage]);

    const getLocalized = (obj?: LocalizedText) => {
        if (!obj) return '';
        return obj[language] || obj.en || obj.es || obj[Object.keys(obj)[0] ?? ''] || '';
    };

    const getCategoryLabel = (categoryId: string) => {
        const translated = t(`categories.${categoryId}`);
        return translated !== `categories.${categoryId}` ? translated : titleizeId(categoryId);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const localizedDate = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        return `${localizedDate} (${day}/${month}/${year})`;
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            setError(false);

            const response = await fetch(publicPath('/jsons/blogPosts.json'));
            if (!response.ok) throw new Error('Network response was not ok');

            const data: unknown = await response.json();
            const posts = Array.isArray(data) ? (data as BlogPost[]) : [];

            const valid = posts.filter((p) => p && typeof p.id === 'string' && typeof p.slug === 'string' && typeof p.date === 'string');

            const showLocalExamples = import.meta.env.DEV
                ? (() => {
                    try {
                        return localStorage.getItem(SHOW_LOCAL_EXAMPLES_KEY) === '1';
                    } catch {
                        return false;
                    }
                })()
                : false;

            const withoutLocalExamples = showLocalExamples ? valid : valid.filter((p) => !p.localExample);
            // Public listing rules:
            // - Draft/private/unlisted are hidden.
            // - Archived stays visible (but tagged) so people can still find it.
            const visible = import.meta.env.DEV
                ? withoutLocalExamples
                : withoutLocalExamples.filter((p) => !p.draft && !p.private && !p.unlisted);
            const sortedPosts = [...visible].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setBlogPosts(sortedPosts);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching blog posts:', err);
            setError(true);
            setLoading(false);
        }
    };

    const derived = useMemo(() => {
        const categories = uniqSorted(
            blogPosts.flatMap((p) => {
                if (p.categoryId) return [p.categoryId];
                if (Array.isArray(p.categories)) return p.categories;
                return [];
            }).filter(Boolean) as string[]
        );

        const tags = uniqSorted(blogPosts.flatMap((p) => p.tags ?? []).filter(Boolean) as string[]);
        const years = uniqSorted(
            blogPosts.map((p) => p.year).filter(Boolean) as string[]
        ).sort((a, b) => Number(b) - Number(a));

        const months = uniqSorted(
            blogPosts.map((p) => p.month).filter(Boolean) as string[]
        );

        return {
            categories,
            tags,
            years,
            months,
        };
    }, [blogPosts]);

    const filteredPosts = useMemo(() => {
        const qNorm = normalizeText(searchTerm);
        const qCompact = qNorm.replace(/\s+/g, '');

        return blogPosts.filter((post) => {
            const title = getLocalized(post.title);
            const excerpt = (getLocalized(post.excerpt) || getLocalized(post.description));
            const tagStr = (post.tags ?? []).join(' ');

            const date = new Date(post.date);
            const derivedYear = post.year || (Number.isNaN(date.getTime()) ? '' : String(date.getFullYear()));
            const derivedMonth = normalizeMonthStr(post.month || (Number.isNaN(date.getTime()) ? '' : String(date.getMonth() + 1)));
            const monthIdx = Number.isNaN(date.getTime()) ? (Number(derivedMonth) ? Number(derivedMonth) - 1 : 0) : date.getMonth();
            const monthTokens = monthNames(Math.min(11, Math.max(0, monthIdx)));

            const hay = normalizeText([
                post.id,
                post.slug,
                title,
                excerpt,
                tagStr,
                derivedYear,
                derivedMonth,
                ...monthTokens,
            ].filter(Boolean).join(' '));
            const hayCompact = hay.replace(/\s+/g, '');

            const matchesSearch = !qNorm || hay.includes(qNorm) || hayCompact.includes(qCompact);

            const postCategories = post.categoryId
                ? [post.categoryId]
                : (post.categories ?? []);

            const matchesCategory = selectedCategory === 'all' || postCategories.includes(selectedCategory);
            const matchesTag = selectedTag === 'all' || (post.tags ?? []).includes(selectedTag);
            const matchesYear = selectedYear === 'all' || (post.year || '') === selectedYear;
            const matchesMonth = selectedMonth === 'all' || normalizeMonthStr(post.month) === normalizeMonthStr(selectedMonth);

            return matchesSearch && matchesCategory && matchesTag && matchesYear && matchesMonth;
        });
    }, [blogPosts, searchTerm, selectedCategory, selectedTag, selectedYear, selectedMonth]);

    const totalPosts = filteredPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalPosts / postsPerPage));

    const requestedPageRaw = Number.parseInt(pageNum ?? '1', 10);
    const requestedPage = Number.isFinite(requestedPageRaw) && requestedPageRaw > 0 ? requestedPageRaw : 1;
    const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

    useEffect(() => {
        if (requestedPage === currentPage) return;
        const to = currentPage === 1
            ? withLang(language, '/blog')
            : withLang(language, `/blog/page/${currentPage}`);
        navigate(to, { replace: true });
    }, [requestedPage, currentPage, totalPages, language, navigate]);

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    const paginate = (pageNumber: number) => {
        const safeTarget = Math.min(Math.max(1, pageNumber), totalPages);
        const to = safeTarget === 1
            ? withLang(language, '/blog')
            : withLang(language, `/blog/page/${safeTarget}`);

        navigate(to);
        window.scrollTo({ top: 0, behavior: 'auto' });
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
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className='text-center'>
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-xl text-gray-300">{t('blog.loading')}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen pt-32 pb-20 px-4">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <h1 className="section-title mb-4">{t('blog.title')}</h1>
                                <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('blog.subtitle')}</p>
                            </div>

                            {/* Error Message */}
                            <div className="flex items-center justify-center pt-15">
                                <div className="text-center card-custom bg-dark-lighter/85 max-w-md ">
                                    <img
                                        src={publicPath('/assets/img/error-image-logo1.png')}
                                        alt="Error"
                                        className="mx-auto mb-4 w-64 h-64 object-cover object-[50%_15%] rounded-lg"
                                        loading="eager"
                                        decoding="async"
                                    />
                                    <h2 className="text-2xl font-bold mb-2">{t('blog.error.loading')}</h2>
                                    <p className="text-gray-300 mb-6">{t('blog.error.description')}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn-primary"
                                    >
                                        {t('blog.refreshPage')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />

            <div className="relative z-10">
                <div className="min-h-screen pt-32 pb-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="section-title mb-4">{t('blog.title')}</h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('blog.subtitle')}</p>
                        </div>

                        {/* Search and Filters */}
                        <div className="mb-12">
                            <div className="card">
                                {/* Search Bar */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                        <input
                                            type="text"
                                            placeholder={t('blog.searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-dark rounded-lg border border-primary/30 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                                    {/* Categories */}
                                    <div>
                                        <label htmlFor="blog-category" className="block text-sm text-gray-400 mb-2">{t('blog.allCategories')}</label>
                                        <select
                                            id="blog-category"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            aria-label={t('blog.allCategories')}
                                            className="w-full bg-dark-lighter border border-primary/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                        >
                                            <option value="all">{t('blog.allCategories')}</option>
                                            {derived.categories.map((c) => (
                                                <option key={c} value={c}>{getCategoryLabel(c)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label htmlFor="blog-tag" className="block text-sm text-gray-400 mb-2">{t('blog.allTags')}</label>
                                        <select
                                            id="blog-tag"
                                            value={selectedTag}
                                            onChange={(e) => setSelectedTag(e.target.value)}
                                            aria-label={t('blog.allTags')}
                                            className="w-full bg-dark-lighter border border-primary/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                        >
                                            <option value="all">{t('blog.allTags')}</option>
                                            {derived.tags.map((tag) => (
                                                <option key={tag} value={tag}>{tag}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Years */}
                                    <div>
                                        <label htmlFor="blog-year" className="block text-sm text-gray-400 mb-2">{t('blog.allYears')}</label>
                                        <select
                                            id="blog-year"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            aria-label={t('blog.allYears')}
                                            className="w-full bg-dark-lighter border border-primary/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                        >
                                            <option value="all">{t('blog.allYears')}</option>
                                            {derived.years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Months */}
                                    <div>
                                        <label htmlFor="blog-month" className="block text-sm text-gray-400 mb-2">{t('blog.allMonths')}</label>
                                        <select
                                            id="blog-month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            aria-label={t('blog.allMonths')}
                                            className="w-full bg-dark-lighter border border-primary/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                        >
                                            <option value="all">{t('blog.allMonths')}</option>
                                            {derived.months.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-6 flex gap-12 md:justify-end">
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedCategory('all');
                                                setSelectedTag('all');
                                                setSelectedYear('all');
                                                setSelectedMonth('all');
                                            }}
                                            className="btn-primary"
                                        >
                                            {t('blog.clearFilters')}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Results Info & Posts per Page */}
                        {filteredPosts.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                <p className="text-gray-400">
                                    {t('blog.showing')} <span className="text-primary font-bold">{indexOfFirstPost + 1}-{Math.min(indexOfLastPost, totalPosts)}</span> {t('blog.of')}{' '}
                                    <span className="text-primary font-bold">{totalPosts}</span> {t('blog.postsText')}
                                </p>
                                <div className="flex items-center gap-3">
                                    <label className="text-gray-400 text-sm">{t('blog.postsPerPage')}:</label>
                                    <select
                                        value={postsPerPage}
                                        onChange={(e) => setPostsPerPage(Number(e.target.value))}
                                        aria-label={t('blog.postsPerPage')}
                                        className="bg-dark-lighter border border-primary/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary cursor-pointer"
                                    >
                                        <option value={6}>6</option>
                                        <option value={9}>9</option>
                                        <option value={12}>12</option>
                                        <option value={18}>18</option>
                                        <option value={24}>24</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Blog Posts Grid */}
                        {filteredPosts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {currentPosts.map((post) => {
                                        const title = getLocalized(post.title);
                                        const excerpt = getLocalized(post.excerpt) || getLocalized(post.description);
                                        const cat = post.categoryId || post.categories?.[0] || 'all';
                                        const to = post.year && post.month
                                            ? withLang(language, `/blog/${post.year}/${post.month}/${post.slug}`)
                                            : withLang(language, `/blog/${post.slug}`);

                                        const isArchived = Boolean(post.archived);
                                        const isOutdated = Boolean(String(post.supersededBy || '').trim());
                                        const isDraft = Boolean(post.draft);
                                        const isPrivate = Boolean(post.private);
                                        const isUnlisted = Boolean(post.unlisted);

                                        return (
                                            <Link
                                                key={post.id}
                                                to={to}
                                                className="card group hover:scale-105 cursor-pointer overflow-hidden"
                                            >
                                                {/* Image */}
                                                <div className="relative overflow-hidden rounded-lg mb-4 aspect-video bg-dark-lighter">
                                                    {post.image ? (
                                                        <img
                                                            src={post.image.startsWith('/') ? publicPath(post.image) : post.image}
                                                            alt={title}
                                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-linear-to-t from-dark via-transparent to-transparent opacity-60" />
                                                    {cat !== 'all' && (
                                                        <div className="absolute top-4 left-4 bg-primary/90 text-dark px-3 py-1 rounded-full text-sm font-bold">
                                                            {getCategoryLabel(cat)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <HiCalendar className="text-primary" />
                                                        {formatDate(post.date)}
                                                    </span>
                                                    {typeof post.readTime === 'number' && (
                                                        <span className="flex items-center gap-1">
                                                            <HiClock className="text-primary" />
                                                            {post.readTime} {t('blog.minuteRead')}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors line-clamp-2">
                                                    {title || post.slug}
                                                </h3>

                                                {/* Status tags */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {import.meta.env.DEV && isDraft ? (
                                                        <span className="px-2 py-1 bg-yellow-400/15 text-yellow-200 text-xs rounded-full border border-yellow-400/20">
                                                            DRAFT
                                                        </span>
                                                    ) : null}
                                                    {import.meta.env.DEV && isPrivate ? (
                                                        <span className="px-2 py-1 bg-red-500/15 text-red-200 text-xs rounded-full border border-red-500/20">
                                                            PRIVATE
                                                        </span>
                                                    ) : null}
                                                    {import.meta.env.DEV && isUnlisted ? (
                                                        <span className="px-2 py-1 bg-white/5 text-white/80 text-xs rounded-full border border-white/15">
                                                            UNLISTED
                                                        </span>
                                                    ) : null}
                                                    {isArchived ? (
                                                        <span className="px-2 py-1 bg-primary/15 text-primary text-xs rounded-full border border-primary/20">
                                                            ARCHIVED
                                                        </span>
                                                    ) : null}
                                                    {isOutdated ? (
                                                        <span className="px-2 py-1 bg-sky-400/15 text-sky-100 text-xs rounded-full border border-sky-400/20">
                                                            UPDATED
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <p className="text-gray-400 mb-4 line-clamp-3">
                                                    {excerpt}
                                                </p>

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {(post.tags ?? []).slice(0, 3).map((tag, index) => (
                                                        <span
                                                            key={`${post.id}-tag-${index}`}
                                                            className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1"
                                                        >
                                                            <HiTag className="text-xs" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Read More */}
                                                <span className="text-primary hover:underline font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                                    {t('blog.readMore')} →
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
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
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📝</div>
                                <h3 className="text-2xl font-bold mb-2 text-gray-300">{t('blog.noResults')}</h3>
                                <p className="text-gray-400 mb-6">{t('blog.noResultsDesc')}</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setSelectedTag('all');
                                        setSelectedYear('all');
                                        setSelectedMonth('all');
                                    }}
                                    className="btn-primary"
                                >
                                    {t('blog.allCategories')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Blog;