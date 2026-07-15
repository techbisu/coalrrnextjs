'use server';

import { fileService } from './services/FileService';
import { revalidatePath } from 'next/cache';

/**
 * Handle Server Action for uploading a file to the File Framework.
 * We expect the FormData to contain:
 * - file: File
 * - original_name: string
 * - mime_type: string
 * - owner_id: string
 * - tags: string (JSON array)
 * - entity_type?: string
 * - entity_id?: string
 * - module?: string
 */
export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const original_name = formData.get('original_name') as string || file.name;
    const mime_type = formData.get('mime_type') as string || file.type;
    const owner_id = formData.get('owner_id') as string || 'system';
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? JSON.parse(tagsString) : undefined;
    
    const entity_type = formData.get('entity_type') as string;
    const entity_id = formData.get('entity_id') as string;
    const module = formData.get('module') as string;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileRecord = await fileService.uploadFile({
      buffer,
      original_name,
      mime_type,
      size_bytes: buffer.length,
      owner_id,
      tags,
      entity_type,
      entity_id,
      module
    });

    if (entity_type && entity_id) {
      revalidatePath(`/${module}/${entity_type}/${entity_id}`);
    }

    return { success: true, fileRecord };
  } catch (error: any) {
    console.error('Upload File Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFileAction(fileId: string, userId: string = 'system') {
  try {
    await fileService.deleteFile(fileId, userId);
    return { success: true };
  } catch (error: any) {
    console.error('Delete File Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPreviewUrlAction(fileId: string) {
  try {
    const url = await fileService.getSignedPreviewUrl(fileId);
    return { success: true, url };
  } catch (error: any) {
    console.error('Preview URL Error:', error);
    return { success: false, error: error.message };
  }
}
