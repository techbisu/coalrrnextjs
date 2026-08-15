import { PrismaClient } from '@prisma/client'
import { withAuditExtension } from '@/core/audit/extensions/PrismaAuditExtension'

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

function createExtendedClient() {
  return new PrismaClient({
    log: process.env.DEBUG_PRISMA === '1' ? ['query'] : ['error'],
  }).$extends(withAuditExtension);
}

type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}