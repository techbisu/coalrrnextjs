import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { JsonDiffViewer } from './JsonDiffViewer';
import { format } from 'date-fns';
import { Terminal } from 'lucide-react';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // The activity_log with application_log joined
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 overflow-y-auto">
        <SheetHeader className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <SheetTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            Payload Inspection
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-4 text-sm mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-slate-500 font-medium mb-1">Event Type</p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">{log.activity}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">Timestamp</p>
            <p className="text-slate-900 dark:text-slate-200 font-mono text-xs mt-1.5">
              {log.entry_ts ? format(new Date(log.entry_ts), 'yyyy-MM-dd HH:mm:ss.SSS') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">Actor ID</p>
            <p className="text-slate-900 dark:text-slate-200">{log.action_by || 'System'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">Target Table</p>
            <p className="text-slate-900 dark:text-slate-200 font-mono text-xs mt-1.5">{log.table_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">Origin IP</p>
            <p className="text-slate-700 dark:text-slate-400 font-mono text-xs mt-1.5">{log.ip_address || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">User Agent</p>
            <p className="text-slate-700 dark:text-slate-400 truncate" title={log.user_agent}>{log.user_agent || 'Unknown'}</p>
          </div>
        </div>

        {log.application_log ? (
          <div>
            <h3 className="text-slate-600 dark:text-slate-400 mb-3 text-sm font-semibold uppercase tracking-wider">Diff Viewer</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              <JsonDiffViewer 
                oldData={log.application_log.old_data} 
                newData={log.application_log.new_data} 
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-500 italic bg-slate-900/30 rounded-md border border-slate-800/50">
            [ NO PAYLOAD DATA FOUND ]
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
