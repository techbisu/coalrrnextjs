/**
 * Not Found Exception - Raised when an entity is not found.
 */
import { DomainException } from './DomainException'

export class NotFoundException extends DomainException {
  public readonly entity_name: string
  public readonly identifier: string

  constructor(entity_name: string, identifier: string) {
    super(`${entity_name} with identifier '${identifier}' not found`, 'NOT_FOUND')
    this.entity_name = entity_name
    this.identifier = identifier
  }
}
