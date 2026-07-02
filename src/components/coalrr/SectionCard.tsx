'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface SectionCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * SectionCard — titled Card with optional icon, description, and action slot.
 * Used everywhere for consistent module sectioning.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <CardTitle className="text-base font-semibold leading-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn('pt-0', contentClassName)}>{children}</CardContent>
    </Card>
  )
}
