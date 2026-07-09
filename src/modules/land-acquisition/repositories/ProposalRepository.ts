import { db } from '@/lib/db'

export class ProposalRepository {
  async findAll() {
    return db.landSchedule.findMany({
      include: { project: true, items: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return db.landSchedule.findUnique({
      where: { id },
      include: { project: true, items: { include: { plot: { include: { mouza: true } } } } },
    })
  }

  async create(data: any) {
    return db.landSchedule.create({
      data,
    })
  }

  async update(id: string, data: any) {
    return db.landSchedule.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return db.landSchedule.delete({
      where: { id },
    })
  }

  async addItem(data: any) {
    return db.landScheduleItem.create({
      data,
    })
  }

  async findItemById(itemId: string) {
    return db.landScheduleItem.findUnique({
      where: { id: itemId },
    })
  }

  async deleteItem(itemId: string) {
    return db.landScheduleItem.delete({
      where: { id: itemId },
    })
  }
}
