import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface JsonDiffViewerProps {
  oldData?: any;
  newData?: any;
}

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffItem {
  key: string;
  oldValue: string;
  newValue: string;
  status: DiffStatus;
}

export const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({ oldData = {}, newData = {} }) => {
  const diffs = useMemo(() => {
    const oldObj = typeof oldData === 'string' ? JSON.parse(oldData || '{}') : (oldData || {});
    const newObj = typeof newData === 'string' ? JSON.parse(newData || '{}') : (newData || {});

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();

    return allKeys.map((key): DiffItem => {
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      
      const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? '');
      const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? '');

      let status: DiffStatus = 'unchanged';
      if (oldVal === undefined && newVal !== undefined) status = 'added';
      else if (oldVal !== undefined && newVal === undefined) status = 'removed';
      else if (oldStr !== newStr) status = 'changed';

      return {
        key,
        oldValue: oldStr,
        newValue: newStr,
        status
      };
    }).filter(d => d.status !== 'unchanged');
  }, [oldData, newData]);

  if (diffs.length === 0) {
    return <div className="text-sm text-slate-500 italic p-6 text-center bg-slate-50 dark:bg-slate-900/50">No payload data to display.</div>;
  }

  const isCreateAction = diffs.every(d => d.status === 'added');
  const isDeleteAction = diffs.every(d => d.status === 'removed');

  return (
    <div className="w-full bg-white dark:bg-slate-950 font-mono text-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold text-xs tracking-wider w-1/4">FIELD KEY</th>
            <th className="px-4 py-3 font-semibold text-xs tracking-wider w-1/4">STATUS</th>
            {!isCreateAction && <th className="px-4 py-3 font-semibold text-xs tracking-wider w-1/4">PREV VAL</th>}
            {!isDeleteAction && <th className="px-4 py-3 font-semibold text-xs tracking-wider w-1/4">NEW VAL</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {diffs.map(({ key, oldValue, newValue, status }) => (
            <tr key={key} className={status === 'unchanged' ? 'bg-slate-50/50 dark:bg-slate-900/20' : 'bg-transparent'}>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium text-xs">{key}</td>
              <td className="px-4 py-3">
                {status === 'added' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20 rounded-sm">++ ADDED</Badge>}
                {status === 'removed' && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20 rounded-sm">-- REMOVED</Badge>}
                {status === 'changed' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20 rounded-sm">~~ CHANGED</Badge>}
                {status === 'unchanged' && <Badge variant="outline" className="text-slate-500 border-slate-200 dark:border-slate-700 rounded-sm">== UNCHANGED</Badge>}
              </td>
              {!isCreateAction && (
                <td className={`px-4 py-3 break-all text-xs ${status === 'removed' || status === 'changed' ? 'bg-rose-50/50 text-rose-600 line-through dark:bg-rose-950/30 dark:text-rose-300/70' : 'text-slate-500'}`}>
                  {oldValue}
                </td>
              )}
              {!isDeleteAction && (
                <td className={`px-4 py-3 break-all text-xs ${status === 'added' || status === 'changed' ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {newValue}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
