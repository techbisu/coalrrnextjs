// GET  /api/schedules — list land acquisition schedules
// POST /api/schedules — create a new acquisition proposal
import { db } from '@/lib/db'
import { ok, badRequest, serverError, dec, iso, readJson } from '../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const schedules = await db.landSchedule.findMany({
      include: { project: true, items: true },
      orderBy: { createdAt: 'desc' },
    })
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
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers can create acquisition proposals')
    const body = await readJson<{ projectId?: string; acquisitionMode?: string; proposalTitle?: string; description?: string; areaOffice?: string; collieryCode?: string; adjacentColliery?: string; notificationDate?: string }>(req)
    if (!body?.projectId || !body.acquisitionMode || !body.proposalTitle) return badRequest('projectId, acquisitionMode, proposalTitle required')
    const validModes = ['cba_act', 'direct_purchase', 'rfctlarr', 'patta']
    if (!validModes.includes(body.acquisitionMode)) return badRequest(`acquisitionMode must be one of: ${validModes.join(', ')}`)
    const project = await db.mstProject.findUnique({ where: { id: body.projectId } })
    if (!project) return badRequest('Project not found')
    if (!project.lockedAt) return badRequest('Cannot create proposal against an unlocked project baseline.')
    const checklist = buildModeChecklist(body.acquisitionMode)
    const scheduleCode = `SCH-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 999)).padStart(3, '0')}`
    const schedule = await db.landSchedule.create({
      data: {
        projectId: body.projectId, scheduleCode, acquisitionMode: body.acquisitionMode, state: 'Drafting',
        proposalTitle: body.proposalTitle, description: body.description ?? '',
        proposedBy: user.name, proposedByRole: user.role,
        areaOffice: body.areaOffice ?? user.collieryCode ?? '',
        collieryCode: body.collieryCode ?? project.collieryCode,
        adjacentColliery: body.adjacentColliery ?? '',
        totalAreaAcres: '0.0000',
        notificationDate: body.notificationDate ? new Date(body.notificationDate) : null,
        modeSpecificChecklist: JSON.stringify(checklist),
        annexureA: JSON.stringify([]), annexureB: JSON.stringify([]), annexureC: JSON.stringify([]),
      },
    })
    return ok({ id: schedule.id, scheduleCode: schedule.scheduleCode, state: schedule.state, checklist, message: `Acquisition proposal ${scheduleCode} created.` }, { status: 201 })
  } catch (e) {
    return serverError('Failed to create schedule', e instanceof Error ? e.message : String(e))
  }
}

function buildModeChecklist(mode: string) {
  const base: Array<{ key: string; label: string; required: boolean; status: string }> = [
    { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'pending' },
    { key: 'title_verification', label: 'Title chain verified', required: true, status: 'pending' },
  ]
  const modeSpecific: Record<string, Array<{ key: string; label: string; required: boolean; status: string }>> = {
    cba_act: [...base, { key: 'cba_consent', label: 'CBA consent resolution', required: true, status: 'pending' }, { key: 'cba_section', label: '§7/§9 CBA Act notification', required: true, status: 'pending' }],
    direct_purchase: [...base, { key: 'consent_letter', label: 'Written consent from landowner', required: true, status: 'pending' }, { key: 'valuation_sheet', label: 'Valuation per PWD rate chart', required: true, status: 'pending' }, { key: 'mutation_status', label: 'Mutation status verified', required: true, status: 'pending' }],
    rfctlarr: [...base, { key: 'notification_4_1', label: '§4(1) Preliminary notification', required: true, status: 'pending' }, { key: 'notification_4_2', label: '§4(2) SIA & public hearing', required: true, status: 'pending' }, { key: 'public_hearing', label: 'Public hearing conducted', required: true, status: 'pending' }, { key: 'award_draft', label: 'Draft award statement', required: true, status: 'pending' }],
    patta: [...base, { key: 'patta_record', label: 'Patta record extracted', required: true, status: 'pending' }, { key: 'tribal_clearance', label: 'Tribal/SC clearance (if applicable)', required: false, status: 'pending' }],
  }
  const codeMap: Record<string, string> = { cba_act: 'CL-1.1', direct_purchase: 'CL-1.2', rfctlarr: 'CL-1.3', patta: 'CL-1.4' }
  return { checklistCode: codeMap[mode], items: modeSpecific[mode] ?? base }
}
