import { z } from 'zod';

// ─── Proposal Schemas ─────────────────────────────────────────────────────────

export const CreateProposalSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  acquisition_mode: z.string().min(1, 'Acquisition mode is required'),
  proposal_title: z.string().min(1, 'Proposal title is required'),
  description: z.string().optional(),
  area_office: z.string().optional(),
  mine_cd: z.string().optional(),
  adjacent_colliery: z.string().optional(),
  notification_date: z.string().optional(),
});
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export const PlotScheduleSchema = z.object({
  plot_no: z.string().min(1, 'Plot number is required'),
  mouza_lgd: z.number().positive('Mouza LGD must be a positive number'),
  to_be_acquired_area: z.number().positive('Area must be positive')
    .max(99999999.9999, 'Value exceeds database limit (12, 4).')
    .transform(val => Number(val.toFixed(4))),
  acq_status: z.string().default('PROPOSED'),
  entry_by: z.string(),
});

export const PlotScheduleLandTypeSchema = z.object({
  schedule_id: z.string(),
  landt_id: z.number().positive(),
  area: z.number().positive()
    .max(99999999.9999, 'Value exceeds database limit (12, 4).')
    .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.'),
  area_to_acquire: z.number().positive()
    .max(99999999.9999, 'Value exceeds database limit (12, 4).')
    .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.'),
});

export const InitiateProposalSchema = z.object({
  proposal: z.object({
    proposal_no: z.string().min(1, 'Proposal number is required'),
    proposal_dt: z.string().transform(str => new Date(str)),
    mine_cd: z.string().min(1, 'Mine code is required'),
    area_cd: z.string().min(1, 'Area code is required'),
    proj_cd: z.string().min(1, 'Project code is required'),
    acq_mode_id: z.number().positive('Acquisition mode ID must be positive'),
    purpose_justification: z.string().min(10, 'Justification must be at least 10 characters'),
    is_within_pr_limit: z.boolean(),
    requires_board_approval: z.boolean(),
    entry_by: z.string(),
  }),
  plots: z.array(PlotScheduleSchema).optional(),
  landTypes: z.array(PlotScheduleLandTypeSchema).optional(),
});
export type InitiateProposalInput = z.infer<typeof InitiateProposalSchema>;
