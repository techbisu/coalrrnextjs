"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/shared/components/ui/input";

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function DiffViewer({ oldData, newData }: { oldData: any, newData: any }) {
  if (!oldData && !newData) return <div className="text-muted-foreground p-4 text-sm">No details available</div>
  
  // Calculate diff using the same logic we did on server
  const ignoreFields = ['entryTs', 'updtTs', 'entry_ts', 'updt_ts', 'entryBy', 'updtBy', 'entry_by', 'updt_by']
  const diff: { field: string, old: any, new: any }[] = []
  
  const o = typeof oldData === 'string' ? JSON.parse(oldData) : (oldData || {})
  const n = typeof newData === 'string' ? JSON.parse(newData) : (newData || {})

  const allKeys = new Set([...Object.keys(o), ...Object.keys(n)])
  for (const key of allKeys) {
    if (ignoreFields.includes(key)) continue
    if (JSON.stringify(o[key]) !== JSON.stringify(n[key])) {
      diff.push({ field: key, old: o[key], new: n[key] })
    }
  }

  return (
    <div className="bg-muted p-4 rounded-md mt-2 space-y-2">
      <h4 className="text-sm font-semibold">Changes:</h4>
      {diff.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tracked fields were changed.</p>
      ) : (
        <div className="border rounded-md bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-1/3">Field</TableHead>
                <TableHead className="w-1/3">Old Value</TableHead>
                <TableHead className="w-1/3">New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diff.map((d) => (
                <TableRow key={d.field}>
                  <TableCell className="font-medium text-xs">{d.field}</TableCell>
                  <TableCell className="text-xs text-red-600/90 bg-red-50/50 dark:bg-red-950/20">{JSON.stringify(d.old) ?? 'null'}</TableCell>
                  <TableCell className="text-xs text-green-600/90 bg-green-50/50 dark:bg-green-950/20">{JSON.stringify(d.new) ?? 'null'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function AuditGrid({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filteredLogs = logs.filter(log => 
    log.activity?.toLowerCase().includes(search.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.action_by?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null)
    else setExpandedRow(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search logs..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow className={expandedRow === log.id ? "bg-muted/20" : ""}>
                  <TableCell>
                    {log.application_log_id ? (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRow(log.id)}>
                        {expandedRow === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.entry_ts)}</TableCell>
                  <TableCell className="font-medium">{log.activity}</TableCell>
                  <TableCell>
                    {log.table_name ? <Badge variant="outline">{log.table_name}</Badge> : '-'}
                  </TableCell>
                  <TableCell>{log.action_by || "System"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.ip_address || "-"}</TableCell>
                </TableRow>
                {expandedRow === log.id && log.application_log && (
                  <TableRow className="bg-muted/5 border-b">
                    <TableCell colSpan={6} className="p-0 border-b-0">
                      <div className="px-14 py-2 bg-gradient-to-r from-muted/10 to-transparent">
                        <DiffViewer 
                          oldData={log.application_log.old_data} 
                          newData={log.application_log.new_data} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No audit logs match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
