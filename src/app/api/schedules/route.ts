// GET  /api/schedules — list land acquisition schedules
// POST /api/schedules — create a new acquisition proposal
import { ProposalService } from '@/modules/land-acquisition/services/ProposalService'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, dec, iso, readJson } from '../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

const service = new ProposalService()

export async function GET() {
  try {
    const auth = await authorizeApi('acquisition.view')
    if (auth.error) return auth.error

    const schedules = await service.getProposals()
    return ok(schedules.map((s) => ({
      id: s.id, scheduleCode: s.scheduleCode, projectId: s.projectId, projectName: s.project.name,
      acquisitionMode: s.acquisitionMode, state: s.state, proposalTitle: s.proposalTitle,
      description: s.description, proposedBy: s.proposedBy, proposedByRole: s.proposedByRole,
      areaOffice: s.areaOffice, collieryCode: s.collieryCode, adjacentColliery: s.adjacentColliery,
      totalAreaAcres: dec(s.totalAreaAcres), notificationDate: iso(s.notificationDate),
      itemSummary: {
        total: s.items.length,
        annexureA: s.items.filter((i) => i.annexureTag === 'A').length,
        annexureB: s.items.filter((i) => i.annexureTag === 'B').length,
        annexureC: s.items.filter((i) => i.annexureTag === 'C').length,
      },
      createdAt: s.createdAt.toISOString(),
    })))
  } catch (e) {
    return serverError('Failed to load schedules', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApi('acquisition.create')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('User not found')

    const body = await readJson<{ projectId?: string; acquisitionMode?: string; proposalTitle?: string; description?: string; areaOffice?: string; collieryCode?: string; adjacentColliery?: string; notificationDate?: string }>(req)
    if (!body?.projectId || !body.acquisitionMode || !body.proposalTitle) return badRequest('projectId, acquisitionMode, proposalTitle required')
    
    const validModes = ['cba_act', 'direct_purchase', 'rfctlarr', 'patta']
    if (!validModes.includes(body.acquisitionMode)) return badRequest(`acquisitionMode must be one of: ${validModes.join(', ')}`)

    const schedule = await service.createProposal({
      projectId: body.projectId,
      acquisitionMode: body.acquisitionMode,
      proposalTitle: body.proposalTitle,
      description: body.description,
      areaOffice: body.areaOffice,
      collieryCode: body.collieryCode,
      adjacentColliery: body.adjacentColliery,
      notificationDate: body.notificationDate,
      userName: user.name,
      userRole: user.role,
    })

    return ok({ 
      id: schedule.id, 
      scheduleCode: schedule.scheduleCode, 
      state: schedule.state, 
      checklist: JSON.parse(schedule.modeSpecificChecklist ?? '{"items":[]}'), 
      message: `Acquisition proposal ${schedule.scheduleCode} created.` 
    }, { status: 201 })
  } catch (e) {
    return serverError('Failed to create schedule', e instanceof Error ? e.message : String(e))
  }
}
