import { PrismaClient } from '@prisma/client'
import { seedWorkflowTransitions } from './prisma/seed/workflow_transitions.seed.ts'

const prisma = new PrismaClient()

async function main() {
  await seedWorkflowTransitions(prisma)
}
main().catch(console.error).finally(() => prisma.$disconnect())
