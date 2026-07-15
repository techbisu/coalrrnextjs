import { GetProjectDashboardUseCase } from './application/use-cases/project/GetProjectDashboardUseCase';
import { PrismaProjectRepository } from './infrastructure/persistence/repositories/PrismaProjectRepository';

async function test() {
  const repo = new PrismaProjectRepository();
  const uc = new GetProjectDashboardUseCase(repo);
  const result = await uc.execute({});
  if (result.isFailure) {
    console.error("FAIL:", result.error);
  } else {
    console.log("SUCCESS:", JSON.stringify(result.value, null, 2));
  }
}

test().catch(console.error);
