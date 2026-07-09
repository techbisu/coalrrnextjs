/**
 * Unauthorized Exception - Raised when user lacks required permissions.
 */
import { DomainException } from './DomainException'

export class UnauthorizedException extends DomainException {
  public readonly permission?: string

  constructor(message: string = 'Unauthorized access', permission?: string) {
    super(message, 'UNAUTHORIZED')
    this.permission = permission
  }
}
