import { z } from 'zod';

export const generateCaptchaSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
});

export const validateCaptchaSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const refreshCaptchaSchema = z.object({
  oldId: z.string().min(1, 'Old ID is required'),
  purpose: z.string().min(1, 'Purpose is required'),
});

export type GenerateCaptchaInput = z.infer<typeof generateCaptchaSchema>;
export type ValidateCaptchaInput = z.infer<typeof validateCaptchaSchema>;
export type RefreshCaptchaInput = z.infer<typeof refreshCaptchaSchema>;
