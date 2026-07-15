'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface AuthUser {
  id: string
  portal: 'ecl' | 'public'
  role: string
  email: string | null
  mobile: string | null
  name: string
  designation: string | null
  mine_cd: string | null
  plot_id: string | null
  roleLabel?: string
  roles: string[]
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (portal: 'ecl' | 'public', role: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return null
      const data = await res.json()
      return data?.user || null
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ portal, role }: { portal: 'ecl' | 'public'; role: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal, role }),
      })
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: async (portal, role) => {
          await loginMutation.mutateAsync({ portal, role })
        },
        logout: async () => {
          await logoutMutation.mutateAsync()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
