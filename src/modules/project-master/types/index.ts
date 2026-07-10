export interface IProjectMaster {
  id: string;
  name: string;
  colliery_code: string;
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
  colliery_code: string;
  total_land_limit_acres: string;
  total_budget_ceiling: string;
  total_employment_quota: number;
  boundary?: string;
}

export interface IProjectMasterUpdateDTO extends Partial<IProjectMasterCreateDTO> {
  statutory_clearances?: string | null;
}
