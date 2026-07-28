import { db } from '@/lib/db'

export class ProposalRepository {
  async findAll() {
    const proposals = await db.land_schedule.findMany({
      include: { land_schedule_item: true },
      orderBy: { entry_ts: 'desc' },
    })
    const projectIds = [...new Set(proposals.map(p => p.project_id))];
    const projects = await db.project.findMany({ where: { projCd: { in: projectIds } } });
    const projectMap = new Map(projects.map(p => [p.projCd, p]));
    
    return proposals.map(p => ({
      ...p,
      mst_project: projectMap.get(p.project_id) || null
    }));
  }

  async findById(id: string) {
    const proposal = await db.land_schedule.findUnique({
      where: { id },
      include: { land_schedule_item: { include: { mst_plot: { include: { mouza: true } } } } },
    })
    if (!proposal) return null;
    const project = await db.project.findUnique({ where: { projCd: proposal.project_id } });
    
    return {
      ...proposal,
      mst_project: project || null
    }
  }

  async create(data: any) {
    return db.land_schedule.create({
      data,
    })
  }

  async update(id: string, data: any) {
    return db.land_schedule.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return db.land_schedule.delete({
      where: { id },
    })
  }

  async addItem(data: any) {
    return db.land_schedule_item.create({
      data,
    })
  }

  async findItemById(itemId: string) {
    return db.land_schedule_item.findUnique({
      where: { id: itemId },
    })
  }

  async deleteItem(itemId: string) {
    return db.land_schedule_item.delete({
      where: { id: itemId },
    })
  }
}
