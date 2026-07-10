"use client"

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export function NotificationCenter({ user_id }: { user_id: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user_id],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?user_id=${user_id}`)
      return res.json()
    },
    refetchInterval: 10000 // Poll every 10 seconds for real-time feel
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ id, action: 'mark_read' })
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user_id] })
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ user_id, action: 'mark_all_read' })
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user_id] })
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={() => markAllRead.mutate()}>
                <Check className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n: any) => {
                const isUnread = n.status !== 'READ'
                let payload: any = {}
                try { payload = JSON.parse(n.payload) } catch (e) {}

                return (
                  <div key={n.id} className={`flex gap-3 border-b p-4 transition-colors ${isUnread ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-transparent'}`}>
                    <div className="flex-1 space-y-1">
                      {payload.subject && <p className="text-sm font-medium">{payload.subject}</p>}
                      <p className="text-sm text-muted-foreground">{payload.body}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(n.entry_ts).toLocaleString()}</p>
                    </div>
                    {isUnread && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded-full" onClick={() => markRead.mutate(n.id)}>
                        <Check className="h-3 w-3 text-emerald-600" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
