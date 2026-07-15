import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditChangePayload } from "../types";

export function AuditDiffViewer({ changes }: { changes: AuditChangePayload[] }) {
  if (!changes || changes.length === 0) return <div className="text-muted-foreground text-sm">No changes recorded.</div>;

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Field</TableHead>
            <TableHead>Old Value</TableHead>
            <TableHead>New Value</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{change.field_name}</TableCell>
              <TableCell className="text-destructive max-w-[200px] truncate" title={change.old_value || ""}>
                {change.old_value || "-"}
              </TableCell>
              <TableCell className="text-emerald-600 dark:text-emerald-400 max-w-[200px] truncate" title={change.new_value || ""}>
                {change.new_value || "-"}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={change.change_type === "ADDED" ? "default" : change.change_type === "DELETED" ? "destructive" : "secondary"}>
                  {change.change_type}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
