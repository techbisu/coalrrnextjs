'use client';

import * as React from 'react';
import { DocSidebar } from './DocSidebar';
import { DocHeader } from './DocHeader';
import { DocSearchModal } from './DocSearchModal';
import type { DocItem, DocFolder } from '@/lib/docs/docReader';

interface DocsLayoutClientProps {
  tree: { files: DocItem[]; subfolders: DocFolder[] };
  allDocs: DocItem[];
  children: React.ReactNode;
}

export function DocsLayoutClient({ tree, allDocs, children }: DocsLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      <DocHeader
        allDocsCount={allDocs.length}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Left Panel) */}
        <div className="hidden lg:block w-72 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
          <DocSidebar tree={tree} allDocsCount={allDocs.length} />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-slate-900 h-full shadow-2xl z-10">
              <DocSidebar
                tree={tree}
                allDocsCount={allDocs.length}
                onSelectDoc={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Workspace Panel */}
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>

      <DocSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allDocs={allDocs}
      />
    </div>
  );
}
