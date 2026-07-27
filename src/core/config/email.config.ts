export const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromAddress: process.env.SMTP_FROM || 'noreply@coalrr.com',
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
} as const;
