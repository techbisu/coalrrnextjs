'use client';

import { useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { TranslationDTO } from '../application/use-cases/GetTranslationsUseCase';
import { updateTranslationAction } from '@/app/(dashboard)/admin/localization/actions';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Edit2, Check, X, Search } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { searchParamsParsers } from './search-params';

interface LocalizationDataTableProps {
  data: TranslationDTO[];
  total: number;
  page: number;
  totalPages: number;
}

export function LocalizationDataTable({ data, total, page: currentPage, totalPages }: LocalizationDataTableProps) {
  const [page, setPage] = useQueryState('page', searchParamsParsers.page.withOptions({ shallow: false }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (id: string) => {
    setIsSaving(true);
    const result = await updateTranslationAction(id, editValue);
    if (result.success) {
      toast.success('Translation updated successfully');
      setEditingId(null);
    } else {
      toast.error(result.message || 'Failed to update translation');
    }
    setIsSaving(false);
  };

  const columns: ColumnDef<TranslationDTO>[] = [
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => <span className="font-semibold text-slate-700 dark:text-slate-300">{row.original.module}</span>,
    },
    {
      accessorKey: 'language_name',
      header: 'Language',
    },
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{row.original.key}</code>,
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <Input 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 max-w-[300px]"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSave(row.original.id)} disabled={isSaving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)} disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-between group">
            <span className="truncate max-w-[300px]" title={row.original.value}>{row.original.value}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setEditingId(row.original.id);
                setEditValue(row.original.value);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3">
                      <Search className="h-6 w-6 opacity-40" />
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">No translations found.</p>
                    <p className="text-sm opacity-70">Try adjusting your filters or search query.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing {data.length} of {total} translations
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
