import { NotificationJob } from '../types';

export interface INotificationProvider {
  deliver(job: NotificationJob): Promise<{ success: boolean; externalId?: string }>;
}
