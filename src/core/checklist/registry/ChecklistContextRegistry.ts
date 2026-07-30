import { IChecklistContextResolver } from '../interfaces/IChecklistContextResolver';

export class ChecklistContextRegistry {
  private resolvers = new Map<string, IChecklistContextResolver>();

  register(moduleCode: string, resolver: IChecklistContextResolver) {
    this.resolvers.set(moduleCode, resolver);
  }

  getResolver(moduleCode: string): IChecklistContextResolver {
    const resolver = this.resolvers.get(moduleCode);
    if (!resolver) {
      throw new Error(`No ChecklistContextResolver registered for module: ${moduleCode}`);
    }
    return resolver;
  }
}
