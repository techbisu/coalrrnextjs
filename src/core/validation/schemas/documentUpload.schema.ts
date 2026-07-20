import { z } from 'zod';

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

export const DocumentUploadSchema = z.object({
  file: z.any()
    .refine((file) => file !== null && file !== undefined, 'File is required')
    .refine((file) => {
      // In browser it's a File object, in server it might be something else but typically has size property
      if (typeof window !== 'undefined' && file instanceof File) {
        return file.size <= MAX_FILE_SIZE_BYTES;
      }
      return file?.size <= MAX_FILE_SIZE_BYTES;
    }, `File size must be less than ${MAX_FILE_SIZE_MB}MB.`)
    .refine((file) => {
      if (typeof window !== 'undefined' && file instanceof File) {
        return ALLOWED_MIME_TYPES.includes(file.type);
      }
      return ALLOWED_MIME_TYPES.includes(file?.type);
    }, 'Only PDF, JPEG, PNG, and DOCX files are allowed.'),
});
