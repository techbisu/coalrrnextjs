/**
 * Base Domain Exception class.
 * All domain-specific exceptions should extend this class.
 */
export abstract class DomainException extends Error {
  public readonly code: string
  public readonly timestamp: Date

  constructor(message: string, code: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.timestamp = new Date()
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    }
  }
}
