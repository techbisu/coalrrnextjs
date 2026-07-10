export interface EventPayload {
  event_name: string;
  module: string;
  user_id?: string;
  entity_id?: string;
  workflowId?: string;
  data: Record<string, any>;
}

export interface NotificationJob {
  logId: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';
  recipient_contact: string; // e.g. email address, phone, or user ID
  payload: Record<string, any>; // Rendered template subject/body
  retry_count: number;
}
