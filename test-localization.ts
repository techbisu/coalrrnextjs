import { db } from './src/lib/db'
import { LocalizationEngine } from './src/localization/services/LocalizationEngine'

async function run() {
  console.log('Seeding test translation...');
  
  const lang = await db.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', native_name: 'English', is_default: true, is_active: true },
  });

  const mod = await db.translation_module.upsert({
    where: { name: 'common' },
    update: {},
    create: { name: 'common' },
  });

  const key = await db.translation_key.upsert({
    where: { module_id_key: { module_id: mod.id, key: 'save' } },
    update: {},
    create: { module_id: mod.id, key: 'save' },
  });

  await db.translation_value.upsert({
    where: { translation_key_id_language_id: { translation_key_id: key.id, language_id: lang.id } },
    update: { value: 'Save Button', status: 'approved' },
    create: { translation_key_id: key.id, language_id: lang.id, value: 'Save Button', status: 'approved' },
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
