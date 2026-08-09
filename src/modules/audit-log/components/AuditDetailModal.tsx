import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { JsonDiffViewer } from './JsonDiffViewer';
import { format } from 'date-fns';
import { Terminal, Database, Activity, Clock, ShieldAlert, Monitor, User } from 'lucide-react';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // The activity_log with application_log joined
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 overflow-y-auto p-0">
        
        {/* Header section with white background */}
        <div className="bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
          <SheetHeader>
            <SheetTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              Payload Inspection
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Bento Grid Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            
            {/* Event Type */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" /> Event Type
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 font-bold">{log.activity}</p>
            </div>
            
            {/* Timestamp */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Timestamp
              </div>
              <p className="text-slate-900 dark:text-slate-200 font-mono text-sm">
                {log.entry_ts ? format(new Date(log.entry_ts), 'yyyy-MM-dd HH:mm:ss.SSS') : 'N/A'}
              </p>
            </div>
            
            {/* Target Table */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" /> Target Table
              </div>
              <p className="text-slate-900 dark:text-slate-200 font-mono text-sm">{log.table_name || 'N/A'}</p>
            </div>
            
            {/* Actor ID */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <User className="w-3.5 h-3.5" /> Actor ID
              </div>
              <p className="text-slate-900 dark:text-slate-200 font-medium">{log.action_by || 'System'}</p>
            </div>

            {/* Origin IP */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" /> Origin IP
              </div>
              <p className="text-slate-700 dark:text-slate-400 font-mono text-sm">{log.ip_address || 'Unknown'}</p>
            </div>

            {/* User Agent */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">
                <Monitor className="w-3.5 h-3.5" /> User Agent
              </div>
              <p className="text-slate-700 dark:text-slate-400 truncate text-sm" title={log.user_agent}>
                {log.user_agent || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Diff Viewer / Empty State */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>
               <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>
               <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>
               <h3 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest ml-2">SQL Difference Matrix</h3>
            </div>
            
            {log.application_log ? (
              <div className="p-1 bg-slate-950">
                <JsonDiffViewer 
                  oldData={log.application_log.old_data} 
                  newData={log.application_log.new_data} 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Database className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-medium">No payload data captured</p>
                <p className="text-xs mt-1 text-slate-400 text-center max-w-[250px]">
                  This activity was logged without detailed SQL differences (e.g. read event or simple create).
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
