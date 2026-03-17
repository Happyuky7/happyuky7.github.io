import { useNavigate } from 'react-router-dom';

import VideoBackground from '@components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type ErrorPageProps = {
  code: number;
  title?: string;
  message?: string;
};

function clampStatus(code: number) {
  if (!Number.isFinite(code)) return 500;
  return Math.max(400, Math.min(599, Math.trunc(code)));
}

function statusKey(code: number) {
  const c = clampStatus(code);
  // Known keys; everything else falls back to `errors.common.*`.
  const known = new Set([400, 401, 403, 404, 408, 429, 500, 502, 503]);
  return known.has(c) ? String(c) : 'common';
}

export default function ErrorPage({ code, title, message }: ErrorPageProps) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const normalized = clampStatus(code);
  const key = statusKey(normalized);
  const resolvedTitle = title ?? t(`errors.${key}.title`);
  const resolvedMessage = message ?? t(`errors.${key}.message`);

  const showRetry = normalized === 408 || normalized === 429 || normalized >= 500;
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  const illustration = (() => {
    if (normalized === 404) return publicPath('/assets/img/error-404-img.png');
    if (normalized === 500) return publicPath('/assets/img/error-500-img.png');
    if (normalized === 401 || normalized === 403) return publicPath('/assets/img/error-unknown-img.png');
    // Use a GIF for the rest to give it more personality.
    return publicPath('/assets/img/error-unknown-img.png');
  })();

  return (
    <>
      {/* Force a static background on error pages (independent from the global background switch). */}
      <VideoBackground videoSrc="/assets/img/background.png" overlay={true} staticOverlay={true} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="w-full max-w-2xl rounded-2xl border border-primary/15 bg-dark-lighter/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-6 py-6 border-b border-primary/10">
            <div className="mt-1 flex flex-col items-center gap-5">
              <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="font-mono text-6xl md:text-7xl font-black tracking-tight bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                {normalized}
              </div>
              {/*<div className="mb-2 rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 font-mono text-xs text-white/70">
                {t('errors.hintLabel')}: {t(`errors.${key}.hint`)}
              </div>*/}
            </div>

            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-white">{resolvedTitle}</h1>
            <p className="mt-3 text-gray-200/80">{resolvedMessage}</p>
          </div>

          <div className="px-6 py-5">
            <div className="mt-2 mb-6">
              <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-2">
                <img
                  src={illustration}
                  alt="Error illustration"
                  className="mx-auto w-full max-h-64 rounded-xl object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            {showDebug && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-left font-mono text-[12px] leading-relaxed text-white/70">
                <div>{t('errors.traceTitle')}</div>
                <div className="mt-2">• path: {typeof window !== 'undefined' ? window.location.pathname : ''}</div>
                <div>• time: {new Date().toISOString()}</div>
                <div>• code: {normalized}</div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-dark-lighter text-gray-200 rounded-lg hover:bg-dark border border-primary/30 transition-all"
              >
                {t('errors.actions.back')}
              </button>

              {showRetry && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-dark-lighter text-gray-200 rounded-lg hover:bg-dark border border-primary/30 transition-all"
                >
                  {t('errors.actions.retry')}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(withLang(language || 'en', '/'))}
                className="btn-primary"
              >
                {t('errors.actions.home')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
