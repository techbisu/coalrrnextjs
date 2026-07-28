'use client'

import { useAuth } from '@/authorization/providers/AuthProvider'

export function useRole() {
  const { user } = useAuth()

  const hasRole = (role: string) => {
    if (!user) return false
    return user.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]) => {
    if (!user) return false
    return roles.some(r => user.roles.includes(r))
  }

  const hasAllRoles = (roles: string[]) => {
    if (!user) return false
    return roles.every(r => user.roles.includes(r))
  }

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    roles: user?.roles || []
  }
}
