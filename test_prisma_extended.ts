import { db } from './src/lib/db';

async function main() {
  try {
    const created = await db.manual_milestone.create({
      data: {
        entity_type: 'proposal',
        entity_id: 'test_id',
        milestone_type: 'GENERAL_MILESTONE',
        authority_name: 'District Office',
        reference_no: null,
        sent_at: new Date(),
        outcome: 'APPROVED',
        remarks: null,
        document_id: null,
        entry_by: 'system'
      }
    });
    console.log('Success:', created);
  } catch (err) {
    console.error('Prisma Error:', err);
  }
}
main();
