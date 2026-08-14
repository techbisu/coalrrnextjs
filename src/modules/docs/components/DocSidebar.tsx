'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  ShieldCheck,
  Layers,
  FileCode,
  Compass,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import type { DocItem, DocFolder } from '@/lib/docs/docReader';

interface DocSidebarProps {
  tree: { files: DocItem[]; subfolders: DocFolder[] };
  allDocsCount: number;
  onSelectDoc?: () => void;
}

export function DocSidebar({ tree, allDocsCount, onSelectDoc }: DocSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({
    architecture: true,
    sop: true,
    'agent-rules': true,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const isSearching = searchQuery.trim().length > 0;
  const filterQuery = searchQuery.toLowerCase();

  const filterFiles = (files: DocItem[]) =>
    files.filter(
      (f) =>
        f.title.toLowerCase().includes(filterQuery) ||
        f.relativePath.toLowerCase().includes(filterQuery)
    );

  const filterFolder = (folder: DocFolder): DocFolder | null => {
    const matchingFiles = filterFiles(folder.files);
    const matchingSubfolders = folder.subfolders
      .map(filterFolder)
      .filter((sf): sf is DocFolder => sf !== null);

    if (matchingFiles.length > 0 || matchingSubfolders.length > 0) {
      return {
        ...folder,
        files: matchingFiles,
        subfolders: matchingSubfolders,
      };
    }
    return null;
  };

  const rootFiles = filterFiles(tree.files);
  const rootSubfolders = isSearching
    ? tree.subfolders.map(filterFolder).filter((sf): sf is DocFolder => sf !== null)
    : tree.subfolders;

  return (
    <aside className="w-full flex flex-col h-full bg-slate-50/90 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 select-none">
      {/* Filter Input at Top of Sidebar */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder="Filter docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-500/50 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {/* Subfolders (Architecture, SOP, Agent Rules, etc.) */}
        {rootSubfolders.map((folder) => {
          const isExpanded = isSearching || (expandedFolders[folder.slugPath] ?? false);
          const folderIcon =
            folder.name === 'architecture' ? (
              <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
            ) : folder.name === 'sop' ? (
              <Compass className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            ) : folder.name === 'agent-rules' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            );

          return (
            <div key={folder.slugPath} className="space-y-0.5">
              <button
                onClick={() => toggleFolder(folder.slugPath)}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold text-xs text-left transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  {folderIcon}
                  <span className="truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {folder.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
                  <span className="text-[10px] font-mono opacity-80 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                    {folder.files.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="pl-2 ml-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                  {folder.files.map((file) => {
                    const href = `/docs/${file.slugPath}`;
                    const isActive = pathname === href || pathname === `/docs/${file.slugPath}`;

                    return (
                      <Link
                        key={file.id}
                        href={href}
                        onClick={onSelectDoc}
                        className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText
                            className={`w-3 h-3 shrink-0 ${
                              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                          <span className="truncate">{file.title}</span>
                        </div>
                      </Link>
                    );
                  })}

                  {folder.subfolders.map((sf) => (
                    <RenderSubfolder
                      key={sf.slugPath}
                      folder={sf}
                      pathname={pathname}
                      expandedFolders={expandedFolders}
                      toggleFolder={toggleFolder}
                      isSearching={isSearching}
                      onSelectDoc={onSelectDoc}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Root General Files */}
        {rootFiles.length > 0 && (
          <div className="space-y-0.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-emerald-500" />
              General Guides
            </div>

            <div className="space-y-0.5">
              {rootFiles.map((file) => {
                const href = `/docs/${file.slugPath}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={file.id}
                    href={href}
                    onClick={onSelectDoc}
                    className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{file.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
        <span>COALRR Framework</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{allDocsCount} docs</span>
      </div>
    </aside>
  );
}

function RenderSubfolder({
  folder,
  pathname,
  expandedFolders,
  toggleFolder,
  isSearching,
  onSelectDoc,
}: {
  folder: DocFolder;
  pathname: string;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  isSearching: boolean;
  onSelectDoc?: () => void;
}) {
  const isExpanded = isSearching || (expandedFolders[folder.slugPath] ?? false);

  return (
    <div className="space-y-0.5 pt-0.5">
      <button
        onClick={() => toggleFolder(folder.slugPath)}
        className="w-full flex items-center justify-between p-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <div className="flex items-center gap-1.5 truncate">
          {isExpanded ? (
            <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-3 h-3 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{folder.title}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
          {folder.files.map((file) => {
            const href = `/docs/${file.slugPath}`;
            const isActive = pathname === href;
            return (
              <Link
                key={file.id}
                href={href}
                onClick={onSelectDoc}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] truncate transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FileText className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{file.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
