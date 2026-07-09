/**
 * Not Found Exception - Raised when an entity is not found.
 */
import { DomainException } from './DomainException'

export class NotFoundException extends DomainException {
  public readonly entityName: string
  public readonly identifier: string

  constructor(entityName: string, identifier: string) {
    super(`${entityName} with identifier '${identifier}' not found`, 'NOT_FOUND')
    this.entityName = entityName
    this.identifier = identifier
  }
}
