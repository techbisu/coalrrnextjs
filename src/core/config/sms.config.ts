export const smsConfig = {
  defaultProvider: process.env.SMS_DEFAULT_PROVIDER || 'gov',
  providers: {
    gov: {
      url: process.env.GOV_SMS_URL || 'https://smsgw.sms.gov.in/failsafe/MLink',
      usernameSms: process.env.GOV_SMS_USERNAME || '',
      pinSms: process.env.GOV_SMS_PIN || '',
      usernameOtp: process.env.GOV_OTP_USERNAME || '',
      pinOtp: process.env.GOV_OTP_PIN || '',
      signature: process.env.GOV_SMS_SIGNATURE || '',
      dltEntityIdOtp: process.env.GOV_DLT_ENTITY_ID || '',
      dltTemplateIdOtp: process.env.GOV_DLT_TEMPLATE_ID || '',
      dltTemplateMsgOtp: process.env.GOV_DLT_TEMPLATE_MSG || ''
    }
  }
} as const;
