import { db } from '@/lib/db';
import { 
  INotificationStorage, 
  EventRegistryData, 
  NotificationLogCreateData, 
  NotificationLogUpdateData, 
  UserContactInfo 
} from '@/core/notifications/interfaces/INotificationStorage';

export class PrismaNotificationStorage implements INotificationStorage {
  async getEventRegistryWithRules(event_name: string): Promise<EventRegistryData | null> {
    const event = await db.event_registry.findUnique({
      where: { event_name },
      include: {
        rules: {
          where: { is_active: true },
          include: { template: true }
        }
      }
    });

    if (!event) return null;

    return {
      id: event.id,
      event_name: event.event_name,
      rules: event.rules.map(rule => ({
        id: rule.id,
        recipient_resolver: rule.recipient_resolver,
        priority: rule.priority,
        is_active: rule.is_active,
        template: {
          id: rule.template.id,
          channel: rule.template.channel,
          subject: rule.template.subject,
          body: rule.template.body,
          is_active: rule.template.is_active
        }
      }))
    };
  }

  async createNotificationLog(data: NotificationLogCreateData): Promise<{ id: string }> {
    const log = await db.notification_log.create({
      data: {
        event_id: data.event_id,
        recipient_id: data.recipient_id,
        recipient_contact: data.recipient_contact,
        channel: data.channel,
        payload: data.payload,
        status: data.status,
        priority: data.priority,
      }
    });
    return { id: log.id };
  }

  async updateNotificationLog(id: string, data: NotificationLogUpdateData): Promise<void> {
    await db.notification_log.update({
      where: { id },
      data: {
        status: data.status,
        failure_reason: data.failure_reason,
        retry_count: data.retry_count,
        delivered_at: data.delivered_at,
        sent_at: data.sent_at,
      }
    });
  }

  async isUserOptedOut(user_id: string, channel: string): Promise<boolean> {
    const pref = await db.notification_preference.findUnique({
      where: { user_id_channel: { user_id, channel } }
    });
    return pref ? !pref.is_enabled : false;
  }

  async findUserContactInfo(user_id: string): Promise<UserContactInfo | null> {
    const user = await db.user.findUnique({ where: { id: user_id } }); // Assuming user_id is string form of BigInt, or string ID in DB? user ID is BigInt!
    if (!user) return null;
    return { 
      id: user.id.toString(), 
      email: user.email ?? undefined, 
      phone: user.mobile ?? undefined 
    };
  }

  async findUsersByRole(role: string): Promise<UserContactInfo[]> {
    const users = await db.user.findMany({ where: { role } });
    return users.map(user => ({
      id: user.id.toString(),
      email: user.email ?? undefined,
      phone: user.mobile ?? undefined
    }));
  }
}
