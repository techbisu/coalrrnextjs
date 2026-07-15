import { PrismaClient } from '@prisma/client'
import { seedSysConfig } from './sys_config.seed'
import { seedTranslations } from './translations.seed'
import { seedMstPlot } from './mst_plot.seed'

const db = new PrismaClient()

async function main() {
  console.log('🌱 COALRR Master Seed Orchestrator')
  console.log('-----------------------------------')

  try {
    // Execute all seeds sequentially to respect FK constraints
    await seedSysConfig(db)
    await seedTranslations(db)
    await seedMstPlot(db)

    console.log('\n✅ All seeds completed successfully.')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

if (require.main === module) {
  main()
}
