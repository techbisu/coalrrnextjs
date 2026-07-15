'use server';

import { db } from '@/lib/db';
import { LocalizationCache } from '@/localization/cache/LocalizationCache';
import { revalidatePath } from 'next/cache';

export async function approveTranslation(valueId: string, adminUserId: string) {
  const value = await db.translation_value.update({
    where: { id: valueId },
    data: {
      status: 'approved',
      approved_by: adminUserId,
    },
    include: { language: true }
  });

  // Invalidate cache so next request pulls the approved translation
  await LocalizationCache.invalidateCache(value.language.code);
  revalidatePath('/admin/localization');
  
  return { success: true };
}

export async function saveTranslation(keyId: string, language_id: string, new_value: string, adminUserId: string) {
  const existing = await db.translation_value.findUnique({
    where: { translation_key_id_language_id: { translation_key_id: keyId, language_id: language_id } }
  });

  if (existing) {
    if (existing.value !== new_value) {
      await db.translation_history.create({
        data: {
          translation_value_id: existing.id,
          value: existing.value,
          status: existing.status,
          version: existing.version,
          changed_by: adminUserId,
          change_reason: 'Manual Edit',
        },
      });

      await db.translation_value.update({
        where: { id: existing.id },
        data: {
          value: new_value,
          status: 'draft',
          version: existing.version + 1,
          entry_by: adminUserId,
        }
      });
    }
  } else {
    await db.translation_value.create({
      data: {
        translation_key_id: keyId,
        language_id: language_id,
        value: new_value,
        status: 'draft',
        version: 1,
        entry_by: adminUserId,
      }
    });
  }

  revalidatePath('/admin/localization');
  return { success: true };
}
