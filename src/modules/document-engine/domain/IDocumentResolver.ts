export interface DocumentResolverResult {
  fields: Record<string, unknown>;
  tables: Record<string, any[]>;
  signatures?: any[];
}

export interface IDocumentResolver {
  resolve(applicationId: string, context?: Record<string, any>): Promise<DocumentResolverResult>;
}
