import React from 'react';
import { HiHeart } from 'react-icons/hi';
import { useLanguage } from '@/i18n/LanguageContext';


const Footer: React.FC = () => {

    const currentYear = new Date().getFullYear();

    const { t } = useLanguage();

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
                <div className="hidden items-center justify-between text-sm text-gray-300/95 md:flex">
                    <p className="flex items-center gap-1">
                        © {currentYear}. {t('footer.rights')}
                    </p>

                    <p className="flex items-center gap-1.5">
                        {t('footer.made-with')}{' '}
                        <HiHeart className="text-green-500 w-4 h-4 animate-pulse" /> {t('footer.by')}{' '}
                        <a
                            href="https://happyuky7.github.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-400 transition-colors duration-300 font-medium hover:underline"
                        >
                            Happyuky7
                        </a>
                    </p>
                </div>

                {/* Mobile layout */}
                <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-300/95 md:hidden">
                    <p className="flex items-center gap-1">
                        © {currentYear}. {t('footer.rights')}
                    </p>
                    <p className="flex items-center gap-1.5">
                        {t('footer.made-with')}{' '}
                        <HiHeart className="text-green-500 w-4 h-4 animate-pulse" /> {t('footer.by')}{' '}
                        <a
                            href="https://happyuky7.github.io"
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