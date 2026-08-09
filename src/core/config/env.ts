import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  UPLOAD_MAX_SIZE_MB: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
  UPLOAD_MAX_FILES: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
  STORAGE_PROVIDER: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  ENABLE_VIRUS_SCAN: z.string().optional().transform(v => v === 'true'),
  
  // Global Toggles
  GLOBAL_OTP_ENABLED: z.string().optional().transform(v => v !== 'false'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  
  // Email Variables
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.string().optional(),

  // SMS Variables
  SMS_DEFAULT_PROVIDER: z.string().optional(),
  GOV_SMS_URL: z.string().optional(),
  GOV_SMS_USERNAME: z.string().optional(),
  GOV_SMS_PIN: z.string().optional(),
  GOV_OTP_USERNAME: z.string().optional(),
  GOV_OTP_PIN: z.string().optional(),
  GOV_SMS_SIGNATURE: z.string().optional(),
  GOV_DLT_ENTITY_ID: z.string().optional(),
  GOV_DLT_TEMPLATE_ID: z.string().optional(),
  GOV_DLT_TEMPLATE_MSG: z.string().optional(),
  
  // Notification General
  NOTIFICATION_MAX_RETRIES: z.string().optional(),
  NOTIFICATION_RETRY_BACKOFF_MS: z.string().optional(),
})

// Validate env vars
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsedEnv.data
