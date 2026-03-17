import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { HiCode } from 'react-icons/hi';
import { useNavigate } from "react-router-dom";

import { useLanguage } from '@i18n/LanguageContext';
import CodeBlock from "@/components/code/CodeBlock";

interface ReadmeError {
    status: number | 'invalid' | 'network';
}

interface ProjectReadmeProps {
    readme: string;
    readmeError?: ReadmeError | null;
    readmeBaseUrl?: string | null;
}

const ProjectReadme: React.FC<ProjectReadmeProps> = ({ readme, readmeError, readmeBaseUrl }) => {
    const { t } = useLanguage();
  const navigate = useNavigate();

    const isGitHubBlobBase = !!readmeBaseUrl && readmeBaseUrl.includes('github.com/') && readmeBaseUrl.includes('/blob/');

    const isLocalBase = (() => {
      if (!readmeBaseUrl || isGitHubBlobBase) return false;
      if (typeof window === 'undefined') return false;
      return readmeBaseUrl.startsWith(window.location.origin);
    })();

    const resolvePublicUrl = (path: string) => {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      const cleanPath = (path || '').startsWith('/') ? (path || '').slice(1) : (path || '');
      return `${cleanBase}${cleanPath}`.replace(/\/+/g, '/');
    };

    const resolveAgainstBase = (value: string) => {
      if (!readmeBaseUrl) return value;
      try {
        return new URL(value, readmeBaseUrl.endsWith('/') ? readmeBaseUrl : `${readmeBaseUrl}/`).toString();
      } catch {
        return value;
      }
    };

    const stripViteBase = (pathname: string) => {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
      if (!cleanBase || cleanBase === '/') return pathname || '/';
      if (pathname.startsWith(cleanBase)) {
        const sliced = pathname.slice(cleanBase.length);
        return sliced.startsWith('/') ? sliced : `/${sliced}`;
      }
      return pathname || '/';
    };

    const isProbablyFilePath = (pathname: string) => {
      const last = (pathname || '').split('/').filter(Boolean).at(-1) || '';
      return /\.[a-z0-9]{1,8}$/i.test(last);
    };

    return (
        <div>
          {/* README Content */}
          {readme && (
            <div className="card">
              {/* README Not Translated Warning Message */}
              {(
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <p className="text-blue-300 text-sm text-center">
                      {t('projectsDetails.readmeNotTranslated')}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/20">
                <HiCode className="text-3xl text-primary" />
                <h2 className="text-2xl font-bold">README</h2>
              </div>
              
              <div className="prose prose-invert prose-lg max-w-none prose-headings:text-left prose-p:text-left prose-ul:text-left prose-ol:text-left prose-li:text-left prose-blockquote:text-left prose-table:text-left">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a({ node, children, href, ...props }) {

                      let resolvedHref = href;
                      
                      if (href && readmeBaseUrl) {
                        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
                          resolvedHref = href;
                        } else if (href.startsWith('/') && isGitHubBlobBase) {
                          const cleanHref = href.slice(1);
                          resolvedHref = `${readmeBaseUrl}/${cleanHref}`;
                        } else if (href.startsWith('/') && !isGitHubBlobBase) {
                          // Absolute site path: respect Vite base (GitHub Pages friendly)
                          resolvedHref = resolvePublicUrl(href);
                        } else {
                          resolvedHref = resolveAgainstBase(href);
                        }
                      } else if (href && !readmeBaseUrl) {
                        console.log('Warning: readmeBaseUrl not set, link not resolved:', href);
                      }
                      
                      return (
                        (() => {
                          const rawHref = resolvedHref || href || '';

                          // Hash/mailto: keep default browser behavior
                          if (rawHref.startsWith('#') || rawHref.startsWith('mailto:')) {
                            return (
                              <a
                                href={rawHref}
                                className="text-primary hover:underline transition-colors break-all"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          }

                          const isHttp = /^https?:\/\//i.test(rawHref);

                          // GitHub README: keep links as external
                          if (isGitHubBlobBase) {
                            return (
                              <a
                                href={rawHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline transition-colors break-all"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          }

                          // Local README: use SPA navigation for same-app routes; open new tab for assets/files/external
                          if (isLocalBase && typeof window !== 'undefined') {
                            let url: URL | null = null;
                            try {
                              url = new URL(rawHref, window.location.origin);
                            } catch {
                              url = null;
                            }

                            if (url && url.origin === window.location.origin) {
                              const path = stripViteBase(url.pathname);
                              const looksLikeAsset = url.pathname.includes('/assets/') || url.pathname.includes('/projects-content/') || url.pathname.includes('/blog-content/');
                              const isFile = isProbablyFilePath(url.pathname);

                              const shouldSpaNavigate = !looksLikeAsset && !isFile;
                              if (shouldSpaNavigate) {
                                const to = `${path}${url.search}${url.hash}`;
                                return (
                                  <a
                                    href={to}
                                    className="text-primary hover:underline transition-colors break-all"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(to);
                                    }}
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              }

                              // assets/files: do not navigate away from the SPA
                              return (
                                <a
                                  href={url.toString()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline transition-colors break-all"
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            }
                          }

                          // Default behavior: external links open in new tab; others open normally
                          return (
                            <a
                              href={rawHref}
                              target={isHttp ? "_blank" : undefined}
                              rel={isHttp ? "noopener noreferrer" : undefined}
                              className="text-primary hover:underline transition-colors break-all"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        })()
                      );
                    },
                    h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mb-6 mt-8 text-primary text-left wrap-break-word" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mb-4 mt-6 text-white text-left wrap-break-word" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mb-3 mt-4 text-white text-left wrap-break-word" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-300 mb-4 leading-relaxed text-left wrap-break-word" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2 text-left" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2 text-left" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-primary pl-4 italic text-gray-400 my-4 text-left" {...props} />
                    ),
                    img: ({ node, src, alt, ...props }) => {
                      
                      let resolvedSrc = src;
                      
                      if (src && readmeBaseUrl) {
                        if (src.startsWith('http')) {
                          resolvedSrc = src;
                        } else if (isGitHubBlobBase) {
                          if (src.startsWith('/') || src.startsWith('./')) {
                            const cleanSrc = src.startsWith('./') ? src.slice(2) : src.slice(1);
                            const rawBaseUrl = readmeBaseUrl
                              .replace('github.com', 'raw.githubusercontent.com')
                              .replace('/blob/', '/');
                            resolvedSrc = `${rawBaseUrl}/${cleanSrc}`;
                          } else {
                            const rawBaseUrl = readmeBaseUrl
                              .replace('github.com', 'raw.githubusercontent.com')
                              .replace('/blob/', '/');
                            resolvedSrc = `${rawBaseUrl}/${src}`;
                          }
                        } else {
                          // Local README: resolve relative images against local base directory
                          if (src.startsWith('/')) {
                            resolvedSrc = resolvePublicUrl(src);
                          } else {
                            resolvedSrc = resolveAgainstBase(src);
                          }
                        }
                      }
                      
                      // Detectar si es un badge mediante múltiples criterios
                      const altText = (alt || '').toLowerCase();
                      const srcText = (src || '').toLowerCase();
                      
                      const isBadge = 
                        // URLs de servicios de badges
                        srcText.includes('shields.io') || 
                        srcText.includes('badgen.net') ||
                        srcText.includes('img.shields') ||
                        srcText.includes('badge.fury.io') ||
                        srcText.includes('codecov.io') ||
                        srcText.includes('travis-ci.org') ||
                        srcText.includes('circleci.com') ||
                        srcText.includes('david-dm.org') ||
                        // Palabras clave en la URL o alt
                        srcText.includes('/badge') ||
                        srcText.includes('-badge') ||
                        altText.includes('badge') ||
                        altText.includes('shield') ||
                        altText.includes('license') ||
                        altText.includes('version') ||
                        altText.includes('npm') ||
                        altText.includes('build') ||
                        altText.includes('coverage') ||
                        altText.includes('status') ||
                        // Extensiones SVG comúnmente usadas para badges
                        (srcText.endsWith('.svg') && (
                          srcText.includes('badge') || 
                          altText.includes('badge') ||
                          altText.includes('license') ||
                          altText.includes('version')
                        ));
                      
                      return (
                        <img 
                          src={resolvedSrc}
                          alt={alt}
                          className={isBadge 
                            ? "my-2 max-w-full inline-block align-middle" 
                            : "rounded-lg my-6 w-full block"
                          }
                          loading={isBadge ? "eager" : "lazy"}
                          decoding="async"
                          {...props} 
                        />
                      );
                    },
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-6 code-scrollbar">
                        <table className="min-w-full border border-primary/20" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => <th className="border border-primary/20 px-4 py-2 bg-dark-lighter text-primary" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-primary/20 px-4 py-2 text-gray-300" {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) => {
                      if (inline) {
                        return <code className="bg-dark-lighter px-2 py-1 rounded text-primary font-mono text-sm" {...props}>{children}</code>;
                      }
                      return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                    },
                    pre: ({ node, children, ...props }) => (
                      <pre className="bg-dark-lighter rounded-lg overflow-x-auto mb-6 relative group code-scrollbar" {...props}>
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {readme}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {!readme && (
            <div className="card text-center py-12">
              <HiCode className="text-6xl text-gray-600 mx-auto mb-4" />
              {readmeError ? (
                <div>
                  {readmeError.status === 429 && (
                    <>
                      <p className="text-xl text-yellow-400 mb-2">⚠️ {t('projectsDetails.readmeError429')}</p>
                      <p className="text-sm text-gray-500">Error 429: Too Many Requests</p>
                    </>
                  )}
                  {readmeError.status === 404 && (
                    <>
                      <p className="text-xl text-red-400 mb-2">❌ {t('projectsDetails.readmeError404')}</p>
                      <p className="text-sm text-gray-500">Error 404: Not Found</p>
                    </>
                  )}
                  {readmeError.status === 'invalid' && (
                    <>
                      <p className="text-xl text-orange-400 mb-2">🚫 {t('projectsDetails.readmeErrorInvalid')}</p>
                      <p className="text-sm text-gray-500">Invalid file format detected</p>
                    </>
                  )}
                  {readmeError.status !== 429 && readmeError.status !== 404 && readmeError.status !== 'invalid' && (
                    <>
                      <p className="text-xl text-red-400 mb-2">⚠️ {t('projectsDetails.readmeErrorGeneric')}</p>
                      <p className="text-sm text-gray-500">Error {readmeError.status}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xl text-gray-400">{t('projectsDetails.noReadme')}</p>
              )}
            </div>
          )}

        </div>
    );
};

export default ProjectReadme;