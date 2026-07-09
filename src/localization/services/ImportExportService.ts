import { db } from '@/lib/db'
import Papa from 'papaparse'

export class ImportExportService {
  /**
   * Generates a CSV of translations for a specific language
   */
  static async exportToCSV(languageCode: string): Promise<string> {
    const language = await db.language.findUnique({
      where: { code: languageCode },
    });
    if (!language) throw new Error('Language not found');

    const values = await db.translationValue.findMany({
      where: { languageId: language.id },
      include: {
        translationKey: {
          include: { module: true },
        },
      },
    });

    const data = values.map((v) => ({
      Module: v.translationKey.module.name,
      Key: v.translationKey.key,
      Value: v.value,
      Status: v.status,
    }));

    return Papa.unparse(data);
  }

  /**
   * Parses a CSV string and inserts/updates draft translations
   */
  static async importFromCSV(languageCode: string, csvData: string, userId: string): Promise<number> {
    const language = await db.language.findUnique({
      where: { code: languageCode },
    });
    if (!language) throw new Error('Language not found');

    const parsed = Papa.parse<{ Module: string; Key: string; Value: string; Status: string }>(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    let count = 0;
    for (const row of parsed.data) {
      if (!row.Module || !row.Key || !row.Value) continue;

      // Upsert Module
      const mod = await db.translationModule.upsert({
        where: { name: row.Module },
        update: {},
        create: { name: row.Module },
      });

      // Upsert Key
      const key = await db.translationKey.upsert({
        where: { moduleId_key: { moduleId: mod.id, key: row.Key } },
        update: {},
        create: { moduleId: mod.id, key: row.Key },
      });

      // Upsert Value (Always as draft when imported, unless explicitly handled)
      const existing = await db.translationValue.findUnique({
        where: { translationKeyId_languageId: { translationKeyId: key.id, languageId: language.id } },
      });

      if (existing) {
        if (existing.value !== row.Value) {
          // Keep history
          await db.translationHistory.create({
            data: {
              translationValueId: existing.id,
              value: existing.value,
              status: existing.status,
              version: existing.version,
              changedBy: userId,
              changeReason: 'CSV Import Overwrite',
            },
          });
          
          await db.translationValue.update({
            where: { id: existing.id },
            data: {
              value: row.Value,
              status: 'draft',
              version: existing.version + 1,
              createdBy: userId,
            },
          });
          count++;
        }
      } else {
        await db.translationValue.create({
          data: {
            translationKeyId: key.id,
            languageId: language.id,
            value: row.Value,
            status: 'draft',
            version: 1,
            createdBy: userId,
          },
        });
        count++;
      }
    }
    return count;
  }
}
