/**
 * Checklist Requirement Rule Validation Schema — Shared between Client & Server
 * Per AGENTS.md validation.md rule: Single source of truth for Zod schemas.
 */
import { z } from 'zod';

export const ShowIfConditionSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
  ])
);

export const InputSchemaConfigSchema = z.object({
  type: z.enum(['document', 'text', 'number', 'boolean', 'generated_document', 'custom']),
  multiple: z.boolean().optional(),
  template_code: z.string().optional(),
  auto_complete_on_final: z.boolean().optional(),
}).passthrough();

export const ChecklistRequirementRuleSchema = z.object({
  chk_code: z.string().min(1, 'validation.required'),
  module_code: z.string().min(1, 'validation.required'),
  requirement_type: z.string().min(1, 'validation.required'),
  title: z.string().min(1, 'validation.required'),
  description: z.string().nullable().optional(),
  input_schema: InputSchemaConfigSchema.nullable().optional(),
  show_if: ShowIfConditionSchema.nullable().optional(),
  inherit_from: z.record(z.string(), z.any()).nullable().optional(),
  sync_to_parent: z.record(z.string(), z.any()).nullable().optional(),
  min_responses_required: z.number().int().nonnegative().default(1),
  is_mandatory: z.boolean().default(true),
  display_order: z.number().int().default(0),
  local_vernacular: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type ChecklistRequirementRuleInput = z.infer<typeof ChecklistRequirementRuleSchema>;
