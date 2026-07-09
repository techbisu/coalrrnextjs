'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Bell, Clock, AlertTriangle, CheckCircle2, Info, CheckCheck,
} from 'lucide-react'

export type NotificationType = 'sla' | 'grievance' | 'approval' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read?: boolean
}

export interface NotificationBellProps {
  notifications: Notification[]
  onMarkAllRead?: () => void
  className?: string
}

const TYPE_META: Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  sla:       { icon: Clock,          color: 'text-amber-600 bg-amber-100 dark:bg-amber-950' },
  grievance: { icon: AlertTriangle,  color: 'text-rose-600 bg-rose-100 dark:bg-rose-950' },
  approval:  { icon: CheckCircle2,   color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' },
  info:      { icon: Info,           color: 'text-sky-600 bg-sky-100 dark:bg-sky-950' },
}

export function NotificationBell({ notifications, onMarkAllRead, className }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false)
  const unread = notifications.filter((n) => !n.read)
  const unreadCount = unread.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative h-9 w-9', className)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} new</Badge>}
          </div>
          {unreadCount > 0 && onMarkAllRead && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onMarkAllRead}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type]
                const Icon = meta.icon
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/40',
                      !n.read && 'bg-amber-50/40 dark:bg-amber-950/10',
                    )}
                  >
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', meta.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/70">{n.timestamp}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
