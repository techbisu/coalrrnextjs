const fs = require('fs');

function addUseCaseToContainer() {
  const filePath = 'src/infrastructure/di/Container.ts';
  let c = fs.readFileSync(filePath, 'utf8');

  if (c.includes('assignUserScopeUseCase')) return;

  const imports = `
import { PrismaMineRepository } from '../persistence/repositories/PrismaMineRepository';
import { AssignUserScopeUseCase } from '@/application/use-cases/org/AssignUserScopeUseCase';
import { TransferUserUseCase } from '@/application/use-cases/org/TransferUserUseCase';
import { ListUserScopeHistoryUseCase } from '@/application/use-cases/org/ListUserScopeHistoryUseCase';
import { UpdateMineAdjacencyUseCase } from '@/application/use-cases/org/UpdateMineAdjacencyUseCase';
import { GetAdjacentMinesUseCase } from '@/application/use-cases/org/GetAdjacentMinesUseCase';
  `;

  c = imports + c;

  const repos = `
const mineRepository = new PrismaMineRepository(db);
  `;
  c = c.replace('const userOrgScopeRepository =', repos.trim() + '\nconst userOrgScopeRepository =');

  const exportsStr = `
export const assignUserScopeUseCase = globalForDI.assignUserScopeUseCase ?? new AssignUserScopeUseCase(userOrgScopeRepository);
export const transferUserUseCase = globalForDI.transferUserUseCase ?? new TransferUserUseCase(userOrgScopeRepository);
export const listUserScopeHistoryUseCase = globalForDI.listUserScopeHistoryUseCase ?? new ListUserScopeHistoryUseCase(userOrgScopeRepository);
export const updateMineAdjacencyUseCase = globalForDI.updateMineAdjacencyUseCase ?? new UpdateMineAdjacencyUseCase(mineRepository);
export const getAdjacentMinesUseCase = globalForDI.getAdjacentMinesUseCase ?? new GetAdjacentMinesUseCase(mineRepository);
  `;

  c = c.replace('export const userOrgScopeRepositoryExport =', exportsStr.trim() + '\nexport const userOrgScopeRepositoryExport =');

  const globals = `
  globalForDI.assignUserScopeUseCase = assignUserScopeUseCase;
  globalForDI.transferUserUseCase = transferUserUseCase;
  globalForDI.listUserScopeHistoryUseCase = listUserScopeHistoryUseCase;
  globalForDI.updateMineAdjacencyUseCase = updateMineAdjacencyUseCase;
  globalForDI.getAdjacentMinesUseCase = getAdjacentMinesUseCase;
  `;

  c = c.replace('globalForDI.userOrgScopeRepository =', globals.trim() + '\n  globalForDI.userOrgScopeRepository =');

  fs.writeFileSync(filePath, c, 'utf8');
}

addUseCaseToContainer();
console.log('Container updated');
