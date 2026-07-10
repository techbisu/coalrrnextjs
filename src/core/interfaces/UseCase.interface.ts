/**\n * Use Case Interface - Contract for application service operations.
 * Each use case represents a single business operation.
 */
import { Result } from '../result/Result'

export interface IUseCase<TRequest, TResponse, E = any> {
  execute(request: TRequest): Promise<Result<TResponse, E>>
}

export interface ICommand<T> {
  readonly type: string
  readonly payload: T
}

export interface IQuery<T> {
  readonly type: string
  readonly params: T
}
