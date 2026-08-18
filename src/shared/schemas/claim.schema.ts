import { z } from 'zod'

export const plotEntrySchema = z.object({
  plot_id: z.string().min(1, { message: 'validation.required' }),
  plot_schedule_id: z.string().optional(),
  plot_no: z.string().optional(),
  khatian_no: z.string().optional(),
  own_share_acres: z.union([z.string(), z.number()]).transform((val) => String(val)),
  total_ror_area: z.union([z.string(), z.number()]).optional().transform((val) => val ? String(val) : undefined),
  link_deed_no: z.string().optional(),
  ownership_date: z.string().optional(),
  transferor_name: z.string().optional(),
  acquisition_mode_offered: z.string().optional().default('CBA_ACT'),
})

export const submitClaimSchema = z.object({
  authType: z.enum(['aadhaar', 'epic']).optional(),
  aadhaarNumber: z.string().optional(),
  epicNo: z.string().optional(),

  claimant_name: z.string().min(1, { message: 'validation.required' }),
  father_husband_name: z.string().optional(),
  present_address: z.string().optional(),
  permanent_address: z.string().optional(),
  occupation: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional().default('Indian'),
  religion: z.string().optional(),
  caste_category: z.string().optional(),
  primary_mobile_no: z.string().optional(),
  photo_doc_id: z.string().optional(),

  plot_entries: z.array(plotEntrySchema).min(1, { message: 'validation.at_least_one_plot_required' }),
  total_claim_share_acres: z.union([z.string(), z.number()]).optional().transform((val) => val ? String(val) : undefined),

  prior_compensation_received: z.boolean().optional(),
  prior_compensation_details: z.string().optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  passbook_doc_id: z.string().optional(),
  prior_employment_linked: z.boolean().optional(),
  prior_employment_details: z.string().optional(),
  is_free_from_disputes: z.boolean().optional(),
  dispute_details: z.string().optional(),
  is_free_from_encumbrances: z.boolean().optional(),
  encumbrance_details: z.string().optional(),
  can_handover_possession: z.boolean().optional(),
  possession_reason: z.string().optional(),
  opted_monetary_in_lieu_of_employment: z.boolean().optional(),
  monetary_opt_reason: z.string().optional(),

  magistrate_affidavit_doc_id: z.string().optional(),
  title_deed_doc_id: z.string().optional(),
})

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>
export type PlotEntryInput = z.infer<typeof plotEntrySchema>
