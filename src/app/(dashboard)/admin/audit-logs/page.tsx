import React from 'react'
import { db } from '@/lib/db'
import { AuditGrid } from '@/core/audit/components/AuditGrid'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const logs = await db.audit_log.findMany({
    orderBy: { entry_ts: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
        <p className="text-muted-foreground">Comprehensive overview of system activity and user actions.</p>
      </div>
      <div className="bg-card text-card-foreground shadow-sm rounded-lg border p-6">
        <AuditGrid logs={logs as any} />
      </div>
    </div>
  )
}
