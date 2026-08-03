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
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { LanguageDTO } from '../application/use-cases/GetLanguagesUseCase';
import { toggleLanguageActiveAction, setDefaultLanguageAction } from '@/app/(dashboard)/admin/localization/actions';
import { toast } from 'sonner';
import { Check, Star, Settings2 } from 'lucide-react';

interface LanguageDataTableProps {
  data: LanguageDTO[];
}

export function LanguageDataTable({ data }: LanguageDataTableProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setIsUpdating(id);
    const result = await toggleLanguageActiveAction(id, isActive);
    if (result.success) {
      toast.success('Language status updated.');
    } else {
      toast.error(result.message || 'Failed to update language.');
    }
    setIsUpdating(null);
  };

  const handleSetDefault = async (id: string) => {
    setIsUpdating(id);
    const result = await setDefaultLanguageAction(id);
    if (result.success) {
      toast.success('Default language updated.');
    } else {
      toast.error(result.message || 'Failed to set default language.');
    }
    setIsUpdating(null);
  };

  const columns: ColumnDef<LanguageDTO>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-bold">{row.original.code}</code>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.flag && <span className="text-lg">{row.original.flag}</span>}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: 'native_name',
      header: 'Native Name',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.native_name}</span>,
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
      cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.direction}</Badge>,
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => {
        const isDefault = row.original.is_default;
        return (
          <Switch 
            checked={row.original.is_active} 
            onCheckedChange={(checked) => handleToggleActive(row.original.id, checked)}
            disabled={isDefault || isUpdating === row.original.id}
          />
        );
      }
    },
    {
      accessorKey: 'is_default',
      header: 'Default',
      cell: ({ row }) => {
        const isDefault = row.original.is_default;
        const isActive = row.original.is_active;
        
        if (isDefault) {
          return (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 gap-1 pl-1.5">
              <Star className="h-3 w-3 fill-current" />
              Default
            </Badge>
          );
        }

        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
            disabled={!isActive || isUpdating === row.original.id}
            onClick={() => handleSetDefault(row.original.id)}
          >
            Set Default
          </Button>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Settings2 className="h-8 w-8 opacity-20" />
                  <p>No languages found.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
