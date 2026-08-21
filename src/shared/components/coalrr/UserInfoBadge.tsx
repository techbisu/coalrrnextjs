'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Phone, Mail, Shield } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Badge } from '@/shared/components/ui/badge'

export interface UserInfoBadgeProps {
  userId?: number | string
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
  const lower = roleStr.toLowerCase()
  if (lower === 'unit_office') return 'Unit Office'
  if (lower === 'unit_surveyor') return 'Unit Surveyor'
  if (lower === 'land_clerk') return 'Land Clerk'
  if (lower === 'area_office') return 'Area Nodal Officer'
  if (lower === 'gm_planning' || lower === 'lre') return 'GM (Planning / LRE)'
  if (lower === 'gm_finance') return 'GM (Finance)'
  if (lower === 'director') return 'Director (Technical)'
  if (lower === 'cmd') return 'CMD'
  return roleStr
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function UserInfoBadge({ userId: directUserId, user: passedUser, role, className = '' }: UserInfoBadgeProps) {
  const resolvedUserId = directUserId || passedUser?.id

  // Fetch authentic user profile from /api/users/[id]
  const { data: fetchedUser } = useQuery({
    queryKey: ['user-profile', resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null
      const res = await fetch(`/api/users/${resolvedUserId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: Boolean(resolvedUserId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Merge authentic fetched profile over passed user props
  const activeUser = fetchedUser || passedUser

  // ONLY render when real user data with a name exists
  if (!activeUser || !activeUser.name) {
    if (!role) return null
    return <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRoleLabel(role)}</span>
  }

  // If user.name is purely numeric (e.g. "5"), resolve to human readable title
  const rawNameStr = String(activeUser.name).trim()
  const isNumericName = /^\d+$/.test(rawNameStr)
  const userName = isNumericName
    ? (role ? formatRoleLabel(role) : `Officer (ID: ${rawNameStr})`)
    : rawNameStr

  const userDesignation = activeUser.designation || activeUser.role_name || (role ? formatRoleLabel(role) : undefined)
  const initials = getInitials(userName)
  const userId = activeUser.id ? String(activeUser.id) : null

  // Use authentic role_name from auth DB, fallback to role prop if not "Drafting" state
  const cleanRole = activeUser.role_name || (role && role.toLowerCase() !== 'drafting' ? role : undefined)

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

        <TooltipContent side="top" sideOffset={6} className="p-3.5 w-72 text-xs space-y-2.5 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl rounded-xl z-50">
          <div className="flex items-center gap-2.5 border-b pb-2.5 border-slate-800">
            <Avatar className="h-9 w-9 border-2 border-sky-400 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-sky-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-white text-xs truncate">{userName}</p>
                {userId && (
                  <Badge variant="outline" className="text-[9px] font-mono border-slate-700 text-slate-300 px-1.5 py-0">
                    ID: {userId}
                  </Badge>
                )}
              </div>
              {userDesignation && (
                <p className="text-[11px] text-sky-400 font-medium truncate">{userDesignation}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-slate-300 text-[11px]">
            {cleanRole && (
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Role: <strong className="text-white">{formatRoleLabel(cleanRole)}</strong></span>
              </div>
            )}
            {activeUser.area_name && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span className="truncate">Area: <strong className="text-white">{activeUser.area_name}</strong></span>
              </div>
            )}
            {activeUser.colliery_name && activeUser.colliery_name !== activeUser.area_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">Colliery / Unit: <strong className="text-white">{activeUser.colliery_name}</strong></span>
              </div>
            )}
            {activeUser.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span>Mobile: <strong className="text-white">{activeUser.mobile}</strong></span>
              </div>
            )}
            {activeUser.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span className="truncate text-slate-200">{activeUser.email}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
