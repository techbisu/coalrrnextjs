export interface IRole {
  id: string
  name: string
  displayName: string | null
  description: string | null
  guardName: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPermission {
  id: string
  name: string
  displayName: string | null
  description: string | null
  module: string | null
  group: string | null
  guardName: string
  createdAt: Date
  updatedAt: Date
}

export interface CachedPermissions {
  roles: string[]
  permissions: string[]
}

export interface IAuthorizationContext {
  userId?: string
  userRoles?: string[]
  userPermissions?: string[]
}

export interface IPolicy {
  [action: string]: (user: any, entity: any, ...args: any[]) => Promise<boolean> | boolean
}

export type AuthorizationResult = {
  authorized: boolean
  reason?: string
}
