import { INotificationProvider } from '../../interfaces/INotificationProvider';
import { NotificationJob } from '../../types';
import { smsConfig } from '../../../config/sms.config';

export class GovSmsProvider implements INotificationProvider {
  async deliver(job: NotificationJob): Promise<{ success: boolean; externalId?: string }> {
    try {
      const { url, usernameSms, pinSms, usernameOtp, pinOtp, signature, dltEntityIdOtp, dltTemplateIdOtp } = smsConfig.providers.gov;
      const { payload, recipient_contact } = job;
      
      const isOtp = payload.eventData?.type === 'OTP';
      
      const queryParams = new URLSearchParams();
      
      if (isOtp) {
        queryParams.append('username', usernameOtp);
        queryParams.append('pin', pinOtp);
        queryParams.append('message', payload.body);
        queryParams.append('mnumber', recipient_contact);
        queryParams.append('signature', signature);
        queryParams.append('dlt_entity_id', dltEntityIdOtp);
        queryParams.append('dlt_template_id', dltTemplateIdOtp);
      } else {
        queryParams.append('username', usernameSms);
        queryParams.append('pin', pinSms);
        queryParams.append('message', payload.body);
        queryParams.append('mnumber', recipient_contact);
        queryParams.append('signature', signature);
      }

      const requestUrl = `${url}?${queryParams.toString()}`;
      
      // Short-circuit in development to avoid 10s connection timeouts since the gateway is usually IP-restricted
      if (process.env.NODE_ENV === 'development') {
        console.log('[GovSmsProvider] Dev mode: Mocking SMS delivery to', recipient_contact);
        console.log('[GovSmsProvider] URL would have been:', requestUrl);
        return { success: true, externalId: 'mock-dev-sms' };
      }

      const response = await fetch(requestUrl, {
        method: 'GET',
        // Next.js handles fetch natively, no extra verify: false needed unless strictly dealing with custom certs
      });


      const body = await response.text();
      console.log('[GovSmsProvider] API Response:', body);

      if (!response.ok) {
        throw new Error(`GovSmsProvider HTTP error! status: ${response.status} response: ${body}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[GovSmsProvider] Failed to send SMS:', error);
      return { success: false };
    }
  }
}
