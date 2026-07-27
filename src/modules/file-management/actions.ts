'use server';

import { uploadFileUseCase, deleteFileUseCase, getFilePreviewUseCase } from '@/infrastructure/di/Container';
import { revalidatePath } from 'next/cache';

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const originalName = formData.get('original_name') as string || file.name;
    const mimeType = formData.get('mime_type') as string || file.type;
    const ownerId = formData.get('owner_id') as string || 'system';
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? JSON.parse(tagsString) : undefined;
    
    const entityType = formData.get('entity_type') as string;
    const entityId = formData.get('entity_id') as string;
    const module = formData.get('module') as string;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFileUseCase.execute({
      buffer,
      originalName,
      mimeType,
      sizeBytes: buffer.length,
      ownerId,
      tags,
      entityType,
      entityId,
      module
    });

    if (result.isFailure) {
      throw new Error(result.error as string);
    }

    if (entityType && entityId) {
      revalidatePath(`/${module}/${entityType}/${entityId}`);
    }

    return { success: true, fileRecord: result.value?.props };
  } catch (error: any) {
    console.error('Upload File Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFileAction(fileId: string, userId: string = 'system') {
  try {
    const result = await deleteFileUseCase.execute({ fileId, userId });
    
    if (result.isFailure) {
      throw new Error(result.error as string);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete File Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPreviewUrlAction(fileId: string) {
  try {
    const result = await getFilePreviewUseCase.execute({ fileId });
    
    if (result.isFailure) {
      throw new Error(result.error as string);
    }

    return { success: true, url: result.value };
  } catch (error: any) {
    console.error('Preview URL Error:', error);
    return { success: false, error: error.message };
  }
}
