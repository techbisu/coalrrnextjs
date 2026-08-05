/**
 * Proposal Validation Schema — Shared between Client & Server
 * Per AGENTS.md validation.md rule: Single source of truth for validation rules using Zod.
 */
import { z } from 'zod';

export const CreateProposalSchema = z.object({
  proj_cd: z.string().min(1, 'validation.required'),
  area_cd: z.string().min(1, 'validation.required'),
  mine_cd: z.string().min(1, 'validation.required'),
  acq_mode_id: z.number().positive('validation.required'),
  proposal_no: z.string().min(1, 'validation.required'),
  proposal_dt: z.string().min(1, 'validation.required'),
  proposal_type: z.enum(['STANDARD_LAP', 'DRAFT_PR_CHECKLIST_1_4']).default('STANDARD_LAP'),
  purpose_justification: z.string().min(10, 'validation.min_length'),
  
  // Per-Acre Compensation Rates (INR/Acre)
  rate_tenancy_land_with_emp: z.number().nonnegative('validation.positive_number').default(0),
  rate_tenancy_land_no_emp: z.number().nonnegative('validation.positive_number').default(0),
  rate_govt_land: z.number().nonnegative('validation.positive_number').default(0),
  rate_forest_land: z.number().nonnegative('validation.positive_number').default(0),
  
  // Employment & SOP Flags
  employment_proposed_count: z.number().int().nonnegative('validation.positive_number').default(0),
  employment_system: z.enum(['PACKAGE_DEAL', 'TAGGED', 'NONE']).default('PACKAGE_DEAL'),
  has_debottar_land: z.boolean().default(false),
  has_tribal_land: z.boolean().default(false),
  has_formal_negotiation: z.boolean().default(false),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
