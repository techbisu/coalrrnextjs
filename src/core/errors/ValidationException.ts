/**\n * Validation Exception - Raised when business rules are violated.\n */
import { DomainException } from './DomainException'

export class ValidationException extends DomainException {
  public readonly errors: Array<{ field: string; message: string }>

  constructor(message: string, errors: Array<{ field: string; message: string }> = []) {
    super(message, 'VALIDATION_ERROR')
    this.errors = errors
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}