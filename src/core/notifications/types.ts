export interface EventPayload {
  eventName: string;
  module: string;
  userId?: string;
  entityId?: string;
  workflowId?: string;
  data: Record<string, any>;
}

export interface NotificationJob {
  logId: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';
  recipientContact: string; // e.g. email address, phone, or user ID
  payload: Record<string, any>; // Rendered template subject/body
  retryCount: number;
}
