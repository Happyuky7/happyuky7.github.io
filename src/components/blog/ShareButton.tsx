import { useCallback, useMemo, useState } from 'react';
import { HiCheck, HiShare } from 'react-icons/hi';

import { useLanguage } from '@i18n/LanguageContext';

type ShareButtonProps = {
    path: string;
    title?: string;
};

function normalizePath(path: string) {
    const trimmed = (path || '').trim();
    if (!trimmed) return '/';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default function ShareButton({ path, title }: ShareButtonProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const shareUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const baseUrl = window.location.origin;
        const normalized = normalizePath(path);
        return normalized.startsWith('http') ? normalized : `${baseUrl}${normalized}`;
    }, [path]);

    const shareText = useMemo(() => title || t('blog.shareDefaultText'), [title, t]);

    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            window.setTimeout(() => {
                setCopied(false);
                setShowMenu(false);
            }, 2000);
        } catch (err) {
            console.error('Error copying link:', err);
        }
    }, [shareUrl]);

    const openShare = useCallback(
        (platform: 'twitter' | 'linkedin' | 'reddit') => {
            const shareUrls: Record<typeof platform, string> = {
                twitter: `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
            };

            window.open(shareUrls[platform], '_blank', 'width=600,height=520');
            setShowMenu(false);
        },
        [shareText, shareUrl],
    );

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all duration-300 group"
                aria-label={t('blog.shareAriaLabel')}
            >
                <HiShare className="text-lg group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('blog.sharePost')}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

                    <div className="absolute top-full mt-2 right-0 z-50 bg-dark-lighter border border-primary/20 rounded-lg shadow-xl overflow-hidden min-w-[220px]">
                        <button
                            type="button"
                            onClick={copyToClipboard}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors text-left"
                        >
                            {copied ? (
                                <>
                                    <HiCheck className="text-green-500 text-xl" />
                                    <span className="text-green-500 font-medium">{t('blog.linkCopied')}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span className="text-gray-300">{t('blog.copyLink')}</span>
                                </>
                            )}
                        </button>

                        <div className="border-t border-primary/10" />

                        <button
                            type="button"
                            onClick={() => openShare('twitter')}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            <span className="text-gray-300">X (Twitter)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => openShare('linkedin')}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <span className="text-gray-300">LinkedIn</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => openShare('reddit')}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors text-left"
                        >
                            <svg className="w-5 h-5 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
                            </svg>
                            <span className="text-gray-300">Reddit</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
