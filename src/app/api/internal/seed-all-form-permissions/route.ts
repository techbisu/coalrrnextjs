import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sigRules = await db.document_template_signature.findMany()
    const seededPermissions: string[] = []

    for (const rule of sigRules) {
      const roleStr = rule.sig_permission ? rule.sig_permission.toLowerCase() : 'admin'
      const permCode = `${rule.template_code.toLowerCase()}.sign.${roleStr}`

      let perm = await db.permission.findFirst({
        where: { name: permCode }
      })

      if (!perm) {
        perm = await db.permission.create({
          data: {
            id: randomUUID(),
            name: permCode,
            module: 'document-engine',
            guard_name: 'web',
            updt_ts: new Date()
          }
        })
        seededPermissions.push(permCode)
      }

      // Ensure corresponding role exists in `role` table
      let role = await db.role.findFirst({ where: { name: roleStr } })
      if (!role) {
        role = await db.role.create({
          data: {
            id: randomUUID(),
            name: roleStr,
            guard_name: 'web',
            is_system: false,
            updt_ts: new Date()
          }
        })
      }

      // Link permission to role
      await db.role_has_permission.upsert({
        where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
        create: { role_id: role.id, permission_id: perm.id, updt_ts: new Date() },
        update: { updt_ts: new Date() }
      })

      // Link to Super Administrator
      const superAdminRole = await db.role.findFirst({ where: { name: 'Super Administrator' } })
      if (superAdminRole) {
        await db.role_has_permission.upsert({
          where: { role_id_permission_id: { role_id: superAdminRole.id, permission_id: perm.id } },
          create: { role_id: superAdminRole.id, permission_id: perm.id, updt_ts: new Date() },
          update: { updt_ts: new Date() }
        })
      }
    }

    return NextResponse.json({
      success: true,
      seededPermissionsCount: seededPermissions.length,
      totalRulesSeeded: sigRules.length
    })
  } catch (err: any) {
    console.error('Error seeding form permissions:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
