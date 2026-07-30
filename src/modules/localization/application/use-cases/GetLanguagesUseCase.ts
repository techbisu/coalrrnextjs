import { db } from '@/lib/db';

export interface LanguageDTO {
  id: string;
  code: string;
  name: string;
  native_name: string;
  direction: string;
  flag: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export class GetLanguagesUseCase {
  async execute(): Promise<LanguageDTO[]> {
    const languages = await db.language.findMany({
      orderBy: [
        { is_default: 'desc' },
        { sort_order: 'asc' },
        { name: 'asc' },
      ],
    });

    return languages.map(lang => ({
      id: lang.id,
      code: lang.code,
      name: lang.name,
      native_name: lang.native_name,
      direction: lang.direction,
      flag: lang.flag,
      is_default: lang.is_default,
      is_active: lang.is_active,
      sort_order: lang.sort_order,
    }));
  }
}
