import { Entity } from '@/core/base/Entity'
import { Result, Fail, Ok } from '@/core/result/Result'
import { randomUUID } from 'crypto'

export interface ActivityLogProps {
  id: string
  activity: string
  tableName?: string | null
  actionBy?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  applicationLogId?: string | null
  entryTs: Date
  updtTs: Date
}

export interface CreateActivityLogProps {
  activity: string
  tableName?: string | null
  actionBy?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  applicationLogId?: string | null
}

export class ActivityLog extends Entity<string> {
  private props: ActivityLogProps

  private constructor(props: ActivityLogProps) {
    super(props.id)
    this.props = props
  }

  static create(props: CreateActivityLogProps): Result<ActivityLog> {
    if (!props.activity || props.activity.trim().length === 0) {
      return Fail('Activity description is required')
    }

    const now = new Date()
    const log = new ActivityLog({
      id: randomUUID(),
      activity: props.activity.trim(),
      tableName: props.tableName || null,
      actionBy: props.actionBy || null,
      ipAddress: props.ipAddress || null,
      userAgent: props.userAgent || null,
      applicationLogId: props.applicationLogId || null,
      entryTs: now,
      updtTs: now,
    })

    return Ok(log)
  }

  static reconstitute(props: ActivityLogProps): ActivityLog {
    return new ActivityLog(props)
  }

  get activity(): string { return this.props.activity }
  get tableName(): string | null { return this.props.tableName || null }
  get actionBy(): string | null { return this.props.actionBy || null }
  get ipAddress(): string | null { return this.props.ipAddress || null }
  get userAgent(): string | null { return this.props.userAgent || null }
  get applicationLogId(): string | null { return this.props.applicationLogId || null }
  get entryTs(): Date { return this.props.entryTs }
  get updtTs(): Date { return this.props.updtTs }

  toPersistence() {
    return {
      id: this.id,
      activity: this.props.activity,
      table_name: this.props.tableName,
      action_by: this.props.actionBy,
      ip_address: this.props.ipAddress,
      user_agent: this.props.userAgent,
      application_log_id: this.props.applicationLogId,
      entry_ts: this.props.entryTs,
      updt_ts: this.props.updtTs,
    }
  }
}
