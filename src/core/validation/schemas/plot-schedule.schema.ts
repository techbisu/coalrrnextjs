import { z } from 'zod';

export const LandTypeSchema = z.object({
  landt_id: z.any()
    .refine(val => val !== undefined && val !== null && val !== '', 'Land Type is required.')
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, 'Land Type is required.'),
  area: z.any()
    .refine(val => val !== undefined && val !== null && val !== '', 'Land Type Area is required.')
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, 'Land Type Area must be greater than 0.')
    .refine(val => val <= 99999999.9999, 'Value exceeds database limit (12, 4).')
    .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.'),
  area_to_acquire: z.any()
    .refine(val => val !== undefined && val !== null && val !== '', 'Area to acquire is required.')
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, 'Area to acquire must be greater than 0.')
    .refine(val => val <= 99999999.9999, 'Value exceeds database limit (12, 4).')
    .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.')
}).superRefine((data, ctx) => {
  if (data.area_to_acquire > data.area) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Area to acquire (${data.area_to_acquire}) cannot exceed Land Type Area (${data.area}).`,
      path: ['area_to_acquire']
    });
  }
});

export const PlotScheduleSchema = z.object({
  plot_no: z.string().min(1, 'Plot Number (auto-generated) is missing.'),
  mouza_lgd: z.coerce.number().positive('Mouza LGD is required.'),
  total_ror_area: z.coerce.number()
    .positive('Total ROR Area must be greater than 0.')
    .max(99999999.9999, 'Value exceeds database limit (12, 4).')
    .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.'),
  to_be_acquired_area: z.coerce.number()
    .positive('Total Area to Acquire must be greater than 0.')
    .max(99999999.9999, 'Value exceeds database limit (12, 4).')
    .transform(val => Number(val.toFixed(4)))
    .optional(),
  acq_status: z.string().default('PROPOSED'),
  entry_by: z.string(),
  state_lgd: z.coerce.number().optional(),
  plot_ty: z.string().min(1, 'Plot Type is required.'),
  plot_number: z.string().min(1, 'Plot Number is required.').max(5, 'Maximum 5 characters allowed.'),
  bata_no: z.string().max(5, 'Maximum 5 characters allowed.').optional().or(z.literal('')),
  opt_plot_ty: z.string().min(1, 'Previous Plot Type is required.'),
  opt_plot: z.string().min(1, 'Previous Plot Number is required.').max(5, 'Maximum 5 characters allowed.'),
  opt_bata: z.string().max(5, 'Maximum 5 characters allowed.').optional().or(z.literal('')),
  land_types: z.array(LandTypeSchema).min(1, 'At least one Land Type must be specified.')
}).superRefine((data, ctx) => {
  // Check if total land type area sum matches Total ROR Area
  const totalLandTypeArea = data.land_types.reduce((sum, lt) => sum + (lt.area || 0), 0);
  
  // Use a small epsilon to avoid floating point precision issues (supports 4 decimal places)
  if (totalLandTypeArea - data.total_ror_area > 0.00001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Sum of Land Type ROR Areas (${totalLandTypeArea.toFixed(4)}) cannot exceed Total ROR Area (${data.total_ror_area.toFixed(4)}).`,
      path: ['land_types']
    });
  }



  // Check for duplicate land types
  const seenLandTypes = new Set<string>();
  data.land_types.forEach((lt, index) => {
    if (!lt.landt_id) return;
    const key = String(lt.landt_id);
    if (seenLandTypes.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'This land type has already been added to the plot.',
        path: ['land_types', index, 'landt_id']
      });
    } else {
      seenLandTypes.add(key);
    }
  });
});

export const AddPlotsSchema = z.object({
  plots: z.array(PlotScheduleSchema).min(1, 'At least one valid plot is required.')
});
