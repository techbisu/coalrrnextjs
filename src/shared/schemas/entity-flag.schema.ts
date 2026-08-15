import { z } from 'zod'
import { CHECKABLE_ENTITY_TYPES, MODULE_CODES } from '@/core/config/module-codes.config'

/**
 * Valid canonical entity types accepted by the Entity Flag system.
 */
export const CANONICAL_ENTITY_TYPES = [
  CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
  CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL,
  CHECKABLE_ENTITY_TYPES.EMPLOYMENT_APPLICATION,
  CHECKABLE_ENTITY_TYPES.FORM_I_CLAIM,
  CHECKABLE_ENTITY_TYPES.PROJECT,
  // Also support upper-case canonical module code equivalents
  MODULE_CODES.LAND_SCHEDULE,
  MODULE_CODES.COMPENSATION_PAYROLL,
  MODULE_CODES.EMPLOYMENT_APP,
  MODULE_CODES.FORM_I_CLAIM,
  MODULE_CODES.PROJECT,
] as const

export const SetEntityFlagSchema = z.object({
  entityType: z.string().min(1, 'validation.required').refine(
    (val) => CANONICAL_ENTITY_TYPES.includes(val.toLowerCase() as any) || CANONICAL_ENTITY_TYPES.includes(val as any),
    { message: 'validation.invalid_entity_type' }
  ),
  entityId: z.string().min(1, 'validation.required').max(64, 'validation.max_length_exceeded'),
  flagCode: z.string().min(1, 'validation.required').max(80, 'validation.max_length_exceeded'),
  flagValue: z.any().refine((val) => val !== undefined, { message: 'validation.required' }),
  source: z.string().max(50, 'validation.max_length_exceeded').optional().default('SYSTEM'),
  isOverridden: z.boolean().optional().default(false),
  overrideReason: z.string().nullable().optional(),
  entryBy: z.string().max(64, 'validation.max_length_exceeded').optional(),
})

export type SetEntityFlagInput = z.infer<typeof SetEntityFlagSchema>
