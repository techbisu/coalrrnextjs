import { Prisma } from '@prisma/client'
import { auditConfig } from '@/core/config/audit.config'
import { getRequestContext } from '@/core/context/RequestContext'

const EXCLUDED_MODELS = auditConfig.excludedModels as readonly string[]
const NO_AUDIT_FIELDS_MODELS = auditConfig.noAuditFieldsModels as readonly string[]

// ─── Helper: inject entry_by / updt_by / timestamps ──────────────────────────

function injectAuditFields(
  model: string,
  args: any,
  userId: string | undefined | null,
  operation: 'create' | 'update'
) {
  if (!args.data) return

  const modelNameLower = model.toLowerCase()
  const skipInject =
    NO_AUDIT_FIELDS_MODELS.includes(modelNameLower) ||
    NO_AUDIT_FIELDS_MODELS.includes(model)
  if (skipInject) return

  const dmmfModel = Prisma.dmmf.datamodel.models.find(
    (m) => m.name.toLowerCase() === modelNameLower
  )
  const isCamel =
    dmmfModel?.fields.some((f) => f.name === 'entryBy' || f.name === 'updtBy') ?? false

  if (isCamel) {
    if (operation === 'create') {
      if (dmmfModel?.fields.some((f) => f.name === 'entryBy'))
        (args.data as any).entryBy = userId
      if (dmmfModel?.fields.some((f) => f.name === 'entryTs') && !(args.data as any).entryTs)
        (args.data as any).entryTs = Math.floor(Date.now() / 1000)
    }
    if (dmmfModel?.fields.some((f) => f.name === 'updtBy'))
      (args.data as any).updtBy = userId
    if (dmmfModel?.fields.some((f) => f.name === 'updtTs') && !(args.data as any).updtTs)
      (args.data as any).updtTs = Math.floor(Date.now() / 1000)
  } else {
    const isBigIntEntry =
      dmmfModel?.fields.some((f) => f.name === 'entry_ts' && f.type === 'BigInt') ?? false
    const isBigIntUpdt =
      dmmfModel?.fields.some((f) => f.name === 'updt_ts' && f.type === 'BigInt') ?? false

    if (operation === 'create') {
      if (dmmfModel?.fields.some((f) => f.name === 'entry_by'))
        (args.data as any).entry_by = userId
      if (dmmfModel?.fields.some((f) => f.name === 'entry_ts') && !(args.data as any).entry_ts)
        (args.data as any).entry_ts = isBigIntEntry ? BigInt(Date.now()) : new Date()
    }
    if (dmmfModel?.fields.some((f) => f.name === 'updt_by'))
      (args.data as any).updt_by = userId
    if (dmmfModel?.fields.some((f) => f.name === 'updt_ts') && !(args.data as any).updt_ts)
      (args.data as any).updt_ts = isBigIntUpdt ? BigInt(Date.now()) : new Date()
  }
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const withAuditExtension = Prisma.defineExtension({
  name: 'PrismaAuditExtension',
  query: {
    $allModels: {
      async create({ model, args, query }) {
        // Read from AsyncLocalStorage — works in HTTP, BullMQ, cron, tests
        const { userId, ipAddress, userAgent } = getRequestContext()

        const modelName = String(model).toLowerCase()

        // Auto-assign a UUID for document_instance if missing
        if (model === 'document_instance' && !(args.data as any).id) {
          ;(args.data as any).id = require('crypto').randomUUID()
        }

        injectAuditFields(String(model), args, userId, 'create')

        const txTimestamp = new Date()
        const result = await query(args)

        if (
          !EXCLUDED_MODELS.includes(modelName) &&
          !EXCLUDED_MODELS.includes(model as string)
        ) {
          import('@/core/audit/services/AuditService').then(({ Audit }) => {
            Audit.updateRecord(
              model,
              'CREATE',
              undefined,
              undefined,
              result,
              userId,
              ipAddress,
              userAgent,
              txTimestamp
            ).catch(console.error)
          }).catch(() => {})
        }

        return result
      },

      async update({ model, args, query }) {
        const { userId, ipAddress, userAgent } = getRequestContext()

        const modelName = String(model).toLowerCase()
        const prismaModel =
          String(model).charAt(0).toLowerCase() + String(model).slice(1)

        let oldData: any = undefined
        if (
          !EXCLUDED_MODELS.includes(modelName) &&
          !EXCLUDED_MODELS.includes(model as string)
        ) {
          try {
            if ((args as any).where) {
              const { db } = await import('@/lib/db')
              if (db && (db as any)[prismaModel]) {
                oldData = await (db as any)[prismaModel].findUnique({
                  where: (args as any).where,
                })
              }
            }
          } catch (e) {
            console.error('Failed to fetch oldData for audit:', e)
          }
        }

        injectAuditFields(String(model), args, userId, 'update')

        const txTimestamp = new Date()
        const result = await query(args)

        if (
          !EXCLUDED_MODELS.includes(modelName) &&
          !EXCLUDED_MODELS.includes(model as string)
        ) {
          import('@/core/audit/services/AuditService').then(({ Audit }) => {
            Audit.updateRecord(
              model,
              'UPDATE',
              (args as any).where,
              oldData,
              result,
              userId,
              ipAddress,
              userAgent,
              txTimestamp
            ).catch(console.error)
          }).catch(() => {})
        }

        return result
      },

      async delete({ model, args, query }) {
        const { userId, ipAddress, userAgent } = getRequestContext()

        const txTimestamp = new Date()
        const result = await query(args)

        const modelName = String(model).toLowerCase()
        if (
          !EXCLUDED_MODELS.includes(modelName) &&
          !EXCLUDED_MODELS.includes(model as string)
        ) {
          import('@/core/audit/services/AuditService').then(({ Audit }) => {
            Audit.updateRecord(
              model,
              'DELETE',
              (args as any).where,
              result,
              undefined,
              userId,
              ipAddress,
              userAgent,
              txTimestamp
            ).catch(console.error)
          }).catch(() => {})
        }

        return result
      },
    },
  },
})
