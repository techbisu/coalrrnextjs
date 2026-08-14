'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Copy, Check, ExternalLink, Info, AlertTriangle, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface DocMarkdownViewerProps {
  content: string;
}

export function DocMarkdownViewer({ content }: DocMarkdownViewerProps) {
  return (
    <div className="space-y-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-normal max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h1
                id={id}
                className="scroll-m-20 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 mt-5 mb-2.5 first:mt-0 flex items-center justify-between group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
                <span className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 text-base font-mono">
                  #
                </span>
              </h1>
            );
          },
          h2: ({ children }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h2
                id={id}
                className="scroll-m-20 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
                <span className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 text-sm font-mono">
                  #
                </span>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            return (
              <h3
                id={id}
                className="scroll-m-20 text-sm font-bold text-slate-900 dark:text-slate-200 mt-3 mb-1 flex items-center gap-1.5 group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-5 list-disc space-y-0.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-5 list-decimal space-y-0.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-normal py-0.5">{children}</li>,
          blockquote: ({ children }) => {
            const contentStr = String(children);
            const isNote = contentStr.includes('[!NOTE]');
            const isWarning = contentStr.includes('[!WARNING]') || contentStr.includes('[!CAUTION]');
            const isImportant = contentStr.includes('[!IMPORTANT]') || contentStr.includes('[!TIP]');

            if (isNote || isImportant) {
              return (
                <div className="my-3 p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    <Info className="w-3.5 h-3.5" />
                    <span>NOTE / TIP</span>
                  </div>
                  <div>{children}</div>
                </div>
              );
            }

            if (isWarning) {
              return (
                <div className="my-3 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>WARNING</span>
                  </div>
                  <div>{children}</div>
                </div>
              );
            }

            return (
              <blockquote className="my-3 pl-3 border-l-3 border-emerald-500 italic text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/50 py-1.5 rounded-r-md text-xs">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">{children}</tr>
          ),
          th: ({ children }) => <th className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">{children}</th>,
          td: ({ children }) => (
            <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300 text-xs leading-normal font-mono text-[11px] break-words max-w-sm">
              {children}
            </td>
          ),
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;

            // Handle codebase file:// links e.g. file:///d:/coalrrnextjs/src/...
            if (href.startsWith('file://') || href.includes('file:///')) {
              const cleanPath = href
                .replace(/^file:\/\/\/[a-zA-Z]:\/coalrrnextjs\//i, '')
                .replace(/^file:\/\/\//i, '')
                .replace(/^file:\/\//i, '');
              const filename = cleanPath.split('/').pop() || cleanPath;

              return (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cleanPath);
                    toast.success(`Copied path: ${cleanPath}`);
                  }}
                  title={`Click to copy relative path: ${cleanPath}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                >
                  <FileCode className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[280px]">{filename}</span>
                </button>
              );
            }

            // Handle internal markdown file links e.g. ./architecture/application.md or application.md
            if (href.endsWith('.md') || href.includes('.md#')) {
              const cleanHref = href
                .replace(/^\.\//, '')
                .replace(/^\.\.\//, '')
                .replace(/\.md/, '');
              const docUrl = cleanHref.startsWith('docs/') ? `/${cleanHref}` : `/docs/${cleanHref}`;

              return (
                <Link
                  href={docUrl}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {children}
                </Link>
              );
            }

            // External links
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                {children}
                <ExternalLink className="w-3 h-3 inline opacity-70" />
              </a>
            );
          },
          code: ({ className, children, ...props }) => {
            const isInline = !className && !String(children).includes('\n');
            const codeText = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code
                  className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock code={codeText} language={(className || '').replace('language-', '')} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/80" />
          <div className="w-2 h-2 rounded-full bg-amber-500/80" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
          <span className="ml-1 font-semibold text-slate-300">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-snug text-slate-200 scrollbar-thin scrollbar-thumb-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}
