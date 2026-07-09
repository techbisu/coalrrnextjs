import * as React from 'react'
import { EnterpriseShell } from '@/shared/components/layout/EnterpriseShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnterpriseShell>
      {children}
    </EnterpriseShell>
  )
}
