/**
 * Enterprise URL Routing Service.
 * Centralized registry for all application routes. 
 * Business modules MUST use this instead of hardcoding strings.
 */
export const routes = {
  home: () => '/',
  dashboard: () => '/dashboard',
  
  project: {
    list: () => '/projects',
    details: (publicId: string) => `/projects/${publicId}`,
  },
  
  proposal: {
    list: () => '/proposals',
    details: (publicId: string) => `/proposals/${publicId}`,
    history: (publicId: string) => `/proposals/${publicId}/history`,
  },
  
  payroll: {
    list: () => '/payrolls',
    details: (publicId: string) => `/payrolls/${publicId}`,
  },
  
  claim: {
    list: () => '/claims',
    details: (publicId: string) => `/claims/${publicId}`,
  },
  
  rnrAsset: {
    list: () => '/rnr-assets',
    details: (publicId: string) => `/rnr-assets/${publicId}`,
  },
  
  paymentLedger: {
    list: () => '/payments',
    details: (publicId: string) => `/payments/${publicId}`,
  },
  
  nomination: {
    list: () => '/nominations',
    details: (publicId: string) => `/nominations/${publicId}`,
  },
  
  employment: {
    list: () => '/employment',
    details: (publicId: string) => `/employment/${publicId}`,
  },
  
  employmentWizard: {
    list: () => '/employment-wizard',
  },
  
  workflow: {
    list: () => '/workflows',
    details: (publicId: string) => `/workflows/${publicId}`,
  },

  file: {
    // For secure signing, call the Server Action `generateSignedDownloadUrl(fileId)` instead
    download: (fileId: string) => `/api/files/${fileId}/download`
  }
}

/**
 * URL Parser used by the Catch-All route shell to reverse-map URLs into application state.
 */
export class UrlParser {
  static parse(pathname: string) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return { view: 'dashboard' }

    const [moduleRoute, publicId, action] = parts

    // Map URL segments back to Zustand view keys
    const viewMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'projects': 'project-master',
      'proposals': 'acquisition',
      'payrolls': 'payroll-builder',
      'claims': 'form-i-wizard',
      'rnr-assets': 'rnr-asset',
      'payments': 'payment-ledger',
      'nominations': 'nomination',
      'employment': 'employment',
      'employment-wizard': 'employment-wizard',
      'workflows': 'workflow-inbox'
    }

    const view = viewMap[moduleRoute] || 'dashboard'
    return { view, moduleRoute, publicId, action }
  }
}
