import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createHash } from 'crypto'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  designation: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
})

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ok({ error: 'Unauthorized' })

  try {
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, mobile: true,
        designation: true, role: true, portal: true, mine_cd: true,
        entry_ts: true,
      }
    })

    // Load active scope
    const activeScope = await db.user_org_scope.findFirst({
      where: { user_id: user.id, effective_to: null },
      include: {
        area: { select: { area_cd: true, area_en: true } },
        mine: { select: { mine_cd: true, mine_en: true } },
      },
      orderBy: { effective_from: 'desc' }
    })

    // Load assigned roles
    const assignedRoles = await db.model_has_role.findMany({
      where: { model_id: user.id, model_type: 'user' },
      include: { role: { select: { id: true, name: true, display_name: true } } }
    })

    return ok({
      user: fullUser,
      scope: activeScope,
      roles: assignedRoles.map(r => r.role),
    })
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return ok({ error: 'Unauthorized' })

  try {
    const body = await readJson(req)
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.format())

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: result.data.name,
        designation: result.data.designation || null,
        mobile: result.data.mobile || null,
        email: result.data.email || null,
        updt_ts: new Date(),
      },
      select: { id: true, name: true, email: true, mobile: true, designation: true }
    })

    return ok({ user: updated })
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser()
  if (!user) return ok({ error: 'Unauthorized' })

  try {
    const body = await readJson(req)
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.format())

    // Verify current password
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { password_hash: true } })
    if (!dbUser) return badRequest('User not found')

    const currentHash = hashPassword(result.data.current_password)
    if (dbUser.password_hash !== currentHash) {
      return badRequest('Current password is incorrect')
    }

    await db.user.update({
      where: { id: user.id },
      data: { password_hash: hashPassword(result.data.new_password), updt_ts: new Date() }
    })

    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
