export interface IProjectMaster {
  id: string;
  name: string;
  mine_cd: string | null;
  area_cd: string | null;
  state_lgd: bigint | null;
  pr_doc_id: string | null;
  total_land_limit_acres: string; // Stored as Decimal, passed as string
  total_budget_ceiling: string;
  total_employment_quota: number;
  boundary: string;
  statutory_clearances: string | null;
  isLocked: boolean;
  locked_at: Date | null;
  entry_ts: Date;
  updt_ts: Date;
}

export interface IProjectMasterCreateDTO {
  name: string;
  mine_cd?: string;
  area_cd?: string;
  state_lgd?: bigint;
  pr_doc_id?: string;
  mouza_lgds?: bigint[];
  total_land_limit_acres: string;
  total_budget_ceiling: string;
  total_employment_quota: number;
  boundary?: string;
}

export interface IProjectMasterUpdateDTO extends Partial<IProjectMasterCreateDTO> {
  statutory_clearances?: string | null;
}
