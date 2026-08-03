import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const signatures = await prisma.$queryRaw`SELECT * FROM "public"."document_template_signature" WHERE template_code = 'FORM_VII'`;
    console.log("Document Template Signatures for FORM_VII:");
    console.log(signatures);
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
