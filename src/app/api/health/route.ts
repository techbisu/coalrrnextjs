/**
 * Health Check Endpoint - Returns system health status.
 * Used by load balancers, orchestrators, and monitoring systems.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
}

export async function GET() {
  const startTime = Date.now()
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    checks: {
      database: { status: 'down' },
      memory: { used: 0, total: 0, percentage: 0 },
    },
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart
    health.checks.database = {
      status: 'up',
      responseTime: dbTime,
    }
  } catch (error: any) {
    health.checks.database = {
      status: 'down',
      error: error.message,
    }
    health.status = 'unhealthy'
  }

  // Check memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage()
    health.checks.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    }

    // Mark as degraded if memory usage > 80%
    if (health.checks.memory.percentage > 80 && health.status === 'healthy') {
      health.status = 'degraded'
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
