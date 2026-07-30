export interface IChecklistRepository {
  findRulesByModule(moduleCode: string): Promise<any[]>;
  findSubmissions(checkableType: string, checkableId: string): Promise<any[]>;
  findSubmission(requirementId: string, checkableType: string, checkableId: string): Promise<any>;
  upsertSubmission(data: any): Promise<any>;
}
