'use server';

import { getAuditLogsUseCase } from '@/infrastructure/di/Container';
import { authorizeApi } from '@/core/authorization/middleware/authorize';

export async function fetchAuditLogsAction(filters: any) {
  // Use authorization
  const auth = await authorizeApi('audit.view');
  if ('error' in auth) {
    throw new Error('Unauthorized');
  }

  const result = await getAuditLogsUseCase.execute(filters, auth.user.id);
  if (result.isFailure) {
    throw new Error(result.error as string);
  }

  // Need to parse stringified dates back if necessary, but JSON.parse handles most client transitions 
  // Next.js Server Actions automatically handle Date objects now.
  return result.value;
}
