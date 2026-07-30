'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { UpdateTranslationUseCase } from '@/modules/localization/application/use-cases/UpdateTranslationUseCase';
import { AddTranslationUseCase } from '@/modules/localization/application/use-cases/AddTranslationUseCase';
import { ManageLanguageUseCase, CreateLanguageDTO } from '@/modules/localization/application/use-cases/ManageLanguageUseCase';
import { LocalizationCache } from '@/localization/cache/LocalizationCache';

export async function updateTranslationAction(id: string, value: string) {
  // In a real app we'd verify session/permissions here
  const session = await getServerSession();
  const userId = (session?.user as any)?.id || 'system';

  const useCase = new UpdateTranslationUseCase();
  const result = await useCase.execute({ id, value, userId });

  if (result.success) {
    LocalizationCache.invalidateCache();
    revalidatePath('/admin/localization');
  }

  return result;
}

export async function addTranslationAction(data: { module: string, key: string, value: string, languageId: string }) {
  const session = await getServerSession();
  const userId = (session?.user as any)?.id || 'system';

  const useCase = new AddTranslationUseCase();
  const result = await useCase.execute({
    module: data.module,
    key: data.key,
    value: data.value,
    languageId: data.languageId,
    userId
  });

  if (result.success) {
    LocalizationCache.invalidateCache();
    revalidatePath('/admin/localization');
  }

  return result;
}

export async function addLanguageAction(data: CreateLanguageDTO) {
  const useCase = new ManageLanguageUseCase();
  const result = await useCase.createLanguage(data);
  
  if (result.isSuccess) {
    revalidatePath('/admin/localization');
    return { success: true };
  }
  return { success: false, message: result.error?.message };
}

export async function toggleLanguageActiveAction(id: string, isActive: boolean) {
  const useCase = new ManageLanguageUseCase();
  const result = await useCase.toggleActive(id, isActive);
  
  if (result.isSuccess) {
    revalidatePath('/admin/localization');
    return { success: true };
  }
  return { success: false, message: result.error?.message };
}

export async function setDefaultLanguageAction(id: string) {
  const useCase = new ManageLanguageUseCase();
  const result = await useCase.setDefault(id);
  
  if (result.isSuccess) {
    revalidatePath('/admin/localization');
    return { success: true };
  }
  return { success: false, message: result.error?.message };
}
