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

  // Filter items if search query is active
  const isSearching = searchQuery.trim().length > 0;
  const filterQuery = searchQuery.toLowerCase();

  const filterFiles = (files: DocItem[]) =>
    files.filter(
      (f) => f.title.toLowerCase().includes(filterQuery) || f.relativePath.toLowerCase().includes(filterQuery)
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
    <aside className="w-full flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
        <Link href="/docs" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              COALRR Docs
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono">
                {allDocsCount} files
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">Developer Knowledge Base</p>
          </div>
        </Link>
      </div>

      {/* Filter Input */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <Input
            type="text"
            placeholder="Filter documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-xs text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
        {/* Subfolders (Architecture, SOP, Agent Rules, etc.) */}
        {rootSubfolders.map((folder) => {
          const isExpanded = isSearching || (expandedFolders[folder.slugPath] ?? false);
          const folderIcon =
            folder.name === 'architecture' ? (
              <Layers className="w-3.5 h-3.5 text-sky-400" />
            ) : folder.name === 'sop' ? (
              <Compass className="w-3.5 h-3.5 text-amber-400" />
            ) : folder.name === 'agent-rules' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            );

          return (
            <div key={folder.slugPath} className="space-y-1">
              <button
                onClick={() => toggleFolder(folder.slugPath)}
                className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-slate-800/70 text-slate-200 font-semibold text-xs text-left transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  {folderIcon}
                  <span className="truncate group-hover:text-white">{folder.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                  <span className="text-[10px] font-mono opacity-60">
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
                <div className="pl-3 ml-2 border-l border-slate-800 space-y-0.5">
                  {folder.files.map((file) => {
                    const href = `/docs/${file.slugPath}`;
                    const isActive = pathname === href || pathname === `/docs/${file.slugPath}`;

                    return (
                      <Link
                        key={file.id}
                        href={href}
                        onClick={onSelectDoc}
                        className={`flex items-center justify-between p-1.5 rounded-md text-[11px] transition-colors ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className={`w-3 h-3 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="truncate">{file.title}</span>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Nested Subfolders if any */}
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

        {/* Root Files */}
        {rootFiles.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-slate-400" />
              General Modules & Guides
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
                    className={`flex items-center justify-between p-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
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
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>COALRR Framework</span>
        <span className="font-mono text-[10px]">v2.0</span>
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
    <div className="space-y-0.5 pt-1">
      <button
        onClick={() => toggleFolder(folder.slugPath)}
        className="w-full flex items-center justify-between p-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
      >
        <div className="flex items-center gap-1.5 truncate">
          {isExpanded ? <FolderOpen className="w-3 h-3 text-amber-400" /> : <Folder className="w-3 h-3 text-slate-500" />}
          <span className="truncate">{folder.title}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="pl-2 border-l border-slate-800 space-y-0.5">
          {folder.files.map((file) => {
            const href = `/docs/${file.slugPath}`;
            const isActive = pathname === href;
            return (
              <Link
                key={file.id}
                href={href}
                onClick={onSelectDoc}
                className={`flex items-center gap-1.5 p-1 rounded text-[11px] truncate ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate">{file.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
