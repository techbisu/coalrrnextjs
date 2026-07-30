import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface AddTranslationRequest {
  module: string;
  key: string;
  value: string;
  languageId: string;
  userId: string;
}

export class AddTranslationUseCase {
  async execute(request: AddTranslationRequest) {
    try {
      // Check if translation already exists
      const existing = await db.translation.findUnique({
        where: {
          module_key_language_id: {
            module: request.module,
            key: request.key,
            language_id: request.languageId,
          }
        }
      });

      if (existing) {
        return { success: false, message: 'Translation key already exists for this language and module' };
      }

      await db.translation.create({
        data: {
          id: randomUUID(),
          module: request.module,
          key: request.key,
          value: request.value,
          language_id: request.languageId,
          entry_by: request.userId,
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to add translation:', error);
      return { success: false, message: 'Internal server error' };
    }
  }
}
