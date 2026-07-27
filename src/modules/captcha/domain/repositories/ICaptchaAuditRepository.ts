export interface ICaptchaAuditRepository {
  logAudit(action: string, purpose: string, ip_address?: string): Promise<void>;
}
