export interface IProjectMaster {
  id: string;
  name: string;
  collieryCode: string;
  totalLandLimitAcres: string; // Stored as Decimal, passed as string
  totalBudgetCeiling: string;
  totalEmploymentQuota: number;
  boundary: string;
  statutoryClearances: string | null;
  isLocked: boolean;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectMasterCreateDTO {
  name: string;
  collieryCode: string;
  totalLandLimitAcres: string;
  totalBudgetCeiling: string;
  totalEmploymentQuota: number;
  boundary?: string;
}

export interface IProjectMasterUpdateDTO extends Partial<IProjectMasterCreateDTO> {
  statutoryClearances?: string | null;
}
