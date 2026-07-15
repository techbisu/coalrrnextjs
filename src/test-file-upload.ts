import { PrismaProjectRepository } from './infrastructure/persistence/repositories/PrismaProjectRepository';
import { CreateProjectUseCase } from './application/use-cases/project/CreateProjectUseCase';
import { fileService } from './modules/file-management/services/FileService';

async function test() {
  const repo = new PrismaProjectRepository();
  
  // 1. Mock file upload
  const buffer = Buffer.from('test file content');
  console.log('Uploading file...');
  const file_record = await fileService.uploadFile({
    buffer,
    original_name: 'test.pdf',
    mime_type: 'application/pdf',
    size_bytes: buffer.length,
    owner_id: 'user-123',
  });
  console.log('Uploaded File Record:', file_record.id);

  // 2. Mock project creation
  const uc = new CreateProjectUseCase(repo);
  console.log('Creating project...');
  const result = await uc.execute({
    name: 'Test Project ' + Date.now(),
    mine_cd: '4103',
    total_land_limit_acres: 100,
    total_budget_ceiling: 1000000,
    total_employment_quota: 10,
    user_id: 'user-123',
    pr_doc_id: file_record.id,
  });

  if (result.isFailure) {
    console.error('Failed to create project:', result.error);
    return;
  }
  console.log('Created project:', result.value.id);

  // 3. Verify file attachment
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const attachments = await db.file_attachment.findMany({
    where: { entity_id: result.value.id }
  });
  console.log('Attachments found:', attachments);
}

test().catch(console.error);
