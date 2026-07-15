import { AsyncLocalStorage } from 'async_hooks';

interface RequestContextPayload {
  userId?: string;
}

export const RequestContext = new AsyncLocalStorage<RequestContextPayload>();

export function getUserIdFromContext(): string | undefined {
  const store = RequestContext.getStore();
  return store?.userId;
}
