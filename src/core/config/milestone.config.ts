import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from './module-codes.config';

export const milestoneConfig = {
  // Direct Purchase (DP) milestone definitions and their dependencies
  DP: [
    { id: 'SALE_DEED_REGISTRATION', label: 'Sale Deed Registration', requires: [] },
    { id: 'STAMP_DUTY_CLEARANCE', label: 'Stamp Duty Clearance', requires: ['SALE_DEED_REGISTRATION'] },
    { id: 'VALUATION_APPROVAL', label: 'Valuation Committee Approval', requires: [] },
    { id: 'POSSESSION_HANDOVER', label: 'Physical Possession Handover', requires: ['SALE_DEED_REGISTRATION', 'STAMP_DUTY_CLEARANCE'] },
    { id: 'BOARD_SANCTION', label: 'Board Administrative Approval', requires: [] },
    { id: 'MUTATION_COMPLETED', label: 'Land Mutation Completed', requires: ['POSSESSION_HANDOVER'] },
    { id: 'OTHER_MILESTONE', label: 'Other Statutory Milestone', requires: [] },
  ],

  // Coal Bearing Areas (CBA) Act milestone definitions and their dependencies
  CBA: [
    { id: 'SECTION_4_NOTIFICATION', label: 'Section 4 Gazette Notification', requires: [], triggersTransition: 'advance_to_sec7_prep' },
    { id: 'SECTION_7_NOTIFICATION', label: 'Section 7 Gazette Notification', requires: ['SECTION_4_NOTIFICATION'] },
    { id: 'SECTION_9_NOTIFICATION', label: 'Section 9 Gazette Notification', requires: ['SECTION_7_NOTIFICATION'] },
    { id: 'SECTION_11_NOTIFICATION', label: 'Section 11 Declaration', requires: ['SECTION_9_NOTIFICATION'] },
    { id: 'FORM_XXII_ISSUE', label: 'Form-XXII Public Notice', requires: [] },
    { id: 'OTHER_MILESTONE', label: 'Other Statutory Milestone', requires: [] },
  ],

  allowedRoles: ['admin', 'super_admin', 'area_gm', 'unit_office', 'legal_officer']
} as const;

export function getSeedMilestoneDefinitions() {
  const definitions: Array<{ moduleCode: string; milestoneCode: string; name: string; entityType: string; requires: string[] }> = [];

  for (const m of milestoneConfig.DP) {
    definitions.push({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      milestoneCode: m.id,
      name: m.label,
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      requires: [...m.requires],
    });
  }

  for (const m of milestoneConfig.CBA) {
    definitions.push({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      milestoneCode: m.id,
      name: m.label,
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      requires: [...m.requires],
    });
  }

  return definitions;
}
