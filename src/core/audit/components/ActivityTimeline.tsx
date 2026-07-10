import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type audit_log = {
  id: string;
  event_type: string;
  user_id: string | null;
  entry_ts: Date;
  remarks: string | null;
  module_name: string;
  changes: Array<{
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    json_diff: string | null;
  }>;
};

export function ActivityTimeline({ logs }: { logs: audit_log[] }) {
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
                  <Badge variant={log.event_type === 'DELETE' ? 'destructive' : log.event_type === 'CREATE' ? 'default' : 'secondary'}>
                    {log.event_type}
                  </Badge>
                  <span className="text-sm font-medium">{log.module_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(log.entry_ts), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {log.user_id && <p className="text-sm text-muted-foreground">user: {log.user_id}</p>}
                {log.remarks && <p className="text-sm mt-1">{log.remarks}</p>}
                
                {log.changes.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {log.changes.map((change, i) => (
                      <div key={i} className="text-xs rounded-md bg-muted p-2">
                        {change.field_name === 'JSON_DIFF' && change.json_diff ? (
                          <div className="space-y-1">
                            {Object.entries(JSON.parse(change.json_diff)).map(([key, vals]: [string, any]) => (
                              <div key={key} className="grid grid-cols-3 gap-2">
                                <span className="font-semibold truncate">{key}</span>
                                <span className="text-red-500/80 truncate line-through">{String(vals.old)}</span>
                                <span className="text-green-600 dark:text-green-400 truncate">{String(vals.new)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono">{change.field_name}</p>
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
