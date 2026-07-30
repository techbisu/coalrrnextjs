export const proposalConfig = {
  // Mapping of Acquisition Mode string keys to their corresponding acq_mode_id in the database
  acquisitionModeIdMap: {
    cba_act: 1,
    rfctlarr: 2,
    direct_purchase: 6,
    patta: 4 // Draft Project Expansion
  } as const,

  // Fallback values used when proposal_no or mine/area codes are not yet provided
  // These should only be used as a temporary draft reference, not committed to DB permanently
  fallbackProposalNoPrefix: 'PROP-',
  fallbackMineCode: 'UNK',
  fallbackAreaCode: 'UNK',

  defaultLimits: {
    warningThresholdPercent: 80,
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
