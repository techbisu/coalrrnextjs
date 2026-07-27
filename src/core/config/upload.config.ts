import { env } from './env';

export const uploadConfig = {
  maxFileSizeMb: env.UPLOAD_MAX_SIZE_MB,
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFilesPerUpload: env.UPLOAD_MAX_FILES,
  storageProvider: env.STORAGE_PROVIDER,
  enableVirusScan: env.ENABLE_VIRUS_SCAN && env.NODE_ENV === 'production',
} as const;
