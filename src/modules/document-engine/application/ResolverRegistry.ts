import { IDocumentResolver } from '../domain/IDocumentResolver'
import { FormIResolver } from './resolvers/FormIResolver'
import { FormXXIIResolver } from './resolvers/FormXXIIResolver'
import { FormVIIResolver } from './resolvers/FormVIIResolver'
import { FormXVIResolver } from './resolvers/FormXVIResolver'
import { IDocumentQueryService } from './queries/IDocumentQueryService'

export class ResolverRegistry {
  private resolvers: Map<string, IDocumentResolver> = new Map()
  private queryService: IDocumentQueryService | null = null

  constructor(queryService?: IDocumentQueryService) {
    this.queryService = queryService || null

    this.resolvers.set('FORM_I', new FormIResolver())
    if (this.queryService) {
      this.resolvers.set('FORM_XXII', new FormXXIIResolver(this.queryService))
      this.resolvers.set('FORM_VII', new FormVIIResolver(this.queryService))
      this.resolvers.set('FORM_XVI', new FormXVIResolver(this.queryService))
    } else {
      this.resolvers.set('FORM_XXII', new FormXXIIResolver())
      this.resolvers.set('FORM_VII', new FormVIIResolver())
      this.resolvers.set('FORM_XVI', new FormXVIResolver())
    }
    // Add other resolvers here
  }

  getResolver(templateCode: string): IDocumentResolver {
    const resolver = this.resolvers.get(templateCode)
    if (!resolver) {
      // Fallback resolver for custom / unknown template codes
      return this.resolvers.get('FORM_VII') || (this.queryService ? new FormVIIResolver(this.queryService) : new FormVIIResolver())
    }
    return resolver
  }
}
