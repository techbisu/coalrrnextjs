'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Copy, Check, ExternalLink, Info, AlertTriangle, FileCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocMarkdownViewerProps {
  content: string;
}

export function DocMarkdownViewer({ content }: DocMarkdownViewerProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
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
                className="scroll-m-20 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 mt-8 mb-4 first:mt-0 flex items-center justify-between group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
                <span className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 text-lg font-mono">
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
                className="scroll-m-20 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-8 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
                <span className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 text-base font-mono">
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
                className="scroll-m-20 text-base font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2 flex items-center gap-2 group"
              >
                <a href={`#${id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {children}
                </a>
              </h3>
            );
          },
          p: ({ children }) => <p className="mb-4 leading-7 text-slate-700 dark:text-slate-300">{children}</p>,
          ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => {
            const contentStr = String(children);
            const isNote = contentStr.includes('[!NOTE]');
            const isWarning = contentStr.includes('[!WARNING]') || contentStr.includes('[!CAUTION]');
            const isImportant = contentStr.includes('[!IMPORTANT]') || contentStr.includes('[!TIP]');

            if (isNote || isImportant) {
              return (
                <div className="my-4 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    <Info className="w-4 h-4" />
                    <span>NOTE / TIP</span>
                  </div>
                  <div>{children}</div>
                </div>
              );
            }

            if (isWarning) {
              return (
                <div className="my-4 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>WARNING</span>
                  </div>
                  <div>{children}</div>
                </div>
              );
            }

            return (
              <blockquote className="my-4 pl-4 border-l-4 border-emerald-500 italic text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/50 py-2.5 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="my-6 w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800">
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
          th: ({ children }) => <th className="p-3 font-bold text-slate-800 dark:text-slate-200 text-xs">{children}</th>,
          td: ({ children }) => (
            <td className="p-3 text-slate-700 dark:text-slate-300 text-xs leading-relaxed break-words max-w-md">
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
                  title={`Click to copy relative codebase path: ${cleanPath}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                >
                  <FileCode className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[300px]">{filename}</span>
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
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-medium border border-slate-200 dark:border-slate-700/60"
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
    <div className="relative my-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden text-xs shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-semibold text-slate-300">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors"
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

      <pre className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}
