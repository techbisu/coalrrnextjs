import * as z from 'zod'

export const permissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  display_name: z.string().min(2, 'Display Name must be at least 2 characters'),
  module: z.string().optional().or(z.literal('')),
  group: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

export const updatePermissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  display_name: z.string().min(2, 'Display Name must be at least 2 characters').optional(),
  module: z.string().optional().or(z.literal('')),
  group: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})
