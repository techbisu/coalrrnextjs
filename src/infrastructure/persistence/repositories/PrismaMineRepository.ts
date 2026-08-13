import { mine } from '@prisma/client';
import { db } from '@/lib/db';

export interface IMineRepository {
  getAdjacentMines(mineCd: string): Promise<mine[]>;
  updateAdjacency(mineCd: string, adjacentMineIds: string[]): Promise<void>;
  getAllMines(): Promise<mine[]>;
}

export class PrismaMineRepository implements IMineRepository {
  async getAdjacentMines(mineCd: string): Promise<mine[]> {
    const mine = await db.mine.findUnique({
      where: { mine_cd: mineCd }
    });
    
    if (!mine || !mine.adjacent_mine_ids.length) {
      return [];
    }

    return db.mine.findMany({
      where: {
        mine_cd: { in: mine.adjacent_mine_ids }
      }
    });
  }

  async updateAdjacency(mineCd: string, adjacentMineIds: string[]): Promise<void> {
    await db.mine.update({
      where: { mine_cd: mineCd },
      data: { adjacent_mine_ids: adjacentMineIds }
    });
  }

  async getAllMines(): Promise<mine[]> {
    return db.mine.findMany({
      orderBy: { mine_en: 'asc' }
    });
  }
}
