export interface IRole {
  id: string
  name: string
  display_name: string | null
  description: string | null
  guard_name: string
  is_system: boolean
  entry_ts: Date
  updt_ts: Date
}

export interface IPermission {
  id: string
  name: string
  display_name: string | null
  description: string | null
  module: string | null
  group: string | null
  guard_name: string
  entry_ts: Date
  updt_ts: Date
}

export interface CachedPermissions {
  roles: string[]
  permissions: string[]
}

export interface IAuthorizationContext {
  user_id?: string
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
