'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { UpdateTranslationUseCase } from '@/modules/localization/application/use-cases/UpdateTranslationUseCase';

export async function updateTranslationAction(id: string, value: string) {
  // In a real app we'd verify session/permissions here
  const session = await getServerSession();
  const userId = (session?.user as any)?.id || 'system';

  const useCase = new UpdateTranslationUseCase();
  const result = await useCase.execute({ id, value, userId });

  if (result.success) {
    revalidatePath('/admin/localization');
  }

  return result;
}
