'use client';

import * as React from 'react';
import { AlignLeft, ChevronRight } from 'lucide-react';
import type { DocHeading } from '@/lib/docs/docReader';

interface DocTocProps {
  headings: DocHeading[];
}

export function DocToc({ headings }: DocTocProps) {
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -40% 0px' }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="w-64 shrink-0 hidden lg:block p-4 space-y-3 border-l border-slate-200 dark:border-slate-800 text-xs sticky top-14 h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
        <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />
        <span>On This Page</span>
      </div>

      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const isH1 = heading.level === 1;
          const isH2 = heading.level === 2;
          const isH3 = heading.level === 3;

          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`block truncate transition-colors py-1 ${
                isH1 ? 'font-bold text-slate-800 dark:text-slate-200' : isH2 ? 'pl-2 text-slate-600 dark:text-slate-400' : 'pl-4 text-slate-500 dark:text-slate-500 text-[11px]'
              } ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-l-2 border-emerald-500 pl-2'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {heading.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
