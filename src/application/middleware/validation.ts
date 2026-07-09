/**
 * API Validation Middleware - Validates request body against Zod schemas.
 * Returns standardized error responses for validation failures.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/app/api/_lib'

export interface ValidationResult<T> {
  success: true
  data: T
}

export interface ValidationFailure {
  success: false
  error: NextResponse<ApiError>
}

/**
 * Validates request body against a Zod schema.
 * Returns either the validated data or an error response.
 */
export async function validateBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>> | ValidationFailure> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))

      return {
        success: false,
        error: NextResponse.json<ApiError>(
          {
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        ),
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (e) {
    return {
      success: false,
      error: NextResponse.json<ApiError>(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> | ValidationFailure {
  const { searchParams } = new URL(req.url)
  const params = Object.fromEntries(searchParams.entries())
  
  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return {
      success: false,
      error: NextResponse.json<ApiError>(
        {
          error: 'Invalid query parameters',
          details: errors,
        },
        { status: 400 }
      ),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Validates route parameters against a Zod schema.
 */
export function validateParams<T extends z.ZodTypeAny>(
  params: Record<string, string>,
  schema: T
): ValidationResult<z.infer<T>> | ValidationFailure {
  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return {
      success: false,
      error: NextResponse.json<ApiError>(
        {
          error: 'Invalid route parameters',
          details: errors,
        },
        { status: 400 }
      ),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}