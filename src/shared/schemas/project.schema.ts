/**
 * Project Validation Schema — Shared between Client & Server
 * Per AGENTS.md validation.md rule: Single source of truth for validation rules using Zod.
 */
import { z } from 'zod';

export const ProjectSchema = z.object({
  proj_cd: z.string().max(50, 'validation.max_length').optional().default(''),
  ecl_proj_cd: z.string().max(50, 'validation.max_length').optional().default(''),
  proj_nm: z.string().min(2, 'validation.required').max(200, 'validation.max_length').optional(),
  name: z.string().min(1, 'validation.required').max(500, 'validation.max_length').optional(),
  area_cd: z.string().min(1, 'validation.required'),
  mine_cd: z.string().min(1, 'validation.required').optional(),
  mine_cds: z.array(z.string()).optional(),
  state_lgd: z.union([z.string(), z.number()]).optional(),
  district_lgd: z.union([z.string(), z.number()]).optional(),
  block_lgds: z.array(z.string()).optional().default([]),
  proj_status: z.string().default('ACTIVE'),
  is_combo_project: z.boolean().default(false),
  linked_mine_codes: z.array(z.string()).default([]),
  mouza_lgds: z.array(z.string()).optional().default([]),

  // Type-Wise Approved Land Baselines (Acres)
  approved_tenancy_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_govt_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_patta_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_forest_area: z.coerce.number().nonnegative('validation.positive_number').default(0),

  // Use-Wise Approved Land Baselines (Acres)
  approved_excavation_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_safety_zone_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_ob_dump_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_infra_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_diversion_area: z.coerce.number().nonnegative('validation.positive_number').default(0),
  approved_rehab_area: z.coerce.number().nonnegative('validation.positive_number').default(0),

  // Financial & Employment Baselines
  total_land_limit_acres: z.coerce.number().nonnegative('validation.positive_number').optional(),
  land_budget: z.coerce.number().nonnegative('validation.positive_number').default(0),
  rr_budget: z.coerce.number().nonnegative('validation.positive_number').default(0),
  total_employment_quota: z.coerce.number().int().nonnegative('validation.positive_number').optional(),
  sanctioned_employment_count: z.coerce.number().int().nonnegative('validation.positive_number').default(0),
  pr_doc_id: z.string().nullable().optional(),
  boundary: z.string().optional(),
}).refine(data => data.proj_nm || data.name, {
  message: 'validation.required',
  path: ['proj_nm'],
})

export const CreateProjectSchema = ProjectSchema

export type ProjectInput = z.input<typeof ProjectSchema>;
export type ProjectOutput = z.output<typeof ProjectSchema>;
