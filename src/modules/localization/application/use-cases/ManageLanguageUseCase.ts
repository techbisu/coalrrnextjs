import { db } from '@/lib/db';
import { Result, ResultFactory } from '@/core/result/Result';

export interface CreateLanguageDTO {
  code: string;
  name: string;
  native_name: string;
  direction?: string;
}

export class ManageLanguageUseCase {
  
  async createLanguage(data: CreateLanguageDTO): Promise<Result<void, Error>> {
    try {
      const existing = await db.language.findUnique({ where: { code: data.code } });
      if (existing) {
        return ResultFactory.fail(new Error('Language code already exists.'));
      }

      await db.language.create({
        data: {
          id: data.code.toUpperCase(), // Using code as ID for simplicity
          code: data.code,
          name: data.name,
          native_name: data.native_name,
          direction: data.direction || 'LTR',
          updt_ts: new Date(),
        }
      });
      return ResultFactory.ok(undefined);
    } catch (error) {
      console.error('[ManageLanguageUseCase.createLanguage]', error);
      return ResultFactory.fail(new Error('Failed to create language.'));
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<Result<void, Error>> {
    try {
      const language = await db.language.findUnique({ where: { id } });
      if (!language) return ResultFactory.fail(new Error('Language not found.'));

      if (language.is_default && !isActive) {
        return ResultFactory.fail(new Error('Cannot deactivate the default language.'));
      }

      await db.language.update({
        where: { id },
        data: { is_active: isActive, updt_ts: new Date() }
      });
      
      return ResultFactory.ok(undefined);
    } catch (error) {
      console.error('[ManageLanguageUseCase.toggleActive]', error);
      return ResultFactory.fail(new Error('Failed to toggle language status.'));
    }
  }

  async setDefault(id: string): Promise<Result<void, Error>> {
    try {
      const language = await db.language.findUnique({ where: { id } });
      if (!language) return ResultFactory.fail(new Error('Language not found.'));
      if (!language.is_active) return ResultFactory.fail(new Error('Cannot set an inactive language as default.'));

      await db.$transaction([
        // Unset current default
        db.language.updateMany({
          where: { is_default: true },
          data: { is_default: false, updt_ts: new Date() }
        }),
        // Set new default
        db.language.update({
          where: { id },
          data: { is_default: true, updt_ts: new Date() }
        })
      ]);

      return ResultFactory.ok(undefined);
    } catch (error) {
      console.error('[ManageLanguageUseCase.setDefault]', error);
      return ResultFactory.fail(new Error('Failed to set default language.'));
    }
  }
}
