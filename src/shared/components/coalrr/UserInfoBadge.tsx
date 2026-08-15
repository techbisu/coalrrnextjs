'use client'

import * as React from 'react'
import { Building2, MapPin, Phone, Mail, Shield } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'

export interface UserInfoBadgeProps {
  user?: {
    id?: number | string
    name?: string
    designation?: string
    mobile?: string
    email?: string
    area_name?: string
    colliery_name?: string
  } | null
  role?: string
  className?: string
}

function getInitials(name?: string): string {
  if (!name) return 'OFF'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatRoleLabel(roleStr?: string): string {
  if (!roleStr) return 'Officer'
  return roleStr
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function UserInfoBadge({ user, role, className = '' }: UserInfoBadgeProps) {
  // ONLY render when real user data with a name exists
  if (!user || !user.name) {
    if (!role) return null
    return <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRoleLabel(role)}</span>
  }

  // If user.name is purely numeric (e.g. "5"), resolve to human readable title
  const rawNameStr = String(user.name).trim()
  const isNumericName = /^\d+$/.test(rawNameStr)
  const userName = isNumericName
    ? (role ? formatRoleLabel(role) : `Officer (ID: ${rawNameStr})`)
    : rawNameStr

  const userDesignation = user.designation || (role ? formatRoleLabel(role) : 'Officer')
  const initials = getInitials(userName)

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-900 hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-400 transition-colors ${className}`}>
            <Avatar className="h-4.5 w-4.5 border border-sky-400 shrink-0">
              <AvatarFallback className="text-[9px] font-bold bg-sky-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span>{userName}</span>
            {userDesignation && (
              <span className="text-[11px] text-slate-500 font-normal">
                ({userDesignation})
              </span>
            )}
          </span>
        </TooltipTrigger>

        <TooltipContent side="top" sideOffset={6} className="p-3.5 w-64 text-xs space-y-2.5 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl rounded-xl">
          <div className="flex items-center gap-2.5 border-b pb-2 border-slate-800">
            <Avatar className="h-8 w-8 border border-sky-400">
              <AvatarFallback className="text-xs font-bold bg-sky-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs truncate">{userName}</p>
              <p className="text-[11px] text-sky-400 font-medium truncate">{userDesignation}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-300 text-[11px]">
            {role && (
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Role: <strong className="text-white">{formatRoleLabel(role)}</strong></span>
              </div>
            )}
            {user.area_name && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span className="truncate">Area: <strong className="text-white">{user.area_name}</strong></span>
              </div>
            )}
            {user.colliery_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">Colliery / Unit: <strong className="text-white">{user.colliery_name}</strong></span>
              </div>
            )}
            {user.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span>Mobile: <strong className="text-white">{user.mobile}</strong></span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
