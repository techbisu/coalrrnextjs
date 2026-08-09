'use client'

import * as React from 'react'
import { Button } from '@/shared/components/ui/button'
import { FolderOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { EntityFileManagerModal } from './EntityFileManagerModal'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/shared/components/ui/button'

export interface EntityFileManagerTriggerProps {
  entityType: string
  entityId: string
  label?: string
  showCount?: boolean
  defaultTab?: 'list' | 'upload' | 'link'
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  className?: string
}

export function EntityFileManagerTrigger({
  entityType,
  entityId,
  label = 'File Workspace',
  showCount = true,
  defaultTab = 'list',
  variant = 'outline',
  size = 'default',
  className,
}: EntityFileManagerTriggerProps) {
  const [open, setOpen] = React.useState(false)

  const { data: fileCount = 0 } = useQuery({
    queryKey: ['entity-files-count', entityType, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/files/entity/${entityType}/${entityId}`)
      if (!res.ok) return 0
      const json = await res.json()
      return (json.data || []).length
    },
  })

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn('gap-2 group relative', className)}
      >
        <FolderOpen className={cn("h-4 w-4 transition-transform group-hover:scale-110", variant === 'outline' ? 'text-muted-foreground mr-1' : 'text-primary')} />
        <span>{label}</span>
        {showCount && fileCount > 0 && (
          <span className={cn(
            "inline-flex items-center justify-center h-5 min-w-5 rounded-full text-[10px] font-bold px-1.5 ml-1",
            variant === 'outline' ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
          )}>
            {fileCount}
          </span>
        )}
      </Button>

      <EntityFileManagerModal
        open={open}
        onOpenChange={setOpen}
        entityType={entityType}
        entityId={entityId}
        defaultTab={defaultTab}
      />
    </>
  )
}
