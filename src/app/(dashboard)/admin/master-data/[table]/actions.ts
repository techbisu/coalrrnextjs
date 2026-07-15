'use server'

import { createMasterDataUseCase, updateMasterDataUseCase } from '@/infrastructure/di/Container'
import { revalidatePath } from 'next/cache'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'

export async function createMasterRecord(modelName: string, data: any) {
  const auth = await authorizeApi('acquisition.edit')
  if (auth.error) throw new Error('Unauthorized')

  // Inject audit fields — entry_ts is BigInt (epoch ms), entry_by is user name/id
  const enrichedData = {
    ...data,
    entry_ts: BigInt(Date.now()),
    entry_by: auth.user.name ?? auth.user.id,
  }

  const result = await createMasterDataUseCase.execute(modelName, enrichedData)
  if (result.isSuccess) {
    AuditQueue.push({
      event_type: 'CREATE_MASTER_DATA',
      module_name: 'admin',
      entity_name: modelName,
      user_id: auth.user.id,
      remarks: JSON.stringify(data)
    })

    EventBus.publish({
      event_name: 'MASTER_DATA_UPDATED',
      module: 'admin',
      user_id: auth.user.id,
      data: { tableName: modelName, userName: auth.user.name }
    })

    revalidatePath(`/admin/master-data/${modelName}`)
    return { success: true }
  }
  return { success: false, error: result.error }
}

export async function updateMasterRecord(modelName: string, pkField: string, id: any, data: any) {
  const auth = await authorizeApi('acquisition.edit')
  if (auth.error) throw new Error('Unauthorized')

  // Inject update audit fields
  const enrichedData = {
    ...data,
    updt_ts: BigInt(Date.now()),
    updt_by: auth.user.name ?? auth.user.id,
  }

  const result = await updateMasterDataUseCase.execute(modelName, pkField, id, enrichedData)
  if (result.isSuccess) {
    AuditQueue.push({
      event_type: 'UPDATE_MASTER_DATA',
      module_name: 'admin',
      entity_name: modelName,
      entity_id: id,
      user_id: auth.user.id,
      remarks: JSON.stringify(data)
    })

    EventBus.publish({
      event_name: 'MASTER_DATA_UPDATED',
      module: 'admin',
      user_id: auth.user.id,
      data: { tableName: modelName, userName: auth.user.name }
    })

    revalidatePath(`/admin/master-data/${modelName}`)
    return { success: true }
  }
  return { success: false, error: result.error }
}
