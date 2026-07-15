import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const db = new PrismaClient();

async function seed() {
  const hash = crypto.createHash('sha256').update('demo1234').digest('hex');
  const users = [
    { email: 'unit@coalrr.gov.in', name: 'Unit Surveyor', designation: 'Surveyor', role: 'Surveyor', portal: 'ecl' },
    { email: 'area@coalrr.gov.in', name: 'Area Land Officer', designation: 'Officer', role: 'Area Officer', portal: 'ecl' },
    { email: 'gm.planning@coalrr.gov.in', name: 'GM Planning', designation: 'GM', role: 'GM', portal: 'ecl' },
    { email: 'cmd@coalrr.gov.in', name: 'CMD', designation: 'Director', role: 'Director', portal: 'ecl' }
  ];

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        password_hash: hash,
        mobile: Math.floor(Math.random() * 10000000000).toString(),
      }
    });
  }
  console.log('Users seeded');
}

seed().catch(console.error).finally(() => db.$disconnect());
