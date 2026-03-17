import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

import CodeBlock from '@components/code/CodeBlock';
import { publicPath } from '@/utils/publicPath';

export type ResolveHeadingId = (level: number, rawText: string) => string;

function slugifyHeading(text: string) {
    return (text || '')
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 64);
}

function createHeadingIdFactory() {
    const seen = new Map<string, number>();
    return (text: string) => {
        const base = slugifyHeading(text) || 'section';
        const next = (seen.get(base) || 0) + 1;
        seen.set(base, next);
        return next === 1 ? base : `${base}-${next}`;
    };
}

function flattenText(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(flattenText).join('');
    if (typeof node === 'object' && 'props' in node) return flattenText((node as any).props?.children);
    return '';
}

function normalizeHeadingText(raw: string) {
    return (raw || '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[`*_~]/g, '')
        .trim();
}

export default function BlogMarkdown({
    markdown,
    resolveHeadingId,
}: {
    markdown: string;
    resolveHeadingId?: ResolveHeadingId;
}) {
    const getId = useMemo(() => createHeadingIdFactory(), [markdown]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
            components={{
                a: ({ children, href, ...props }: any) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline transition-colors"
                        {...props}
                    >
                        {children}
                    </a>
                ),
                h1: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(1, text) : getId(text);
                    return (
                        <h1 id={id} className="scroll-mt-28 text-4xl font-bold mb-6 mt-8 text-primary clear-both" {...props}>
                            {children}
                        </h1>
                    );
                },
                h2: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(2, text) : getId(text);
                    return (
                        <h2 id={id} className="scroll-mt-28 text-3xl font-bold mb-4 mt-6 text-white clear-both" {...props}>
                            {children}
                        </h2>
                    );
                },
                h3: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(3, text) : getId(text);
                    return (
                        <h3 id={id} className="scroll-mt-28 text-2xl font-bold mb-3 mt-4 text-white clear-both" {...props}>
                            {children}
                        </h3>
                    );
                },
                h4: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(4, text) : getId(text);
                    return (
                        <h4 id={id} className="scroll-mt-28 text-xl font-bold mb-2 mt-4 text-white clear-both" {...props}>
                            {children}
                        </h4>
                    );
                },
                h5: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(5, text) : getId(text);
                    return (
                        <h5 id={id} className="scroll-mt-28 text-lg font-bold mb-2 mt-4 text-white clear-both" {...props}>
                            {children}
                        </h5>
                    );
                },
                h6: ({ children, ...props }: any) => {
                    const text = normalizeHeadingText(flattenText(children));
                    const id = resolveHeadingId ? resolveHeadingId(6, text) : getId(text);
                    return (
                        <h6 id={id} className="scroll-mt-28 text-base font-bold mb-2 mt-4 text-white clear-both" {...props}>
                            {children}
                        </h6>
                    );
                },
                p: (props: any) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
                ul: (props: any) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2" {...props} />,
                ol: (props: any) => <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2" {...props} />,
                blockquote: (props: any) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-gray-400 my-4" {...props} />
                ),
                table: (props: any) => (
                    <div className="overflow-x-auto my-6 code-scrollbar clear-both">
                        <table className="min-w-full border border-primary/20" {...props} />
                    </div>
                ),
                th: (props: any) => <th className="border border-primary/20 px-4 py-2 bg-dark-lighter text-primary" {...props} />,
                td: (props: any) => <td className="border border-primary/20 px-4 py-2 text-gray-300" {...props} />,
                figure: ({ className, ...props }: any) => (
                    <figure className={['clear-both', className].filter(Boolean).join(' ')} {...props} />
                ),
                figcaption: ({ className, ...props }: any) => (
                    <figcaption className="text-gray-400 text-sm mt-2 mb-4" {...props} />
                ),
                img: ({ className, ...props }: any) => {
                    const rawSrc = typeof props?.src === 'string' ? props.src : '';
                    const src = rawSrc && rawSrc.startsWith('/') ? publicPath(rawSrc) : rawSrc;
                    return (
                        <img
                            className={['max-w-full h-auto', className].filter(Boolean).join(' ')}
                            loading="lazy"
                            decoding="async"
                            {...props}
                            src={src}
                        />
                    );
                },
                // react-markdown v10 types don't expose `inline`; infer inline by missing language class.
                code: (props: any) => {
                    const { className, children, ...rest } = props;
                    const isInline = !className;

                    if (isInline) {
                        return (
                            <code className="bg-dark-lighter px-2 py-1 rounded text-primary" {...rest}>
                                {children}
                            </code>
                        );
                    }

                    return (
                        <CodeBlock className={className} {...rest}>
                            {children}
                        </CodeBlock>
                    );
                },
                pre: (props: any) => (
                    <pre className="bg-dark-lighter rounded-lg overflow-x-auto mb-6 relative group code-scrollbar clear-both" {...props} />
                ),
            }}
        >
            {markdown}
        </ReactMarkdown>
    );
}
