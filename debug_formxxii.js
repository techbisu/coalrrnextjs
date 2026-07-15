const { PrismaClient } = require('@prisma/client');
async function main() {
  const db = new PrismaClient();
  const proposalId = 'd60b5d1e-aeff-42e6-9655-15641a6e305b';

  console.log('--- land_schedule state ---');
  const proposal = await db.land_schedule.findUnique({
    where: { id: proposalId },
    include: { project: { select: { id: true, name: true, total_land_limit_acres: true, total_budget_ceiling: true, total_employment_quota: true } } }
  });
  console.log('state:', proposal?.state);
  console.log('project:', proposal?.project);

  console.log('\n--- document_template FORM_XXII ---');
  const template = await db.document_template.findUnique({ where: { template_code: 'FORM_XXII' } });
  console.log('template:', template ? 'found' : 'NOT FOUND');

  console.log('\n--- document_instance ---');
  const instance = await db.document_instance.findFirst({ where: { template_code: 'FORM_XXII', application_id: proposalId } });
  console.log('instance:', instance ?? 'NOT FOUND');

  console.log('\n--- file_attachment (land_schedule) ---');
  const attachment = await db.file_attachment.findFirst({
    where: { entity_type: 'land_schedule', entity_id: proposalId },
    include: { file: { include: { versions: { orderBy: { version_number: 'desc' }, take: 1 } } } },
    orderBy: { entry_ts: 'desc' }
  });
  console.log('attachment:', attachment ?? 'NOT FOUND');

  await db.$disconnect();
}
main().catch(console.error);
