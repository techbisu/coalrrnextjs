import { z } from 'zod';

export const ChecklistQuerySchema = z.object({
  moduleCode: z.string().min(1, 'Module code is required'),
  checkableType: z.string().min(1, 'Checkable type is required'),
  checkableId: z.string().min(1, 'Checkable ID is required'),
});

export const UpdateSubmissionSchema = z.object({
  moduleCode: z.string().min(1, 'Module code is required'),
  requirementId: z.string().min(1, 'Requirement ID is required'),
  checkableType: z.string().min(1, 'Checkable type is required'),
  checkableId: z.string().min(1, 'Checkable ID is required'),
  documentId: z.string().optional(),
  userInput: z.any().optional(),
});
