import { Result, Ok, Fail } from '@/core/result/Result'

export interface SystemConfigProps {
  id: string
  category: string
  key: string
  value: string
  type: string
  description: string | null
  is_secret: boolean
  entry_ts: Date
  updt_ts: Date
}

export class SystemConfig {
  private constructor(public readonly props: SystemConfigProps) {}

  public static create(props: SystemConfigProps): Result<SystemConfig> {
    if (!props.key) return Fail('Key is required')
    if (!props.category) return Fail('Category is required')
    return Ok(new SystemConfig(props))
  }

  get id() { return this.props.id }
  get key() { return this.props.key }
  get value() { return this.props.value }
  get category() { return this.props.category }
  get type() { return this.props.type }
  get description() { return this.props.description }
  get is_secret() { return this.props.is_secret }

  public updateValue(value: string): Result<void> {
    // Basic validation depending on type
    if (this.props.type === 'number' && isNaN(Number(value))) {
      return Fail('Value must be a valid number')
    }
    if (this.props.type === 'boolean' && value !== 'true' && value !== 'false') {
      return Fail('Value must be true or false')
    }
    this.props.value = value
    this.props.updt_ts = new Date()
    return Ok(undefined as any)
  }
}
