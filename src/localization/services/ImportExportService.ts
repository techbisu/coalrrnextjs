import { db } from '@/lib/db';
import Papa from 'papaparse';
import { JobQueue } from '@/core/jobs/JobQueue';

export class ImportExportService {
  /**
   * Generates a CSV of translations for a specific language
   */
  static async exportToCSV(languageCode: string): Promise<string> {
    const language = await db.language.findUnique({
      where: { code: languageCode },
    });
    if (!language) throw new Error('language not found');

    const values = await db.translation.findMany({
      where: { language_id: language.id },
    });

    const data = values.map((v) => ({
      Module: v.module,
      Key: v.key,
      Value: v.value,
      Status: 'approved',
    }));

    return Papa.unparse(data);
  }

  /**
   * Parses a CSV string and inserts/updates draft translations
   */
  static async importFromCSV(languageCode: string, csvData: string, user_id: string): Promise<void> {
    await JobQueue.enqueue('processLocalizationCsv', {
      languageCode,
      csvData,
      userId: user_id
    });
  }
}
