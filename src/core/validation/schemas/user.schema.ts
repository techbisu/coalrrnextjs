import * as z from 'zod'

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  portal: z.string().min(1, 'Portal is required'),
  role: z.string().min(1, 'Role is required'),
  designation: z.string().optional().or(z.literal('')),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  portal: z.string().min(1, 'Portal is required').optional(),
  role: z.string().min(1, 'Role is required').optional(),
  designation: z.string().optional().or(z.literal('')),
})
