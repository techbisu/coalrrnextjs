import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditDetailModal } from './AuditDetailModal';

export const AuditLogTable = ({ data, onPageChange, currentPage, totalPages, loading }: any) => {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading audit logs...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-gray-500 border rounded-md bg-gray-50">No audit logs found for the selected criteria.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Timestamp</th>
              <th className="px-4 py-3 font-medium text-gray-700">Activity</th>
              <th className="px-4 py-3 font-medium text-gray-700">Table</th>
              <th className="px-4 py-3 font-medium text-gray-700">Actor</th>
              <th className="px-4 py-3 font-medium text-gray-700">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {log.entry_ts ? format(new Date(log.entry_ts), 'yyyy-MM-dd HH:mm:ss') : '-'}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {log.activity}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono bg-white">{log.table_name || 'N/A'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-gray-800">{log.action_by || 'System'}</span>
                    <span className="text-xs text-gray-400 font-mono">{log.ip_address}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AuditDetailModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        log={selectedLog} 
      />
    </div>
  );
};
