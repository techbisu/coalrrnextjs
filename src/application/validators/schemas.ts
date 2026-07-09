/**
 * API Validation Schemas using Zod.
 * Centralized validation for all API requests.
 */
import { z } from 'zod'

// ===================== Project Schemas =====================

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(500, 'Name must be less than 500 characters'),
  collieryCode: z.string().min(1, 'Colliery code is required').max(50, 'Colliery code must be less than 50 characters'),
  totalLandLimitAcres: z.coerce.number().positive('Land limit must be positive'),
  totalBudgetCeiling: z.coerce.number().positive('Budget ceiling must be positive'),
  totalEmploymentQuota: z.coerce.number().int('Employment quota must be an integer').nonnegative('Employment quota cannot be negative'),
  boundary: z.string().optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  collieryCode: z.string().min(1).max(50).optional(),
  totalLandLimitAcres: z.coerce.number().positive().optional(),
  totalBudgetCeiling: z.coerce.number().positive().optional(),
  totalEmploymentQuota: z.coerce.number().int().nonnegative().optional(),
  statutoryClearances: z.string().optional(),
})

// ===================== Proposal Schemas =====================

export const CreateProposalSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  scheduleCode: z.string().min(1, 'Schedule code is required'),
  acquisitionMode: z.enum(['cba_act', 'direct_purchase', 'rfctlarr', 'patta']),
  proposalTitle: z.string().min(1, 'Proposal title is required').max(500),
  description: z.string().optional(),
  proposedBy: z.string().optional(),
  areaOffice: z.string().optional(),
  collieryCode: z.string().optional(),
})

// ===================== Payroll Schemas =====================

export const CreatePayrollSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  multiplicationFactor: z.coerce.number().min(0).max(10).default(1),
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
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ===================== Types =====================

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>
export type CreatePayrollInput = z.infer<typeof CreatePayrollSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>