'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import type { DocItem } from '@/lib/docs/docReader';

interface DocPaginationProps {
  prevDoc: DocItem | null;
  nextDoc: DocItem | null;
}

export function DocPagination({ prevDoc, nextDoc }: DocPaginationProps) {
  if (!prevDoc && !nextDoc) return null;

  return (
    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {prevDoc ? (
        <Link
          href={`/docs/${prevDoc.slugPath}`}
          className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group"
        >
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
            <ArrowLeft className="w-3 h-3 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
            Previous
          </span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
            {prevDoc.title}
          </span>
          <span className="text-[11px] text-slate-500 truncate mt-0.5">
            {prevDoc.category}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {nextDoc ? (
        <Link
          href={`/docs/${nextDoc.slugPath}`}
          className="flex flex-col items-end text-right p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group"
        >
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
            Next
            <ArrowRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
            {nextDoc.title}
          </span>
          <span className="text-[11px] text-slate-500 truncate mt-0.5">
            {nextDoc.category}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
