import { z } from 'zod'

export const CompleteStepSchema = z.object({
  entityType: z.string().min(1, 'validation.required'),
  entityId: z.string().min(1, 'validation.required'),
  stepGroup: z.string().min(1, 'validation.required'),
  stepKey: z.string().min(1, 'validation.required'),
  remarks: z.string().optional(),
}).strict()

export const StepStatusQuerySchema = z.object({
  entityType: z.string().min(1, 'validation.required'),
  entityId: z.string().min(1, 'validation.required'),
  stepGroup: z.string().optional(),
})

export const WorkflowRecipientsQuerySchema = z.object({
  entityType: z.string().min(1, 'validation.required'),
  entityId: z.string().min(1, 'validation.required'),
  targetRole: z.string().min(1, 'validation.required'),
  allowSelf: z.coerce.boolean().optional().default(false),
})

export type CompleteStepInput = z.infer<typeof CompleteStepSchema>
export type StepStatusQueryInput = z.infer<typeof StepStatusQuerySchema>
export type WorkflowRecipientsQueryInput = z.infer<typeof WorkflowRecipientsQuerySchema>
