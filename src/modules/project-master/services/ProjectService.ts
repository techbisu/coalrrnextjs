import { ProjectRepository } from '../repositories/ProjectRepository'
import { IProjectMasterCreateDTO, IProjectMasterUpdateDTO } from '../types'
import { AuditQueue } from '@/audit/services/AuditQueue'
import { EventBus } from '@/notifications/EventBus'

export class ProjectService {
  static async getDashboardProjects() {
    return await ProjectRepository.findAll()
  }

  static async createProject(data: IProjectMasterCreateDTO, userId: string) {
    const project = await ProjectRepository.create(data)

    AuditQueue.push({
      action: 'CREATE_PROJECT',
      entityType: 'MstProject',
      entityId: project.id,
      userId,
      details: JSON.stringify(data)
    })

    return project
  }

  static async updateProject(id: string, data: IProjectMasterUpdateDTO, userId: string) {
    const current = await ProjectRepository.findById(id)
    if (!current) throw new Error('Project not found')
    if (current.lockedAt) throw new Error('Cannot edit a locked baseline')

    const updated = await ProjectRepository.update(id, data)

    AuditQueue.push({
      action: 'UPDATE_PROJECT',
      entityType: 'MstProject',
      entityId: id,
      userId,
      details: JSON.stringify(data)
    })

    return updated
  }

  static async lockProject(id: string, userId: string) {
    const current = await ProjectRepository.findById(id)
    if (!current) throw new Error('Project not found')
    if (current.lockedAt) throw new Error('Already locked')

    const locked = await ProjectRepository.lock(id)

    AuditQueue.push({
      action: 'LOCK_PROJECT_BASELINE',
      entityType: 'MstProject',
      entityId: id,
      userId,
      details: 'Baseline permanently locked.'
    })

    EventBus.publish({
      eventName: 'PROJECT_LOCKED',
      module: 'project-master',
      userId,
      entityId: id,
      data: { projectName: locked.name }
    })

    return locked
  }
}
