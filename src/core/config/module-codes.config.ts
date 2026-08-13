/**
 * Module Codes Configuration (COALRR spec §2.3).
 *
 * Single source of truth for canonical module codes across the application.
 * Eliminates inconsistent strings like 'LAND_ACQ_PROPOSAL' vs 'LAND_SCHEDULE' vs 'land_schedule'.
 */

export const MODULE_CODES = {
  LAND_SCHEDULE: 'LAND_SCHEDULE',
  COMPENSATION_PAYROLL: 'COMPENSATION_PAYROLL',
  EMPLOYMENT_APP: 'EMPLOYMENT_APP',
  FORM_I_CLAIM: 'FORM_I_CLAIM',
  PROJECT: 'PROJECT',
} as const

export type CanonicalModuleCode = keyof typeof MODULE_CODES

export const CHECKABLE_ENTITY_TYPES = {
  ACQ_LAND_SCHEDULE: 'acq_land_schedule',
  COMPENSATION_PAYROLL: 'compensation_payroll',
  EMPLOYMENT_APPLICATION: 'employment_application',
  FORM_I_CLAIM: 'form_i_claim',
  PROJECT: 'project',
} as const

export const ACQ_LAND_SCHEDULE = CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE

export type CheckableEntityType = typeof CHECKABLE_ENTITY_TYPES[keyof typeof CHECKABLE_ENTITY_TYPES]

export const ACQ_MODE_ID = {
  CBA: 1,
  RFCTLARR: 2,
  GOVT_TRANSFER: 3,
  LEASE_GOVT: 4,
  FOREST_DIVERSION: 5,
  DIRECT_PURCHASE: 6,
  INHERITED_LAND: 7,
  LA_ACT_1948: 8,
  LEASE_TENANCY: 9,
} as const;

/**
 * Normalizes legacy or variant module string aliases to the canonical ModuleCode.
 * Example: 'acq_land_schedule', 'land_schedule', 'LAND_ACQ_PROPOSAL', 'acq_proposal', 'proposal' -> 'LAND_SCHEDULE'
 */
export function normalizeModuleCode(rawCode?: string | null): CanonicalModuleCode {
  if (!rawCode) return 'LAND_SCHEDULE'

  const upper = rawCode.toUpperCase().trim()

  // Land Acquisition aliases
  if (
    upper === 'LAND_SCHEDULE' ||
    upper === 'ACQ_LAND_SCHEDULE' ||
    upper === 'ACQ_PROPOSAL' ||
    upper === 'LAND_ACQ_PROPOSAL' ||
    upper === 'LAND_ACQ_SCHEDULE' ||
    upper === 'LAND_ACQUISITION' ||
    upper === 'PROPOSAL'
  ) {
    return 'LAND_SCHEDULE'
  }

  // Compensation Payroll aliases
  if (upper === 'COMPENSATION_PAYROLL' || upper === 'PAYROLL') {
    return 'COMPENSATION_PAYROLL'
  }

  // Employment Application aliases
  if (upper === 'EMPLOYMENT_APP' || upper === 'EMPLOYMENT_APPLICATION' || upper === 'EMPLOYMENT') {
    return 'EMPLOYMENT_APP'
  }

  // Form-I Claim aliases
  if (upper === 'FORM_I_CLAIM' || upper === 'FORM_I') {
    return 'FORM_I_CLAIM'
  }

  // Project aliases
  if (upper === 'PROJECT' || upper === 'PROJECT_MODULE') {
    return 'PROJECT'
  }

  return 'LAND_SCHEDULE' // Default safe fallback
}

/**
 * Returns the canonical module code string used for entity_type, workflow_code, and module_code in DB queries.
 */
export function getEntityTypeForModule(moduleCode: CanonicalModuleCode): string {
  return MODULE_CODES[moduleCode] ?? moduleCode
}

/**
 * Resolves mode-aware workflow code (e.g. 'LAND_SCHEDULE_CBA_ACT', 'LAND_SCHEDULE_RFCTLARR').
 * Enables mode-specific state machines while falling back to base module code when not custom-configured.
 */
export function resolveWorkflowCode(moduleCode: string, acqModeIdOrCode?: string | number): string {
  const canonicalModule = normalizeModuleCode(moduleCode)
  if (!acqModeIdOrCode) return canonicalModule

  const modeSuffix = String(acqModeIdOrCode).toUpperCase().trim().replace(/[^A-Z0-9]/g, '_')
  return `${canonicalModule}_${modeSuffix}`
}
