'use client'

import React, { ReactNode } from 'react'
import { useRole } from '../hooks/useRole'

export interface RoleGuardProps {
  role: string | string[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  role, 
  requireAll = false,
  children, 
  fallback = null 
}) => {
  const { hasRole, hasAnyRole, hasAllRoles } = useRole()

  let isAllowed = false

  if (Array.isArray(role)) {
    isAllowed = requireAll ? hasAllRoles(role) : hasAnyRole(role)
  } else {
    isAllowed = hasRole(role)
  }

  if (isAllowed) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
