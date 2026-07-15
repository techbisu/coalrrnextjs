const { PrismaClient } = require('@prisma/client');
async function main() {
  const db = new PrismaClient();
  const template = await db.document_template.upsert({
    where: { template_code: 'FORM_XXII' },
    update: {},
    create: {
      template_code: 'FORM_XXII',
      template_name: 'Form XXII',
      description: 'Form XXII Generation',
      storage_path: 'templates/form_xxii.docx',
      config: { resolver: 'FormXXIIResolver' }
    }
  });
  console.log('Inserted template:', template);
  await db.$disconnect();
}
main().catch(console.error);
