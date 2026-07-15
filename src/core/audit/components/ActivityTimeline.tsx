import React from "react";
import { AuditLogPayload } from "../types";

const formatDate = (date: Date | string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export function ActivityTimeline({ logs }: { logs: (AuditLogPayload & { entry_ts: Date | string })[] }) {
  if (!logs || logs.length === 0) return <div className="p-4 text-center text-muted-foreground">No activity found.</div>;

  return (
    <div className="relative border-l border-border ml-3 pl-6 space-y-6 my-4">
      {logs.map((log, index) => (
        <div key={index} className="relative">
          <div className="absolute -left-[31px] bg-background border-2 border-primary rounded-full w-4 h-4 mt-1.5" />
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{log.action} - {log.module}</span>
              <span className="text-xs text-muted-foreground">{formatDate(log.entry_ts)}</span>
            </div>
            {log.description && <p className="text-sm text-muted-foreground">{log.description}</p>}
            {log.entry_by && <span className="text-xs text-muted-foreground">By: {log.entry_by}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
