import { db } from '@/lib/db'

export class RecipientResolver {
  /**
   * Resolves a recipient rule into a list of contacts.
   * e.g. "Role:unit_office" -> [{ id: "123", email: "unit@ecl.com", phone: "99999", inAppId: "123" }]
   */
  public static async resolve(resolverString: string, payload: Record<string, any>): Promise<Array<{ id: string; email?: string; phone?: string }>> {
    const [type, value] = resolverString.split(':')
    
    if (type === 'SpecificUser') {
      const user = await db.user.findUnique({ where: { id: value } })
      if (!user) return []
      return [{ id: user.id, email: user.email ?? undefined, phone: user.mobile ?? undefined }]
    }

    if (type === 'Role') {
      const users = await db.user.findMany({ where: { role: value } })
      return users.map(user => ({ id: user.id, email: user.email ?? undefined, phone: user.mobile ?? undefined }))
    }

    if (type === 'EventUser' && payload.userId) {
      const user = await db.user.findUnique({ where: { id: payload.userId } })
      if (!user) return []
      return [{ id: user.id, email: user.email ?? undefined, phone: user.mobile ?? undefined }]
    }

    // By default, just return empty
    return []
  }
}
