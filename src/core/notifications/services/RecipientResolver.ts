import { NotificationConfig } from '../NotificationConfig'

export class RecipientResolver {
  /**
   * Resolves a recipient rule into a list of contacts.
   * e.g. "role:unit_office" -> [{ id: "123", email: "unit@ecl.com", phone: "99999", inAppId: "123" }]
   */
  public static async resolve(resolverString: string, payload: Record<string, any>): Promise<Array<{ id: string; email?: string; phone?: string }>> {
    const [type, value] = resolverString.split(':')
    
    if (type === 'SpecificUser') {
      const user = await NotificationConfig.storage.findUserContactInfo(value)
      if (!user) return []
      return [user]
    }

    if (type === 'role') {
      const users = await NotificationConfig.storage.findUsersByRole(value)
      return users
    }

    if (type === 'EventUser' && payload.user_id) {
      const user = await NotificationConfig.storage.findUserContactInfo(payload.user_id)
      if (!user) return []
      return [user]
    }

    // By default, just return empty
    return []
  }
}
