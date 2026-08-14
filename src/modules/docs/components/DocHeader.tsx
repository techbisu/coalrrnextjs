'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Clock,
  FileCode,
  Copy,
  Menu,
  X,
  Search,
  BookOpen,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import type { DocItem } from '@/lib/docs/docReader';

interface DocHeaderProps {
  meta?: DocItem;
  allDocsCount?: number;
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
}

export function DocHeader({ meta, allDocsCount = 130, onToggleSidebar, onOpenSearch }: DocHeaderProps) {
  const handleCopyPath = () => {
    if (meta) {
      navigator.clipboard.writeText(meta.relativePath);
      toast.success(`Copied path: ${meta.relativePath}`);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Page link copied to clipboard!');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
      {/* Left Brand Area (Matches w-72 Sidebar) */}
      <div className="w-72 shrink-0 hidden lg:flex items-center justify-between px-4 h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950">
        <Link href="/docs" className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">COALRR Docs</span>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 font-mono"
            >
              {allDocsCount} files
            </Badge>
          </div>
        </Link>
      </div>

      {/* Right Content Header Bar */}
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6 h-full min-w-0">
        {/* Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-2 truncate min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-4 h-4" />
          </Button>

          <Link
            href="/docs"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 shrink-0 lg:hidden"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Docs</span>
          </Link>

          {meta ? (
            <>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">Docs</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {meta.slug.length > 1 && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline font-medium">
                  {meta.category}
                  <ChevronRight className="w-3.5 h-3.5 inline mx-1 text-slate-400" />
                </span>
              )}
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {meta.title}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Developer Documentation Hub
            </span>
          )}
        </div>

        {/* Right Search & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSearch}
              className="h-8 text-xs gap-2 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
                Ctrl K
              </kbd>
            </Button>
          )}

          {meta && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPath}
                title={`Copy relative path: ${meta.relativePath}`}
                className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FileCode className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                <span className="hidden sm:inline font-mono text-[11px]">{meta.relativePath.split('/').pop()}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareLink}
                title="Copy shareable URL"
                className="h-8 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
