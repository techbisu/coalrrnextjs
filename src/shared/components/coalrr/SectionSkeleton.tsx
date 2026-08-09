'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

export function SectionSkeleton({ title }: { title?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm min-h-[220px] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-medium">{title || 'Loading section...'}</span>
    </div>
  )
}
