import { NotificationJob } from '../../notifications/types'
import { NotificationConfig } from '../../notifications/NotificationConfig'
import { InAppProvider, MockPushProvider } from '../../notifications/providers/MockProviders'
import { NodemailerProvider } from '../../notifications/providers/NodemailerProvider'
import { SmsProviderFactory } from '../../notifications/providers/sms/SmsProviderFactory'
import { notificationConfig } from '../../config/notification.config'

export const dispatchNotification = async (job: NotificationJob): Promise<void> => {
  console.log(`[dispatchNotification.job] Dispatching ${job.channel} to ${job.recipient_contact}`)
  
  let provider;
  
  switch (job.channel) {
    case 'EMAIL':
      provider = new NodemailerProvider();
      break;
    case 'SMS':
      provider = SmsProviderFactory.getProvider();
      break;
    case 'IN_APP':
      provider = new InAppProvider();
      break;
    case 'PUSH':
      provider = new MockPushProvider();
      break;
    default:
      throw new Error(`No provider registered for channel ${job.channel}`);
  }

  try {
    const result = await provider.deliver(job)

    if (result.success) {
      await NotificationConfig.storage.updateNotificationLog(job.logId, { 
        status: 'DELIVERED', 
        delivered_at: new Date() 
      })
    } else {
      throw new Error('Provider returned false for success')
    }
  } catch (error: any) {
    // We update the log here. If this throws, BullMQ will retry it.
    // If BullMQ fails it completely after max retries, a separate error listener on BullMQ handles the final FAILED state,
    // but for now, we just update it as FAILED if we exceed max retries inside our manual logic (if used synchronously).
    
    // In synchronous development mode, JobDispatcher executes this inline without BullMQ's automatic retry backoff.
    if (process.env.NODE_ENV === 'development') {
        await NotificationConfig.storage.updateNotificationLog(job.logId, { 
            status: 'FAILED', 
            failure_reason: error.message 
        });
    } else {
        await NotificationConfig.storage.updateNotificationLog(job.logId, { 
            status: 'FAILED', // Or FAILED_RETRYING if you want to track it
            failure_reason: error.message 
        });
        // We throw so BullMQ natively tracks the failure and triggers backoff retries.
        throw error;
    }
  }
}
