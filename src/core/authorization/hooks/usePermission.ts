'use client'

import { useAuth } from '@/authorization/providers/AuthProvider'

export function usePermission() {
  const { user } = useAuth()
  
  const hasPermission = (permission: string) => {
    if (!user) return false
    if (user.roles?.includes('super_administrator')) return true
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]) => {
    if (!user) return false
    if (user.roles?.includes('super_administrator')) return true
    return permissions.some(p => user.permissions.includes(p))
  }

  const hasAllPermissions = (permissions: string[]) => {
    if (!user) return false
    if (user.roles?.includes('super_administrator')) return true
    return permissions.every(p => user.permissions.includes(p))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions || []
  }
}
