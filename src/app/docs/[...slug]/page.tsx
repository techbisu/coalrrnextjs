import * as React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDocBySlug, getAllDocFiles } from '@/lib/docs/docReader';
import { DocMarkdownViewer } from '@/modules/docs/components/DocMarkdownViewer';
import { DocToc } from '@/modules/docs/components/DocToc';
import { DocPagination } from '@/modules/docs/components/DocPagination';
import { Badge } from '@/shared/components/ui/badge';
import { Clock, FileCode, Calendar } from 'lucide-react';

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) return { title: 'Document Not Found — COALRR Docs' };

  return {
    title: `${doc.meta.title} — COALRR Developer Docs`,
    description: `Read ${doc.meta.title} in the COALRR Framework developer documentation.`,
  };
}

export async function generateStaticParams() {
  const allDocs = getAllDocFiles();
  return allDocs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function DocSlugPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const { meta, content, headings, prevDoc, nextDoc } = doc;
  const cleanContent = content.replace(/^#\s+.+$/m, '').trim();

  return (
    <div className="flex-1 flex w-full justify-center">
      {/* Main Formatted Document Reader */}
      <div className="flex-1 min-w-0 max-w-4xl p-6 md:p-10 space-y-6">
        {/* Document Header Metadata Bar */}
        <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              {meta.category}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {meta.relativePath}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {meta.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {meta.readingTimeMinutes} min read
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-sky-500" />
              {(meta.sizeBytes / 1024).toFixed(1)} KB
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Updated {new Date(meta.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Rendered Formatted Markdown View */}
        <DocMarkdownViewer content={cleanContent} />

        {/* Previous / Next Document Footer Links */}
        <DocPagination prevDoc={prevDoc} nextDoc={nextDoc} />
      </div>

      {/* Sticky Table of Contents Navigation (Right Sub-Panel) */}
      <DocToc headings={headings} />
    </div>
  );
}
