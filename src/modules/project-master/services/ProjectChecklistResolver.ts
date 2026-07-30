import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'

export class ProjectChecklistResolver implements IChecklistContextResolver {
  constructor(private repo: IProjectRepository) {}

  async resolve(entityId: string): Promise<Record<string, any>> {
    const project = await this.repo.findById(entityId);
    if (!project) throw new Error('Project not found');

    return {
      projectId: project.id,
      isExpansion: project.projectDesc?.toLowerCase().includes('expansion') || false,
    };
  }
}
