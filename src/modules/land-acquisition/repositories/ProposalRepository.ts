import { db } from '@/lib/db'

export class ProposalRepository {
  async findAll() {
    return db.land_schedule.findMany({
      include: { mst_project: true, land_schedule_item: true },
      orderBy: { entry_ts: 'desc' },
    })
  }

  async findById(id: string) {
    return db.land_schedule.findUnique({
      where: { id },
      include: { mst_project: true, land_schedule_item: { include: { mst_plot: { include: { mouza: true } } } } },
    })
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
