import { db } from './src/lib/db'
import { LocalizationEngine } from './src/localization/services/LocalizationEngine'

async function run() {
  console.log('Seeding test translation...');
  
  const lang = await db.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true, isActive: true },
  });

  const mod = await db.translationModule.upsert({
    where: { name: 'common' },
    update: {},
    create: { name: 'common' },
  });

  const key = await db.translationKey.upsert({
    where: { moduleId_key: { moduleId: mod.id, key: 'save' } },
    update: {},
    create: { moduleId: mod.id, key: 'save' },
  });

  await db.translationValue.upsert({
    where: { translationKeyId_languageId: { translationKeyId: key.id, languageId: lang.id } },
    update: { value: 'Save Button', status: 'approved' },
    create: { translationKeyId: key.id, languageId: lang.id, value: 'Save Button', status: 'approved' },
  });

  console.log('Testing LocalizationEngine...');
  const translations = await LocalizationEngine.loadTranslations('en');
  console.log('Translations retrieved:', translations);
  
  if (translations.common?.save === 'Save Button') {
    console.log('✅ Verification passed!');
  } else {
    console.error('❌ Verification failed!');
  }
}

run().catch(console.error).finally(() => process.exit(0));
