'use client'

import React, { ReactNode } from 'react'
import { usePermission } from '../hooks/usePermission'

export interface CanProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission, hasAllPermissions } = usePermission()

  const isAllowed = Array.isArray(permission)
    ? hasAllPermissions(permission)
    : hasPermission(permission)

  if (isAllowed) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
