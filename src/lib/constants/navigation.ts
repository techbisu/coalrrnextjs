export type ViewKey =
  | 'dashboard'
  | 'project-master'   // M1
  | 'acquisition'      // M2
  | 'form-i-wizard'    // M3
  | 'payroll-builder'  // M4
  | 'paf-census'       // M6
  | 'rnr-asset'        // M7
  | 'payment-ledger'   // M8
  | 'nomination'       // M9
  | 'employment'       // M10
  | 'employment-wizard'// M10 (public portal)
  | 'workflow-inbox'

export interface NavItem {
  key: ViewKey
  label: string
  module: string
  icon: string
  description: string
  portals: Array<'ecl' | 'public'>
  requiredPermission?: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',       label: 'Dashboard',            module: 'Overview', icon: 'LayoutDashboard', description: 'Cross-module KPIs, SLA countdowns, and pending approvals', portals: ['ecl'], requiredPermission: 'dashboard.view' },
  { key: 'project-master',  label: 'Project Master & GIS', module: 'M1',       icon: 'Map',              description: 'Locked baseline, statutory clearances, GIS boundary', portals: ['ecl'], requiredPermission: 'project.view' },
  { key: 'acquisition',     label: 'Land Acquisition',     module: 'M2',       icon: 'ClipboardList',   description: 'Plot acquisition proposals, CL-1 checklists, area/HQ vetting', portals: ['ecl'], requiredPermission: 'acquisition.view' },
  { key: 'form-i-wizard',   label: 'Form-I Claim Wizard',  module: 'M3',       icon: 'FileText',         description: 'Public portal multi-step claim submission (21-day timer)', portals: ['public', 'ecl'], requiredPermission: 'claim.view' },
  { key: 'payroll-builder', label: 'Compensation Payroll', module: 'M4',       icon: 'Calculator',       description: 'Live Math Engine preview, batch award calculation', portals: ['ecl'], requiredPermission: 'payroll.view' },
  { key: 'paf-census',      label: 'PAF Census Register',  module: 'M6',       icon: 'Users',            description: 'Project Affected Families census, photo ID cards, satellite freeze', portals: ['ecl'], requiredPermission: 'census.view' },
  { key: 'rnr-asset',       label: 'R&R Asset Proposal',   module: 'M7',       icon: 'Home',             description: 'Homestead, shifting, cattle shed, subsistence grant payrolls', portals: ['ecl'], requiredPermission: 'rnr.view' },
  { key: 'payment-ledger',  label: 'Form-D Payment Ledger',module: 'M8',       icon: 'Lock',             description: 'Immutable hash-chained payment register', portals: ['ecl'], requiredPermission: 'ledger.view' },
  { key: 'nomination',      label: 'Nominee Package Deal', module: 'M9',       icon: 'UserPlus',         description: 'Form-A nomination, nominee pooling toward 2.00-acre threshold', portals: ['public', 'ecl'], requiredPermission: 'nomination.view' },
  { key: 'employment',      label: 'Employment Verification', module: 'M10',   icon: 'Users',            description: '2.00-acre nominee pooling gate, Form-IX/X quota, CL-4 checklist', portals: ['ecl'], requiredPermission: 'employment.view' },
  { key: 'employment-wizard', label: 'Employment Application', module: 'M10',  icon: 'Briefcase',        description: 'Form-V/VI bio-data wizard, document upload, status tracker', portals: ['public'], requiredPermission: 'employment.view' },
  { key: 'workflow-inbox',  label: 'Workflow Inbox',       module: 'Cross',    icon: 'Inbox',            description: 'Pending approvals across all modules', portals: ['ecl'], requiredPermission: 'workflow.view' },
]
