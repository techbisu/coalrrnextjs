import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.mst_project.findMany({
    select: {
      id: true,
      name: true,
      state_lgd: true,
      area_cd: true,
      mine_cd: true
    }
  })
  
  console.log(JSON.stringify(projects, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
