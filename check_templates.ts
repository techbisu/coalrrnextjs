import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const templates = await prisma.$queryRaw`SELECT * FROM "public"."document_template"`;
    console.log("Document Templates:");
    console.log(templates);
    
    const fields = await prisma.$queryRaw`SELECT * FROM "public"."document_template_field"`;
    console.log("Document Template Fields:");
    console.log(fields);
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
