import { Result, Ok, Fail } from '@/core'
import { db } from '@/lib/db'
import { uploadFileUseCase, linkFileUseCase, deleteFileUseCase } from '@/infrastructure/di/Container'
import { MODULE_CODES } from '@/core/config/module-codes.config'

export interface UploadDocumentDTO {
  proposalId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  userId: string;
  module?: string; // e.g. "LAND_ACQ_PROPOSAL"
}

export class ProposalDocumentPackageService {
  /**
   * Uploads a document and attaches it to a Proposal
   */
  async uploadAndAttach(data: UploadDocumentDTO): Promise<Result<any>> {
    try {
      // 1. Validate Proposal is not locked from adding documents
      const proposal = await db.acq_proposal.findUnique({ where: { proposal_id: data.proposalId } })
      if (!proposal) return Fail('Proposal not found')
      
      // Basic lock check: if it's already escalated/approved, we might not allow uploads.
      // Assuming state transitions govern this, we just do a basic check here or let the workflow handle it.
      if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(proposal.overall_status)) {
        return Fail('Cannot modify documents for a finalized proposal')
      }

      // 2. Upload file via FileManagement module
      const uploadResult = await uploadFileUseCase.execute({
        originalName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        buffer: data.fileBuffer,
        ownerId: data.userId,
      })

      if (uploadResult.isFailure) return Fail(String(uploadResult.error))
      
      const fileId = uploadResult.value!.id

      // 3. Link file to Proposal entity
      const linkResult = await linkFileUseCase.execute({
        fileId: fileId as string,
        entityType: 'PROPOSAL',
        entityId: data.proposalId,
        module: data.module || MODULE_CODES.LAND_SCHEDULE,
        ownerId: data.userId,
      })

      if (linkResult.isFailure) return Fail(String(linkResult.error))

      return Ok({ fileId, attachmentId: linkResult.value!.id })
    } catch (e: any) {
      console.error('ProposalDocumentPackageService.uploadAndAttach error:', e)
      return Fail(e.message)
    }
  }

  /**
   * Get all attached documents for a Proposal
   */
  async getPackageDocuments(proposalId: string): Promise<Result<any[]>> {
    try {
      const attachments = await db.file_attachment.findMany({
        where: { entity_type: 'PROPOSAL', entity_id: proposalId },
        include: {
          file_record: {
            include: {
              file_version: {
                orderBy: { version_number: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { entry_ts: 'desc' }
      })

      return Ok(attachments.map(att => {
        const latestVersion = att.file_record.file_version[0]
        return {
          attachmentId: att.id,
          fileId: att.file_record.id,
          fileName: att.file_record.original_name,
          sizeBytes: latestVersion ? Number(latestVersion.size_bytes) : 0,
          mimeType: latestVersion?.mime_type || 'application/octet-stream',
          attachedAt: att.entry_ts,
          attachedBy: att.attached_by,
          attachmentType: 'DOCUMENT'
        }
      }))
    } catch (e: any) {
      return Fail(e.message)
    }
  }

  /**
   * Delete a document attachment
   */
  async removeDocument(proposalId: string, attachmentId: string, userId: string): Promise<Result<boolean>> {
    try {
      const attachment = await db.file_attachment.findFirst({
        where: { id: attachmentId, entity_id: proposalId, entity_type: 'PROPOSAL' }
      })

      if (!attachment) return Fail('Attachment not found')

      // Also hard delete the underlying file for security/cleanup, or just soft delete.
      // DeleteFileUseCase handles soft vs hard delete depending on config.
      const deleteResult = await deleteFileUseCase.execute({ fileId: attachment.file_id })
      if (deleteResult.isFailure) return Fail(String(deleteResult.error))

      return Ok(true)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
