import { IDocumentResolver } from '../domain/IDocumentResolver'
import { FormIResolver } from './resolvers/FormIResolver'
import { FormIIResolver } from './resolvers/FormIIResolver'
import { FormXXIIResolver } from './resolvers/FormXXIIResolver'
import { FormVIIResolver } from './resolvers/FormVIIResolver'
import { IDocumentQueryService } from './queries/IDocumentQueryService'

export class ResolverRegistry {
  private resolvers: Map<string, IDocumentResolver> = new Map()
  private queryService: IDocumentQueryService | null = null

  constructor(queryService?: IDocumentQueryService) {
    this.queryService = queryService || null

    this.resolvers.set('FORM_I', new FormIResolver())
    this.resolvers.set('FORM_II', new FormIIResolver())
    if (this.queryService) {
      this.resolvers.set('FORM_XXII', new FormXXIIResolver(this.queryService))
      this.resolvers.set('FORM_VII', new FormVIIResolver(this.queryService))
    } else {
      this.resolvers.set('FORM_XXII', new FormXXIIResolver())
      this.resolvers.set('FORM_VII', new FormVIIResolver())
    }
    // Add other resolvers here
  }

  getResolver(templateCode: string): IDocumentResolver {
    switch (templateCode) {
      case 'FORM_I':
        return new FormIResolver()
      case 'FORM_II':
        return new FormIIResolver()
      case 'FORM_XXII':
        return this.queryService ? new FormXXIIResolver(this.queryService) : new FormXXIIResolver()
      case 'FORM_VII':
        return this.queryService ? new FormVIIResolver(this.queryService) : new FormVIIResolver()
      default:
        const resolver = this.resolvers.get(templateCode)
        if (!resolver) {
          return this.queryService ? new FormVIIResolver(this.queryService) : new FormVIIResolver()
        }
        return resolver
    }
  }
}
