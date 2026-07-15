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
  columns: MasterColumnConfig[]
}

export const MASTER_REGISTRY: Record<string, MasterDataConfig> = {
  'state_master': {
    title: 'State Master',
    description: 'Manage states across India',
    modelName: 'state_master',
    primaryKey: 'state_lgd',
    columns: [
      { key: 'state_lgd', label: 'State LGD Code', type: 'number', required: true },
      { key: 'state_en', label: 'State Name (English)', type: 'string', required: true },
      { key: 'state_loc_vern', label: 'Local Vernacular', type: 'string' },
      { key: 'short_code', label: 'Short Code', type: 'string' },
      { key: 'is_active', label: 'Is Active', type: 'boolean' }
    ]
  },
  'district_master': {
    title: 'District Master',
    description: 'Manage districts',
    modelName: 'district_master',
    primaryKey: 'district_lgd',
    columns: [
      { key: 'state_lgd',   label: 'State',         type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'district_lgd', label: 'District LGD', type: 'number', required: true },
      { key: 'district_en', label: 'District Name', type: 'string', required: true },
      { key: 'is_active',   label: 'Is Active',     type: 'boolean' },
    ],
  },
  'block_master': {
    title: 'Block Master',
    description: 'Manage blocks',
    modelName: 'block_master',
    primaryKey: 'block_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',       type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'district_lgd', label: 'District',    type: 'number', required: true, lookupFrom: 'district_master', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block LGD',   type: 'number', required: true },
      { key: 'block_en',     label: 'Block Name',  type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active',   type: 'boolean' },
    ],
  },
  'ps_master': {
    title: 'Police Station Master',
    description: 'Manage police stations',
    modelName: 'ps_master',
    primaryKey: 'ps_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',     type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'district_lgd', label: 'District',  type: 'number', required: true, lookupFrom: 'district_master', dependsOnField: 'state_lgd' },
      { key: 'ps_lgd',       label: 'PS LGD',    type: 'number', required: true },
      { key: 'ps_en',        label: 'PS Name',   type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active', type: 'boolean' },
    ],
  },
  'mouza_master': {
    title: 'Mouza Master',
    description: 'Manage mouzas',
    modelName: 'mouza_master',
    primaryKey: 'mouza_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',      type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'district_lgd', label: 'District',   type: 'number', required: true, lookupFrom: 'district_master', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block',      type: 'number', required: true, lookupFrom: 'block_master',    dependsOnField: 'district_lgd' },
      { key: 'mouza_lgd',    label: 'Mouza LGD',  type: 'number', required: true },
      { key: 'mouza_en',     label: 'Mouza Name', type: 'string', required: true },
      { key: 'jl_no',        label: 'JL Number',  type: 'string' },
      { key: 'is_active',    label: 'Is Active',  type: 'boolean' },
    ],
  },
  'vill_master': {
    title: 'Village Master',
    description: 'Manage villages',
    modelName: 'vill_master',
    primaryKey: 'village_lgd',
    columns: [
      { key: 'state_lgd',    label: 'State',        type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'district_lgd', label: 'District',     type: 'number', required: true, lookupFrom: 'district_master', dependsOnField: 'state_lgd' },
      { key: 'block_lgd',    label: 'Block',        type: 'number', required: true, lookupFrom: 'block_master',    dependsOnField: 'district_lgd' },
      { key: 'village_lgd',  label: 'Village LGD',  type: 'number', required: true },
      { key: 'village_name', label: 'Village Name', type: 'string', required: true },
      { key: 'is_active',    label: 'Is Active',    type: 'boolean' },
    ],
  },
  'area_master': {
    title: 'Area Master',
    description: 'Manage ECL Areas',
    modelName: 'area_master',
    primaryKey: 'area_cd',
    columns: [
      { key: 'state_lgd', label: 'State', type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'area_cd', label: 'Area Code', type: 'string', required: true },
      { key: 'area_en', label: 'Area Name', type: 'string', required: true },
      { key: 'short_nm', label: 'Short Name', type: 'string' }
    ]
  },
  'cast_master': {
    title: 'Caste Master',
    description: 'Manage castes/categories',
    modelName: 'cast_master',
    primaryKey: 'cast_id',
    columns: [
      { key: 'cast_id', label: 'Caste ID', type: 'number', required: true },
      { key: 'cast_type', label: 'Caste Type', type: 'string', required: true }
    ]
  },
  'owner_type_master': {
    title: 'Owner Type Master',
    description: 'Manage owner types',
    modelName: 'owner_type_master',
    primaryKey: 'owner_type_id',
    columns: [
      { key: 'owner_type_id', label: 'Type ID', type: 'number', required: true },
      { key: 'owner_type', label: 'Owner Type', type: 'string', required: true }
    ]
  },
  'mine_master': {
    title: 'Mine Master',
    description: 'Manage mines',
    modelName: 'mine_master',
    primaryKey: 'mine_cd',
    columns: [
      { key: 'state_lgd', label: 'State', type: 'number', required: true, lookupFrom: 'state_master' },
      { key: 'area_cd', label: 'Area', type: 'string', required: true, lookupFrom: 'area_master', dependsOnField: 'state_lgd'},
      { key: 'mine_cd', label: 'Mine Code', type: 'string', required: true },
      { key: 'mine_en', label: 'Mine Name', type: 'string', required: true },
      { key: 'is_active', label: 'Is Active', type: 'boolean' }
    ]
  },
  'landclass_master': {
    title: 'Land Class Master',
    description: 'Manage land classes',
    modelName: 'landclass_master',
    primaryKey: 'landc_id',
    columns: [
      { key: 'landc_id', label: 'Land Class ID', type: 'number', required: true },
      { key: 'land_class', label: 'Land Class', type: 'string', required: true }
    ]
  },
  'landtype_master': {
    title: 'Land Type Master',
    description: 'Manage land types',
    modelName: 'landtype_master',
    primaryKey: 'landt_id',
    columns: [
      { key: 'landt_id', label: 'Land Type ID', type: 'number', required: true },
      { key: 'land_type', label: 'Land Type', type: 'string', required: true }
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
  'chk_master_new': {
    title: 'Checklist Master',
    description: 'Manage dynamic checklists',
    modelName: 'chk_master_new',
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
  }
}
