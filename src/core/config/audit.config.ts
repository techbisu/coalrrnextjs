export const auditConfig = {
  // Fields to ignore when generating diffs
  ignoreFields: ['entryTs', 'updtTs', 'entry_ts', 'updt_ts', 'entryBy', 'updtBy', 'entry_by', 'updt_by'],
  
  // Max retries for the audit job queue if it fails
  jobMaxRetries: Number(process.env.AUDIT_JOB_MAX_RETRIES ?? 3),
  
  // Queue configuration
  queueName: 'audit-log-queue',

  // Models that should not generate audit logs on mutation
  excludedModels: [
    'activity_log', 'application_log', 'audit_logs', 'audit_changes', 
    'audit_sessions', 'user', 'audit_api_logs', 'audit_security_logs', 
    'audit_download_logs', 'audit_exception_logs', 'audit_login_attempts', 
    'auth_session', 'captcha_audit_log', 'captcha_challenge', 'captcha_config',
    'otp_session'
  ],

  // Models that do not have entry_by/updt_by/entry_ts/updt_ts fields to inject
  noAuditFieldsModels: [
    'user_org_scope', 'model_has_role', 'role_has_permission', 
    'role', 'permission', 'auth_session', 'activity_log', 'application_log'
  ]
} as const
