import type { PrismaClient } from '@prisma/client'

export async function seedTranslations(db: PrismaClient) {
  console.log('Seeding translations (sys_config)...')
  
  // NOTE: This will be expanded for other tables.
  const translations = [
    { key: 'CONFIG_CATEGORY_AUTHENTICATION', en: 'Authentication', hi: 'प्रमाणीकरण' },
    { key: 'CONFIG_CATEGORY_NOTIFICATIONS', en: 'Notifications', hi: 'सूचनाएं' },
    { key: 'CONFIG_CATEGORY_SYSTEM', en: 'System Settings', hi: 'सिस्टम सेटिंग्स' },
    { key: 'CONFIG_TYPE_NUMBER', en: 'Number', hi: 'संख्या' },
    { key: 'CONFIG_TYPE_STRING', en: 'Text', hi: 'पाठ' },
    { key: 'CONFIG_TYPE_BOOLEAN', en: 'Toggle (Yes/No)', hi: 'टॉगल (हां/नहीं)' },
  ]
  
  // TODO: Insert these into translation_key / translation_value tables when we fix them.
  // For now we just prepare the array.
  console.log('Translations prepared for sys_config:', translations.length)
}
