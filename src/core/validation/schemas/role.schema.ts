import * as z from 'zod'

export const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  display_name: z.string().min(2, 'Display Name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  is_system: z.boolean().default(false),
})

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  display_name: z.string().min(2, 'Display Name must be at least 2 characters').optional(),
  description: z.string().optional().or(z.literal('')),
})
