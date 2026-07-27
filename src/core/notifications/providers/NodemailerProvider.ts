import nodemailer from 'nodemailer';
import { INotificationProvider } from '../interfaces/INotificationProvider';
import { NotificationJob } from '../types';
import { emailConfig } from '../../config/email.config';

export class NodemailerProvider implements INotificationProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  async deliver(job: NotificationJob): Promise<{ success: boolean; externalId?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: emailConfig.fromAddress,
        to: job.recipient_contact,
        subject: job.payload.subject || 'Notification',
        text: job.payload.body, // Fallback for clients without HTML support
        html: job.payload.body, // Assuming body is compiled HTML
      });
      
      return { success: true, externalId: info.messageId };
    } catch (error) {
      console.error('[NodemailerProvider] Failed to send email:', error);
      return { success: false };
    }
  }
}
