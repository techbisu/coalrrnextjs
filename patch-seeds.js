const fs = require('fs');
const path = require('path');
const dir = 'd:/coalrrnextjs/prisma/seed';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.seed.ts'));
for(const file of files) {
  // skip the ones I already fixed manually
  if (['mst_project.seed.ts', 'mst_plot.seed.ts', 'user.seed.ts', 'role.seed.ts', 'translations.seed.ts'].includes(file)) continue;

  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if(!content.includes('randomUUID')) {
    content = content.replace(/import type { PrismaClient } from '@prisma\/client'/, 
      "import type { PrismaClient } from '@prisma/client'\nimport { randomUUID } from 'crypto'");
  }
  
  // replace create: {
  content = content.replace(/create:\s*\{/g, 'create: { id: randomUUID(), updt_ts: new Date(),');
  // replace update: {
  content = content.replace(/update:\s*\{/g, 'update: { updt_ts: new Date(),');
  // also for data: { (like in createMany or create)
  content = content.replace(/data:\s*\{/g, 'data: { id: randomUUID(), updt_ts: new Date(),');

  fs.writeFileSync(p, content);
}
console.log('Patched seeds!');
