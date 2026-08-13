/**
 * GenericEntityContextResolver
 *
 * A zero-configuration context resolver for the ChecklistContextRegistry.
 * When no module-specific resolver is registered, this fallback is used.
 *
 * It resolves the entity context by querying `process_definition.config_json`
 * to find which table and fields to query, then returns those fields as the
 * context map for `show_if` rule evaluation and document generation.
 *
 * For modules without a process_definition config_json entry, it returns an
 * empty context (checklists with no `show_if` rules still render correctly).
 *
 * This makes any new module's checklist work purely via DB configuration
 * without writing a TypeScript resolver class.
 */
import 'server-only';
import { db } from '@/lib/db';
import { IChecklistContextResolver } from '../interfaces/IChecklistContextResolver';

export class GenericEntityContextResolver implements IChecklistContextResolver {
  constructor(private readonly moduleCode: string) {}

  async resolve(entityId: string): Promise<Record<string, any>> {
    try {
      // Look for a process_definition that carries context_fields config
      const processDef = await db.process_definition.findFirst({
        where: { module_code: this.moduleCode, is_active: true },
        select: { config_json: true }
      });

      const config = processDef?.config_json as Record<string, any> | null;
      const contextTable = config?.context_table as string | undefined;
      const contextIdField = config?.context_id_field as string | undefined;
      const contextFields = config?.context_fields as string[] | undefined;

      if (!contextTable || !contextIdField) {
        // No specific entity table configured — return empty context.
        // Checklist items with no show_if rules will still be displayed.
        return {};
      }

      // Dynamically query the entity table via Prisma's raw $queryRaw
      // We select only the fields listed in context_fields to keep this minimal
      const fieldsClause = contextFields?.length
        ? contextFields.map(f => `"${f}"`).join(', ')
        : '*';

      const rows = await db.$queryRawUnsafe(
        `SELECT ${fieldsClause} FROM ${contextTable} WHERE "${contextIdField}" = $1 LIMIT 1`,
        entityId
      ) as Record<string, any>[];

      return rows[0] ?? {};
    } catch (e: any) {
      console.warn(`[GenericEntityContextResolver] Failed to resolve context for module "${this.moduleCode}", entity "${entityId}":`, e.message);
      return {};
    }
  }
}
