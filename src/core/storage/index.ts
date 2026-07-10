import { LocalStorageProvider } from './LocalStorageProvider'

// Export a singleton instance of the Storage Provider.
// In Phase 5, this can be swapped with an S3StorageProvider.
export const storage_provider = new LocalStorageProvider()

export * from './IStorageProvider'
export * from './LocalStorageProvider'
