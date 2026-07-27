import { db } from '@/lib/db';
import { LocalizationCache } from '@/localization/cache/LocalizationCache';

export interface UpdateTranslationRequest {
  id: string;
  value: string;
  userId: string;
}

export interface UpdateTranslationResponse {
  success: boolean;
  message?: string;
}

export class UpdateTranslationUseCase {
  async execute(request: UpdateTranslationRequest): Promise<UpdateTranslationResponse> {
    try {
      const existing = await db.translation.findUnique({
        where: { id: request.id },
        include: { language: true }
      });

      if (!existing) {
        return { success: false, message: 'Translation not found' };
      }

      await db.translation.update({
        where: { id: request.id },
        data: {
          value: request.value,
          updt_ts: new Date(),
        }
      });

      // Invalidate cache for this language
      await LocalizationCache.invalidateCache(existing.language.code);

      return { success: true };
    } catch (error) {
      console.error('Failed to update translation:', error);
      return { success: false, message: 'An error occurred while updating the translation.' };
    }
  }
}
