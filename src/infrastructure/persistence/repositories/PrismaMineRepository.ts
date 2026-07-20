import { mine_master } from '@prisma/client';
import { db } from '@/lib/db';

export interface IMineRepository {
  getAdjacentMines(mineCd: string): Promise<mine_master[]>;
  updateAdjacency(mineCd: string, adjacentMineIds: string[]): Promise<void>;
  getAllMines(): Promise<mine_master[]>;
}

export class PrismaMineRepository implements IMineRepository {
  async getAdjacentMines(mineCd: string): Promise<mine_master[]> {
    const mine = await db.mine_master.findUnique({
      where: { mine_cd: mineCd }
    });
    
    if (!mine || !mine.adjacent_mine_ids.length) {
      return [];
    }

    return db.mine_master.findMany({
      where: {
        mine_cd: { in: mine.adjacent_mine_ids }
      }
    });
  }

  async updateAdjacency(mineCd: string, adjacentMineIds: string[]): Promise<void> {
    await db.mine_master.update({
      where: { mine_cd: mineCd },
      data: { adjacent_mine_ids: adjacentMineIds }
    });
  }

  async getAllMines(): Promise<mine_master[]> {
    return db.mine_master.findMany({
      orderBy: { mine_en: 'asc' }
    });
  }
}
