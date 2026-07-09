'use client'

import React, { createContext, ReactNode } from 'react'

interface AuthorizationContextValue {}

const AuthorizationContext = createContext<AuthorizationContextValue>({})

export const AuthorizationProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthorizationContext.Provider value={{}}>
      {children}
    </AuthorizationContext.Provider>
  )
}
