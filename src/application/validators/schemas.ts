/**
 * API Validation Schemas using Zod.
 * Centralized validation for all API requests.
 */
import { z } from 'zod'

// ===================== Project Schemas =====================

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(500, 'Name must be less than 500 characters'),
  mine_cd: z.string().min(1, 'Colliery code is required').max(50, 'Colliery code must be less than 50 characters'),
  area_cd: z.string().optional(),
  state_lgd: z.coerce.bigint().optional(),
  pr_doc_id: z.string().nullable().optional(),
  mouza_lgds: z.array(z.coerce.bigint()).optional(),
  total_land_limit_acres: z.coerce.number().positive('Land limit must be positive'),
  land_budget: z.coerce.number().nonnegative('Land budget cannot be negative'),
  rr_budget: z.coerce.number().nonnegative('R&R budget cannot be negative'),
  total_employment_quota: z.coerce.number().int('Employment quota must be an integer').nonnegative('Employment quota cannot be negative'),
  boundary: z.string().optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  mine_cd: z.string().min(1).max(50).optional(),
  area_cd: z.string().optional(),
  state_lgd: z.coerce.bigint().optional(),
  pr_doc_id: z.string().nullable().optional(),
  mouza_lgds: z.array(z.coerce.bigint()).optional(),
  total_land_limit_acres: z.coerce.number().positive().optional(),
  land_budget: z.coerce.number().nonnegative().optional(),
  rr_budget: z.coerce.number().nonnegative().optional(),
  total_employment_quota: z.coerce.number().int().nonnegative().optional(),
  statutory_clearances: z.string().optional(),
  boundary: z.string().optional(),   // GeoJSON polygon stringified
})

export const LockBaselineSchema = z.object({
  confirmName: z.string().min(1, 'Confirmation name is required'),
  approvedAreaAcres: z.coerce.number().positive(),
  approvedBudgetINR: z.coerce.number().positive(),
  approvedJobs: z.coerce.number().int().nonnegative().optional().default(0),
  approvalDate: z.string().min(1, 'Approval date is required'),
  approvalRefNo: z.string().min(1, 'Reference number is required'),
  docId: z.string().optional(),
  mouzaLgds: z.array(z.string()).optional(),
})

export const GenerateFormXXIISchema = z.object({
  proposedAreaAcres: z.coerce.number().positive('Proposed area must be positive'),
  proposedJobs: z.coerce.number().int().nonnegative().optional().default(0),
})

export const ApproveFormXXIISchema = z.object({
  approvedAreaAcres: z.coerce.number().positive('Approved area must be positive'),
  approvedJobs: z.coerce.number().int().nonnegative().optional().default(0),
  approvalDate: z.string().min(1, 'Approval date is required'),
  approvalRefNo: z.string().min(1, 'Reference number is required'),
  docId: z.string().min(1, 'Document ID is required'),
  mouzaLgds: z.array(z.string()).optional(),
})

// ===================== Proposal Schemas =====================

export const CreateProposalSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  acquisition_mode: z.enum(['cba_act', 'direct_purchase', 'rfctlarr', 'patta']),
  proposal_title: z.string().min(1, 'Proposal title is required').max(500),
  description: z.string().optional(),
  area_office: z.string().optional(),
  adjacent_colliery: z.string().optional(),
  notification_date: z.string().datetime().optional(),
})

export const UpdateProposalSchema = z.object({
  proposal_title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  area_office: z.string().optional(),
  adjacent_colliery: z.string().optional(),
  notification_date: z.string().datetime().optional(),
})

// ===================== Checklist Schemas =====================

export const UpdateChecklistItemSchema = z.object({
  itemKey: z.string().min(1, 'Item key is required'),
  status: z.enum(['pending', 'in_progress', 'complete', 'not_applicable']),
})

// ===================== Plot Schemas =====================

export const AddPlotSchema = z.object({
  plot_id: z.string().min(1, 'Plot ID is required'),
  annexure_tag: z.enum(['A', 'B', 'C']),
})

export const UpdatePlotAnnexureSchema = z.object({
  annexure_tag: z.enum(['A', 'B', 'C']),
})

// ===================== Payroll Schemas =====================

export const CreatePayrollSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  multiplication_factor: z.coerce.number().min(0).max(10).default(1),
})

// ===================== Auth Schemas =====================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  mobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid mobile number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}).refine(data => data.email || data.mobile, {
  message: 'Either email or mobile is required',
})

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').optional(),
  mobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid mobile number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  portal: z.enum(['ecl', 'public']),
  role: z.string().optional(),
})

// ===================== Pagination Schemas =====================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// ===================== Types =====================

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type LockBaselineInput = z.infer<typeof LockBaselineSchema>
export type GenerateFormXXIIInput = z.infer<typeof GenerateFormXXIISchema>
export type ApproveFormXXIIInput = z.infer<typeof ApproveFormXXIISchema>
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>
export type UpdateChecklistItemInput = z.infer<typeof UpdateChecklistItemSchema>
export type AddPlotInput = z.infer<typeof AddPlotSchema>
export type UpdatePlotAnnexureInput = z.infer<typeof UpdatePlotAnnexureSchema>
export type CreatePayrollInput = z.infer<typeof CreatePayrollSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>