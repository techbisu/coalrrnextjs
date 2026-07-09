'use client'

import { useAuth } from '@/authorization/providers/AuthProvider'

export function usePermission() {
  const { user } = useAuth()
  
  const hasPermission = (permission: string) => {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]) => {
    if (!user) return false
    return permissions.some(p => user.permissions.includes(p))
  }

  const hasAllPermissions = (permissions: string[]) => {
    if (!user) return false
    return permissions.every(p => user.permissions.includes(p))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions || []
  }
}
