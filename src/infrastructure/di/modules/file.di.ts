import { PrismaFileRepository } from '@/modules/file-management/infrastructure/persistence/PrismaFileRepository'
import { UploadFileUseCase } from '@/modules/file-management/application/use-cases/UploadFileUseCase'
import { DeleteFileUseCase } from '@/modules/file-management/application/use-cases/DeleteFileUseCase'
import { GetFilePreviewUseCase } from '@/modules/file-management/application/use-cases/GetFilePreviewUseCase'
import { LinkFileUseCase } from '@/modules/file-management/application/use-cases/LinkFileUseCase'
import { DownloadFileUseCase } from '@/modules/file-management/application/use-cases/DownloadFileUseCase'
import { S3StorageProvider } from '@/modules/file-management/storage/S3StorageProvider'
import { localStorageProvider } from '@/modules/file-management/storage/LocalStorageProvider'
import { ClamAVScanner } from '@/modules/file-management/security/ClamAVScanner'
import { uploadConfig } from '@/core/config/upload.config'

const globalForFileDI = globalThis as unknown as {
  uploadFileUseCase: UploadFileUseCase | undefined
  deleteFileUseCase: DeleteFileUseCase | undefined
  getFilePreviewUseCase: GetFilePreviewUseCase | undefined
  linkFileUseCase: LinkFileUseCase | undefined
  downloadFileUseCase: DownloadFileUseCase | undefined
}

const fileRepository = new PrismaFileRepository()
const storageProvider = uploadConfig.storageProvider === 'S3' ? new S3StorageProvider() : localStorageProvider
const virusScanner = new ClamAVScanner()

export const uploadFileUseCase = globalForFileDI.uploadFileUseCase ?? new UploadFileUseCase(fileRepository, storageProvider, virusScanner)
export const deleteFileUseCase = globalForFileDI.deleteFileUseCase ?? new DeleteFileUseCase(fileRepository)
export const getFilePreviewUseCase = globalForFileDI.getFilePreviewUseCase ?? new GetFilePreviewUseCase(fileRepository, storageProvider)
export const linkFileUseCase = globalForFileDI.linkFileUseCase ?? new LinkFileUseCase(fileRepository)
export const downloadFileUseCase = globalForFileDI.downloadFileUseCase ?? new DownloadFileUseCase(fileRepository, storageProvider)

if (process.env.NODE_ENV !== 'production') {
  globalForFileDI.uploadFileUseCase = uploadFileUseCase
  globalForFileDI.deleteFileUseCase = deleteFileUseCase
  globalForFileDI.getFilePreviewUseCase = getFilePreviewUseCase
  globalForFileDI.linkFileUseCase = linkFileUseCase
  globalForFileDI.downloadFileUseCase = downloadFileUseCase
}

