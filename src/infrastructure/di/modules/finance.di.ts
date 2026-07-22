import { PrismaLedgerEntryRepository } from '@/infrastructure/persistence/repositories/PrismaLedgerEntryRepository'
import { PrismaRnrPayrollRepository } from '@/infrastructure/persistence/repositories/PrismaRnrPayrollRepository'
import { PrismaPayrollsRepository } from '@/infrastructure/persistence/repositories/PrismaPayrollsRepository'

import { ListLedgerEntriesUseCase } from '@/application/use-cases/ledger/ListLedgerEntriesUseCase'
import { AppendLedgerEntryUseCase } from '@/application/use-cases/ledger/AppendLedgerEntryUseCase'

import { GetRnrPayrollsUseCase } from '@/application/use-cases/rnr-payrolls/GetRnrPayrollsUseCase'
import { CreateRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/CreateRnrPayrollUseCase'
import { GetRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/GetRnrPayrollUseCase'
import { UpdateRnrPayrollStateUseCase } from '@/application/use-cases/rnr-payrolls/UpdateRnrPayrollStateUseCase'
import { DeleteRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/DeleteRnrPayrollUseCase'
import { AddRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/AddRnrPayrollLineUseCase'
import { UpdateRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/UpdateRnrPayrollLineUseCase'
import { DeleteRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/DeleteRnrPayrollLineUseCase'

import { GetPayrollsUseCase } from '@/application/use-cases/payrolls/GetPayrollsUseCase'
import { CreatePayrollUseCase } from '@/application/use-cases/payrolls/CreatePayrollUseCase'
import { GetPayrollByIdUseCase } from '@/application/use-cases/payrolls/GetPayrollByIdUseCase'
import { UpdatePayrollFactorUseCase } from '@/application/use-cases/payrolls/UpdatePayrollFactorUseCase'
import { AddPayrollLineUseCase } from '@/application/use-cases/payrolls/AddPayrollLineUseCase'
import { DeletePayrollLineUseCase } from '@/application/use-cases/payrolls/DeletePayrollLineUseCase'

const globalForFinanceDI = globalThis as unknown as {
  listLedgerEntriesUseCase: ListLedgerEntriesUseCase | undefined
  appendLedgerEntryUseCase: AppendLedgerEntryUseCase | undefined
  getRnrPayrollsUseCase: GetRnrPayrollsUseCase | undefined
  createRnrPayrollUseCase: CreateRnrPayrollUseCase | undefined
  getRnrPayrollUseCase: GetRnrPayrollUseCase | undefined
  updateRnrPayrollStateUseCase: UpdateRnrPayrollStateUseCase | undefined
  deleteRnrPayrollUseCase: DeleteRnrPayrollUseCase | undefined
  addRnrPayrollLineUseCase: AddRnrPayrollLineUseCase | undefined
  updateRnrPayrollLineUseCase: UpdateRnrPayrollLineUseCase | undefined
  deleteRnrPayrollLineUseCase: DeleteRnrPayrollLineUseCase | undefined
  getPayrollsUseCase: GetPayrollsUseCase | undefined
  createPayrollUseCase: CreatePayrollUseCase | undefined
  getPayrollByIdUseCase: GetPayrollByIdUseCase | undefined
  updatePayrollFactorUseCase: UpdatePayrollFactorUseCase | undefined
  addPayrollLineUseCase: AddPayrollLineUseCase | undefined
  deletePayrollLineUseCase: DeletePayrollLineUseCase | undefined
}

const ledgerEntryRepository = new PrismaLedgerEntryRepository()
const rnrPayrollRepository = new PrismaRnrPayrollRepository()
const payrollsRepository = new PrismaPayrollsRepository()

export const listLedgerEntriesUseCase = globalForFinanceDI.listLedgerEntriesUseCase ?? new ListLedgerEntriesUseCase(ledgerEntryRepository)
export const appendLedgerEntryUseCase = globalForFinanceDI.appendLedgerEntryUseCase ?? new AppendLedgerEntryUseCase(ledgerEntryRepository)

export const getRnrPayrollsUseCase = globalForFinanceDI.getRnrPayrollsUseCase ?? new GetRnrPayrollsUseCase(rnrPayrollRepository)
export const createRnrPayrollUseCase = globalForFinanceDI.createRnrPayrollUseCase ?? new CreateRnrPayrollUseCase(rnrPayrollRepository)
export const getRnrPayrollUseCase = globalForFinanceDI.getRnrPayrollUseCase ?? new GetRnrPayrollUseCase(rnrPayrollRepository)
export const updateRnrPayrollStateUseCase = globalForFinanceDI.updateRnrPayrollStateUseCase ?? new UpdateRnrPayrollStateUseCase(rnrPayrollRepository)
export const deleteRnrPayrollUseCase = globalForFinanceDI.deleteRnrPayrollUseCase ?? new DeleteRnrPayrollUseCase(rnrPayrollRepository)
export const addRnrPayrollLineUseCase = globalForFinanceDI.addRnrPayrollLineUseCase ?? new AddRnrPayrollLineUseCase(rnrPayrollRepository)
export const updateRnrPayrollLineUseCase = globalForFinanceDI.updateRnrPayrollLineUseCase ?? new UpdateRnrPayrollLineUseCase(rnrPayrollRepository)
export const deleteRnrPayrollLineUseCase = globalForFinanceDI.deleteRnrPayrollLineUseCase ?? new DeleteRnrPayrollLineUseCase(rnrPayrollRepository)

export const getPayrollsUseCase = globalForFinanceDI.getPayrollsUseCase ?? new GetPayrollsUseCase(payrollsRepository)
export const createPayrollUseCase = globalForFinanceDI.createPayrollUseCase ?? new CreatePayrollUseCase(payrollsRepository)
export const getPayrollByIdUseCase = globalForFinanceDI.getPayrollByIdUseCase ?? new GetPayrollByIdUseCase(payrollsRepository)
export const updatePayrollFactorUseCase = globalForFinanceDI.updatePayrollFactorUseCase ?? new UpdatePayrollFactorUseCase(payrollsRepository)
export const addPayrollLineUseCase = globalForFinanceDI.addPayrollLineUseCase ?? new AddPayrollLineUseCase(payrollsRepository)
export const deletePayrollLineUseCase = globalForFinanceDI.deletePayrollLineUseCase ?? new DeletePayrollLineUseCase(payrollsRepository)

if (process.env.NODE_ENV !== 'production') {
  globalForFinanceDI.listLedgerEntriesUseCase = listLedgerEntriesUseCase
  globalForFinanceDI.appendLedgerEntryUseCase = appendLedgerEntryUseCase
  globalForFinanceDI.getRnrPayrollsUseCase = getRnrPayrollsUseCase
  globalForFinanceDI.createRnrPayrollUseCase = createRnrPayrollUseCase
  globalForFinanceDI.getRnrPayrollUseCase = getRnrPayrollUseCase
  globalForFinanceDI.updateRnrPayrollStateUseCase = updateRnrPayrollStateUseCase
  globalForFinanceDI.deleteRnrPayrollUseCase = deleteRnrPayrollUseCase
  globalForFinanceDI.addRnrPayrollLineUseCase = addRnrPayrollLineUseCase
  globalForFinanceDI.updateRnrPayrollLineUseCase = updateRnrPayrollLineUseCase
  globalForFinanceDI.deleteRnrPayrollLineUseCase = deleteRnrPayrollLineUseCase
  globalForFinanceDI.getPayrollsUseCase = getPayrollsUseCase
  globalForFinanceDI.createPayrollUseCase = createPayrollUseCase
  globalForFinanceDI.getPayrollByIdUseCase = getPayrollByIdUseCase
  globalForFinanceDI.updatePayrollFactorUseCase = updatePayrollFactorUseCase
  globalForFinanceDI.addPayrollLineUseCase = addPayrollLineUseCase
  globalForFinanceDI.deletePayrollLineUseCase = deletePayrollLineUseCase
}
