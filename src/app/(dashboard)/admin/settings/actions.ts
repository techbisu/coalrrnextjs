'use server'

import { updateSystemConfigUseCase } from '@/infrastructure/di/Container'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { revalidatePath } from 'next/cache'

export async function updateSettings(data: { key: string, value: string }[]) {
  const auth = await authorizeApi('project.view')
  if (auth.error) throw new Error('Unauthorized')

  const res = await updateSystemConfigUseCase.execute({ inputs: data, user_id: auth.user.id })
  if (!res.isSuccess) throw new Error(res.error)

  revalidatePath('/admin/settings')
  return { success: true }
}
