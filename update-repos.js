const fs = require('fs');

function injectScopeToRepo(filePath, areaField, mineField, entryField) {
  if (!fs.existsSync(filePath)) return;
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('UserScopeService')) {
    c = 'import { UserScopeService } from "@/core/authorization/services/UserScopeService";\n' + c;
  }
  
  const injection = `
    const scopeWhere = options?.scope && options?.userId ? UserScopeService.visibilityWhere(options.scope, options.userId, '${areaField}', '${mineField}', '${entryField}') : {};
    const where: any = { ...scopeWhere };
  `;
  
  c = c.replace(/const where: any = \{.*?\}/g, injection.trim());
  fs.writeFileSync(filePath, c, 'utf8');
}

injectScopeToRepo('src/infrastructure/persistence/repositories/PrismaProposalRepository.ts', 'area_office', 'mine_cd', 'proposed_by');
injectScopeToRepo('src/infrastructure/persistence/repositories/PrismaPafRepository.ts', 'plot.mouza.block.district.state.area_cd', 'mine_cd', 'entry_by'); // arbitrary relations for paf
injectScopeToRepo('src/infrastructure/persistence/repositories/PrismaClaimRepository.ts', 'plot.mouza.block.district.state.area_cd', 'mine_cd', 'entry_by');
injectScopeToRepo('src/infrastructure/persistence/repositories/PrismaLedgerEntryRepository.ts', 'plot.mouza.block.district.state.area_cd', 'mine_cd', 'entry_by');

console.log("Repositories scope updated");
