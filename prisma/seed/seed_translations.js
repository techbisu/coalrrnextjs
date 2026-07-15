const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure english language exists
  let enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  if (!enLang) {
    enLang = await prisma.language.create({
      data: { code: 'en', name: 'English', nativeName: 'English', isDefault: true }
    });
  }

  // Ensure common module exists
  let commonModule = await prisma.translationModule.findUnique({ where: { name: 'common' } });
  if (!commonModule) {
    commonModule = await prisma.translationModule.create({
      data: { name: 'common', description: 'Common shared translations' }
    });
  }

  // Add keys
  const keys = [
    { key: 'sidebar.workspace', value: 'Workspace' },
    { key: 'sidebar.logout', value: 'Log out' },
    { key: 'shell.loading', value: 'Loading...' },
  ];

  for (const k of keys) {
    let tKey = await prisma.translationKey.findUnique({
      where: { moduleId_key: { moduleId: commonModule.id, key: k.key } }
    });
    if (!tKey) {
      tKey = await prisma.translationKey.create({
        data: { moduleId: commonModule.id, key: k.key }
      });
    }

    // Add value
    await prisma.translationValue.upsert({
      where: { translationKeyId_languageId: { translationKeyId: tKey.id, languageId: enLang.id } },
      update: { value: k.value, status: 'approved' },
      create: { translationKeyId: tKey.id, languageId: enLang.id, value: k.value, status: 'approved' }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
