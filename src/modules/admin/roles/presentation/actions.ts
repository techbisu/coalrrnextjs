'use server'

import { revalidatePath } from 'next/cache'
import {
  createAdminRoleUseCase,
  updateAdminRoleUseCase,
  deleteAdminRoleUseCase,
  createAdminPermissionUseCase,
  updateAdminPermissionUseCase,
  deleteAdminPermissionUseCase
} from '@/infrastructure/di/Container'
import { getCurrentUser } from '@/lib/auth'
import { role, permission } from '@prisma/client'

import { authorize } from '@/core/authorization/middleware/authorize'
import { roleSchema, updateRoleSchema } from '@/core/validation/schemas/role.schema'
import { permissionSchema, updatePermissionSchema } from '@/core/validation/schemas/permission.schema'

// --- Roles ---

export async function createRoleAction(data: { name: string, display_name: string, guard_name?: string, description?: string, is_system?: boolean }): Promise<{ data?: role, error?: string }> {
  try {
    await authorize('admin.roles.create')
    const user = await getCurrentUser()
    const validData = roleSchema.parse(data)

    const result = await createAdminRoleUseCase.execute(validData, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateRoleAction(id: string, data: { name?: string, display_name?: string, description?: string }): Promise<{ data?: role, error?: string }> {
  try {
    await authorize('admin.roles.update')
    const user = await getCurrentUser()
    const validData = updateRoleSchema.parse(data)

    const result = await updateAdminRoleUseCase.execute({ id, ...validData }, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteRoleAction(id: string): Promise<{ success?: boolean, error?: string }> {
  try {
    await authorize('admin.roles.delete')
    const user = await getCurrentUser()

    const result = await deleteAdminRoleUseCase.execute(id, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { success: true }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

// --- Permissions ---

export async function createPermissionAction(data: { name: string, display_name: string, guard_name?: string, module?: string, group?: string, description?: string }): Promise<{ data?: permission, error?: string }> {
  try {
    await authorize('admin.permissions.create')
    const user = await getCurrentUser()
    const validData = permissionSchema.parse(data)

    const result = await createAdminPermissionUseCase.execute(validData, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updatePermissionAction(id: string, data: { name?: string, display_name?: string, module?: string, group?: string, description?: string }): Promise<{ data?: permission, error?: string }> {
  try {
    await authorize('admin.permissions.update')
    const user = await getCurrentUser()
    const validData = updatePermissionSchema.parse(data)

    const result = await updateAdminPermissionUseCase.execute({ id, ...validData }, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { data: result.value }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deletePermissionAction(id: string): Promise<{ success?: boolean, error?: string }> {
  try {
    await authorize('admin.permissions.delete')
    const user = await getCurrentUser()

    const result = await deleteAdminPermissionUseCase.execute(id, { user: user! })
    if (result.isSuccess) {
      revalidatePath('/admin/roles')
      return { success: true }
    }
    return { error: String(result.error) }
  } catch (error: any) {
    return { error: error.message }
  }
}
