'use client'

import * as React from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'

export interface CollapsibleSectionCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleSectionCard({
  title,
  subtitle,
  badge,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-200 overflow-hidden', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">{title}</span>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">Toggle {title}</span>
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-border/60 animate-in fade-in-50 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
