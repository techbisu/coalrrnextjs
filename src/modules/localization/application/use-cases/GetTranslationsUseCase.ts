import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { localizationConfig } from '@/core/config/localization.config';

export interface GetTranslationsRequest {
  module?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TranslationDTO {
  id: string;
  module: string;
  key: string;
  value: string;
  language_id: string;
  language_name: string;
  status: string;
}

export interface GetTranslationsResponse {
  translations: TranslationDTO[];
  total: number;
  page: number;
  totalPages: number;
  modules: string[];
}

export class GetTranslationsUseCase {
  async execute(request: GetTranslationsRequest): Promise<GetTranslationsResponse> {
    const page = request.page || 1;
    const limit = request.limit || localizationConfig.useCasePageSize;
    const skip = (page - 1) * limit;

    const where: Prisma.translationWhereInput = {};

    if (request.module && request.module !== 'all') {
      where.module = request.module;
    }

    if (request.search) {
      where.OR = [
        { key: { contains: request.search, mode: 'insensitive' } },
        { value: { contains: request.search, mode: 'insensitive' } }
      ];
    }

    const [translations, total, distinctModules] = await Promise.all([
      db.translation.findMany({
        where,
        include: { language: true },
        orderBy: [{ module: 'asc' }, { key: 'asc' }],
        skip,
        take: limit,
      }),
      db.translation.count({ where }),
      db.translation.findMany({
        distinct: ['module'],
        select: { module: true },
        orderBy: { module: 'asc' },
      })
    ]);

    const dtos: TranslationDTO[] = translations.map(t => ({
      id: t.id,
      module: t.module,
      key: t.key,
      value: t.value,
      language_id: t.language_id,
      language_name: t.language.name,
      status: 'approved',
    }));

    return {
      translations: dtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      modules: distinctModules.map(m => m.module),
    };
  }
}
