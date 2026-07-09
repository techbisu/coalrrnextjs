'use client'

import React, { ReactNode } from 'react'
import { usePermission } from '../hooks/usePermission'

export interface CannotProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export const Cannot: React.FC<CannotProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission, hasAllPermissions } = usePermission()

  const canDo = Array.isArray(permission)
    ? hasAllPermissions(permission)
    : hasPermission(permission)

  if (!canDo) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
