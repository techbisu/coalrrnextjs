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
} as const

export type CanonicalModuleCode = keyof typeof MODULE_CODES

/**
 * Normalizes legacy or variant module string aliases to the canonical ModuleCode.
 * Example: 'land_schedule', 'LAND_ACQ_PROPOSAL', 'LAND_ACQ_SCHEDULE' -> 'LAND_SCHEDULE'
 */
export function normalizeModuleCode(rawCode?: string | null): CanonicalModuleCode {
  if (!rawCode) return 'LAND_SCHEDULE'

  const upper = rawCode.toUpperCase().trim()

  // Land Acquisition aliases
  if (
    upper === 'LAND_SCHEDULE' ||
    upper === 'LAND_ACQ_PROPOSAL' ||
    upper === 'LAND_ACQ_SCHEDULE' ||
    upper === 'LAND_ACQUISITION' ||
    upper === 'PROPOSAL' ||
    upper === 'LAND_SCHEDULE'
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

  return 'LAND_SCHEDULE' // Default safe fallback
}

/**
 * Returns the canonical module code string used for entity_type, workflow_code, and module_code in DB queries.
 */
export function getEntityTypeForModule(moduleCode: CanonicalModuleCode): string {
  return MODULE_CODES[moduleCode] ?? moduleCode
}
