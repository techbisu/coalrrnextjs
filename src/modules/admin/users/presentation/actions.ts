'use server'

import { 
  getAdminUsersUseCase, 
  createAdminUserUseCase, 
  updateAdminUserUseCase, 
  deleteAdminUserUseCase 
} from '@/infrastructure/di/Container'
import { getCurrentUser } from '@/lib/auth'
import { user } from '@prisma/client'
import { db } from '@/lib/db'
import { authorize } from '@/core/authorization/middleware/authorize'
import { userSchema, updateUserSchema } from '@/core/validation/schemas/user.schema'

export async function fetchUsersAction(): Promise<{ data?: user[], error?: string }> {
  try {
    await authorize('admin.users.view')
    
    const result = await getAdminUsersUseCase.execute()
    if (result.isSuccess) {
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createUserAction(data: any): Promise<{ data?: user, error?: string }> {
  try {
    await authorize('admin.users.create')
    const currentUser = await getCurrentUser()
    const validData = userSchema.parse(data)

    const result = await createAdminUserUseCase.execute({
      portal: validData.portal,
      role: validData.role,
      name: validData.name,
      email: validData.email || undefined,
      mobile: validData.mobile || undefined,
      designation: validData.designation || undefined,
      mine_cd: data.mine_cd, // keep this as is if not in schema yet
      action_by: currentUser!.id.toString()
    })

    if (result.isSuccess) {
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateUserAction(id: string, data: any): Promise<{ data?: user, error?: string }> {
  try {
    await authorize('admin.users.update')
    const currentUser = await getCurrentUser()
    const validData = updateUserSchema.parse(data)

    const result = await updateAdminUserUseCase.execute({
      id,
      ...validData,
      action_by: currentUser!.id
    })

    if (result.isSuccess) {
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteUserAction(id: string): Promise<{ success?: boolean, error?: string }> {
  try {
    await authorize('admin.users.delete')
    const currentUser = await getCurrentUser()

    const result = await deleteAdminUserUseCase.execute({
      id,
      action_by: currentUser!.id
    })

    if (result.isSuccess) {
      return { success: true }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function toggleUserStatusAction(
  userId: string, 
  data: { is_active?: boolean; approve?: boolean }
): Promise<{ success?: boolean, error?: string }> {
  try {
    await authorize('admin.users.update')
    const currentUser = await getCurrentUser()

    const updateData: any = { updt_ts: new Date(), updt_by: currentUser!.id }
    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active
    }
    if (data.approve === true) {
      updateData.verified_at = new Date()
    }
    
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) throw new Error("Invalid user ID");
    
    await db.user.update({
      where: { id: numericId },
      data: updateData
    })
    
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
