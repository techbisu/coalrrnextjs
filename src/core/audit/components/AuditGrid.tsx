import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditLogPayload } from "../types";

const formatDate = (date: Date | string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export function AuditGrid({ logs }: { logs: (AuditLogPayload & { id: string, entry_ts: Date | string })[] }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.entry_ts)}</TableCell>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell>{log.module}</TableCell>
              <TableCell>{log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}</TableCell>
              <TableCell>
                <Badge variant={log.status === "SUCCESS" ? "default" : "destructive"}>{log.status}</Badge>
              </TableCell>
              <TableCell>{log.entry_by || "System"}</TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                No audit logs available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
