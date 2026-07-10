import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  guard_name: z.string().default('web'),
})

export const permissionSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  module: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  guard_name: z.string().default('web'),
})

export const syncRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export const syncPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})
