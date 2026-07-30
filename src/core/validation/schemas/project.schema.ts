import { z } from 'zod';

// ─── Project Schemas ──────────────────────────────────────────────────────────

export const ProjectBoundarySchema = z.object({
  boundary: z.string().min(1, 'Boundary cannot be empty'),
});
export type ProjectBoundaryInput = z.infer<typeof ProjectBoundarySchema>;

export const CreateProjectSchema = z.object({
  projNm: z.string().min(1, 'Project name is required'),
  area_cd: z.string().min(1, 'Area is required'),
  mine_cds: z.array(z.string()).min(1, 'At least one mine is required'),
  state_lgd: z.coerce.bigint().optional(),
  mouza_lgds: z.array(z.coerce.bigint()).optional(),
  total_land_limit_acres: z.coerce.number().positive().optional(),
  pr_doc_id: z.string().optional().nullable(),
  user_id: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
