import type { PrismaClient } from '@prisma/client'

export async function seedMstPlot(db: PrismaClient) {
  console.log('Seeding mst_plot...')

  // Ensure mouza exists for the FK
  await db.mouza_master.upsert({
    where: { mouza_lgd: 318357n },
    update: {},
    create: {
      mouza_lgd: 318357n,
      mouza_name_en: 'Dummy Mouza',
      state_lgd: 20n,
      is_active: true
    }
  })

  // These mouzas must exist in mouza_master for FK to work
  const plots = [
    {
      id: 'plot-1',
      mouza_lgd: 318357n, // Standard dummy LGD code used in other seeds
      plot_number: '123/A',
      khata_number: '55',
      land_type: 'tenancy',
      area_acres: 2.5000,
    },
    {
      id: 'plot-2',
      mouza_lgd: 318357n,
      plot_number: '456/B',
      khata_number: '89',
      land_type: 'forest',
      area_acres: 5.0000,
    }
  ]

  for (const plot of plots) {
    await db.mst_plot.upsert({
      where: {
        mouza_lgd_plot_number: {
          mouza_lgd: plot.mouza_lgd,
          plot_number: plot.plot_number
        }
      },
      update: {
        khata_number: plot.khata_number,
        land_type: plot.land_type,
        area_acres: plot.area_acres,
      },
      create: plot,
    })
  }
}
