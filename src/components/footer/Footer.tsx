import React, { useMemo } from 'react';
import { HiHeart } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { sortedElsewhereSites } from '@components/elsewhere/elsewhereData';

// How many of my other sites get a shortcut down here. The footer is meant to
// stay minimal, so this is deliberately small - the full list lives on /elsewhere.
const FOOTER_SITE_COUNT = 3;

const Footer: React.FC = () => {

    const currentYear = new Date().getFullYear();

    const { t, language } = useLanguage();

    const sites = useMemo(() => sortedElsewhereSites().slice(0, FOOTER_SITE_COUNT), []);
    const elsewhereTo = useMemo(() => withLang(language, '/elsewhere'), [language]);

    const linkClass =
        'text-gray-400 hover:text-green-500 transition-colors duration-300 hover:underline';

    const siteLinks = (
        <nav
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-400"
            aria-label={t('elsewhere.title')}
        >
            {sites.map((site, index) => (
                <React.Fragment key={site.id}>
                    {index > 0 ? <span aria-hidden="true" className="text-gray-600">·</span> : null}
                    <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                    >
                        {site.name}
                    </a>
                </React.Fragment>
            ))}
            <span aria-hidden="true" className="text-gray-600">·</span>
            <Link to={elsewhereTo} className={linkClass}>
                {t('nav.elsewhere')}
            </Link>
        </nav>
    );

    return (
        <footer className="relative z-10 w-full -mb-20 bg-black/0 backdrop-blur-md">

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <span
                    className="block h-px w-full rounded-full bg-primary/25 md:bg-primary/25"
                    aria-hidden="true"
                />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Desktop layout */}
                <div className="hidden flex-col gap-4 text-sm text-gray-300/95 md:flex">
                    {siteLinks}

                    <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1">
                            © {currentYear}. {t('footer.rights')}
                        </p>

                        <p className="flex items-center gap-1.5">
                            {t('footer.made-with')}{' '}
                            <HiHeart className="text-green-500 w-4 h-4 animate-pulse" /> {t('footer.by')}{' '}
                            <a
                                href="https://happyuky7.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-400 transition-colors duration-300 font-medium hover:underline"
                            >
                                Happyuky7
                            </a>
                        </p>
                    </div>
                </div>

                {/* Mobile layout */}
                <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-300/95 md:hidden">
                    {siteLinks}
                    <p className="flex items-center gap-1">
                        © {currentYear}. {t('footer.rights')}
                    </p>
                    <p className="flex items-center gap-1.5">
                        {t('footer.made-with')}{' '}
                        <HiHeart className="text-green-500 w-4 h-4 animate-pulse" /> {t('footer.by')}{' '}
                        <a
                            href="https://happyuky7.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-400 transition-colors duration-300 font-medium hover:underline"
                        >
                            Happyuky7
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
