import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const attachments = await prisma.file_attachment.findMany({
      take: 10,
      include: {
        file_record: {
          include: {
            file_version: true
          }
        }
      }
    });
    console.log(JSON.stringify(attachments, null, 2));
  } catch (e) {
    console.error("PRISMA ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
