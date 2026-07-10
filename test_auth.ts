import { authService } from './src/infrastructure/di/Container'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function test() {
  const users = await db.user.findMany()
  for (const user of users) {
    const hasProjectView = await authService.can(user.id, 'project.view')
    const roles = await authService.getUserRoles(user.id)
    const perms = await authService.getUserPermissions(user.id)
    console.log(`User: ${user.email} | Roles: ${roles.join(', ')} | project.view: ${hasProjectView}`)
    console.log(`  Perms: ${perms.join(', ')}`)
  }
}

test().catch(console.error).finally(() => db.$disconnect())
