export interface ChecklistContext {
  entityVersion: number;
  contextVersion: number;
  calculatedAt: Date;
  isStale: boolean;
  data: Record<string, unknown>;
}

export interface IChecklistContextProvider {
  supports(contextType: string): boolean;
  resolveContext(entityId: string): Promise<ChecklistContext>;
}
