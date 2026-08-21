/**
 * Step Groups Configuration (COALRR Universal Workflow Platform).
 *
 * Single source of truth for micro-step groups and multi-signature matrices
 * across all COALRR modules (Land Schedule, Employment Apps, Compensation Payroll).
 *
 * Conforms strictly to AGENTS.md rules and config-management.md requirements.
 */
import { MODULE_CODES, type CanonicalModuleCode } from './module-codes.config'

export interface StepDefinitionConfig {
  readonly stepKey: string
  readonly stepLabel: string
  readonly stepOrder: number
  readonly requiredRole: string
  readonly isMandatory: boolean
  readonly requiredPermission?: string
  readonly showIf?: Record<string, unknown>
}

export interface StepGroupConfig {
  readonly groupCode: string
  readonly groupLabel: string
  readonly requiredForTransition: string
  readonly description?: string
  readonly steps: ReadonlyArray<StepDefinitionConfig>
}

export const STEP_GROUPS_CONFIG: Record<CanonicalModuleCode, Record<string, StepGroupConfig>> = {
  [MODULE_CODES.LAND_SCHEDULE]: {
    FORM_VII_SIGNATURES: {
      groupCode: 'FORM_VII_SIGNATURES',
      groupLabel: 'Form-VII Reconciliation Certificate (12 Signatures)',
      requiredForTransition: 'AreaVetting',
      description: 'Reconciliation signatures from Purchasing Colliery and Adjacent Colliery management teams.',
      steps: [
        { stepKey: 'pur_land_clerk', stepLabel: 'Purchasing Land Clerk', stepOrder: 1, requiredRole: 'land_clerk', isMandatory: true },
        { stepKey: 'pur_surveyor', stepLabel: 'Purchasing Survey Officer', stepOrder: 2, requiredRole: 'surveyor', isMandatory: true },
        { stepKey: 'pur_manager', stepLabel: 'Purchasing Colliery Manager', stepOrder: 3, requiredRole: 'colliery_manager', isMandatory: true },
        { stepKey: 'pur_agent', stepLabel: 'Purchasing Project Agent', stepOrder: 4, requiredRole: 'project_agent', isMandatory: true },
        { stepKey: 'pur_area_officer', stepLabel: 'Purchasing Area Land Officer', stepOrder: 5, requiredRole: 'area_land_officer', isMandatory: true },
        { stepKey: 'pur_area_gm', stepLabel: 'Purchasing Area GM', stepOrder: 6, requiredRole: 'area_gm', isMandatory: true },
        { stepKey: 'adj_land_clerk', stepLabel: 'Adjacent Land Clerk', stepOrder: 7, requiredRole: 'land_clerk', isMandatory: true },
        { stepKey: 'adj_surveyor', stepLabel: 'Adjacent Survey Officer', stepOrder: 8, requiredRole: 'surveyor', isMandatory: true },
        { stepKey: 'adj_manager', stepLabel: 'Adjacent Colliery Manager', stepOrder: 9, requiredRole: 'colliery_manager', isMandatory: true },
        { stepKey: 'adj_agent', stepLabel: 'Adjacent Project Agent', stepOrder: 10, requiredRole: 'project_agent', isMandatory: true },
        { stepKey: 'adj_area_officer', stepLabel: 'Adjacent Area Land Officer', stepOrder: 11, requiredRole: 'area_land_officer', isMandatory: true },
        { stepKey: 'adj_area_gm', stepLabel: 'Adjacent Area GM', stepOrder: 12, requiredRole: 'area_gm', isMandatory: true },
      ],
    },
    FORM_XXII_SIGNATURES: {
      groupCode: 'FORM_XXII_SIGNATURES',
      groupLabel: 'Form-XXII Area Land Cell Scrutiny (3 Signatures)',
      requiredForTransition: 'HqParallelVetting',
      description: 'Scrutiny and vetting signatures from Area Land Cell for forwarding to Headquarter.',
      steps: [
        { stepKey: 'area_cell_member', stepLabel: 'Area Land Cell Member', stepOrder: 1, requiredRole: 'area_land_cell_member', isMandatory: true },
        { stepKey: 'area_land_officer', stepLabel: 'Area Land Officer', stepOrder: 2, requiredRole: 'area_land_officer', isMandatory: true },
        { stepKey: 'area_gm', stepLabel: 'Area General Manager', stepOrder: 3, requiredRole: 'area_gm', isMandatory: true },
      ],
    },
  },
  [MODULE_CODES.EMPLOYMENT_APP]: {
    DOCUMENT_VERIFICATION: {
      groupCode: 'DOCUMENT_VERIFICATION',
      groupLabel: 'Applicant Document Verification',
      requiredForTransition: 'UnitScrutiny',
      description: 'Verification of Aadhaar, Educational Certificates, and Relationship Proofs.',
      steps: [
        { stepKey: 'identity_verified', stepLabel: 'Aadhaar & Identity Verified', stepOrder: 1, requiredRole: 'land_clerk', isMandatory: true },
        { stepKey: 'education_verified', stepLabel: 'Educational Certificate Verified', stepOrder: 2, requiredRole: 'unit_office', isMandatory: true },
        { stepKey: 'land_title_verified', stepLabel: 'Land Ownership Link Verified', stepOrder: 3, requiredRole: 'surveyor', isMandatory: true },
      ],
    },
    COMMITTEE_APPROVAL: {
      groupCode: 'COMMITTEE_APPROVAL',
      groupLabel: 'Employment Screening Committee Approval',
      requiredForTransition: 'ScreeningPassed',
      description: 'Signatures from 3-member Area Screening Committee.',
      steps: [
        { stepKey: 'member_1_sign', stepLabel: 'Screening Officer Signature', stepOrder: 1, requiredRole: 'area_land_officer', isMandatory: true },
        { stepKey: 'member_2_sign', stepLabel: 'Personnel Manager Signature', stepOrder: 2, requiredRole: 'area_office', isMandatory: true },
        { stepKey: 'chairman_sign', stepLabel: 'Area GM Approval Signature', stepOrder: 3, requiredRole: 'area_gm', isMandatory: true },
      ],
    },
  },
  [MODULE_CODES.COMPENSATION_PAYROLL]: {
    PAYROLL_VERIFICATION: {
      groupCode: 'PAYROLL_VERIFICATION',
      groupLabel: 'Compensation Payroll Pre-Audit Verification',
      requiredForTransition: 'ApprovalPending',
      description: 'Pre-audit calculations, land rate verification, and finance budget check.',
      steps: [
        { stepKey: 'calc_verified', stepLabel: 'Valuation & Calculation Audit', stepOrder: 1, requiredRole: 'area_land_officer', isMandatory: true },
        { stepKey: 'beneficiary_verified', stepLabel: 'Bank & Beneficiary Account Audit', stepOrder: 2, requiredRole: 'area_office', isMandatory: true },
        { stepKey: 'budget_verified', stepLabel: 'Finance Budget Concurrence', stepOrder: 3, requiredRole: 'gm_finance', isMandatory: true },
      ],
    },
  },
  [MODULE_CODES.FORM_I_CLAIM]: {},
  [MODULE_CODES.PROJECT]: {},
}

/**
 * Utility helper to retrieve a specific step group configuration safely.
 */
export function getStepGroupConfig(moduleCode: string, groupCode: string): StepGroupConfig | undefined {
  const normModule = moduleCode.toUpperCase() as CanonicalModuleCode
  const moduleConfig = STEP_GROUPS_CONFIG[normModule]
  if (!moduleConfig) return undefined
  return moduleConfig[groupCode]
}
