import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'

export class FormXIIIResolver implements IDocumentResolver {
  async resolve(
    applicationId: string,
    context?: Record<string, any>
  ): Promise<DocumentResolverResult> {
    return {
      fields: {},
      tables: {},
    }
  }
}