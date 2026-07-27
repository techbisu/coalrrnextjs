import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JsonDiffViewer } from './JsonDiffViewer';
import { format } from 'date-fns';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // The activity_log with application_log joined
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50 p-4 rounded-md border">
          <div>
            <p className="text-gray-500 font-medium mb-1">Activity</p>
            <p className="font-semibold text-gray-800">{log.activity}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Timestamp</p>
            <p className="font-semibold text-gray-800">
              {log.entry_ts ? format(new Date(log.entry_ts), 'PPP p') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Action By</p>
            <p className="font-semibold text-gray-800">{log.action_by || 'System'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Target Table</p>
            <p className="font-mono text-gray-800">{log.table_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">IP Address</p>
            <p className="font-mono text-gray-600">{log.ip_address || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">User Agent</p>
            <p className="text-gray-600 truncate" title={log.user_agent}>{log.user_agent || 'Unknown'}</p>
          </div>
        </div>

        {log.application_log ? (
          <div>
            <h3 className="font-semibold text-lg mb-3">Data Changes</h3>
            <JsonDiffViewer 
              oldData={log.application_log.old_data} 
              newData={log.application_log.new_data} 
            />
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 italic bg-gray-50 rounded-md border">
            No application data changes associated with this activity.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
