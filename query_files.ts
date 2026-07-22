import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const files = await prisma.file_record.findMany({ take: 5, include: { file_version: true } });
  console.log(JSON.stringify(files, (k, v) => typeof v === 'bigint' ? Number(v) : v, 2));
}
main().finally(() => prisma.$disconnect());
