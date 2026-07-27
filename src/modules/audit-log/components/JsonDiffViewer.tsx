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
    });
  }, [oldData, newData]);

  if (diffs.length === 0) {
    return <div className="text-sm text-gray-500 italic">No data to display.</div>;
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 font-medium text-gray-700 w-1/4">Field</th>
            <th className="px-4 py-2 font-medium text-gray-700 w-1/4">Status</th>
            <th className="px-4 py-2 font-medium text-gray-700 w-1/4">Old Value</th>
            <th className="px-4 py-2 font-medium text-gray-700 w-1/4">New Value</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {diffs.map(({ key, oldValue, newValue, status }) => (
            <tr key={key} className={status === 'unchanged' ? 'bg-gray-50/50' : 'bg-white'}>
              <td className="px-4 py-2 font-mono text-xs text-gray-600">{key}</td>
              <td className="px-4 py-2">
                {status === 'added' && <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Added</Badge>}
                {status === 'removed' && <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Removed</Badge>}
                {status === 'changed' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Changed</Badge>}
                {status === 'unchanged' && <Badge variant="outline" className="text-gray-400 border-gray-200">Unchanged</Badge>}
              </td>
              <td className={`px-4 py-2 font-mono text-xs break-all ${status === 'removed' || status === 'changed' ? 'bg-red-50/50 text-red-900 line-through opacity-70' : 'text-gray-500'}`}>
                {oldValue}
              </td>
              <td className={`px-4 py-2 font-mono text-xs break-all ${status === 'added' || status === 'changed' ? 'bg-green-50/50 text-green-900 font-medium' : 'text-gray-500'}`}>
                {newValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
