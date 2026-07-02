// COALRR API — helpers shared across all route handlers
import { NextResponse } from 'next/server'

export type ApiError = { error: string; details?: unknown }

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json<ApiError>({ error, details }, { status: 400 })
}

export function notFound(error = 'Not found') {
  return NextResponse.json<ApiError>({ error }, { status: 404 })
}

export function serverError(error: string, details?: unknown) {
  return NextResponse.json<ApiError>({ error, details }, { status: 500 })
}

/** Serialize a Prisma Decimal as a string (never a float). */
export function dec(v: { toString(): string } | null | undefined): string {
  return v == null ? '0' : v.toString()
}

/** Serialize dates as ISO strings; null stays null. */
export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

/** Read JSON body safely. */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
