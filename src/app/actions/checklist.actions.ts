'use server'

import { Container } from '@/infrastructure/di/Container'
import { ChecklistQuerySchema, UpdateSubmissionSchema } from '@/core/validation/schemas/checklist.schema'

export async function getChecklistStatus(moduleCode: string, checkableType: string, checkableId: string) {
  console.log(`[SERVER ACTION] getChecklistStatus started for ${checkableId}`);
  try {
    const parseResult = ChecklistQuerySchema.safeParse({ moduleCode, checkableType, checkableId });
    if (!parseResult.success) {
      throw new Error(`Validation failed: ${parseResult.error.message}`);
    }

    const user = await getCurrentUser().catch(() => null);
    const userPermissions = user?.permissions || [];

    const result = await Container.getChecklistStatusUseCase!.execute({
      ...parseResult.data,
      userPermissions,
    } as any);

    if (result.isFailure) {
      console.log(`[SERVER ACTION] getChecklistStatus failed:`, result.error);
      throw new Error(result.error as string);
    }

    console.log(`[SERVER ACTION] getChecklistStatus success for ${checkableId}`);
    return result.value;
  } catch (err) {
    console.error(`[SERVER ACTION] Error in getChecklistStatus:`, err);
    throw err;
  }
}

import { getCurrentUser } from '@/lib/auth'

export async function updateChecklistSubmission(req: {
  moduleCode: string;
  requirementId: string;
  checkableType: string;
  checkableId: string;
  documentId?: string;
  userInput?: any;
}) {
  // 1. Mandatory Auth Check
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // 2. Input Validation
  const parseResult = UpdateSubmissionSchema.safeParse(req);
  if (!parseResult.success) {
    throw new Error(`Validation failed: ${parseResult.error.message}`);
  }

  // 3. Execute UseCase
  const result = await Container.updateChecklistSubmissionUseCase!.execute({
    ...parseResult.data,
    userId: user.id
  });

  if (result.isFailure) {
    throw new Error(result.error as string);
  }

  return result.value;
}
