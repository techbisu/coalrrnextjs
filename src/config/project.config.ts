export const PROJECT_CONFIG = {
  // Format variables: {AREA} (Short Name), {MINE} (Mine Code), {YEAR} (Current Year), {SEQ} (Auto-increment 4-digit sequence)
  eclProjCdFormat: 'ECL/{AREA}/{MINE}/{YEAR}/{SEQ}',

  statutoryClearances: [
    {
      key: 'CLEARANCE_DGMS',
      label: 'DGMS Clearance',
      level: 'PROJECT',
      mandatory: true,
    },
    {
      key: 'CLEARANCE_ENV',
      label: 'Environment Clearance',
      level: 'PROJECT',
      mandatory: true,
    },
    {
      key: 'CLEARANCE_FOREST',
      label: 'Forest Dept. Clearance',
      level: 'PLOT',
      mandatory: false,
      requiredCondition: (plot: any) => plot?.land_type?.toLowerCase().includes('forest')
    }
  ]
}
