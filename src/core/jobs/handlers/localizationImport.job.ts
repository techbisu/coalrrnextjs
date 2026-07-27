import { db } from '@/lib/db';
import Papa from 'papaparse';
import { randomUUID } from 'crypto';

/**
 * Job handler for processing CSV imports of translations.
 * Prevents large CSVs from blocking HTTP requests.
 */
export async function processLocalizationCsvJob(type: string, payload: { languageCode: string, csvData: string, userId: string }): Promise<void> {
  const { languageCode, csvData, userId } = payload;
  
  const language = await db.language.findUnique({
    where: { code: languageCode },
  });
  
  if (!language) throw new Error('language not found');

  const parsed = Papa.parse<{ Module: string; Key: string; Value: string; Status: string }>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  for (const row of parsed.data) {
    if (!row.Module || !row.Key || !row.Value) continue;

    const existing = await db.translation.findUnique({
      where: { module_key_language_id: { module: row.Module, key: row.Key, language_id: language.id } },
    });

    if (existing) {
      if (existing.value !== row.Value) {
        await db.translation.update({
          where: { id: existing.id },
          data: {
            value: row.Value,
            updt_by: userId,
            updt_ts: new Date(),
          },
        });
      }
    } else {
      await db.translation.create({
        data: {
          id: randomUUID(),
          module: row.Module,
          key: row.Key,
          language_id: language.id,
          value: row.Value,
          entry_by: userId,
          updt_ts: new Date(),
        },
      });
    }
  }
}
