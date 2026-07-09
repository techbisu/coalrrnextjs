'use server';

import { db } from '@/lib/db';
import { LocalizationCache } from '@/localization/cache/LocalizationCache';
import { revalidatePath } from 'next/cache';

export async function approveTranslation(valueId: string, adminUserId: string) {
  const value = await db.translationValue.update({
    where: { id: valueId },
    data: {
      status: 'approved',
      approvedBy: adminUserId,
    },
    include: { language: true }
  });

  // Invalidate cache so next request pulls the approved translation
  await LocalizationCache.invalidateCache(value.language.code);
  revalidatePath('/admin/localization');
  
  return { success: true };
}

export async function saveTranslation(keyId: string, languageId: string, newValue: string, adminUserId: string) {
  const existing = await db.translationValue.findUnique({
    where: { translationKeyId_languageId: { translationKeyId: keyId, languageId: languageId } }
  });

  if (existing) {
    if (existing.value !== newValue) {
      await db.translationHistory.create({
        data: {
          translationValueId: existing.id,
          value: existing.value,
          status: existing.status,
          version: existing.version,
          changedBy: adminUserId,
          changeReason: 'Manual Edit',
        },
      });

      await db.translationValue.update({
        where: { id: existing.id },
        data: {
          value: newValue,
          status: 'draft',
          version: existing.version + 1,
          createdBy: adminUserId,
        }
      });
    }
  } else {
    await db.translationValue.create({
      data: {
        translationKeyId: keyId,
        languageId: languageId,
        value: newValue,
        status: 'draft',
        version: 1,
        createdBy: adminUserId,
      }
    });
  }

  revalidatePath('/admin/localization');
  return { success: true };
}
