# COALRR Phase II - Comprehensive Database Analysis

This document outlines the complete structure of the `disputedb` database, describing the schema, tables, columns, and relationships across all modules (Acquisition, Compensation, Employment, R&R, and Public).

## Schema: `acquisition`

This schema encapsulates the tables related to the acquisition domain of the application.

### Table: `acq_prop_cba`
**Purpose**: Stores Acquisition Proposals (M2 Module) linking to projects and defining acquisition modes.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_cba_id` | `integer` | NO | ✅ |
| `acq_prop_id` | `bigint` | YES |  |
| `ten_cap_req` | `character varying` | YES |  |
| `for_cap_req` | `character varying` | YES |  |
| `govt_cap_req` | `character varying` | YES |  |
| `rr_cap_req` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `acq_purpose` | `character varying` | YES |  |
| `tot_land_val` | `character varying` | YES |  |
| `tot_cost` | `numeric` | YES |  |
| `cur_noti` | `character varying` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `reg_det`
**Purpose**: Stores data related to reg_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `reg_id` | `bigint` | NO | ✅ |
| `deed_no` | `character varying` | YES |  |
| `deed_vol` | `character varying` | YES |  |
| `adsr_nm` | `character varying` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `page` | `character varying` | YES |  |
| `ser_no` | `character varying` | YES |  |
| `qry_no` | `character varying` | YES |  |
| `prop_tt` | `character varying` | YES |  |
| `comp_dt` | `date` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `so_no` | `character varying` | YES |  |
| `la_case_no` | `character varying` | YES |  |
| `lar_id_no` | `character varying` | YES |  |
| `govt_ordr_no` | `character varying` | YES |  |
| `fc_clr_no` | `character varying` | YES |  |
| `agrmnt_doc_id` | `bigint` | YES |  |
| `aggr_ref_no` | `character varying` | YES |  |
| `is_lease` | `boolean` | YES |  |
| `reg_dt` | `date` | YES |  |
| `land_info` | `text` | YES |  |
| `mouza_cd` | `bigint` | YES |  |
| `state_lgd` | `bigint` | NO |  |
| `district_lgd` | `bigint` | NO |  |
| `block_lgd` | `bigint` | NO |  |
| `ref_date` | `date` | YES |  |
| `govt_ordr_no_lease` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `net_paid_value` | `numeric` | YES |  |
| `rfct_cert_no` | `character varying` | YES |  |
| `rfct_ref_no` | `character varying` | YES |  |
| `given_by` | `character varying` | YES |  |

---

### Table: `acq_poss`
**Purpose**: Stores data related to acq_poss.

**Foreign Key Relationships**:
- `phase_id` -> `acquisition.phase_det (phase_id)`
- `acq_id` -> `acquisition.acq_det (acq_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pos_acq_id` | `bigint` | NO | ✅ |
| `prop_id` | `bigint` | YES |  |
| `psnc_prop_id` | `bigint` | YES |  |
| `acq_dt_type` | `character varying` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `jl_no` | `character varying` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `land_acqur` | `numeric` | YES |  |
| `purp_acq` | `character varying` | YES |  |
| `poss_area` | `numeric` | YES |  |
| `status_cd` | `character varying` | YES |  |
| `land_acq_time` | `bigint` | YES |  |
| `comp_set_time` | `bigint` | YES |  |
| `apprv_ref` | `text` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `acq_id` | `bigint` | YES |  |
| `poss_dt` | `date` | YES |  |
| `poss_ref_no` | `text` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `is_reg` | `boolean` | YES |  |
| `land_use` | `character varying` | YES |  |
| `poss_is_full` | `boolean` | YES |  |
| `land_use_remarks` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `landt_id` | `bigint` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `area_cd` | `character varying` | YES |  |

---

### Table: `acq_det`
**Purpose**: Stores data related to acq_det.

**Foreign Key Relationships**:
- `phase_id` -> `acquisition.phase_det (phase_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_id` | `bigint` | NO | ✅ |
| `prop_id` | `bigint` | YES |  |
| `acq_mode_id` | `bigint` | NO |  |
| `fwd_from` | `bigint` | YES |  |
| `fwd_to` | `bigint` | YES |  |
| `remark` | `text` | YES |  |
| `acq_dt` | `date` | YES |  |
| `acq_ref_no` | `text` | YES |  |
| `acq_doc_id` | `character varying` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `status_cd` | `character varying` | YES |  |
| `acq_area` | `numeric` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `acq_is_full` | `boolean` | YES |  |
| `inh_class` | `character varying` | YES |  |
| `inh_class_file` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |
| `acq_area_rm` | `numeric` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `poss_is_full` | `boolean` | YES |  |

---

### Table: `beneficiary_master`
**Purpose**: Stores data related to beneficiary_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `benf_id` | `bigint` | NO | ✅ |
| `benf_code` | `character varying` | NO |  |
| `benf_name` | `character varying` | NO |  |
| `benf_father_name` | `character varying` | YES |  |
| `owner_code` | `character varying` | YES |  |
| `pres_add` | `jsonb` | YES |  |
| `id_type` | `character varying` | YES |  |
| `id_no` | `character varying` | YES |  |
| `paf_code` | `character varying` | YES |  |
| `photo_path` | `text` | YES |  |
| `doc_path` | `character varying` | YES |  |
| `contact_no` | `character varying` | YES |  |
| `dob` | `date` | YES |  |
| `cast_id` | `bigint` | YES |  |
| `is_head` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `isowner` | `boolean` | NO |  |
| `apr_dupli` | `boolean` | NO |  |
| `area_cd` | `character varying` | YES |  |
| `is_alive_ben` | `boolean` | YES |  |

---

### Table: `chk_det`
**Purpose**: Stores the dynamic Mode-Specific Checklists (JSONB) for M2 Proposal validation.

**Foreign Key Relationships**:
- `jstn_id` -> `acquisition.just_fwd (jstn_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `chk_entry_id` | `integer` | NO | ✅ |
| `prop_id` | `bigint` | YES |  |
| `proj_cd` | `bigint` | YES |  |
| `sch_cd` | `bigint` | YES |  |
| `jstn_id` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `chk_id` | `jsonb` | YES |  |
| `prop_type` | `integer` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `chk_mid` | `bigint` | YES |  |

---

### Table: `just_fwd`
**Purpose**: Stores data related to just_fwd.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `jstn_id` | `integer` | NO | ✅ |
| `prop_id` | `bigint` | YES |  |
| `prop_ty` | `bigint` | YES |  |
| `fwd_to` | `integer` | YES |  |
| `jstn_cmnt` | `text` | YES |  |
| `status` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `delta` | `jsonb` | YES |  |
| `cur_noti` | `character varying` | YES |  |
| `rec_check` | `character varying` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `clubd_proj_det`
**Purpose**: Stores data related to clubd_proj_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `clubd_proj_id` | `bigint` | NO | ✅ |
| `proj_cd` | `character varying` | YES |  |
| `clubd_proj_cd` | `character varying` | YES |  |
| `area` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `beneficiary_list`
**Purpose**: Stores data related to beneficiary_list.

**Foreign Key Relationships**:
- `owner_code` -> `acquisition.ownr_list (owner_code)`
- `benf_code` -> `acquisition.beneficiary_master (benf_code)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `benf_id` | `bigint` | NO | ✅ |
| `benf_code` | `character varying` | NO |  |
| `owner_code` | `character varying` | NO |  |
| `tot_area` | `numeric` | YES |  |
| `share_area` | `numeric` | YES |  |
| `photo_path_del` | `character varying` | YES |  |
| `doc_path_del` | `character varying` | YES |  |
| `contact_no_del` | `character varying` | YES |  |
| `dob_del` | `date` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `cast_id` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `area_emp` | `double precision` | YES |  |
| `is_comp_paid` | `boolean` | YES |  |
| `is_rr_given` | `boolean` | YES |  |
| `is_emp_given` | `boolean` | YES |  |
| `is_comp_sanc` | `boolean` | YES |  |
| `is_rr_sanc` | `boolean` | YES |  |
| `is_emp_sanc` | `boolean` | YES |  |
| `comp_aprv_stat` | `integer` | YES |  |
| `comp_aprv_by` | `character varying` | YES |  |
| `comp_aprv_remark` | `character varying` | YES |  |
| `comp_aprv_ts` | `bigint` | YES |  |
| `rr_aprv_stat` | `integer` | YES |  |
| `rr_aprv_by` | `character varying` | YES |  |
| `rr_aprv_remark` | `character varying` | YES |  |
| `rr_aprv_ts` | `bigint` | YES |  |
| `rem_area_emp` | `double precision` | YES |  |
| `given_area_emp` | `double precision` | YES |  |
| `emp_sanc_status` | `USER-DEFINED` | YES |  |
| `pos_acq_id` | `bigint` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |
| `area_cd` | `character varying` | YES |  |

---

### Table: `acq_prop_dp`
**Purpose**: Stores Acquisition Proposals (M2 Module) linking to projects and defining acquisition modes.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_dp_id` | `integer` | NO | ✅ |
| `acq_prop_id` | `bigint` | YES |  |
| `ten_wemp` | `character varying` | YES |  |
| `ten_woemp` | `character varying` | YES |  |
| `tot_reg_cost` | `character varying` | YES |  |
| `tot_mut_cost` | `character varying` | YES |  |
| `oth_cost` | `character varying` | YES |  |
| `oth_cost_purp` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `tot_cost` | `numeric` | YES |  |
| `tot_land_val` | `numeric` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `govt_rate` | `character varying` | YES |  |
| `forest_rate` | `character varying` | YES |  |

---

### Table: `acq_prop_rfctlarr`
**Purpose**: Stores Acquisition Proposals (M2 Module) linking to projects and defining acquisition modes.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_rfctlarr_id` | `integer` | NO | ✅ |
| `acq_prop_id` | `bigint` | YES |  |
| `ten_est_prc` | `numeric` | YES |  |
| `for_est_prc` | `numeric` | YES |  |
| `govt_est_prc` | `numeric` | YES |  |
| `oth_est_prc` | `numeric` | YES |  |
| `pr_cap_acq` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `tot_land_val` | `character varying` | YES |  |
| `tot_mut_cost` | `character varying` | YES |  |
| `cap_amt_rr` | `numeric` | YES |  |
| `tot_cost` | `numeric` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `mut_det`
**Purpose**: Stores data related to mut_det.

**Foreign Key Relationships**:
- `plot_no` -> `acquisition.plot_det (plot_no)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `mut_id` | `bigint` | NO | ✅ |
| `khtn_no` | `character varying` | YES |  |
| `khtn_id` | `text` | NO |  |
| `mut_area` | `numeric` | YES |  |
| `mut_status` | `character varying` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `mut_case_no` | `character varying` | YES |  |
| `blro_nm` | `text` | YES |  |
| `reg_id` | `bigint` | YES |  |
| `mut_favour` | `text` | YES |  |
| `mut_date` | `date` | YES |  |
| `nw_khtn_no` | `character varying` | YES |  |
| `applied_dt` | `date` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `pos_acq_id` | `bigint` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `deed_of_conv_no` | `character varying` | YES |  |
| `mouza_lgd` | `bigint` | YES |  |
| `plot_info` | `jsonb` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `nw_khtn_ty` | `smallint` | YES |  |

---

### Table: `phase_det`
**Purpose**: Stores data related to phase_det.

**Foreign Key Relationships**:
- `plot_no` -> `acquisition.plot_det (plot_no)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `phase_id` | `bigint` | NO | ✅ |
| `plot_no` | `character varying` | NO |  |
| `phase_area` | `numeric` | YES |  |
| `prop_id` | `bigint` | YES |  |
| `status_cd` | `character varying` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `phase_no` | `character varying` | YES |  |
| `sanc_dt` | `date` | YES |  |
| `sanc_ref_no` | `character varying` | YES |  |
| `sanc_is_full` | `boolean` | YES |  |
| `proj_aprv_cd` | `bigint` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `aprvlandtype` | `bigint` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `area_cd` | `character varying` | YES |  |

---

### Table: `plot_det`
**Purpose**: Master table storing plot information, land class, and total area.

**Foreign Key Relationships**:
- `proj_cd` -> `acquisition.proj_det (proj_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `plot_no` | `character varying` | NO | ✅ |
| `proj_cd` | `character varying` | YES |  |
| `state_lgd` | `bigint` | NO |  |
| `district_lgd` | `bigint` | NO |  |
| `block_lgd` | `bigint` | NO |  |
| `mouza_lgd` | `bigint` | NO |  |
| `ps_lgd` | `bigint` | NO |  |
| `opt_plot` | `character varying` | YES |  |
| `opt_bata` | `character varying` | YES |  |
| `plot_number` | `character varying` | YES |  |
| `opt_ty_plot` | `character varying` | YES |  |
| `landt_id_old` | `bigint` | YES |  |
| `landc_id` | `bigint` | YES |  |
| `tot_area` | `numeric` | NO |  |
| `area_un_aprv` | `numeric` | YES |  |
| `area_sanc` | `numeric` | YES |  |
| `area_un_acq` | `numeric` | YES |  |
| `area_un_poss` | `numeric` | YES |  |
| `area_acqrd` | `numeric` | YES |  |
| `area_vac` | `numeric` | YES |  |
| `area_emp` | `numeric` | YES |  |
| `plot_bound` | `text` | YES |  |
| `status_cd` | `character varying` | YES |  |
| `jl_no` | `bigint` | YES |  |
| `land_use` | `character varying` | YES |  |
| `bata_number` | `character varying` | YES |  |
| `is_inh` | `boolean` | YES |  |
| `plot_is_full` | `boolean` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `aprv_by` | `integer` | YES |  |
| `aprv_remark` | `text` | YES |  |
| `aprv_ts` | `bigint` | YES |  |
| `ty_plot` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `landt_id` | `text` | YES |  |
| `apr_dupli` | `boolean` | NO |  |

---

### Table: `khtn_list`
**Purpose**: Stores data related to khtn_list.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `khtn_id` | `character varying` | NO | ✅ |
| `mouza_lgd` | `bigint` | YES |  |
| `khatian_no` | `character varying` | NO |  |
| `ecl_khtn_no` | `character varying` | YES |  |
| `emp_share` | `real` | YES |  |
| `owner_code` | `jsonb` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_lnk_ow` | `boolean` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `khtn_ty` | `smallint` | YES |  |

---

### Table: `plot_sch_list_acq`
**Purpose**: Stores data related to plot_sch_list_acq.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_plot_id` | `character varying` | NO |  |
| `acq_prop_id` | `bigint` | YES |  |
| `sch_cd` | `bigint` | YES |  |
| `plot_ty` | `character varying` | YES |  |
| `plot_number` | `character varying` | YES |  |
| `bata_no` | `character varying` | YES |  |
| `opt_plot_ty` | `character varying` | YES |  |
| `opt_plot` | `character varying` | YES |  |
| `opt_bata` | `character varying` | YES |  |
| `tot_area` | `numeric` | YES |  |
| `ecl_area` | `numeric` | YES |  |
| `ten_area` | `numeric` | YES |  |
| `for_area` | `numeric` | YES |  |
| `def_area` | `numeric` | YES |  |
| `oth_psu_gov_area` | `numeric` | YES |  |
| `gov_area` | `numeric` | YES |  |
| `ray_to_acq` | `numeric` | YES |  |
| `trib_to_acq` | `numeric` | YES |  |
| `deb_to_acq` | `numeric` | YES |  |
| `disp_acq` | `numeric` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `block_lgd` | `bigint` | YES |  |
| `ps_lgd` | `bigint` | YES |  |
| `mouza_lgd` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `ten_acqred` | `numeric` | YES |  |
| `for_acqred` | `numeric` | YES |  |
| `gov_acqred` | `numeric` | YES |  |
| `gov_patta_acqred` | `numeric` | YES |  |
| `for_patta_acqred` | `numeric` | YES |  |
| `disp_acqred` | `numeric` | YES |  |
| `acq_status` | `numeric` | YES |  |
| `ten_area_rm` | `numeric` | YES |  |
| `for_area_rm` | `numeric` | YES |  |
| `def_area_rm` | `numeric` | YES |  |
| `oth_psu_gov_area_rm` | `numeric` | YES |  |
| `gov_area_rm` | `numeric` | YES |  |
| `to_be_aacq_area` | `numeric` | YES |  |
| `to_be_aacq_area_rm` | `numeric` | YES |  |
| `id` | `integer` | NO | ✅ |
| `for_to_acq` | `numeric` | YES |  |
| `def_to_acq` | `numeric` | YES |  |
| `oth_psu_gov_to_acq` | `numeric` | YES |  |
| `gov_to_acq` | `numeric` | YES |  |
| `tot_be_aacq_plot` | `numeric` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `landc_with_area` | `text` | YES |  |

---

### Table: `owner_land_share`
**Purpose**: Stores data related to owner_land_share.

**Foreign Key Relationships**:
- `acq_id` -> `acquisition.acq_det (acq_id)`
- `owner_code` -> `acquisition.ownr_list (owner_code)`
- `khtn_det_id` -> `acquisition.khtn_det (khtn_det_id)`
- `pos_acq_id` -> `acquisition.acq_poss (pos_acq_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `owner_lnd_cd` | `bigint` | NO | ✅ |
| `owner_code` | `character varying` | YES |  |
| `khatian_no` | `character varying` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `share_area` | `numeric` | YES |  |
| `land_share` | `numeric` | YES |  |
| `acq_id` | `bigint` | YES |  |
| `pos_acq_id` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `area_possd` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_self_benefi` | `boolean` | YES |  |
| `beneficiary_list` | `character varying` | YES |  |
| `acq_plsch_id` | `bigint` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |

---

### Table: `poss_prop`
**Purpose**: Stores data related to poss_prop.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`
- `proj_cd` -> `acquisition.proj_det (proj_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `poss_prop_id` | `integer` | NO | ✅ |
| `acq_prop_id` | `bigint` | YES |  |
| `prop_no` | `character varying` | YES |  |
| `so_no` | `character varying` | YES |  |
| `so_dt` | `date` | YES |  |
| `acq_cutoff` | `date` | YES |  |
| `settl_dt` | `date` | YES |  |
| `ten_wemp` | `character varying` | YES |  |
| `ten_woemp` | `character varying` | YES |  |
| `for_rate` | `character varying` | YES |  |
| `gov_rate` | `character varying` | YES |  |
| `oth_psu_gov_rate` | `character varying` | YES |  |
| `tot_land_cost` | `character varying` | YES |  |
| `tot_mut_cost` | `character varying` | YES |  |
| `tot_cost` | `character varying` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `prop_dt` | `date` | YES |  |
| `status` | `bigint` | NO |  |
| `aprv_id` | `bigint` | YES |  |
| `fwd_user_id` | `bigint` | YES |  |
| `cur_noti` | `character varying` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `cal_sheet_file_id` | `bigint` | YES |  |
| `acq_prop_multi` | `text` | YES |  |
| `total_acq_area` | `double precision` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `possr_list`
**Purpose**: Stores data related to possr_list.

**Foreign Key Relationships**:
- `khtn_det_id` -> `acquisition.khtn_det (khtn_det_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `possr_id` | `bigint` | NO | ✅ |
| `possr_nm` | `character varying` | YES |  |
| `possr_type_id` | `bigint` | YES |  |
| `possr_addrs` | `text` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `khtn_no` | `character varying` | YES |  |
| `id_no` | `character varying` | YES |  |
| `id_type` | `character varying` | YES |  |
| `possr_fh_nm` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `ownr_list`
**Purpose**: Stores data related to ownr_list.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `owner_id` | `bigint` | NO | ✅ |
| `owner_code` | `character varying` | NO |  |
| `owner_name` | `character varying` | NO |  |
| `pres_add` | `jsonb` | YES |  |
| `owner_father_name` | `character varying` | YES |  |
| `khatian_no` | `character varying` | YES |  |
| `id_type` | `character varying` | YES |  |
| `id_no` | `character varying` | YES |  |
| `owner_type_id` | `bigint` | NO |  |
| `cast_id` | `bigint` | YES |  |
| `perm_add` | `jsonb` | YES |  |
| `occuptn` | `character varying` | YES |  |
| `gender` | `character varying` | YES |  |
| `nation` | `character varying` | YES |  |
| `religion` | `character varying` | YES |  |
| `leg_inst` | `character varying` | YES |  |
| `reg_dd_dt` | `bigint` | YES |  |
| `trans_lnd_area` | `numeric` | YES |  |
| `by_dp` | `numeric` | YES |  |
| `by_cba` | `numeric` | YES |  |
| `tot_area` | `numeric` | YES |  |
| `comp_rec` | `character varying` | YES |  |
| `bank_acc_det` | `jsonb` | YES |  |
| `photo_path` | `character varying` | YES |  |
| `doc_path` | `character varying` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `email_id` | `character varying` | YES |  |
| `contact_no` | `character varying` | YES |  |
| `dob` | `date` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_self_benefi` | `boolean` | YES |  |
| `benf_code` | `jsonb` | YES |  |
| `is_alive_owner` | `boolean` | NO |  |
| `epic_no` | `character varying` | YES |  |
| `dod` | `character varying` | YES |  |
| `apr_dupli` | `boolean` | NO |  |
| `area_cd` | `character varying` | YES |  |
| `remarks` | `text` | YES |  |

---

### Table: `proj_aprv`
**Purpose**: Stores data related to proj_aprv.

**Foreign Key Relationships**:
- `proj_cd` -> `acquisition.proj_det (proj_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `aprv_id` | `bigint` | NO | ✅ |
| `proj_cd` | `character varying` | NO |  |
| `aprv_area` | `numeric` | YES |  |
| `area_acq` | `numeric` | YES |  |
| `emp_sanc` | `integer` | YES |  |
| `aprv_dt` | `date` | YES |  |
| `aprv_ref_no` | `character varying` | YES |  |
| `is_active` | `boolean` | YES |  |
| `remark` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `district_lgd` | `text` | YES |  |
| `ps_lgd` | `text` | YES |  |
| `block_lgd` | `text` | YES |  |
| `mouza_lgd` | `text` | YES |  |
| `prop_id` | `bigint` | YES |  |
| `rr_cap` | `numeric` | YES |  |
| `land_cap` | `numeric` | YES |  |

---

### Table: `proj_det`
**Purpose**: Stores data related to proj_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `proj_cd` | `character varying` | NO | ✅ |
| `ecl_proj_cd` | `character varying` | YES |  |
| `proj_nm` | `character varying` | YES |  |
| `mine_cd` | `character varying` | NO |  |
| `area_cd` | `character varying` | NO |  |
| `state_lgd` | `bigint` | YES |  |
| `tot_aprv_area` | `bigint` | YES |  |
| `tot_area_acq` | `character varying` | YES |  |
| `tot_emp_sanc` | `integer` | YES |  |
| `is_active` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_emp_compltd` | `boolean` | YES |  |
| `emp_count` | `integer` | YES |  |
| `district_lgd` | `text` | YES |  |
| `ps_lgd` | `text` | YES |  |
| `block_lgd` | `text` | YES |  |
| `mouza_lgd` | `text` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `aprv_by` | `character varying` | YES |  |
| `aprv_remark` | `character varying` | YES |  |
| `aprv_ts` | `bigint` | YES |  |
| `land_cap` | `numeric` | YES |  |
| `rr_cap` | `numeric` | YES |  |

---

### Table: `khtn_det`
**Purpose**: Stores data related to khtn_det.

**Foreign Key Relationships**:
- `khtn_id` -> `acquisition.khtn_list (khtn_id)`
- `plot_no` -> `acquisition.plot_det (plot_no)`
- `acq_id` -> `acquisition.acq_det (acq_id)`
- `pos_acq_id` -> `acquisition.acq_poss (pos_acq_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `khtn_det_id` | `bigint` | NO | ✅ |
| `phase_id` | `bigint` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `khtn_id` | `character varying` | NO |  |
| `share_area` | `numeric` | NO |  |
| `land_share` | `numeric` | YES |  |
| `area_possd` | `numeric` | YES |  |
| `area_acqrd` | `numeric` | YES |  |
| `area_vac` | `numeric` | YES |  |
| `area_emp` | `numeric` | YES |  |
| `agrmnt_lnd` | `character varying` | YES |  |
| `poss_stat` | `character varying` | YES |  |
| `agrmnt_no` | `character varying` | YES |  |
| `agrmnt_dt` | `date` | YES |  |
| `agrmnt_doc` | `character varying` | YES |  |
| `ltg_stat` | `character varying` | YES |  |
| `case_no` | `character varying` | YES |  |
| `court_nm` | `character varying` | YES |  |
| `case_dt` | `date` | YES |  |
| `is_comp_paid` | `boolean` | YES |  |
| `is_rr_given` | `boolean` | YES |  |
| `is_emp_given` | `boolean` | YES |  |
| `has_possr` | `boolean` | YES |  |
| `is_comp_sanc` | `boolean` | YES |  |
| `is_rr_sanc` | `boolean` | YES |  |
| `is_emp_sanc` | `boolean` | YES |  |
| `is_reg` | `boolean` | YES |  |
| `pos_acq_id` | `bigint` | YES |  |
| `acq_id` | `bigint` | YES |  |
| `khatian_no` | `character varying` | YES |  |
| `is_mut` | `character varying` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `ecl_khtn_no` | `character varying` | YES |  |
| `ltg_order_no` | `character varying` | YES |  |
| `ltg_case_solve_dt` | `date` | YES |  |
| `mut_case_no` | `character varying` | YES |  |
| `mut_date` | `date` | YES |  |
| `mut_applied_dt` | `date` | YES |  |
| `comp_aprv_stat` | `integer` | YES |  |
| `comp_aprv_by` | `character varying` | YES |  |
| `comp_aprv_remark` | `character varying` | YES |  |
| `comp_aprv_ts` | `bigint` | YES |  |
| `rr_aprv_stat` | `integer` | YES |  |
| `rr_aprv_by` | `character varying` | YES |  |
| `rr_aprv_remark` | `character varying` | YES |  |
| `rr_aprv_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `land_class` | `bigint` | YES |  |
| `aprv_stat` | `integer` | YES |  |
| `aprv_remark` | `text` | YES |  |
| `aprv_by` | `integer` | YES |  |
| `aprv_ts` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `khtn_ty` | `smallint` | YES |  |
| `acq_plsch_id` | `bigint` | YES |  |
| `is_phy_poss` | `boolean` | YES |  |

---

### Table: `opt_plot_details`
**Purpose**: Master table storing plot information, land class, and total area.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `opt_pid` | `bigint` | NO | ✅ |
| `opt_plot_ty` | `character varying` | NO |  |
| `opt_plot_num` | `character varying` | NO |  |
| `opt_bata_num` | `character varying` | YES |  |
| `tot_area` | `numeric` | NO |  |
| `used_area` | `numeric` | NO |  |
| `plot_no` | `character varying` | NO | ✅ |
| `mouza_lgd` | `bigint` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `acq_prop_blockchain`
**Purpose**: Stores Acquisition Proposals (M2 Module) linking to projects and defining acquisition modes.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `acq_prop_id` | `bigint` | NO |  |
| `jstn_id` | `bigint` | NO |  |
| `event_type` | `character varying` | NO |  |
| `event_status` | `character varying` | NO |  |
| `bc_snapshot` | `jsonb` | NO |  |
| `bc_hash` | `text` | NO |  |
| `bc_tx_hash` | `character varying` | YES |  |
| `bc_ts` | `bigint` | NO |  |
| `entry_by` | `bigint` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |

---

### Table: `acq_prop`
**Purpose**: Stores Acquisition Proposals (M2 Module) linking to projects and defining acquisition modes.

**Foreign Key Relationships**:
- `proj_cd` -> `acquisition.proj_det (proj_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_prop_id` | `bigint` | NO | ✅ |
| `prop_no` | `character varying` | YES |  |
| `prop_dt` | `date` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `tot_acq_area` | `numeric` | YES |  |
| `acq_purp` | `text` | YES |  |
| `tot_aprv_area` | `numeric` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `tot_cost` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `status` | `bigint` | NO |  |
| `aprv_id` | `character varying` | YES |  |
| `fwd_user_id` | `bigint` | YES |  |
| `cal_sheet_file_id` | `bigint` | YES |  |
| `tot_acq_area_rm` | `numeric` | YES |  |
| `poss_status` | `boolean` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `so_no` | `character varying` | YES |  |
| `bc_hash` | `text` | YES |  |
| `bc_tx_hash` | `character varying` | YES |  |
| `bc_ts` | `bigint` | YES |  |
| `bc_snapshot` | `jsonb` | YES |  |

---

### Table: `plot_sch_list_poss`
**Purpose**: Stores data related to plot_sch_list_poss.

**Foreign Key Relationships**:
- `acq_prop_id` -> `acquisition.acq_prop (acq_prop_id)`
- `poss_prop_id` -> `acquisition.poss_prop (poss_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `poss_plot_id` | `character varying` | NO |  |
| `poss_prop_id` | `bigint` | YES |  |
| `sch_cd` | `bigint` | YES |  |
| `acq_prop_id` | `bigint` | YES |  |
| `tot_area` | `numeric` | YES |  |
| `ecl_area` | `numeric` | YES |  |
| `ten_area` | `numeric` | YES |  |
| `for_area` | `numeric` | YES |  |
| `oth_psu_gov_area` | `numeric` | YES |  |
| `gov_area` | `numeric` | YES |  |
| `ten_poss_area` | `numeric` | YES |  |
| `for_poss_area` | `numeric` | YES |  |
| `gov_poss_area` | `numeric` | YES |  |
| `oth_psu_rail_def_poss_area` | `numeric` | YES |  |
| `disp_poss_area` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `id` | `integer` | NO | ✅ |
| `to_be_aacq_rm` | `numeric` | YES |  |
| `total_poss_area` | `numeric` | YES |  |
| `to_be_poss_area_rm` | `numeric` | YES |  |
| `ten_poss_area_rm` | `numeric` | YES |  |
| `for_poss_area_rm` | `numeric` | YES |  |
| `disp_poss_area_rm` | `numeric` | YES |  |
| `oth_psu_gov_poss_area_rm` | `numeric` | YES |  |
| `gov_area_poss_rm` | `numeric` | YES |  |
| `acq_id` | `bigint` | YES |  |
| `gov_pta_area_possd` | `numeric` | YES |  |
| `for_pta_area_possd` | `numeric` | YES |  |
| `gov_pta_area_possd_rm` | `numeric` | YES |  |
| `for_pta_area_possd_rm` | `numeric` | YES |  |
| `mouza_lgd` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `trib_poss_area` | `numeric` | YES |  |
| `deb_poss_area` | `numeric` | YES |  |
| `def_poss_area` | `numeric` | YES |  |
| `oth_psu_gov_poss_area` | `numeric` | YES |  |
| `pro_for_poss_area` | `numeric` | YES |  |
| `trib_poss_area_rm` | `numeric` | YES |  |
| `deb_poss_area_rm` | `numeric` | YES |  |
| `def_poss_area_rm` | `numeric` | YES |  |
| `oth_psu_gov_poss_rm` | `numeric` | YES |  |
| `pro_for_poss_area_rm` | `numeric` | YES |  |
| `def_area` | `numeric` | YES |  |

---

## Schema: `public`

This schema encapsulates the tables related to the public domain of the application.

### Table: `acqu_mode`
**Purpose**: Stores data related to acqu_mode.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `acq_mode_id` | `bigint` | NO | ✅ |
| `aquisition_method` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `cast_master`
**Purpose**: Stores data related to cast_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `cast_id` | `bigint` | NO | ✅ |
| `cast_type` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `block_master`
**Purpose**: Stores data related to block_master.

**Foreign Key Relationships**:
- `district_lgd` -> `public.district_master (district_lgd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `block_lgd` | `bigint` | NO | ✅ |
| `block_en` | `character varying` | NO |  |
| `block_loc_vern` | `character varying` | YES |  |
| `district_lgd` | `bigint` | NO |  |
| `is_active` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `state_lgd` | `bigint` | YES |  |

---

### Table: `area_master`
**Purpose**: Stores data related to area_master.

**Foreign Key Relationships**:
- `state_lgd` -> `public.state_master (state_lgd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `area_cd` | `character varying` | NO | ✅ |
| `area_en` | `character varying` | NO |  |
| `area_loc_vern` | `character varying` | YES |  |
| `is_active` | `boolean` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `area_remarks` | `text` | YES |  |
| `short_nm` | `character varying` | YES |  |

---

### Table: `mine_master`
**Purpose**: Stores data related to mine_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `mine_cd` | `character varying` | NO | ✅ |
| `mine_en` | `character varying` | NO |  |
| `mine_loc_vern` | `character varying` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `area_coverd` | `numeric` | YES |  |
| `area_aquired` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |
| `state_lgd` | `bigint` | YES |  |
| `mine_remarks` | `text` | YES |  |
| `short_nm` | `character varying` | YES |  |

---

### Table: `file_category_master`
**Purpose**: Stores data related to file_category_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_cat_id` | `bigint` | NO | ✅ |
| `file_cat_nm_en` | `character varying` | YES |  |
| `file_cat_nm_loc_vern` | `character varying` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |
| `is_proj_required` | `boolean` | YES |  |
| `is_mouza_required` | `boolean` | NO |  |
| `is_plot_required` | `boolean` | NO |  |
| `is_khtn_required` | `boolean` | NO |  |
| `is_owner_required` | `boolean` | NO |  |
| `icon_class_name` | `character varying` | YES |  |
| `is_phase_required` | `boolean` | NO |  |
| `is_poss_required` | `boolean` | YES |  |
| `is_benf_req` | `boolean` | NO |  |
| `cat_serial` | `integer` | YES |  |

---

### Table: `file_type`
**Purpose**: Stores data related to file_type.

**Foreign Key Relationships**:
- `file_cat_id` -> `public.file_category_master (file_cat_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_type_id` | `bigint` | NO | ✅ |
| `file_cat_id` | `bigint` | NO |  |
| `file_type_nm_en` | `character varying` | YES |  |
| `file_type_nm_loc_vern` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |
| `icon_class_name` | `character varying` | YES |  |

---

### Table: `file_manager_del`
**Purpose**: Stores data related to file_manager_del.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_mn_id` | `bigint` | NO | ✅ |
| `state_lgd` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `mine_cd` | `character varying` | YES |  |
| `proj_cd` | `text` | YES |  |
| `file_cat_id` | `bigint` | YES |  |
| `file_type_id` | `bigint` | YES |  |
| `file_id` | `bigint` | YES |  |
| `filename` | `character varying` | YES |  |
| `filetype` | `character varying` | NO |  |
| `filedata` | `bytea` | YES |  |
| `filepath` | `character varying` | YES |  |
| `ref_no` | `character varying` | YES |  |
| `ref_dt` | `date` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |
| `is_delete` | `boolean` | NO |  |
| `mouza_lgd` | `bigint` | YES |  |
| `plot_number` | `text` | YES |  |
| `khatian_no` | `text` | YES |  |
| `owner_code` | `text` | YES |  |
| `phase_id` | `text` | YES |  |
| `proposal_id` | `text` | YES |  |
| `prop_type` | `character varying` | YES |  |

---

### Table: `foreign_newtable`
**Purpose**: Stores data related to foreign_newtable.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | YES |  |
| `value` | `character varying` | YES |  |

---

### Table: `foreign_newtable_test`
**Purpose**: Stores data related to foreign_newtable_test.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | YES |  |
| `value` | `character varying` | YES |  |

---

### Table: `landclass_master`
**Purpose**: Stores data related to landclass_master.

**Foreign Key Relationships**:
- `landt_id` -> `public.landtype_master (landt_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `landc_id` | `bigint` | NO | ✅ |
| `landt_id` | `bigint` | YES |  |
| `land_class` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `loc_vern` | `character varying` | YES |  |
| `district_lgd` | `bigint` | YES |  |

---

### Table: `module`
**Purpose**: Stores data related to module.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `mod_id` | `bigint` | NO | ✅ |
| `mod_nm` | `character varying` | NO |  |
| `mod_cd` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `miningarea_gis`
**Purpose**: Stores data related to miningarea_gis.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `objectid` | `integer` | NO |  |
| `id` | `integer` | YES |  |
| `layer` | `character varying` | YES |  |
| `text` | `character varying` | YES |  |
| `mouza_name` | `character varying` | YES |  |
| `mouza_id` | `integer` | YES |  |
| `vill_code` | `integer` | YES |  |
| `dist_code` | `integer` | YES |  |
| `area_code` | `integer` | YES |  |
| `blk_lgd` | `integer` | YES |  |
| `state_lgd` | `integer` | YES |  |
| `jl_no` | `integer` | YES |  |
| `plot_no` | `integer` | YES |  |
| `area_name` | `character varying` | YES |  |
| `shape` | `text` | YES |  |
| `landclass` | `character varying` | YES |  |
| `landuses` | `character varying` | YES |  |
| `landtype` | `character varying` | YES |  |

---

### Table: `claim_for_benefits`
**Purpose**: Stores data related to claim_for_benefits.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `claim_cd` | `integer` | NO | ✅ |
| `pap_cd` | `character varying` | YES |  |
| `land_type` | `character varying` | YES |  |
| `is_recorded_tenant` | `character varying` | NO |  |
| `is_paf_alive` | `character varying` | YES |  |
| `deceased_paf_name` | `character varying` | YES |  |
| `date_of_death` | `date` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `failed_jobs`
**Purpose**: Stores data related to failed_jobs.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `uuid` | `character varying` | NO |  |
| `connection` | `text` | NO |  |
| `queue` | `text` | NO |  |
| `payload` | `text` | NO |  |
| `exception` | `text` | NO |  |
| `failed_at` | `timestamp without time zone` | NO |  |

---

### Table: `file_det`
**Purpose**: Stores data related to file_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_id` | `bigint` | NO | ✅ |
| `file_cat_id` | `bigint` | YES |  |
| `file_type_id` | `bigint` | YES |  |
| `file_nm_en` | `character varying` | YES |  |
| `file_nm_loc_vern` | `character varying` | YES |  |
| `file_content` | `bytea` | YES |  |
| `ref_no` | `character varying` | YES |  |
| `ref_dt` | `date` | YES |  |
| `entry_by` | `bigint` | YES |  |
| `updt_by` | `bigint` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |

---

### Table: `jobs`
**Purpose**: Stores data related to jobs.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `queue` | `character varying` | NO |  |
| `payload` | `text` | NO |  |
| `attempts` | `smallint` | NO |  |
| `reserved_at` | `integer` | YES |  |
| `available_at` | `integer` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `created_at` | `character varying` | YES |  |

---

### Table: `landtype_master`
**Purpose**: Stores data related to landtype_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `landt_id` | `bigint` | NO | ✅ |
| `land_type` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `district_master`
**Purpose**: Stores data related to district_master.

**Foreign Key Relationships**:
- `state_lgd` -> `public.state_master (state_lgd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `district_lgd` | `bigint` | NO | ✅ |
| `district_en` | `character varying` | NO |  |
| `district_loc_vern` | `character varying` | YES |  |
| `state_lgd` | `bigint` | NO |  |
| `is_active` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `model_has_permissions`
**Purpose**: Stores data related to model_has_permissions.

**Foreign Key Relationships**:
- `permission_id` -> `public.permissions (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `permission_id` | `bigint` | NO | ✅ |
| `model_type` | `character varying` | NO | ✅ |
| `model_id` | `bigint` | NO | ✅ |

---

### Table: `model_has_roles`
**Purpose**: Stores data related to model_has_roles.

**Foreign Key Relationships**:
- `role_id` -> `public.roles (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `role_id` | `bigint` | NO | ✅ |
| `model_type` | `character varying` | NO | ✅ |
| `model_id` | `bigint` | NO | ✅ |

---

### Table: `ecl_khtn_list`
**Purpose**: Stores data related to ecl_khtn_list.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `khtn_id` | `character varying` | NO | ✅ |
| `mouza_lgd` | `bigint` | YES |  |
| `khtn_no` | `character varying` | YES |  |
| `tot_area` | `character varying` | YES |  |
| `favour_of` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `khtn_ty` | `smallint` | YES |  |

---

### Table: `owner_type_master`
**Purpose**: Stores data related to owner_type_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `owner_type_id` | `bigint` | NO | ✅ |
| `owner_type` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `mouzalist_gis_fdw`
**Purpose**: Stores data related to mouzalist_gis_fdw.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `mid` | `integer` | NO |  |
| `block_lgd` | `character varying` | YES |  |
| `jl_num` | `character varying` | YES |  |

---

### Table: `permissions`
**Purpose**: Stores data related to permissions.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `name` | `character varying` | NO |  |
| `guard_name` | `character varying` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |
| `permission_nm` | `character varying` | YES |  |
| `page_id` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `section` | `character varying` | YES |  |
| `mod_id` | `bigint` | YES |  |

---

### Table: `possr_type_master`
**Purpose**: Stores data related to possr_type_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `possr_type_id` | `bigint` | NO | ✅ |
| `possr_type` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `password_resets`
**Purpose**: Stores data related to password_resets.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `email` | `character varying` | NO |  |
| `token` | `character varying` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `expiry_time` | `timestamp with time zone` | YES |  |

---

### Table: `otp_verify`
**Purpose**: Stores data related to otp_verify.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `mobile_no` | `character varying` | YES |  |
| `email_id` | `character varying` | YES |  |
| `otp` | `character varying` | YES |  |
| `otp_type` | `character varying` | YES |  |
| `is_verified` | `boolean` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `expiry_time` | `timestamp with time zone` | YES |  |

---

### Table: `pap_nom_files`
**Purpose**: Stores data related to pap_nom_files.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_cd` | `integer` | NO | ✅ |
| `link_code` | `character varying` | YES |  |
| `file_nm` | `character varying` | NO |  |
| `file_type` | `character varying` | NO |  |
| `file_ext` | `character varying` | NO |  |
| `file_cntn` | `bytea` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `status` | `integer` | YES |  |
| `owner_cd` | `character varying` | YES |  |

---

### Table: `pap_ben_det`
**Purpose**: Stores data related to pap_ben_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pap_ben_cd` | `character varying` | NO | ✅ |
| `ben_nm` | `character varying` | YES |  |
| `ben_fnm` | `character varying` | YES |  |
| `pan_no` | `character varying` | YES |  |
| `epic_no` | `character varying` | YES |  |
| `dob` | `character varying` | YES |  |
| `ben_cast` | `bigint` | YES |  |
| `mob_no` | `character varying` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `ps_lgd` | `bigint` | YES |  |
| `vill` | `character varying` | YES |  |
| `pin` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_self_benefited` | `boolean` | NO |  |
| `status` | `integer` | NO |  |
| `is_alive_ben` | `boolean` | NO |  |
| `pap_rel` | `jsonb` | YES |  |
| `verify_status` | `smallint` | YES |  |
| `verify_comment` | `text` | YES |  |

---

### Table: `personal_access_tokens`
**Purpose**: Stores data related to personal_access_tokens.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `tokenable_type` | `character varying` | NO |  |
| `tokenable_id` | `bigint` | NO |  |
| `name` | `character varying` | NO |  |
| `token` | `character varying` | NO |  |
| `abilities` | `text` | YES |  |
| `last_used_at` | `timestamp without time zone` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `present_land_use`
**Purpose**: Stores data related to present_land_use.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `present_land_use` | `character varying` | NO |  |

---

### Table: `pap_lost_possed`
**Purpose**: Stores data related to pap_lost_possed.

**Foreign Key Relationships**:
- `pap_cd` -> `public.pap_det_temp (pap_cd)`
- `pap_ben_cd` -> `public.pap_ben_det (pap_ben_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pl_possed_id` | `bigint` | NO | ✅ |
| `pap_ben_cd` | `character varying` | NO |  |
| `pap_cd` | `character varying` | NO |  |
| `tot_area` | `numeric` | YES |  |
| `share_area` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | NO |  |
| `pos_acq_id` | `bigint` | NO |  |
| `khatian_no` | `character varying` | YES |  |
| `ecl_khtn_no` | `character varying` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `is_comp_sanc` | `boolean` | YES |  |
| `is_rr_sanc` | `boolean` | YES |  |
| `is_emp_sanc` | `boolean` | YES |  |
| `emp_sanc_status` | `USER-DEFINED` | YES |  |

---

### Table: `pap_lost_det`
**Purpose**: Stores data related to pap_lost_det.

**Foreign Key Relationships**:
- `pap_cd` -> `public.pap_det_temp (pap_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pap_lst_cd` | `character varying` | NO | ✅ |
| `pap_cd` | `character varying` | YES |  |
| `mouza_lgd` | `bigint` | YES |  |
| `kh_no` | `character varying` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `land_lost` | `numeric` | YES |  |
| `asst_lost` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `plot_ty` | `integer` | YES |  |
| `plot_number` | `character varying` | YES |  |
| `bata_number` | `character varying` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `block_lgd` | `bigint` | YES |  |
| `file_content` | `bytea` | YES |  |
| `pap_cat` | `character varying` | YES |  |
| `is_eclplot` | `boolean` | YES |  |
| `vrfy_status` | `integer` | YES |  |
| `vrfy_comnt` | `text` | YES |  |
| `khtn_aprv_status` | `boolean` | NO |  |
| `kh_exst` | `boolean` | YES |  |
| `plot_exst` | `boolean` | YES |  |
| `ploakhtanarea` | `numeric` | YES |  |
| `is_claim_shifting` | `character varying` | YES |  |
| `claim_for_benefits` | `numeric` | YES |  |

---

### Table: `pap_det_temp`
**Purpose**: Stores data related to pap_det_temp.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pap_cd` | `character varying` | NO | ✅ |
| `pap_nm` | `character varying` | YES |  |
| `pap_fnm` | `character varying` | YES |  |
| `pan_no` | `character varying` | YES |  |
| `epic_no` | `character varying` | YES |  |
| `dob` | `character varying` | YES |  |
| `pap_cast` | `bigint` | YES |  |
| `religion` | `character varying` | YES |  |
| `mob_no` | `character varying` | YES |  |
| `alt_mob_no` | `character varying` | YES |  |
| `email_id` | `character varying` | YES |  |
| `qualification` | `character varying` | YES |  |
| `u_id` | `character varying` | YES |  |
| `pass` | `character varying` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `ps_lgd` | `bigint` | YES |  |
| `vill` | `character varying` | YES |  |
| `pin` | `bigint` | YES |  |
| `status` | `integer` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `file_type` | `character varying` | YES |  |
| `file_name` | `character varying` | YES |  |
| `file_content` | `bytea` | YES |  |
| `is_paf_reg_complete` | `boolean` | YES |  |
| `is_owner_recipient` | `character varying` | YES |  |
| `reg_token` | `character varying` | YES |  |
| `pap_ben_cds` | `jsonb` | YES |  |
| `is_alive_paf` | `boolean` | NO |  |
| `dod` | `character varying` | YES |  |
| `gender` | `character varying` | YES |  |
| `verify_stps` | `smallint` | NO |  |
| `is_recorded_tenant` | `character varying` | YES |  |
| `consent` | `boolean` | YES |  |

---

### Table: `page_list`
**Purpose**: Stores data related to page_list.

**Foreign Key Relationships**:
- `mod_id` -> `public.module (mod_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `page_id` | `bigint` | NO | ✅ |
| `page_nm` | `character varying` | NO |  |
| `page_slug` | `character varying` | YES |  |
| `mod_id` | `bigint` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `mod_cd` | `character varying` | YES |  |
| `page_cd` | `character varying` | YES |  |

---

### Table: `pswd_hist`
**Purpose**: Stores data related to pswd_hist.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `user_id` | `bigint` | NO |  |
| `old_password` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_at` | `bigint` | YES |  |
| `del_at` | `timestamp without time zone` | YES |  |
| `email` | `character varying` | YES |  |
| `username` | `character varying` | YES |  |

---

### Table: `role_has_permissions`
**Purpose**: Stores data related to role_has_permissions.

**Foreign Key Relationships**:
- `permission_id` -> `public.permissions (id)`
- `role_id` -> `public.roles (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `permission_id` | `bigint` | NO | ✅ |
| `role_id` | `bigint` | NO | ✅ |

---

### Table: `status`
**Purpose**: Stores data related to status.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `status_id` | `bigint` | NO | ✅ |
| `status_nm` | `character varying` | NO |  |
| `status_desc` | `character varying` | NO |  |
| `status_cd` | `character varying` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `acqu_cat` | `bigint` | NO |  |

---

### Table: `roles`
**Purpose**: Stores data related to roles.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `name` | `character varying` | NO |  |
| `guard_name` | `character varying` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `ps_master`
**Purpose**: Stores data related to ps_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `ps_lgd` | `bigint` | NO | ✅ |
| `ps_en` | `character varying` | NO |  |
| `ps_loc_vern` | `character varying` | YES |  |
| `district_lgd` | `bigint` | NO |  |
| `is_active` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `state_lgd` | `bigint` | YES |  |

---

### Table: `state_master`
**Purpose**: Stores data related to state_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `state_lgd` | `bigint` | NO | ✅ |
| `state_en` | `character varying` | NO |  |
| `state_loc_vern` | `character varying` | YES |  |
| `short_code` | `character varying` | YES |  |
| `is_active` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `users`
**Purpose**: Stores data related to users.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `f_name` | `character varying` | NO |  |
| `email` | `character varying` | NO |  |
| `email_verified_at` | `timestamp without time zone` | YES |  |
| `password` | `character varying` | NO |  |
| `remember_token` | `character varying` | YES |  |
| `mobile_no` | `character varying` | YES |  |
| `employee_id` | `character varying` | YES |  |
| `designation` | `character varying` | YES |  |
| `username` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `is_active` | `boolean` | YES |  |
| `created_at` | `bigint` | YES |  |
| `updated_at` | `bigint` | YES |  |
| `deleted_at` | `timestamp without time zone` | YES |  |
| `email_verified` | `boolean` | YES |  |
| `has_approved` | `boolean` | YES |  |
| `email_token` | `text` | YES |  |
| `m_name` | `character varying` | YES |  |
| `l_name` | `character varying` | YES |  |
| `usr_dob` | `date` | YES |  |
| `id_type` | `character varying` | YES |  |
| `id_card_no` | `character varying` | YES |  |
| `mobile_verified` | `boolean` | YES |  |
| `area` | `character varying` | YES |  |
| `totp_secret` | `character varying` | YES |  |
| `picture` | `text` | YES |  |

---

### Table: `vill_master`
**Purpose**: Stores data related to vill_master.

**Foreign Key Relationships**:
- `ps_lgd` -> `public.ps_master (ps_lgd)`
- `block_lgd` -> `public.block_master (block_lgd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `village_lgd` | `bigint` | NO | ✅ |
| `village_name` | `character varying` | NO |  |
| `vill_loc_vern` | `character varying` | NO |  |
| `block_lgd` | `bigint` | NO |  |
| `ps_lgd` | `bigint` | NO |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `vill_cd` | `character varying` | YES |  |

---

### Table: `file_manager`
**Purpose**: Stores data related to file_manager.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_mn_id` | `bigint` | NO | ✅ |
| `state_lgd` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `mine_cd` | `character varying` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `file_cat_id` | `bigint` | YES |  |
| `file_type_id` | `bigint` | YES |  |
| `file_id` | `bigint` | YES |  |
| `filename` | `character varying` | YES |  |
| `filetype` | `character varying` | NO |  |
| `filedata` | `bytea` | YES |  |
| `filepath` | `character varying` | YES |  |
| `ref_no` | `text` | YES |  |
| `ref_dt` | `date` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_active` | `boolean` | NO |  |
| `is_delete` | `boolean` | NO |  |
| `mouza_lgd` | `bigint` | YES |  |
| `plot_number` | `text` | YES |  |
| `khatian_no` | `text` | YES |  |
| `owner_code` | `text` | YES |  |
| `phase_id` | `text` | YES |  |
| `proposal_id` | `text` | YES |  |
| `prop_type` | `character varying` | YES |  |

---

### Table: `tickets`
**Purpose**: Stores data related to tickets.

**Foreign Key Relationships**:
- `user_id` -> `public.users (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `user_id` | `bigint` | NO |  |
| `subject` | `character varying` | NO |  |
| `description` | `text` | NO |  |
| `status` | `character varying` | YES |  |
| `entry_ts` | `timestamp without time zone` | YES |  |
| `updt_ts` | `timestamp without time zone` | YES |  |
| `page_url` | `text` | YES |  |
| `screenshot` | `text` | YES |  |
| `entry_by` | `bigint` | YES |  |
| `updt_by` | `bigint` | YES |  |

---

### Table: `ticket_replies`
**Purpose**: Stores data related to ticket_replies.

**Foreign Key Relationships**:
- `ticket_id` -> `public.tickets (id)`
- `user_id` -> `public.users (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `ticket_id` | `bigint` | NO |  |
| `user_id` | `bigint` | NO |  |
| `message` | `text` | NO |  |
| `entry_ts` | `timestamp without time zone` | YES |  |
| `updt_ts` | `timestamp without time zone` | YES |  |
| `entry_by` | `bigint` | YES |  |
| `updt_by` | `bigint` | YES |  |

---

### Table: `migrations`
**Purpose**: Stores data related to migrations.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `integer` | NO | ✅ |
| `migration` | `character varying` | NO |  |
| `batch` | `integer` | NO |  |

---

### Table: `chk_master_new`
**Purpose**: Stores data related to chk_master_new.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `chk_id` | `integer` | NO | ✅ |
| `chk_description` | `text` | YES |  |
| `chk_type` | `character varying` | YES |  |
| `chk_sub_type` | `character varying` | YES |  |
| `chk_inp_type` | `character varying` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `is_initial` | `boolean` | YES |  |
| `noti_type` | `character varying` | YES |  |
| `chk_inp_instruc` | `text` | YES |  |
| `local_vernacular` | `text` | YES |  |
| `autofetch` | `text` | YES |  |

---

### Table: `push_subscriptions`
**Purpose**: Stores data related to push_subscriptions.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `subscribable_type` | `character varying` | NO |  |
| `subscribable_id` | `bigint` | NO |  |
| `endpoint` | `character varying` | NO |  |
| `public_key` | `character varying` | YES |  |
| `auth_token` | `character varying` | YES |  |
| `content_encoding` | `character varying` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `dynamic_report_histories`
**Purpose**: Stores data related to dynamic_report_histories.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `report_title` | `character varying` | NO |  |
| `sql_query` | `text` | NO |  |
| `entry_by` | `bigint` | YES |  |
| `updt_by` | `bigint` | YES |  |
| `entry_ts` | `timestamp without time zone` | YES |  |
| `updt_ts` | `timestamp without time zone` | YES |  |

---

### Table: `document_templates`
**Purpose**: Stores data related to document_templates.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `template_code` | `character varying` | YES |  |
| `template_name` | `character varying` | YES |  |
| `docx_path` | `text` | YES |  |
| `active` | `boolean` | YES |  |

---

### Table: `report_function_params`
**Purpose**: Stores data related to report_function_params.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `integer` | NO | ✅ |
| `function_name` | `text` | NO |  |
| `param_name` | `text` | NO |  |
| `label` | `text` | NO |  |
| `input_type` | `text` | NO |  |
| `is_required` | `boolean` | YES |  |
| `dropdown_sql` | `text` | YES |  |
| `sort_order` | `integer` | YES |  |
| `is_multi` | `boolean` | YES |  |
| `depends_on` | `character varying` | YES |  |
| `options_sql` | `text` | YES |  |

---

### Table: `mouza_master`
**Purpose**: Stores data related to mouza_master.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `mouza_lgd` | `bigint` | NO | ✅ |
| `mouza_en` | `character varying` | NO |  |
| `mouza_loc_vern` | `character varying` | YES |  |
| `block_lgd` | `bigint` | NO |  |
| `is_active` | `boolean` | YES |  |
| `jl_no` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `gis_enable` | `boolean` | YES |  |
| `halka_no` | `character varying` | YES |  |

---

### Table: `report_functions`
**Purpose**: Stores data related to report_functions.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `integer` | NO | ✅ |
| `function_name` | `text` | NO |  |
| `report_title` | `text` | NO |  |
| `description` | `text` | YES |  |
| `is_active` | `boolean` | YES |  |
| `sort_order` | `integer` | YES |  |
| `group_headers` | `jsonb` | YES |  |

---

### Table: `generated_documents`
**Purpose**: Stores data related to generated_documents.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `document_type` | `character varying` | YES |  |
| `reference_id` | `bigint` | YES |  |
| `docx_file` | `text` | YES |  |
| `pdf_file` | `text` | YES |  |
| `status` | `character varying` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `document_template_fields`
**Purpose**: Stores data related to document_template_fields.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO |  |
| `template_code` | `character varying` | YES |  |
| `field_key` | `character varying` | YES |  |
| `field_type` | `character varying` | YES |  |
| `label` | `text` | YES |  |
| `options` | `jsonb` | YES |  |
| `show_if` | `jsonb` | YES |  |
| `is_required` | `boolean` | YES |  |
| `display_order` | `integer` | YES |  |
| `is_active` | `boolean` | YES |  |

---

### Table: `document_workflow_roles`
**Purpose**: Stores data related to document_workflow_roles.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `template_code` | `character varying` | YES |  |
| `role_code` | `character varying` | YES |  |
| `role_name` | `character varying` | YES |  |
| `sequence_no` | `integer` | YES |  |
| `placeholder_key` | `character varying` | YES |  |
| `can_sign` | `boolean` | YES |  |

---

### Table: `document_signatures`
**Purpose**: Stores data related to document_signatures.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `document_id` | `character varying` | YES |  |
| `role_code` | `character varying` | YES |  |
| `signed_by` | `bigint` | YES |  |
| `signed_name` | `character varying` | YES |  |
| `designation` | `character varying` | YES |  |
| `signed_at` | `timestamp without time zone` | YES |  |
| `remarks` | `text` | YES |  |

---

### Table: `document_instances`
**Purpose**: Stores data related to document_instances.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `character varying` | NO | ✅ |
| `template_code` | `character varying` | YES |  |
| `application_id` | `bigint` | YES |  |
| `form_data` | `jsonb` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |
| `generated_docx` | `text` | YES |  |
| `generated_pdf` | `text` | YES |  |
| `generated_docx_id` | `character varying` | YES |  |
| `generated_pdf_id` | `character varying` | YES |  |
| `resolver_fields_json` | `text` | YES |  |
| `resolver_tables_json` | `text` | YES |  |
| `resolver_signatures_json` | `text` | YES |  |
| `final_fields_json` | `text` | YES |  |
| `signature_data_json` | `text` | YES |  |
| `resolver_version` | `character varying` | YES |  |

---

### Table: `coalrr_documents`
**Purpose**: Stores data related to coalrr_documents.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `vaultable_type` | `character varying` | NO |  |
| `vaultable_id` | `bigint` | NO |  |
| `checklist_item_key` | `character varying` | YES |  |
| `storage_path` | `character varying` | NO |  |
| `original_filename` | `character varying` | YES |  |
| `mime_type` | `character varying` | YES |  |
| `file_size_bytes` | `bigint` | YES |  |
| `virus_scan_status` | `character varying` | NO |  |
| `uploaded_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_mst_project`
**Purpose**: Stores data related to coalrr_mst_project.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `name` | `character varying` | NO |  |
| `colliery_name` | `character varying` | NO |  |
| `district` | `character varying` | YES |  |
| `state_name` | `character varying` | YES |  |
| `target_commencement_date` | `date` | YES |  |
| `total_land_limit_acres` | `numeric` | NO |  |
| `total_budget_ceiling` | `numeric` | NO |  |
| `total_employment_quota` | `integer` | NO |  |
| `statutory_clearances` | `jsonb` | NO |  |
| `locked_at` | `timestamp without time zone` | YES |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_mst_mouza`
**Purpose**: Stores data related to coalrr_mst_mouza.

**Foreign Key Relationships**:
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `project_id` | `bigint` | NO |  |
| `mouza_name` | `character varying` | YES |  |
| `district` | `character varying` | YES |  |
| `block_name` | `character varying` | YES |  |
| `police_station` | `character varying` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_mst_plot`
**Purpose**: Stores data related to coalrr_mst_plot.

**Foreign Key Relationships**:
- `mouza_id` -> `public.coalrr_mst_mouza (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `mouza_id` | `bigint` | NO |  |
| `plot_number` | `character varying` | NO |  |
| `land_type` | `character varying` | NO |  |
| `recorded_area` | `numeric` | NO |  |
| `exhausted_area_for_jobs` | `numeric` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_workflow_review_tasks`
**Purpose**: Stores data related to coalrr_workflow_review_tasks.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `reviewable_type` | `character varying` | NO |  |
| `reviewable_id` | `bigint` | NO |  |
| `role` | `character varying` | NO |  |
| `status` | `character varying` | NO |  |
| `decided_by` | `bigint` | YES |  |
| `decided_at` | `timestamp without time zone` | YES |  |
| `notes` | `text` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_idempotency_receipts`
**Purpose**: Stores data related to coalrr_idempotency_receipts.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `idempotency_key` | `character` | NO |  |
| `action_type` | `character varying` | NO |  |
| `result_reference` | `character varying` | YES |  |
| `created_at` | `timestamp without time zone` | NO |  |

---

### Table: `coalrr_land_schedules`
**Purpose**: Stores data related to coalrr_land_schedules.

**Foreign Key Relationships**:
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `project_id` | `bigint` | NO |  |
| `acquisition_mode` | `character varying` | NO |  |
| `mode_specific_checklist` | `jsonb` | NO |  |
| `exception_flags` | `jsonb` | NO |  |
| `state` | `character varying` | NO |  |
| `state_meta` | `jsonb` | NO |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_land_schedule_items`
**Purpose**: Stores data related to coalrr_land_schedule_items.

**Foreign Key Relationships**:
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `schedule_id` -> `public.coalrr_land_schedules (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `schedule_id` | `bigint` | NO |  |
| `plot_id` | `bigint` | NO |  |
| `annexure_tag` | `character varying` | NO |  |
| `is_active` | `boolean` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_form_i_claims`
**Purpose**: Stores data related to coalrr_form_i_claims.

**Foreign Key Relationships**:
- `plot_id` -> `public.coalrr_mst_plot (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `plot_id` | `bigint` | NO |  |
| `citizen_id_hash` | `character varying` | NO |  |
| `own_share_acres` | `numeric` | NO |  |
| `bank_account_number` | `character varying` | YES |  |
| `bank_ifsc` | `character varying` | YES |  |
| `bank_holder_name` | `character varying` | YES |  |
| `opted_monetary_in_lieu_of_employment` | `boolean` | NO |  |
| `state` | `character varying` | NO |  |
| `state_meta` | `jsonb` | NO |  |
| `idempotency_key` | `character` | YES |  |
| `submitted_at` | `timestamp without time zone` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_compensation_payrolls`
**Purpose**: Stores data related to coalrr_compensation_payrolls.

**Foreign Key Relationships**:
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `project_id` | `bigint` | NO |  |
| `reference_number` | `character varying` | NO |  |
| `multiplication_factor` | `numeric` | NO |  |
| `state` | `character varying` | NO |  |
| `state_meta` | `jsonb` | NO |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_grievances`
**Purpose**: Stores data related to coalrr_grievances.

**Foreign Key Relationships**:
- `form_i_claim_id` -> `public.coalrr_form_i_claims (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `form_i_claim_id` | `bigint` | NO |  |
| `category` | `character varying` | NO |  |
| `description` | `text` | NO |  |
| `resolution` | `character varying` | YES |  |
| `resolution_rationale` | `text` | YES |  |
| `sla_due_at` | `timestamp without time zone` | NO |  |
| `resolved_by` | `bigint` | YES |  |
| `resolved_at` | `timestamp without time zone` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_compensation_payroll_lines`
**Purpose**: Stores data related to coalrr_compensation_payroll_lines.

**Foreign Key Relationships**:
- `form_i_claim_id` -> `public.coalrr_form_i_claims (id)`
- `payroll_id` -> `public.coalrr_compensation_payrolls (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `payroll_id` | `bigint` | NO |  |
| `form_i_claim_id` | `bigint` | NO |  |
| `land_value` | `numeric` | NO |  |
| `asset_value` | `numeric` | NO |  |
| `solatium_amount` | `numeric` | NO |  |
| `escalation_amount` | `numeric` | NO |  |
| `total_award` | `numeric` | NO |  |
| `formula_snapshot` | `jsonb` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_paf_census_records`
**Purpose**: Stores data related to coalrr_paf_census_records.

**Foreign Key Relationships**:
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `project_id` | `bigint` | NO |  |
| `paf_id` | `character varying` | NO |  |
| `head_of_family_name` | `character varying` | NO |  |
| `plot_id` | `bigint` | NO |  |
| `category_of_entitlement` | `character varying` | NO |  |
| `sc_st_obc_category` | `character varying` | NO |  |
| `family_members` | `jsonb` | NO |  |
| `photo_id_card_document_id` | `bigint` | YES |  |
| `has_post_freeze_structure` | `boolean` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_rnr_asset_payrolls`
**Purpose**: Stores data related to coalrr_rnr_asset_payrolls.

**Foreign Key Relationships**:
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `project_id` | `bigint` | NO |  |
| `reference_number` | `character varying` | NO |  |
| `multiplication_factor` | `numeric` | NO |  |
| `state` | `character varying` | NO |  |
| `state_meta` | `jsonb` | NO |  |
| `substantiation_sor_document_id` | `bigint` | YES |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_rnr_asset_payroll_lines`
**Purpose**: Stores data related to coalrr_rnr_asset_payroll_lines.

**Foreign Key Relationships**:
- `paf_census_record_id` -> `public.coalrr_paf_census_records (id)`
- `payroll_id` -> `public.coalrr_rnr_asset_payrolls (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `payroll_id` | `bigint` | NO |  |
| `paf_census_record_id` | `bigint` | NO |  |
| `entitlement_type` | `character varying` | NO |  |
| `land_value` | `numeric` | NO |  |
| `asset_value` | `numeric` | NO |  |
| `solatium_amount` | `numeric` | NO |  |
| `escalation_amount` | `numeric` | NO |  |
| `total_award` | `numeric` | NO |  |
| `deviation_justified` | `boolean` | NO |  |
| `deviation_justification` | `text` | YES |  |
| `formula_snapshot` | `jsonb` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_nominee_pools`
**Purpose**: Stores data related to coalrr_nominee_pools.

**Foreign Key Relationships**:
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `nominee_aadhaar_hash` | `character varying` | NO |  |
| `nominee_name` | `character varying` | YES |  |
| `pooled_acreage` | `numeric` | NO |  |
| `is_threshold_met` | `boolean` | NO |  |
| `project_id` | `bigint` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_form_d_ledger_entries_2026`
**Purpose**: Stores data related to coalrr_form_d_ledger_entries_2026.

**Foreign Key Relationships**:
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `plot_id` | `bigint` | NO |  |
| `compensation_payroll_line_id` | `bigint` | YES |  |
| `payee_type` | `character varying` | NO |  |
| `amount_land` | `numeric` | NO |  |
| `amount_rnr` | `numeric` | NO |  |
| `rtgs_utr_reference` | `character varying` | YES |  |
| `paid_at` | `timestamp without time zone` | NO | ✅ |
| `countersigned_by` | `bigint` | YES |  |
| `countersigned_at` | `timestamp without time zone` | YES |  |
| `row_hash` | `character` | YES |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | NO |  |

---

### Table: `coalrr_form_d_ledger_entries`
**Purpose**: Stores data related to coalrr_form_d_ledger_entries.

**Foreign Key Relationships**:
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`
- `plot_id` -> `public.coalrr_mst_plot (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `plot_id` | `bigint` | NO |  |
| `compensation_payroll_line_id` | `bigint` | YES |  |
| `payee_type` | `character varying` | NO |  |
| `amount_land` | `numeric` | NO |  |
| `amount_rnr` | `numeric` | NO |  |
| `rtgs_utr_reference` | `character varying` | YES |  |
| `paid_at` | `timestamp without time zone` | NO | ✅ |
| `countersigned_by` | `bigint` | YES |  |
| `countersigned_at` | `timestamp without time zone` | YES |  |
| `row_hash` | `character` | YES |  |
| `created_by` | `bigint` | YES |  |
| `created_at` | `timestamp without time zone` | NO |  |

---

### Table: `coalrr_nominee_pool_contributions`
**Purpose**: Stores data related to coalrr_nominee_pool_contributions.

**Foreign Key Relationships**:
- `form_i_claim_id` -> `public.coalrr_form_i_claims (id)`
- `pool_id` -> `public.coalrr_nominee_pools (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `pool_id` | `bigint` | NO |  |
| `form_i_claim_id` | `bigint` | NO |  |
| `contribution_acres` | `numeric` | NO |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_employment_applications`
**Purpose**: Stores data related to coalrr_employment_applications.

**Foreign Key Relationships**:
- `nominee_pool_id` -> `public.coalrr_nominee_pools (id)`
- `project_id` -> `public.coalrr_mst_project (id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `nominee_pool_id` | `bigint` | NO |  |
| `project_id` | `bigint` | NO |  |
| `state` | `character varying` | NO |  |
| `education_level` | `character varying` | YES |  |
| `age` | `integer` | YES |  |
| `self_declaration_confirmed` | `boolean` | NO |  |
| `form_ix_balance_acres` | `numeric` | YES |  |
| `form_x_balance_jobs` | `integer` | YES |  |
| `exception_flags` | `jsonb` | NO |  |
| `idempotency_key` | `character` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

### Table: `coalrr_document_requests`
**Purpose**: Stores data related to coalrr_document_requests.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `requestable_type` | `character varying` | YES |  |
| `requestable_id` | `bigint` | YES |  |
| `form_code` | `character varying` | YES |  |
| `status` | `character varying` | NO |  |
| `storage_path` | `character varying` | YES |  |
| `failure_reason` | `text` | YES |  |
| `idempotency_key` | `character` | NO |  |
| `requested_by` | `bigint` | YES |  |
| `generated_at` | `timestamp without time zone` | YES |  |
| `created_at` | `timestamp without time zone` | YES |  |
| `updated_at` | `timestamp without time zone` | YES |  |

---

## Schema: `employment`

This schema encapsulates the tables related to the employment domain of the application.

### Table: `emp_ben_relation`
**Purpose**: Stores data related to emp_ben_relation.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `emp_code` | `character varying` | YES |  |
| `share_owner_id` | `character varying` | YES |  |
| `owner_details` | `text` | YES |  |
| `relation_with_owner` | `character varying` | YES |  |
| `owner_nominee_relationship_certificate` | `bytea` | YES |  |
| `blood_rel_paf` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `affidavit_doc` | `bytea` | YES |  |
| `gm_cert_doc` | `bytea` | YES |  |

---

### Table: `emp_documents`
**Purpose**: Stores data related to emp_documents.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `emp_doc_id` | `bigint` | NO | ✅ |
| `emp_code` | `character varying` | YES |  |
| `emp_doc_name` | `character varying` | YES |  |
| `emp_doc_ext` | `character varying` | YES |  |
| `emp_doc_path` | `character varying` | YES |  |
| `emp_doc_type` | `character varying` | YES |  |
| `del_ts` | `character varying` | YES |  |
| `file_ref_no` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `owner_name` | `character varying` | YES |  |
| `owner_relationship` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `filedata` | `bytea` | YES |  |
| `owner_code` | `character varying` | YES |  |

---

### Table: `emp_land_share`
**Purpose**: Stores data related to emp_land_share.

**Foreign Key Relationships**:
- `emp_code` -> `employment.ben_reg (emp_code)`
- `land_assigned_to` -> `employment.ben_reg (ben_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `share_id` | `bigint` | NO | ✅ |
| `land_share_measure` | `real` | YES |  |
| `land_share_percent` | `real` | YES |  |
| `land_assigned_to` | `bigint` | YES |  |
| `land_affidavit_declaration_file_path` | `text` | YES |  |
| `status` | `boolean` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `land_mouza_id` | `bigint` | YES |  |
| `land_plot_id` | `character varying` | YES |  |
| `land_khatian_no` | `character varying` | YES |  |
| `relation_with_owner` | `character varying` | YES |  |
| `owner_nominee_relationship_certificate` | `text` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `share_owner_id` | `character varying` | YES |  |
| `emp_code` | `character varying` | YES |  |
| `remarks` | `text` | YES |  |
| `land_block_id` | `bigint` | YES |  |
| `owner_details` | `jsonb` | YES |  |
| `khtn_id` | `character varying` | YES |  |
| `lr_plot_no` | `character varying` | YES |  |
| `disputed_land` | `boolean` | YES |  |
| `lr_plot_bata` | `character varying` | YES |  |
| `ty_plot` | `character varying` | YES |  |
| `declaration_file` | `bytea` | YES |  |
| `rel_file` | `bytea` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |

---

### Table: `emp_owner_share`
**Purpose**: Stores data related to emp_owner_share.

**Foreign Key Relationships**:
- `emp_code` -> `employment.ben_reg (emp_code)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `share_id` | `bigint` | NO | ✅ |
| `owner_details` | `jsonb` | YES |  |
| `owner_share_emp` | `jsonb` | YES |  |
| `total_land` | `double precision` | YES |  |
| `emp_code` | `character varying` | YES |  |
| `owner_code` | `character varying` | YES |  |
| `relationship` | `character varying` | YES |  |
| `documents` | `jsonb` | YES |  |
| `owner_remarks` | `text` | YES |  |
| `updated_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |

---

### Table: `emp_proposal`
**Purpose**: Stores data related to emp_proposal.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `emp_prop_id` | `bigint` | NO | ✅ |
| `emp_cd` | `jsonb` | YES |  |
| `total_proposed_emp_land` | `real` | NO |  |
| `emp_status` | `character varying` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `final_approval` | `boolean` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `prop_ref_cd` | `character varying` | YES |  |
| `emp_jning_dt` | `date` | YES |  |
| `emp_code` | `character varying` | YES |  |
| `is_prop_clsed` | `boolean` | YES |  |
| `is_rel_doc` | `boolean` | YES |  |
| `is_decl_doc` | `boolean` | YES |  |
| `emp_entry_cmplt` | `boolean` | YES |  |
| `emp_state_lgd` | `bigint` | YES |  |
| `emp_dist_lgd` | `bigint` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `emp_aprv_remark` | `text` | YES |  |
| `status` | `bigint` | NO |  |
| `fwd_user_id` | `bigint` | YES |  |

---

### Table: `emp_to_owner_land_update`
**Purpose**: Stores data related to emp_to_owner_land_update.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `share_id` | `bigint` | NO |  |
| `owner_details` | `jsonb` | YES |  |
| `owner_share_emp` | `jsonb` | YES |  |
| `total_land` | `double precision` | YES |  |
| `created_at` | `date` | YES |  |
| `updated_at` | `date` | YES |  |
| `emp_code` | `character varying` | YES |  |
| `owner_code` | `character varying` | YES |  |
| `relationship` | `character varying` | YES |  |
| `documents` | `jsonb` | YES |  |
| `owner_remarks` | `text` | YES |  |
| `khatn_id` | `character varying` | YES |  |
| `is_miss` | `boolean` | YES |  |
| `update_remarks` | `text` | YES |  |
| `updated_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |

---

### Table: `nmne_files`
**Purpose**: Stores data related to nmne_files.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `file_cd` | `integer` | NO | ✅ |
| `nmne_cd` | `character varying` | NO |  |
| `owner_cd` | `character varying` | YES |  |
| `filetype` | `character varying` | NO |  |
| `file_cntn` | `bytea` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `status` | `integer` | YES |  |

---

### Table: `emp_area_avail`
**Purpose**: Stores data related to emp_area_avail.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `emp_area_prop` | `real` | YES |  |
| `khtn_id` | `character varying` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `area_emp_tot` | `real` | YES |  |
| `emp_avail_area` | `real` | YES |  |
| `is_verified` | `boolean` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `emp_cmplt` | `boolean` | YES |  |
| `area_emp_occu` | `real` | YES |  |
| `tot_possd_land` | `real` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `area_avl_id` | `bigint` | NO | ✅ |

---

### Table: `ben_reg`
**Purpose**: Stores data related to ben_reg.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `emp_code` | `character varying` | YES |  |
| `ben_fname` | `character varying` | YES |  |
| `ben_lname` | `character varying` | YES |  |
| `father_name` | `character varying` | YES |  |
| `caste` | `character varying` | YES |  |
| `emp_photo` | `text` | YES |  |
| `ben_gender` | `character varying` | YES |  |
| `ben_dob` | `character varying` | YES |  |
| `ben_age` | `smallint` | YES |  |
| `emp_appointment_files` | `text` | YES |  |
| `emp_start_date` | `date` | YES |  |
| `identity_card_details` | `text` | YES |  |
| `ben_address_psnt` | `text` | YES |  |
| `ben_address_prmt` | `text` | YES |  |
| `ben_mobile_no` | `character varying` | YES |  |
| `ben_email` | `character varying` | YES |  |
| `profile_pics` | `character varying` | YES |  |
| `ben_notes` | `text` | YES |  |
| `status` | `boolean` | YES |  |
| `ben_middle` | `character varying` | YES |  |
| `emp_aprvl_dt` | `date` | YES |  |
| `unq_man_num` | `character varying` | YES |  |
| `prst_pin` | `bigint` | YES |  |
| `prmt_pin` | `bigint` | YES |  |
| `prop_ref_cd` | `character varying` | YES |  |
| `ben_state_lgd` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |
| `mine_cd` | `character varying` | YES |  |
| `proj_cd` | `character varying` | YES |  |
| `guardian` | `character varying` | YES |  |
| `guardian_salutation` | `character varying` | YES |  |
| `emp_guardian_fname` | `character varying` | YES |  |
| `emp_guardian_mname` | `character varying` | YES |  |
| `emp_guardian_lname` | `character varying` | YES |  |
| `emp_salutation` | `character varying` | YES |  |
| `caste_proof` | `text` | YES |  |
| `ben_dist_cd` | `bigint` | YES |  |
| `ben_block_cd` | `character varying` | YES |  |
| `ben_ps_cd` | `bigint` | YES |  |
| `ben_mouza_cd` | `character varying` | YES |  |
| `reference_file_no` | `character varying` | YES |  |
| `prst_po` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `ben_id` | `bigint` | NO | ✅ |
| `benf_code` | `character varying` | YES |  |
| `owner_code` | `character varying` | YES |  |
| `ben_marital_status` | `character varying` | YES |  |
| `if_emp_name` | `character varying` | YES |  |
| `if_emp_designation` | `character varying` | YES |  |
| `if_emp_ein` | `character varying` | YES |  |
| `if_emp_place` | `text` | YES |  |
| `nationality` | `character varying` | YES |  |
| `religion` | `character varying` | YES |  |
| `occupation` | `text` | YES |  |
| `edu_qual` | `text` | YES |  |
| `edu_tech` | `text` | YES |  |
| `nominee_status` | `integer` | YES |  |
| `total_proposed_emp_land` | `real` | YES |  |
| `username` | `character varying` | YES |  |
| `pan_no` | `character varying` | YES |  |
| `reg_token` | `character varying` | YES |  |

---

### Table: `emp_to_owner_land_history`
**Purpose**: Stores data related to emp_to_owner_land_history.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `share_id` | `bigint` | NO |  |
| `owner_details` | `jsonb` | YES |  |
| `owner_share_emp` | `jsonb` | YES |  |
| `total_land` | `double precision` | YES |  |
| `created_at` | `date` | YES |  |
| `updated_at` | `date` | YES |  |
| `emp_code` | `character varying` | YES |  |
| `owner_code` | `character varying` | YES |  |
| `relationship` | `character varying` | YES |  |
| `documents` | `jsonb` | YES |  |
| `owner_remarks` | `text` | YES |  |
| `khatn_id` | `character varying` | YES |  |
| `is_miss` | `boolean` | YES |  |
| `update_remarks` | `text` | YES |  |
| `updated_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `declaration_file` | `bytea` | YES |  |
| `rel_file` | `bytea` | YES |  |

---

## Schema: `rr`

This schema encapsulates the tables related to the rr domain of the application.

### Table: `asset_ben`
**Purpose**: Stores data related to asset_ben.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO | ✅ |
| `ast_nm` | `character varying` | NO |  |
| `inst_flg` | `boolean` | YES |  |
| `rate_amount` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `rr_benefits`
**Purpose**: Stores data related to rr_benefits.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `id` | `bigint` | NO |  |
| `ben_cd` | `character varying` | NO | ✅ |
| `ben_name` | `character varying` | YES |  |
| `ben_desc` | `text` | YES |  |
| `acq_mode_id` | `smallint` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `is_allowance` | `boolean` | YES |  |
| `m_exclusive` | `boolean` | YES |  |
| `policy_assign` | `character varying` | YES |  |

---

### Table: `rr_other_alwnce_given`
**Purpose**: Stores data related to rr_other_alwnce_given.

**Foreign Key Relationships**:
- `ben_given_id` -> `rr.rr_ben_given (ben_given_id)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `alw_id` | `bigint` | NO | ✅ |
| `ben_given_id` | `bigint` | YES |  |
| `ben_cd` | `character varying` | YES |  |
| `benf_code` | `character varying` | YES |  |
| `ben_val` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `pay_ref_no` | `character varying` | YES |  |

---

### Table: `rr_pkg_prop`
**Purpose**: Stores data related to rr_pkg_prop.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pkg_id` | `bigint` | NO | ✅ |
| `pkg_cd` | `character varying` | YES |  |
| `proj_cd` | `text` | YES |  |
| `vill_lgd` | `text` | YES |  |
| `ast_ids` | `jsonb` | YES |  |
| `ben_cds` | `text` | YES |  |
| `status` | `integer` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `acq_mode_id` | `bigint` | YES |  |
| `ben_allowance` | `jsonb` | YES |  |
| `other_benefit` | `character varying` | YES |  |

---

### Table: `pap_det`
**Purpose**: Stores data related to pap_det.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `pap_id` | `bigint` | NO | ✅ |
| `owner_code` | `character varying` | YES |  |
| `paf_cd` | `character varying` | YES |  |
| `hof` | `integer` | YES |  |
| `pap_nm` | `character varying` | YES |  |
| `pap_fnm` | `character varying` | YES |  |
| `cast_id` | `bigint` | YES |  |
| `vill_lgd` | `bigint` | YES |  |
| `religion` | `character varying` | YES |  |
| `pap_id_no` | `character varying` | YES |  |
| `soc_servy` | `character varying` | YES |  |
| `lost_asst` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `rr_ben_given`
**Purpose**: Stores data related to rr_ben_given.

**Foreign Key Relationships**:
- `rr_prop_id` -> `rr.rr_prop (rr_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `ben_given_id` | `bigint` | NO | ✅ |
| `rr_prop_id` | `bigint` | YES |  |
| `benf_code` | `character varying` | YES |  |
| `vill_lgd` | `bigint` | YES |  |
| `rr_site_id` | `bigint` | YES |  |
| `paf_no` | `character varying` | YES |  |
| `house_no` | `character varying` | YES |  |
| `is_soc_servy` | `boolean` | YES |  |
| `comp_prop_id` | `bigint` | YES |  |
| `rr_type` | `character varying` | YES |  |
| `rr_aprv_ref` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `is_emp` | `boolean` | YES |  |
| `emp_type` | `character varying` | YES |  |
| `is_asst_comp_paid` | `boolean` | YES |  |
| `is_other_alwnce_paid` | `boolean` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `khtn_id` | `character varying` | YES |  |
| `rr_ast_date` | `date` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `rr_other_date` | `date` | YES |  |
| `emp_aprv_dt` | `date` | YES |  |
| `emp_amt_paid` | `character varying` | YES |  |
| `emp_payment_date` | `date` | YES |  |
| `emp_ref_no` | `character varying` | YES |  |
| `patta_doc` | `bytea` | YES |  |

---

### Table: `rr_other_alwnce`
**Purpose**: Stores data related to rr_other_alwnce.

**Foreign Key Relationships**:
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `rr_prop_id` -> `rr.rr_prop (rr_prop_id)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`
- `ben_cd` -> `rr.rr_benefits (ben_cd)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `alw_id` | `bigint` | NO | ✅ |
| `rr_prop_id` | `bigint` | YES |  |
| `ben_cd` | `character varying` | YES |  |
| `benf_code` | `character varying` | YES |  |
| `ben_val` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `ben_sanc` | `numeric` | YES |  |
| `rr_pyrl_id` | `bigint` | YES |  |

---

### Table: `rr_pyrl`
**Purpose**: Stores data related to rr_pyrl.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `rr_pyrl_id` | `bigint` | NO | ✅ |
| `rr_prop_id` | `bigint` | NO |  |
| `khtn_id` | `character varying` | NO |  |
| `plot_no` | `character varying` | NO |  |
| `khtn_det_id` | `bigint` | YES |  |
| `benf_code` | `character varying` | NO |  |
| `sub_tot` | `numeric` | YES |  |
| `solacium` | `numeric` | NO |  |
| `tot_amt_sanc` | `numeric` | NO |  |
| `benefit_given` | `character varying` | YES |  |
| `entry_by` | `character varying` | NO |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | NO |  |
| `updt_ts` | `bigint` | NO |  |
| `del_ts` | `bigint` | YES |  |
| `emp_given` | `character varying` | YES |  |

---

### Table: `rr_prop`
**Purpose**: Stores data related to rr_prop.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `rr_prop_id` | `bigint` | NO | ✅ |
| `proj_cd` | `character varying` | YES |  |
| `prop_cd` | `character varying` | NO |  |
| `rr_sett_tm` | `bigint` | YES |  |
| `ben_policy` | `character varying` | YES |  |
| `vill_lgd` | `bigint` | YES |  |
| `dis_per_no` | `character varying` | YES |  |
| `prop_stat` | `bigint` | YES |  |
| `rr_stat` | `bigint` | YES |  |
| `cap_inv` | `character varying` | YES |  |
| `rr_type` | `character varying` | YES |  |
| `rr_aprv_ref` | `character varying` | YES |  |
| `rr_site_cd` | `bigint` | YES |  |
| `ben_cds` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `pap_id` | `text` | YES |  |
| `possr_id` | `text` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `pkg_id` | `bigint` | YES |  |
| `poss_prop_id` | `jsonb` | YES |  |
| `prop_dt` | `date` | YES |  |
| `cap_rr` | `numeric` | YES |  |
| `avb_cap` | `numeric` | YES |  |
| `proposed_cost` | `numeric` | YES |  |
| `sor` | `character varying` | YES |  |

---

## Schema: `compensation`

This schema encapsulates the tables related to the compensation domain of the application.

### Table: `comp_prop`
**Purpose**: Stores Compensation Payroll Batches (M4 Module) routing through Area/HQ/CMD workflows.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `comp_prop_id` | `bigint` | NO | ✅ |
| `comp_proposal_cd` | `character varying` | NO |  |
| `proj_cd` | `character varying` | YES |  |
| `phase_id` | `jsonb` | YES |  |
| `tot_estm_comp` | `character varying` | YES |  |
| `tot_comp` | `character varying` | YES |  |
| `comp_on_emp` | `character varying` | YES |  |
| `land_area_used` | `numeric` | YES |  |
| `demographic_servey_no` | `character varying` | YES |  |
| `demographic_servey_date` | `date` | YES |  |
| `demographic_report` | `character varying` | YES |  |
| `status_cd` | `character varying` | YES |  |
| `remarks` | `text` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `comp_type` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `poss_prop_id` | `jsonb` | YES |  |
| `tot_aprv_area` | `numeric` | YES |  |
| `apv_dt` | `date` | YES |  |
| `apv_ref_no` | `character varying` | YES |  |
| `pkg_ids` | `bigint` | YES |  |
| `cap_rr` | `numeric` | YES |  |
| `avb_cap` | `numeric` | YES |  |
| `proposed_cost` | `numeric` | YES |  |
| `sor` | `character varying` | YES |  |

---

### Table: `comp_pyrl`
**Purpose**: Stores individual payroll lines (payees, land value, solatium, escalation) generated by the Math Engine.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `comp_pyrl_id` | `bigint` | NO | ✅ |
| `comp_pyrl_cd` | `character varying` | YES |  |
| `comp_prop_id` | `bigint` | NO |  |
| `khtn_id` | `character varying` | NO |  |
| `plot_no` | `character varying` | NO |  |
| `pos_acq_id` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `rate_pr_acr` | `character varying` | NO |  |
| `share_ate` | `numeric` | NO |  |
| `tot_area` | `character varying` | YES |  |
| `val_share_area` | `numeric` | YES |  |
| `tot_amount` | `numeric` | YES |  |
| `owner_code` | `character varying` | NO |  |
| `owner_share_area` | `numeric` | YES |  |
| `tot_est_mk_pr` | `numeric` | NO |  |
| `mf_fc` | `numeric` | NO |  |
| `tot_est_mk_pr_fc` | `numeric` | NO |  |
| `enhnc_per` | `numeric` | NO |  |
| `hus_str_amt` | `numeric` | YES |  |
| `tree_str_amt` | `numeric` | YES |  |
| `bore_str_amt` | `numeric` | YES |  |
| `sub_tot` | `numeric` | YES |  |
| `solacium` | `numeric` | NO |  |
| `total_cost` | `numeric` | NO |  |
| `remarks` | `text` | YES |  |
| `entry_by` | `character varying` | NO |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | NO |  |
| `updt_ts` | `bigint` | NO |  |
| `del_ts` | `bigint` | YES |  |
| `benefit_given` | `character varying` | YES |  |

---

### Table: `khtn_wise_land_comp`
**Purpose**: Stores data related to khtn_wise_land_comp.

**Foreign Key Relationships**:
- `comp_prop_id` -> `compensation.comp_prop (comp_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `land_comp_id` | `bigint` | NO | ✅ |
| `comp_prop_id` | `bigint` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `khtn_id` | `character varying` | YES |  |
| `paf_choice` | `integer` | YES |  |
| `comp_on_emp` | `character varying` | YES |  |
| `land_area_used` | `numeric` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `land_comp_sanc_ref` | `bigint` | YES |  |
| `benf_code` | `character varying` | YES |  |

---

### Table: `land_comp_sanc`
**Purpose**: Stores data related to land_comp_sanc.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `land_comp_sanc_ref` | `bigint` | NO | ✅ |
| `sanc_amt` | `character varying` | NO |  |
| `sanc_ref_no` | `character varying` | YES |  |
| `sanc_dt` | `date` | YES |  |
| `land_comp_paid` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `comp_given_legacy`
**Purpose**: Stores data related to comp_given_legacy.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `given_id` | `bigint` | NO | ✅ |
| `benf_name` | `character varying` | NO |  |
| `benf_father_name` | `character varying` | YES |  |
| `id_type` | `character varying` | YES |  |
| `id_no` | `character varying` | YES |  |
| `gender` | `character varying` | YES |  |
| `dob` | `date` | YES |  |
| `plot_no` | `character varying` | YES |  |
| `khatian_no` | `character varying` | YES |  |
| `state_lgd` | `bigint` | YES |  |
| `district_lgd` | `bigint` | YES |  |
| `block_lgd` | `bigint` | YES |  |
| `mouza_lgd` | `bigint` | YES |  |
| `plot_type` | `character varying` | YES |  |
| `plot_number` | `character varying` | YES |  |
| `bata_number` | `character varying` | YES |  |
| `plot_req` | `character varying` | YES |  |
| `village` | `character varying` | YES |  |
| `aprv_ref_no` | `character varying` | YES |  |
| `aprv_date` | `date` | YES |  |
| `is_land_avail` | `boolean` | YES |  |
| `is_legacy` | `boolean` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

### Table: `khtn_wise_ast_comp`
**Purpose**: Stores data related to khtn_wise_ast_comp.

**Foreign Key Relationships**:
- `comp_prop_id` -> `compensation.comp_prop (comp_prop_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `ast_com_id` | `bigint` | NO | ✅ |
| `comp_prop_id` | `bigint` | YES |  |
| `rr_prop_id` | `bigint` | YES |  |
| `phase_id` | `bigint` | YES |  |
| `khtn_id` | `character varying` | YES |  |
| `comp_amt` | `character varying` | YES |  |
| `comp_given` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `khtn_det_id` | `bigint` | YES |  |
| `ast_nm` | `bigint` | YES |  |
| `benf_code` | `character varying` | YES |  |
| `ben_given_id` | `bigint` | YES |  |
| `ast_count` | `bigint` | YES |  |
| `rr_pyrl_id` | `bigint` | YES |  |
| `land_comp_id` | `bigint` | YES |  |

---

### Table: `comp_payment`
**Purpose**: Stores data related to comp_payment.

**Foreign Key Relationships**:
- `land_comp_sanc_ref` -> `compensation.land_comp_sanc (land_comp_sanc_ref)`
- `ast_com_id` -> `compensation.khtn_wise_ast_comp (ast_com_id)`

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `com_payment_id` | `bigint` | NO | ✅ |
| `land_comp_sanc_ref` | `bigint` | YES |  |
| `ast_com_id` | `bigint` | YES |  |
| `amt_paid` | `character varying` | YES |  |
| `pay_mode` | `character varying` | YES |  |
| `pay_ref_no` | `character varying` | YES |  |
| `payment_reference_doc` | `text` | YES |  |
| `claim_id` | `bigint` | YES |  |
| `benf_code` | `character varying` | NO |  |
| `status_cd` | `character varying` | YES |  |
| `pay_dt` | `date` | YES |  |
| `ifsc_cd` | `character varying` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |
| `area_cd` | `character varying` | YES |  |

---

### Table: `legacy_comp`
**Purpose**: Stores data related to legacy_comp.

| Column Name | Data Type | Nullable | Primary Key |
|-------------|-----------|----------|-------------|
| `ast_com_id` | `bigint` | NO | ✅ |
| `given_id` | `bigint` | YES |  |
| `ast_nm` | `bigint` | YES |  |
| `benf_code` | `character varying` | YES |  |
| `comp_amt` | `character varying` | YES |  |
| `comp_given` | `character varying` | YES |  |
| `ben_cd` | `character varying` | YES |  |
| `pay_ref` | `character varying` | YES |  |
| `bank_ifsc` | `character varying` | YES |  |
| `pay_date` | `date` | YES |  |
| `house_no` | `character varying` | YES |  |
| `remark` | `text` | YES |  |
| `entry_by` | `character varying` | YES |  |
| `updt_by` | `character varying` | YES |  |
| `entry_ts` | `bigint` | YES |  |
| `updt_ts` | `bigint` | YES |  |
| `del_ts` | `bigint` | YES |  |

---

