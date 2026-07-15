import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { ISystemConfigRepository } from '../../domain/repositories/ISystemConfigRepository'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'

export interface UpdateConfigInput {
  key: string
  value: string
}

export class UpdateSystemConfigUseCase implements IUseCase<{ inputs: UpdateConfigInput[], user_id: string }, void> {
  constructor(private readonly repo: ISystemConfigRepository) {}

  async execute(request: { inputs: UpdateConfigInput[], user_id: string }): Promise<Result<void>> {
    try {
      const changedKeys: string[] = []
      
      for (const input of request.inputs) {
        const config = await this.repo.findByKey(input.key)
        if (!config) continue // skip non-existent

        // if it's secret and value is '********', skip update
        if (config.is_secret && input.value === '********') continue

        const updateRes = config.updateValue(input.value)
        if (!updateRes.isSuccess) return Fail(updateRes.error!)
        
        await this.repo.save(config)
        changedKeys.push(input.key)
      }
      
      if (changedKeys.length > 0) {
        AuditQueue.push({
          event_type: 'UPDATE_SETTINGS',
          module_name: 'admin',
          entity_name: 'system_config',
          user_id: request.user_id,
          remarks: JSON.stringify({ keys: changedKeys })
        })

        EventBus.publish({
          event_name: 'SETTINGS_CHANGED',
          module: 'admin',
          user_id: request.user_id,
          data: { keys: changedKeys.join(', '), userName: request.user_id }
        })
      }

      return Ok(undefined as any)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
