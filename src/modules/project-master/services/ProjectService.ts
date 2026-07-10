import { ProjectRepository } from '../repositories/ProjectRepository'
import { IProjectMasterCreateDTO, IProjectMasterUpdateDTO } from '../types'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { EventBus } from '@/notifications/EventBus'

export class ProjectService {
  static async getDashboardProjects() {
    return await ProjectRepository.findAll()
  }

  static async createProject(data: IProjectMasterCreateDTO, user_id: string) {
    const project = await ProjectRepository.create(data)

    AuditQueue.push({
      event_type: 'CREATE_PROJECT',
      module_name: 'mst_project',
      entity_id: project.id,
      user_id,
      remarks: JSON.stringify(data)
    })

    return project
  }

  static async updateProject(id: string, data: IProjectMasterUpdateDTO, user_id: string) {
    const current = await ProjectRepository.findById(id)
    if (!current) throw new Error('Project not found')
    if (current.locked_at) throw new Error('Cannot edit a locked baseline')

    const updated = await ProjectRepository.update(id, data)

    AuditQueue.push({
      event_type: 'UPDATE_PROJECT',
      module_name: 'mst_project',
      entity_id: id,
      user_id,
      remarks: JSON.stringify(data)
    })

    return updated
  }

  static async lockProject(id: string, user_id: string) {
    const current = await ProjectRepository.findById(id)
    if (!current) throw new Error('Project not found')
    if (current.locked_at) throw new Error('Already locked')

    const locked = await ProjectRepository.lock(id)

    AuditQueue.push({
      event_type: 'LOCK_PROJECT_BASELINE',
      module_name: 'mst_project',
      entity_id: id,
      user_id,
      remarks: 'Baseline permanently locked.'
    })

    EventBus.publish({
      event_name: 'PROJECT_LOCKED',
      module: 'project-master',
      user_id,
      entity_id: id,
      data: { projectName: locked.name }
    })

    return locked
  }
}
