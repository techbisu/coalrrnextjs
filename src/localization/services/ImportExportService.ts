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
    if (!language) throw new Error('language not found');

    const values = await db.translation_value.findMany({
      where: { language_id: language.id },
      include: {
        translation_key: {
          include: { translation_module: true },
        },
      },
    });

    const data = values.map((v) => ({
      Module: v.translation_key.translation_module.name,
      Key: v.translation_key.key,
      Value: v.value,
      Status: v.status,
    }));

    return Papa.unparse(data);
  }

  /**
   * Parses a CSV string and inserts/updates draft translations
   */
  static async importFromCSV(languageCode: string, csvData: string, user_id: string): Promise<number> {
    const language = await db.language.findUnique({
      where: { code: languageCode },
    });
    if (!language) throw new Error('language not found');

    const parsed = Papa.parse<{ Module: string; Key: string; Value: string; Status: string }>(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    let count = 0;
    for (const row of parsed.data) {
      if (!row.Module || !row.Key || !row.Value) continue;

      // Upsert Module
      const mod = await db.translation_module.upsert({
        where: { name: row.Module },
        update: {},
        create: { name: row.Module },
      });

      // Upsert Key
      const key = await db.translation_key.upsert({
        where: { module_id_key: { module_id: mod.id, key: row.Key } },
        update: {},
        create: { module_id: mod.id, key: row.Key },
      });

      // Upsert Value (Always as draft when imported, unless explicitly handled)
      const existing = await db.translation_value.findUnique({
        where: { translation_key_id_language_id: { translation_key_id: key.id, language_id: language.id } },
      });

      if (existing) {
        if (existing.value !== row.Value) {
          // Keep history
          await db.translation_history.create({
            data: {
              translation_value_id: existing.id,
              value: existing.value,
              status: existing.status,
              version: existing.version,
              changed_by: user_id,
              change_reason: 'CSV Import Overwrite',
            },
          });
          
          await db.translation_value.update({
            where: { id: existing.id },
            data: {
              value: row.Value,
              status: 'draft',
              version: existing.version + 1,
              entry_by: user_id,
            },
          });
          count++;
        }
      } else {
        await db.translation_value.create({
          data: {
            translation_key_id: key.id,
            language_id: language.id,
            value: row.Value,
            status: 'draft',
            version: 1,
            entry_by: user_id,
          },
        });
        count++;
      }
    }
    return count;
  }
}
