import { NotificationJob } from '../types'

export interface ChannelProvider {
  channel: string;
  deliver(job: NotificationJob): Promise<{ success: boolean; error?: string }>;
}
