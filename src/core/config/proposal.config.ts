export const proposalConfig = {
  // Mapping of Acquisition Mode string keys to their corresponding acq_mode_id in the database
  acquisitionModeIdMap: {
    cba_act: 1,
    rfctlarr: 2,
    lts_govt: 3,
    lease_govt: 4,
    forest_diversion: 5,
    direct_purchase: 6,
    inherited_land: 7,
    la_act: 8,
    lease_tenancy: 9,
  } as const,

  acquisitionModeShortCode: {
    cba_act: 'CBA',
    rfctlarr: 'RFCTLARR',
    lts_govt: 'LTS',
    lease_govt: 'LGOVT',
    forest_diversion: 'FD',
    direct_purchase: 'DP',
    inherited_land: 'INH',
    la_act: 'LA',
    lease_tenancy: 'LT',
    patta: 'PATTA',
  } as Record<string, string>,

  primaryCreationModes: [
    { key: 'DIRECT_PURCHASE', acqModeId: 6, label: 'Direct Purchase', sopActivity: '1.2' },
    { key: 'RFCTLARR', acqModeId: 2, label: 'RFCTLARR Act 2013', sopActivity: '1.3' },
    { key: 'CBA', acqModeId: 1, label: 'CBA (A&D) Act 1957', sopActivity: '1.1' },
    { key: 'DRAFT_PR_STAGE', acqModeId: 6, label: 'Draft PR Stage (Checklist 1.4)', sopActivity: '1.4', proposalType: 'DRAFT_PR_CHECKLIST_1_4' },
  ],

  // Fallback values used when proposal_no or mine/area codes are not yet provided
  fallbackProposalNoPrefix: 'PROP-',
  fallbackMineCode: 'UNK',
  fallbackAreaCode: 'UNK',

  defaultLimits: {
    warningThresholdPercent: 80,
    criticalThresholdPercent: 100,
  },

  // Rules for auto-setting optional plot fields based on State LGD and Primary Plot Type
  plotAutoSetRules: [
    {
      stateLgd: '19', // West Bengal
      primaryPlotTypes: ['1', '2'], // LR, RS
      autoSetOptPlotType: '2', // RS
      copyPlotNumber: true
    },
    {
      stateLgd: '20', // Jharkhand
      primaryPlotTypes: ['3'], // CS
      autoSetOptPlotType: '3', // CS
      copyPlotNumber: true
    },
    {
      stateLgd: '20', // Jharkhand
      primaryPlotTypes: ['1', '2'], // LR, RS
      autoSetOptPlotType: '3', // CS
      copyPlotNumber: false
    }
  ]
} as const
