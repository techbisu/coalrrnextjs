import { z } from 'zod';

const parseNumber = (val: any) => {
  if (val === '' || val === undefined || val === null || val === 'undefined') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

export const Step1PlotSchema = z.object({
  mouza_lgd: z.preprocess(
    parseNumber,
    z.number({ message: 'Mouza LGD is required.' })
      .positive('Mouza LGD is required.')
  ),
  plot_ty: z.string().min(1, 'Plot Type is required.'),
  plot_number: z.string().min(1, 'Plot Number is required.').max(5, 'Maximum 5 characters allowed.'),
  total_ror_area: z.preprocess(
    parseNumber,
    z.number({ message: 'Total ROR Area is required.' })
      .positive('Total ROR Area must be greater than 0.')
      .max(99999999.9999, 'Value exceeds database limit (12, 4).')
      .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.')
  )
});

export const SubTypeSchema = z.object({
  sub_landt_id: z.preprocess(
    parseNumber,
    z.number({ message: 'Sub-Type is required.' })
      .positive('Sub-Type is required.')
  ),
  area_to_acquire: z.preprocess(
    parseNumber,
    z.number({ message: 'Area to acquire is required.' })
      .positive('Area to acquire must be greater than 0.')
      .max(99999999.9999, 'Value exceeds database limit (12, 4).')
      .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.')
  )
});

export const LandTypeSchema = z.object({
  landt_id: z.preprocess(
    parseNumber,
    z.number({ message: 'Primary Land Type is required.' })
      .positive('Primary Land Type is required.')
  ),
  area: z.preprocess(
    parseNumber,
    z.number({ message: 'ROR Area is required.' })
      .positive('ROR Area must be greater than 0.')
      .max(99999999.9999, 'Value exceeds database limit (12, 4).')
      .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.')
  ),
  use_purpose: z.string().default('EXCAVATION'),
  sub_types: z.array(SubTypeSchema)
    .min(1, 'At least one sub-type is required.')
}).superRefine((data, ctx) => {
  const sumAreaToAcquire = data.sub_types.reduce((sum, sub) => sum + (sub.area_to_acquire || 0), 0);
  
  if (sumAreaToAcquire - data.area > 0.00001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total acquired area for sub-types (${sumAreaToAcquire.toFixed(4)} ac) cannot exceed Primary Area (${data.area.toFixed(4)} ac).`,
      path: ['sub_types']
    });
  }
});

export const PlotScheduleSchema = z.object({
  plot_no: z.string().min(1, 'Plot Number (auto-generated) is missing.'),
  mouza_lgd: z.preprocess(
    parseNumber,
    z.number({ message: 'Mouza LGD is required.' })
      .positive('Mouza LGD is required.')
  ),
  total_ror_area: z.preprocess(
    parseNumber,
    z.number({ message: 'Total ROR Area is required.' })
      .positive('Total ROR Area must be greater than 0.')
      .max(99999999.9999, 'Value exceeds database limit (12, 4).')
      .refine(val => /^\d+(\.\d{1,4})?$/.test(val.toString()), 'Maximum 4 decimal places allowed.')
  ),
  to_be_acquired_area: z.preprocess(
    val => (val === '' || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, 'Total Area to Acquire cannot be negative.').max(99999999.9999).default(0).optional()
  ),
  ecl_acquired_area: z.preprocess(
    val => (val === '' || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, 'ECL Acquired Area cannot be negative.').max(99999999.9999).default(0).optional()
  ),
  acq_status: z.string().default('PROPOSED'),
  entry_by: z.string(),
  state_lgd: z.preprocess(parseNumber, z.number().optional()),
  plot_ty: z.string().min(1, 'Plot Type is required.'),
  plot_number: z.string().min(1, 'Plot Number is required.').max(5, 'Maximum 5 characters allowed.'),
  bata_no: z.string().max(5, 'Maximum 5 characters allowed.').optional().or(z.literal('')),
  opt_plot_ty: z.string().max(5).optional().or(z.literal('')),
  opt_plot: z.string().max(5, 'Maximum 5 characters allowed.').optional().or(z.literal('')),
  opt_bata: z.string().max(5, 'Maximum 5 characters allowed.').optional().or(z.literal('')),
  land_types: z.array(LandTypeSchema).min(1, 'At least one Land Type must be specified.')
}).superRefine((data, ctx) => {
  // Available to Acquire is the max area for sum of primary land types
  const availableToAcquire = Math.max(0, data.total_ror_area - (data.ecl_acquired_area || 0));
  const totalLandTypeArea = data.land_types.reduce((sum, lt) => sum + (lt.area || 0), 0);
  
  if (totalLandTypeArea - availableToAcquire > 0.00001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Sum of Primary Land Type Areas (${totalLandTypeArea.toFixed(4)} ac) cannot exceed Available to Acquire (${availableToAcquire.toFixed(4)} ac).`,
      path: ['land_types']
    });
  }
});

export const AddPlotsSchema = z.object({
  plots: z.array(PlotScheduleSchema).min(1, 'At least one valid plot is required.')
});
