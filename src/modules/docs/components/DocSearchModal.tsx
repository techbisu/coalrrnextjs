'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Folder, BookOpen, X, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import type { DocItem } from '@/lib/docs/docReader';

interface DocSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDocs: DocItem[];
}

export function DocSearchModal({ isOpen, onClose, allDocs }: DocSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal handled by parent
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDocs = React.useMemo(() => {
    if (!query.trim()) return allDocs.slice(0, 8);
    const q = query.toLowerCase();
    return allDocs
      .filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.relativePath.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [allDocs, query]);

  const handleSelect = (slugPath: string) => {
    onClose();
    router.push(`/docs/${slugPath}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-row items-center gap-3 space-y-0">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <Input
            type="text"
            placeholder="Search documentation by title, category, or path..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="border-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 h-9 p-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300 p-1"
            >
              Clear
            </button>
          )}
        </DialogHeader>

        <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1 text-xs divide-y divide-slate-800/40">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <p>No documentation found matching &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-600">Try searching for keywords like &ldquo;workflow&rdquo;, &ldquo;architecture&rdquo;, or &ldquo;checklist&rdquo;</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelect(doc.slugPath)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/60 text-left transition-colors group"
              >
                <div className="space-y-0.5 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                      {doc.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-800 border-slate-700 text-slate-400">
                      {doc.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate pl-5">
                    {doc.relativePath}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>

        <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Esc</kbd> to exit</span>
          </div>
          <span>Showing {filteredDocs.length} of {allDocs.length} docs</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
