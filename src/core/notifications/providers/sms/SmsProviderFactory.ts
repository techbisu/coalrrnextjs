import { INotificationProvider } from '../../interfaces/INotificationProvider';
import { GovSmsProvider } from './GovSmsProvider';
import { smsConfig } from '../../../config/sms.config';
import { MockSmsProvider } from '../MockProviders';

export class SmsProviderFactory {
  static getProvider(): INotificationProvider {
    switch (smsConfig.defaultProvider) {
      case 'gov':
        return new GovSmsProvider();
      case 'mock':
        return new MockSmsProvider();
      default:
        console.warn(`[SmsProviderFactory] Unknown provider '${smsConfig.defaultProvider}', defaulting to Gov`);
        return new GovSmsProvider();
    }
  }
}
