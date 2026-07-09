'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { ViewKey } from '@/lib/constants/navigation'

export type NominationView = 'list' | 'form' | 'tracking'

interface UiStateContextValue {
  view: ViewKey
  selectedPayrollId: string | null
  selectedScheduleId: string | null
  selectedProjectId: string | null
  selectedClaimForNomination: string | null
  selectedPoolId: string | null
  nominationView: NominationView
  actorRole: string
  setView: (v: ViewKey) => void
  selectPayroll: (id: string | null) => void
  selectSchedule: (id: string | null) => void
  selectProject: (id: string | null) => void
  setSelectedClaimForNomination: (id: string | null) => void
  setSelectedPoolId: (id: string | null) => void
  setNominationView: (v: NominationView) => void
  setActorRole: (r: string) => void
}

const UiStateContext = createContext<UiStateContextValue | undefined>(undefined)

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewKey>('dashboard')
  const [selectedPayrollId, selectPayroll] = useState<string | null>(null)
  const [selectedScheduleId, selectSchedule] = useState<string | null>(null)
  const [selectedProjectId, selectProject] = useState<string | null>(null)
  const [selectedClaimForNomination, setSelectedClaimForNomination] = useState<string | null>(null)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)
  const [nominationView, setNominationView] = useState<NominationView>('list')
  const [actorRole, setActorRole] = useState<string>('area_office')

  return (
    <UiStateContext.Provider
      value={{
        view,
        selectedPayrollId,
        selectedScheduleId,
        selectedProjectId,
        selectedClaimForNomination,
        selectedPoolId,
        nominationView,
        actorRole,
        setView,
        selectPayroll,
        selectSchedule,
        selectProject,
        setSelectedClaimForNomination,
        setSelectedPoolId,
        setNominationView,
        setActorRole,
      }}
    >
      {children}
    </UiStateContext.Provider>
  )
}

export function useUiState() {
  const context = useContext(UiStateContext)
  if (context === undefined) {
    throw new Error('useUiState must be used within a UiStateProvider')
  }
  return context
}
