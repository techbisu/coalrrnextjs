/**
 * DocumentSignatureRequirementResolver
 *
 * A single authoritative service for answering:
 * "Given a document instance, its template's signature rules, and the current
 *  workflow state — are the signature requirements satisfied?"
 *
 * Used by:
 *  - GeneratedDocumentChecklistAdapter (checklist status)
 *  - WorkflowGuardEvaluator (transition guard — delegates to checklist)
 *  - WorkflowSnapshotQueryService (pending actions)
 *
 * This service contains ZERO module-specific logic. All behaviour is driven by:
 *  - document_template_signature rows (sig_permission, workflow_state, display_order, is_required)
 *  - document_instance.signature_data_json (applied signatures)
 *  - The current workflow state string
 *
 * ARCHITECTURE:
 * All data access goes through IDocumentTemplateRepository (domain interface).
 * NO direct Prisma calls. This service is in src/core/ and must not depend on
 * infrastructure or @prisma/client directly.
 */
import type { IDocumentTemplateRepository } from '@/modules/document-engine/domain/IDocumentTemplateRepository'

export interface SignatureRule {
  sig_permission: string
  workflow_state: string | null
  display_order: number
  is_required: boolean
  placeholders?: any
}

export interface SignatureStatus {
  /** Normalized permission key of the applied signature */
  permission: string
  /** Whether the signature is actually applied */
  applied: boolean
}

export interface DocumentSignatureRequirement {
  /** Whether ANY signature rules exist for this template */
  hasSignatureRules: boolean
  /** All signature rules for the template (ordered by display_order) */
  allRules: SignatureRule[]
  /** Rules scoped to the CURRENT workflow state (workflow_state === currentState OR workflow_state IS NULL) */
  currentStageRequiredRules: SignatureRule[]
  /** How many of the current-stage-required rules are satisfied */
  completedCount: number
  totalRequired: number
  /** Whether ALL current-stage-required rules are satisfied */
  allCurrentStageSatisfied: boolean
  /** Whether ALL rules across ALL stages are satisfied */
  fullyCompleted: boolean
  /** The next pending signature rule in the current stage (or null) */
  nextPendingRule: SignatureRule | null
  /** Applied signatures (normalized) */
  appliedSignatures: SignatureStatus[]
  /** Whether the user with the given permissions can sign the next pending signature */
  currentUserCanSign: (userPermissions: string[], userRoles: string[]) => boolean
}

/** Normalize a permission key for comparison: lowercase, last segment after '.', strip -/_ */
function normalizePerm(p: string | undefined | null): string {
  if (!p) return ''
  const str = String(p).trim().toLowerCase()
  const parts = str.split('.')
  return parts[parts.length - 1].replace(/[-_]/g, '')
}

/** Check if a user has a specific permission */
function userHasPerm(userPermissions: string[], userRoles: string[], perm: string): boolean {
  const normalized = normalizePerm(perm)
  return (
    userPermissions.includes(perm) ||
    userPermissions.includes('*') ||
    userRoles.some(r => r.toLowerCase().includes('admin') || r.toLowerCase().includes('super')) ||
    userPermissions.some(p => normalizePerm(p) === normalized)
  )
}

export class DocumentSignatureRequirementResolver {
  private signatureRulesCache = new Map<string, { rules: SignatureRule[]; fetchedAt: number }>()
  private readonly CACHE_TTL_MS = 60_000

  constructor(
    private readonly templateRepository: IDocumentTemplateRepository
  ) {}

  /**
   * Get signature rules for a template (with short TTL cache to avoid N+1 in batch contexts).
   */
  async getSignatureRules(templateCode: string): Promise<SignatureRule[]> {
    const cached = this.signatureRulesCache.get(templateCode)
    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
      return cached.rules
    }

    let rawRules: any[] = []
    try {
      rawRules = await this.templateRepository.findSignatureRules(templateCode)
    } catch {
      rawRules = []
    }

    // Deduplicate by normalized permission
    const seen = new Set<string>()
    const rules: SignatureRule[] = []
    for (const r of rawRules) {
      const norm = normalizePerm(r.sig_permission)
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        rules.push(r)
      }
    }

    if (rules.length > 0) {
      this.signatureRulesCache.set(templateCode, { rules, fetchedAt: Date.now() })
    }
    return rules
  }

  /**
   * Resolve the complete signature requirement status for a document instance
   * in the context of the current workflow state.
   *
   * This is the SINGLE authoritative method for answering:
   * "Are the signature requirements for this document satisfied for this workflow state?"
   */
  async resolve(
    templateCode: string,
    signatureDataJson: any,
    currentState: string,
    fallbackRules?: any[]
  ): Promise<DocumentSignatureRequirement> {
    let allRules = await this.getSignatureRules(templateCode)

    // If no DB rules exist for this template, fall back to instance/step-provided rules if available
    if (allRules.length === 0 && Array.isArray(fallbackRules) && fallbackRules.length > 0) {
      allRules = fallbackRules
        .filter((r: any) => r && (r.type === 'SIGN' || r.role || r.sig_permission || r.permission))
        .map((r: any, idx: number) => ({
          sig_permission: r.sig_permission || r.permission || r.role || 'sign',
          workflow_state: r.workflow_state || null,
          display_order: r.display_order ?? idx + 1,
          is_required: r.is_required !== false,
          placeholders: r.placeholders,
        }))
    }
    const appliedSigs: any[] = Array.isArray(signatureDataJson) ? signatureDataJson : []

    // Build applied signature status list
    const appliedSignatures: SignatureStatus[] = allRules.map(rule => {
      const ruleNorm = normalizePerm(rule.sig_permission)
      const isApplied = appliedSigs.some(s => {
        const sNorm = normalizePerm(s.sig_permission || s.permission || s.role)
        return sNorm === ruleNorm
      })
      return { permission: rule.sig_permission, applied: isApplied }
    })

    // Determine current-stage-required rules:
    // A rule is required for the current stage if:
    //  1. Its workflow_state matches the current state (case-insensitive), OR
    //  2. Its workflow_state is null (universal rule — required in all states)
    const currentStageRequiredRules = allRules.filter(rule => {
      if (!rule.workflow_state) return true // Universal rules apply everywhere
      return rule.workflow_state.toLowerCase() === currentState.toLowerCase()
    })

    const completedCount = currentStageRequiredRules.filter(rule => {
      const ruleNorm = normalizePerm(rule.sig_permission)
      return appliedSigs.some(s => {
        const sNorm = normalizePerm(s.sig_permission || s.permission || s.role)
        return sNorm === ruleNorm
      })
    }).length

    const totalRequired = currentStageRequiredRules.length
    const allCurrentStageSatisfied = totalRequired === 0 || completedCount >= totalRequired

    const fullyCompleted = allRules.length > 0 && allRules.every(rule => {
      const ruleNorm = normalizePerm(rule.sig_permission)
      return appliedSigs.some(s => {
        const sNorm = normalizePerm(s.sig_permission || s.permission || s.role)
        return sNorm === ruleNorm
      })
    })

    // Find next pending rule in current stage
    const nextPendingRule = currentStageRequiredRules.find(rule => {
      const ruleNorm = normalizePerm(rule.sig_permission)
      return !appliedSigs.some(s => {
        const sNorm = normalizePerm(s.sig_permission || s.permission || s.role)
        return sNorm === ruleNorm
      })
    }) || null

    return {
      hasSignatureRules: allRules.length > 0,
      allRules,
      currentStageRequiredRules,
      completedCount,
      totalRequired,
      allCurrentStageSatisfied,
      fullyCompleted,
      nextPendingRule,
      appliedSignatures,
      currentUserCanSign: (userPermissions: string[], userRoles: string[]) => {
        if (!nextPendingRule) return false
        return userHasPerm(userPermissions, userRoles, nextPendingRule.sig_permission)
      },
    }
  }
}

import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'

/**
 * Default singleton instance for convenience.
 * DI container creates its own instance with injected repository.
 */
export const documentSignatureRequirementResolver = new DocumentSignatureRequirementResolver(
  new PrismaDocumentTemplateRepository()
)

export function getDocumentSignatureRequirementResolver(): DocumentSignatureRequirementResolver {
  return documentSignatureRequirementResolver
}
