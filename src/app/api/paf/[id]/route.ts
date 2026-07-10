// GET/PATCH/DELETE /api/paf/[id]
import { ok, badRequest, serverError, notFound, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { getPafRecordUseCase, updatePafRecordUseCase, deletePafRecordUseCase } from '@/infrastructure/di/Container'
import { GetPafRecordUseCase } from '@/application/use-cases/paf/GetPafRecordUseCase'
import { UpdatePafRecordUseCase } from '@/application/use-cases/paf/UpdatePafRecordUseCase'
import { DeletePafRecordUseCase } from '@/application/use-cases/paf/DeletePafRecordUseCase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const useCase = getPafRecordUseCase
    const result = await useCase.execute({ id })

    if (result.isFailure) {
      if (String(result.error) === 'PAF record not found') {
        return notFound('PAF record not found')
      }
      return serverError('Failed to load PAF record', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load PAF record', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return badRequest('Invalid body')

    const useCase = updatePafRecordUseCase
    const result = await useCase.execute({ id, ...body })

    if (result.isFailure) {
      return serverError('Failed to update PAF record', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to update PAF record', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const useCase = deletePafRecordUseCase
    const result = await useCase.execute({ id })

    if (result.isFailure) {
      return serverError('Failed to delete PAF record', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to delete PAF record', e instanceof Error ? e.message : String(e))
  }
}