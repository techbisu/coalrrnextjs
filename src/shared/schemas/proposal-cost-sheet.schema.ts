import { z } from 'zod'

export const proposalCostSheetSchema = z.object({
  total_land_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  total_rehab_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  total_employment_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  registration_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  mutation_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  other_costs_est: z.number().min(0, 'validation.positive_number').optional(),
  grand_total_cost_est: z.number().min(0, 'validation.positive_number').optional(),
  rate_tenancy_land_with_emp: z.number().min(0, 'validation.positive_number').optional(),
  rate_tenancy_land_no_emp: z.number().min(0, 'validation.positive_number').optional(),
  rate_govt_land: z.number().min(0, 'validation.positive_number').optional(),
  rate_forest_land: z.number().min(0, 'validation.positive_number').optional(),
}).strict()

export type ProposalCostSheetInput = z.infer<typeof proposalCostSheetSchema>
