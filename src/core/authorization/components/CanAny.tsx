'use client'

import React, { ReactNode } from 'react'
import { usePermission } from '../hooks/usePermission'

export interface CanAnyProps {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
}

export const CanAny: React.FC<CanAnyProps> = ({ permissions, children, fallback = null }) => {
  const { hasAnyPermission } = usePermission()

  if (hasAnyPermission(permissions)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
