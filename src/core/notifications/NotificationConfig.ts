import { INotificationStorage } from './interfaces/INotificationStorage';

export class NotificationConfig {
  private static storageInstance: INotificationStorage | null = null;

  public static initialize(storage: INotificationStorage) {
    this.storageInstance = storage;
  }

  public static get storage(): INotificationStorage {
    if (!this.storageInstance) {
      throw new Error('Notification framework not initialized. Call NotificationConfig.initialize() first.');
    }
    return this.storageInstance;
  }
}
