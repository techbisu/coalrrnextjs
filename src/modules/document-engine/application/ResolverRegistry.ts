import { IDocumentResolver } from '../domain/IDocumentResolver'
import { FormIResolver } from './resolvers/FormIResolver'
import { FormXXIIResolver } from './resolvers/FormXXIIResolver'

export class ResolverRegistry {
  private resolvers: Map<string, IDocumentResolver> = new Map()

  constructor() {
    this.resolvers.set('FORM_I', new FormIResolver())
    this.resolvers.set('FORM_XXII', new FormXXIIResolver())
    // Add other resolvers here
  }

  getResolver(templateCode: string): IDocumentResolver {
    const resolver = this.resolvers.get(templateCode)
    if (!resolver) {
      throw new Error(`No resolver found for template code: ${templateCode}`)
    }
    return resolver
  }
}
