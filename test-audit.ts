import { db } from './src/lib/db';
import { withAuditContext } from './src/lib/context/AuditContext';
import { auditQueue as AuditQueue } from './src/infrastructure/di/Container';

async function testAuditFramework() {
  console.log('Testing Audit Framework...');
  
  // Create a dummy user context
  const auditContext = {
    user_id: 'user-123',
    userRole: 'admin',
    ip_address: '192.168.1.100',
    user_agent: 'Audit-Test-Script',
    request_url: '/api/test',
    request_method: 'POST',
  };

  await withAuditContext(auditContext, async () => {
    // 1. Create a dummy record (e.g. Language, because it has few fields and is easy to create)
    console.log('Creating a dummy language...');
    const lang = await db.language.create({
      data: {
        code: 'dummy-lang',
        name: 'Dummy Lang',
        native_name: 'Dummy',
        direction: 'LTR',
      }
    });

    console.log('Dummy Language Created:', lang.id);

    // 2. Update the record
    console.log('Updating the dummy language...');
    await db.language.update({
      where: { id: lang.id },
      data: {
        name: 'Updated Dummy Lang',
        is_active: false
      }
    });

    console.log('Dummy Language Updated!');

    // 3. Delete the record
    console.log('Deleting the dummy language...');
    await db.language.delete({
      where: { id: lang.id }
    });

    console.log('Dummy Language Deleted!');
  });

  // Since AuditQueue batches every 3 seconds, we wait for 4 seconds to let it flush.
  console.log('Waiting 4 seconds for queue to flush to DB...');
  await new Promise(res => setTimeout(res, 4000));

  // Check the DB for Audit Logs
  console.log('Checking Audit Logs in DB...');
  const logs = await db.audit_log.findMany({
    where: { entity_name: 'Language' },
    orderBy: { entry_ts: 'desc' },
    take: 3,
    include: { changes: true }
  });

  console.log('\n--- Audit Logs ---');
  logs.forEach(log => {
    console.log(`[${log.event_type}] on ${log.entity_name} by ${log.user_id}`);
    if (log.changes.length > 0) {
      log.changes.forEach(change => {
        console.log(`  -> Field: ${change.field_name}`);
        console.log(`  -> Old: ${change.old_value}`);
        console.log(`  -> New: ${change.new_value}`);
        if (change.json_diff) {
          console.log(`  -> JSON Diff: ${change.json_diff}`);
        }
      });
    }
  });

  console.log('\nAudit test complete!');
}

testAuditFramework().catch(console.error).finally(() => process.exit(0));
