import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';

export interface CreateDocumentVersionDTO {
  documentInstanceId: string;
  contextSnapshot?: Record<string, unknown>;
  sourceEntityVersion?: number;
  generatedFileId?: string;
  pdfFileId?: string;
  generationReason?: string;
  createdBy?: string;
}

export class DocumentVersionService {
  /**
   * Creates a new document version for an instance while marking existing versions as SUPERSEDED.
   */
  async createNewVersion(dto: CreateDocumentVersionDTO): Promise<Result<any>> {
    try {
      // 1. Fetch latest version number for instance
      const lastVersion = await (db as any).document_version.findFirst({
        where: { document_instance_id: dto.documentInstanceId },
        orderBy: { version_no: 'desc' },
      });

      const nextVersionNo = (lastVersion?.version_no ?? 0) + 1;

      // 2. Mark previous active version as SUPERSEDED
      if (lastVersion && lastVersion.status !== 'SUPERSEDED') {
        await (db as any).document_version.update({
          where: { id: lastVersion.id },
          data: {
            status: 'SUPERSEDED',
            superseded_at: new Date(),
          },
        });
      }

      // 3. Create new document_version
      const version = await (db as any).document_version.create({
        data: {
          document_instance_id: dto.documentInstanceId,
          version_no: nextVersionNo,
          status: 'DRAFT',
          context_snapshot: dto.contextSnapshot ?? {},
          source_entity_version: dto.sourceEntityVersion ?? 1,
          generated_file_id: dto.generatedFileId,
          pdf_file_id: dto.pdfFileId,
          generation_reason: dto.generationReason ?? 'Initial generation',
          created_by: dto.createdBy ?? 'system',
        },
      });

      return Ok(version);
    } catch (e: any) {
      console.error('DocumentVersionService.createNewVersion error:', e);
      return Fail(e.message ?? 'Failed to create document version');
    }
  }

  /**
   * Retrieves active/latest version for a document instance.
   */
  async getLatestVersion(documentInstanceId: string): Promise<Result<any>> {
    try {
      const version = await (db as any).document_version.findFirst({
        where: { document_instance_id: documentInstanceId },
        orderBy: { version_no: 'desc' },
      });
      return Ok(version);
    } catch (e: any) {
      console.error('DocumentVersionService.getLatestVersion error:', e);
      return Fail(e.message ?? 'Failed to query latest document version');
    }
  }
}

export const documentVersionService = new DocumentVersionService();
