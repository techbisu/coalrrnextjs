export interface EventRuleTemplate {
  id: string;
  channel: string;
  subject?: string | null;
  body: string;
  is_active: boolean;
}

export interface EventRule {
  id: string;
  recipient_resolver: string;
  priority: string;
  is_active: boolean;
  template: EventRuleTemplate;
}

export interface EventRegistryData {
  id: string;
  event_name: string;
  rules: EventRule[];
}

export interface NotificationLogCreateData {
  event_id?: string;
  recipient_id?: string;
  recipient_contact: string;
  channel: string;
  payload: string;
  status: string;
  priority: string;
}

export interface NotificationLogUpdateData {
  status?: string;
  failure_reason?: string;
  retry_count?: number;
  delivered_at?: Date;
  sent_at?: Date;
}

export interface UserContactInfo {
  id: string;
  email?: string;
  phone?: string;
}

export interface INotificationStorage {
  /**
   * Fetch the event rules and their associated templates for a given event name.
   */
  getEventRegistryWithRules(event_name: string): Promise<EventRegistryData | null>;

  /**
   * Create a new notification log entry.
   */
  createNotificationLog(data: NotificationLogCreateData): Promise<{ id: string }>;

  /**
   * Update an existing notification log entry.
   */
  updateNotificationLog(id: string, data: NotificationLogUpdateData): Promise<void>;

  /**
   * Check if a user has opted out of a specific notification channel.
   */
  isUserOptedOut(user_id: string, channel: string): Promise<boolean>;

  /**
   * Find basic contact information for a specific user ID.
   */
  findUserContactInfo(user_id: string): Promise<UserContactInfo | null>;

  /**
   * Find basic contact information for all users with a specific role.
   */
  findUsersByRole(role: string): Promise<UserContactInfo[]>;
}
