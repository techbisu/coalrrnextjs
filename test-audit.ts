import { db } from './src/lib/db';
import { withAuditContext } from './src/lib/context/AuditContext';
import { AuditQueue } from './src/audit/services/AuditQueue';

async function testAuditFramework() {
  console.log('Testing Audit Framework...');
  
  // Create a dummy user context
  const auditContext = {
    userId: 'user-123',
    userRole: 'admin',
    ipAddress: '192.168.1.100',
    userAgent: 'Audit-Test-Script',
    requestUrl: '/api/test',
    requestMethod: 'POST',
  };

  await withAuditContext(auditContext, async () => {
    // 1. Create a dummy record (e.g. Language, because it has few fields and is easy to create)
    console.log('Creating a dummy language...');
    const lang = await db.language.create({
      data: {
        code: 'dummy-lang',
        name: 'Dummy Lang',
        nativeName: 'Dummy',
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
        isActive: false
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
  const logs = await db.auditLog.findMany({
    where: { entityName: 'Language' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { changes: true }
  });

  console.log('\n--- Audit Logs ---');
  logs.forEach(log => {
    console.log(`[${log.eventType}] on ${log.entityName} by ${log.userId}`);
    if (log.changes.length > 0) {
      log.changes.forEach(change => {
        console.log(`  -> Field: ${change.fieldName}`);
        console.log(`  -> Old: ${change.oldValue}`);
        console.log(`  -> New: ${change.newValue}`);
        if (change.jsonDiff) {
          console.log(`  -> JSON Diff: ${change.jsonDiff}`);
        }
      });
    }
  });

  console.log('\nAudit test complete!');
}

testAuditFramework().catch(console.error).finally(() => process.exit(0));
