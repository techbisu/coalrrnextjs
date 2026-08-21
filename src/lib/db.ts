import { PrismaClient } from '@prisma/client'
import { withAuditExtension } from '@/core/audit/extensions/PrismaAuditExtension'

process.env.TZ = 'Asia/Kolkata'

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined
}

function createExtendedClient() {
  return new PrismaClient({
    log: process.env.DEBUG_PRISMA === '1' ? ['query'] : ['error'],
  }).$extends(withAuditExtension);
}

export const db = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;