import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  eventType: string;
  userId: string | null;
  createdAt: Date;
  remarks: string | null;
  moduleName: string;
  changes: Array<{
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    jsonDiff: string | null;
  }>;
};

export function ActivityTimeline({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-muted-foreground/20 ml-3 space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-6">
              <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={log.eventType === 'DELETE' ? 'destructive' : log.eventType === 'CREATE' ? 'default' : 'secondary'}>
                    {log.eventType}
                  </Badge>
                  <span className="text-sm font-medium">{log.moduleName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {log.userId && <p className="text-sm text-muted-foreground">User: {log.userId}</p>}
                {log.remarks && <p className="text-sm mt-1">{log.remarks}</p>}
                
                {log.changes.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {log.changes.map((change, i) => (
                      <div key={i} className="text-xs rounded-md bg-muted p-2">
                        {change.fieldName === 'JSON_DIFF' && change.jsonDiff ? (
                          <div className="space-y-1">
                            {Object.entries(JSON.parse(change.jsonDiff)).map(([key, vals]: [string, any]) => (
                              <div key={key} className="grid grid-cols-3 gap-2">
                                <span className="font-semibold truncate">{key}</span>
                                <span className="text-red-500/80 truncate line-through">{String(vals.old)}</span>
                                <span className="text-green-600 dark:text-green-400 truncate">{String(vals.new)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono">{change.fieldName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-muted-foreground pl-4">No activity recorded.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
