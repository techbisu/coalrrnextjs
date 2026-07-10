/**
 * Result Pattern - Functional error handling without exceptions.
 * Used throughout the domain layer to return success/failure states.
 */
export type Result<T, E = string> = SuccessResult<T> | FailureResult<T, E>

export interface SuccessResult<T> {
  isSuccess: true
  isFailure: false
  value: T
  error: null
}

export interface FailureResult<T, E> {
  isSuccess: false
  isFailure: true
  value: null
  error: E
}

export class ResultFactory {
  static ok<T>(value: T): SuccessResult<T> {
    return {
      isSuccess: true,
      isFailure: false,
      value,
      error: null,
    }
  }

  static fail<T = unknown, E = string>(error: E): FailureResult<T, E> {
    return {
      isSuccess: false,
      isFailure: true,
      value: null,
      error,
    }
  }

  static combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const failures = results.filter(r => r.isFailure)
    if (failures.length > 0) {
      return ResultFactory.fail<T[], E>((failures[0] as FailureResult<T, E>).error)
    }
    return ResultFactory.ok<T[]>(results.map(r => (r as SuccessResult<T>).value))
  }
}

// Convenience exports
export const Ok = ResultFactory.ok
export const Fail = ResultFactory.fail
export const Result = ResultFactory
