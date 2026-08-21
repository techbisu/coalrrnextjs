export interface MasterColumnConfig {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  required?: boolean
  /**
   * If set, this column is a FK rendered as a searchable MasterAutocomplete.
   */
  lookupFrom?: string
  /**
   * If set, this lookup is filtered by another form field's current value.
   * E.g. district dropdown filtered by selected state: dependsOnField = 'state_lgd'
   */
  dependsOnField?: string
}

export interface MasterDataConfig {
  title: string
  description: string
  modelName: string
  primaryKey: string
  /**
   * Postgres schema name — used for raw CAST LIKE queries on numeric PK columns.
   * Defaults to 'master' in the lookup route if omitted.
   */
  dbSchema?: string
  columns: MasterColumnConfig[]
  /**
   * Columns to search across in the lookup API.
   * String columns use `contains` (insensitive); numeric PK uses CAST LIKE via raw SQL.
   * SERVER-SIDE ONLY. Defaults to [labelKey] if not set.
   */
  searchKeys?: string[]
  /**
   * Optional formatter to override the default dropdown label.
   * SERVER-SIDE ONLY — used in the API route.
   * Must NEVER be passed as a prop to a Client Component.
   */
  labelFormat?: (record: any) => string
}

/**
 * Serializable subset of MasterDataConfig — safe to pass from a Server Component
 * to any Client Component as props. All non-serializable fields (functions) are omitted.
 */
export type MasterDataClientConfig = Omit<MasterDataConfig, 'labelFormat' | 'searchKeys'>

/**
 * Strip server-only fields (labelFormat etc.) from a MasterDataConfig so it
 * can be safely serialised and passed as props to Client Components.
 */
export function toClientConfig(config: MasterDataConfig): MasterDataClientConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { labelFormat: _labelFormat, ...clientConfig } = config
  return clientConfig
}

export const MASTER_REGISTRY: Record<string, MasterDataConfig> = {
  'state': {
    title: 'State Master',
    description: 'Manage states across India',
    modelName: 'state',
    primaryKey: 'state_lgd',
    columns: [
      { key: 'state_lgd', label: 'State LGD Code', type: 'number', required: true },
      { key: 'state_en', label: 'State Name (English)', type: 'string', required: true },
      { key: 'state_loc_vern', label: 'Local Vernacular', type: 'string' },
      { key: 'short_code', label: 'Short Code', type: 'string' },
      { key: 'is_active', label: 'Is Active', type: 'boolean' }
    ],
    labelFormat: (r) => [r.state_en, r.state_loc_vern, r.state_lgd ? String(r.state_lgd) : null].filter(Boolean).join(' | '),
    searchKeys: ['state_en', 'state_loc_vern', 'short_code'],
  },
  'district': {
    title: 'District Master',
    description: 'Manage districts',
    modelName: 'district',
    primaryKey: 'district_lgd',
    columns: [
      { key: 'state_lgd',   label: 'State',         type: 'number', required: true, lookupFrom: 'state' },
      { key: 'district_lgd', label: 'District LGD', type: 'number', required: true },
      { key: 'district_en', label: 'District Name', type: 'string', required: true },
      { key: 'is_active',   label: 'Is Active',     type: 'boolean' },
    ],
    labelFormat: (r) => [r.district_en, r.district_loc_vern, r.district_lgd ? String(r.district_lgd) : null].filter(Boolean).join(' | '),
    searchKeys: ['district_en', 'district_loc_vern'],
  },
  'block': {
    title: 'Block Master',
    description: 'Manage blocks',
    modelName: 'block',
    primaryKey: 'block_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',       type: 'number', required: true, lookupFrom: 'state' },
      { key: 'district_lgd', label: 'District',    type: 'number', required: true, lookupFrom: 'district', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block LGD',   type: 'number', required: true },
      { key: 'block_en',     label: 'Block Name',  type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active',   type: 'boolean' },
    ],
    labelFormat: (r) => [r.block_en, r.block_loc_vern, r.block_lgd ? String(r.block_lgd) : null].filter(Boolean).join(' | '),
    searchKeys: ['block_en', 'block_loc_vern'],
  },
  'ps': {
    title: 'Police Station Master',
    description: 'Manage police stations',
    modelName: 'ps',
    primaryKey: 'ps_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',     type: 'number', required: true, lookupFrom: 'state' },
      { key: 'district_lgd', label: 'District',  type: 'number', required: true, lookupFrom: 'district', dependsOnField: 'state_lgd' },
      { key: 'ps_lgd',       label: 'PS LGD',    type: 'number', required: true },
      { key: 'ps_en',        label: 'PS Name',   type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active', type: 'boolean' },
    ],
    labelFormat: (r) => [r.ps_en, r.ps_loc_vern, r.ps_lgd ? String(r.ps_lgd) : null].filter(Boolean).join(' | '),
    searchKeys: ['ps_en', 'ps_loc_vern'],
  },
  'mouza': {
    title: 'Mouza Master',
    description: 'Manage mouzas',
    modelName: 'mouza',
    primaryKey: 'mouza_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',      type: 'number', required: true, lookupFrom: 'state' },
      { key: 'district_lgd', label: 'District',   type: 'number', required: true, lookupFrom: 'district', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block',      type: 'number', required: true, lookupFrom: 'block',    dependsOnField: 'district_lgd' },
      { key: 'mouza_lgd',    label: 'Mouza LGD',  type: 'number', required: true },
      { key: 'mouza_en',     label: 'Mouza Name', type: 'string', required: true },
      { key: 'jl_no',        label: 'JL Number',  type: 'string' },
      { key: 'is_active',    label: 'Is Active',  type: 'boolean' },
    ],
    labelFormat: (r) => [r.mouza_en, r.mouza_loc_vern, r.halka_no, r.jl_no].filter(Boolean).join(' | '),
    searchKeys: ['mouza_en', 'mouza_loc_vern', 'jl_no', 'halka_no'],
  },
  'village': {
    title: 'Village Master',
    description: 'Manage villages',
    modelName: 'village',
    primaryKey: 'village_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',        type: 'number', required: true, lookupFrom: 'state' },
      { key: 'district_lgd', label: 'District',     type: 'number', required: true, lookupFrom: 'district', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block',        type: 'number', required: true, lookupFrom: 'block',    dependsOnField: 'district_lgd' },
      { key: 'village_lgd',  label: 'Village LGD',  type: 'number', required: true },
      { key: 'village_name', label: 'Village Name', type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active',    type: 'boolean' },
    ],
    labelFormat: (r) => [r.village_name, r.village_loc_vern, r.village_lgd ? String(r.village_lgd) : null].filter(Boolean).join(' | '),
    searchKeys: ['village_name', 'village_loc_vern'],
  },
  'area': {
    title: 'Area Master',
    description: 'Manage ECL Areas',
    modelName: 'area',
    primaryKey: 'area_cd',
    columns: [
      { key: 'state_lgd', label: 'State', type: 'number', required: true, lookupFrom: 'state' },
      { key: 'area_cd', label: 'Area Code', type: 'string', required: true },
      { key: 'area_en', label: 'Area Name', type: 'string', required: true },
      { key: 'short_nm', label: 'Short Name', type: 'string' }
    ]
  },
  'caste': {
    title: 'Caste Master',
    description: 'Manage castes/categories',
    modelName: 'caste',
    primaryKey: 'cast_id',
    columns: [
      { key: 'cast_id', label: 'Caste ID', type: 'number', required: true },
      { key: 'cast_type', label: 'Caste Type', type: 'string', required: true }
    ]
  },
  'owner_type': {
    title: 'Owner Type Master',
    description: 'Manage owner types',
    modelName: 'owner_type',
    primaryKey: 'owner_type_id',
    columns: [
      { key: 'owner_type_id', label: 'Type ID', type: 'number', required: true },
      { key: 'owner_type', label: 'Owner Type', type: 'string', required: true }
    ]
  },
  'mine': {
    title: 'Mine Master',
    description: 'Manage mines',
    modelName: 'mine',
    primaryKey: 'mine_cd',
    columns: [
      { key: 'state_lgd', label: 'State', type: 'number', required: true, lookupFrom: 'state' },
      { key: 'area_cd', label: 'Area', type: 'string', required: true, lookupFrom: 'area', dependsOnField: 'state_lgd'},
      { key: 'mine_cd', label: 'Mine Code', type: 'string', required: true },
      { key: 'mine_en', label: 'Mine Name', type: 'string', required: true },
      { key: 'is_active', label: 'Is Active', type: 'boolean' }
    ]
  },
  'landclass': {
    title: 'Land Class Master',
    description: 'Manage land classes',
    modelName: 'landclass',
    primaryKey: 'landc_id',
    columns: [
      { key: 'landc_id', label: 'Land Class ID', type: 'number', required: true },
      { key: 'land_class', label: 'Land Class', type: 'string', required: true }
    ]
  },
  'landtype': {
    title: 'Land Type Master',
    description: 'Manage land types',
    modelName: 'landtype',
    primaryKey: 'landt_id',
    columns: [
      { key: 'landt_id', label: 'Land Type ID', type: 'number', required: true },
      { key: 'land_type', label: 'Land Type', type: 'string', required: true },
      { key: 'p_id', label: 'Parent ID', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' }
    ]
  },
  'acqu_mode': {
    title: 'Acquisition Mode',
    description: 'Manage acquisition modes',
    modelName: 'acqu_mode',
    primaryKey: 'acq_mode_id',
    columns: [
      { key: 'acq_mode_id', label: 'Mode ID', type: 'number', required: true },
      { key: 'aquisition_method', label: 'Acquisition Method', type: 'string', required: true }
    ]
  },
  'checklist': {
    title: 'Checklist Master',
    description: 'Manage dynamic checklists',
    modelName: 'checklist',
    primaryKey: 'chk_id',
    columns: [
      { key: 'chk_id', label: 'Checklist ID', type: 'number', required: true },
      { key: 'chk_description', label: 'Description', type: 'string' },
      { key: 'chk_type', label: 'Check Type', type: 'string' }
    ]
  },
  'present_land_use': {
    title: 'Present Land Use',
    description: 'Manage land use categories',
    modelName: 'present_land_use',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'number', required: true },
      { key: 'present_land_use', label: 'Land Use', type: 'string', required: true }
    ]
  },
  'project': {
    title: 'Project Master',
    description: 'Manage projects',
    modelName: 'project',
    primaryKey: 'projCd',
    columns: [
      { key: 'projCd', label: 'Project Code', type: 'string', required: true },
      { key: 'projNm', label: 'Project Name', type: 'string', required: true },
      { key: 'eclProjCd', label: 'ECL Project Code', type: 'string' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' }
    ],
    labelFormat: (r) => [r.projNm, r.eclProjCd, r.projCd].filter(Boolean).join(' | '),
    searchKeys: ['projNm', 'eclProjCd', 'projCd'],
  },
  'user_master': {
    title: 'User Master',
    description: 'System users and officials',
    modelName: 'user',
    primaryKey: 'id',
    dbSchema: 'public',
    columns: [
      { key: 'id', label: 'User ID', type: 'number', required: true },
      { key: 'name', label: 'Full Name', type: 'string', required: true },
      { key: 'email', label: 'Email Address', type: 'string' },
      { key: 'designation', label: 'Designation / Role', type: 'string' },
      { key: 'is_active', label: 'Is Active', type: 'boolean' }
    ],
    searchKeys: ['name', 'email', 'designation'],
    labelFormat: (u) => `${u.name} (${u.designation || u.email || 'Official'})`,
  }
}
