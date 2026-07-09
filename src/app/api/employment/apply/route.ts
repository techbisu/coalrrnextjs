import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ poolId?: string }>(req)
    if (!body?.poolId) return badRequest('poolId is required')

    const pool = await db.nomineePool.findUnique({
      where: { id: body.poolId },
      include: {
        contributions: {
          include: {
            formIClaim: {
              include: {
                plot: {
                  include: {
                    landScheduleItems: {
                      include: { schedule: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!pool) return badRequest('Nominee pool not found')
    
    // Find the associated project ID from the plots
    let projectId = ''
    for (const contrib of pool.contributions) {
      for (const item of contrib.formIClaim.plot.landScheduleItems) {
        if (item.schedule?.projectId) {
          projectId = item.schedule.projectId
          break
        }
      }
      if (projectId) break
    }

    if (!projectId) {
      // Fallback: just pick any project if schedule not mapped yet for prototype
      const anyProject = await db.mstProject.findFirst()
      if (!anyProject) return badRequest('No projects found in system')
      projectId = anyProject.id
    }

    const applicationCode = `EMP-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`

    const application = await db.employmentApplication.create({
      data: {
        applicationCode,
        nomineePoolId: pool.id,
        projectId,
        formIxBalanceAcres: pool.pooledAcreage,
        formXBalanceJobs: Math.floor(Number(pool.pooledAcreage) / 2.0), // 1 job per 2 acres
        state: 'Drafting',
      }
    })

    return ok(application, { status: 201 })
  } catch (e) {
    return serverError('Failed to create draft application', e instanceof Error ? e.message : String(e))
  }
}
