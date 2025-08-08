import { eq, desc, and, count, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  games, 
  reviewLogs, 
  type Game, 
  type NewGame, 
  type ReviewLog, 
  type NewReviewLog,
  type GameWithMetadata,
  type GameListItem,
  type ReviewLogWithGame
} from './schema';
import { PaginationInput, GameStatusFilterInput, SearchInput } from './validation';

// 游戏相关的数据访问函数
export class GameDAL {
  // 创建新游戏
  static async create(gameData: NewGame): Promise<Game> {
    try {
      const [result] = await db.insert(games).values(gameData);
      const [game] = await db.select().from(games).where(eq(games.id, gameData.id!));
      if (!game) {
        throw new Error('Failed to create game');
      }
      return game;
    } catch (error) {
      throw new Error(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 根据ID获取游戏
  static async getById(id: string): Promise<Game | null> {
    try {
      const [game] = await db.select().from(games).where(eq(games.id, id));
      return game || null;
    } catch (error) {
      throw new Error(`Failed to get game by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 根据ID获取游戏（带元数据）
  static async getByIdWithMetadata(id: string): Promise<GameWithMetadata | null> {
    try {
      const game = await this.getById(id);
      if (!game) return null;
      
      return {
        ...game,
        isApproved: game.status === 'approved',
        isPending: game.status === 'pending',
        isRejected: game.status === 'rejected',
        canBeShared: game.status === 'approved',
      };
    } catch (error) {
      throw new Error(`Failed to get game with metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取游戏列表项（不包含HTML内容）
  static async getListItems(
    pagination: PaginationInput,
    filter?: GameStatusFilterInput & SearchInput
  ): Promise<{ games: GameListItem[]; total: number }> {
    try {
      let query = db
        .select({
          id: games.id,
          title: games.title,
          description: games.description,
          authorName: games.authorName,
          status: games.status,
          createdAt: games.createdAt,
          approvedAt: games.approvedAt,
        })
        .from(games);

      // Build where conditions
      const conditions = [];
      
      if (filter?.status) {
        conditions.push(eq(games.status, filter.status));
      }

      if (filter?.search && filter.search.trim()) {
        const searchTerm = `%${filter.search.trim()}%`;
        conditions.push(
          sql`(${games.title} LIKE ${searchTerm} OR ${games.authorName} LIKE ${searchTerm})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const [gamesList, totalCount] = await Promise.all([
        query
          .orderBy(desc(games.createdAt))
          .limit(pagination.limit)
          .offset((pagination.page - 1) * pagination.limit),
        this.count(filter?.status, filter?.search),
      ]);

      return {
        games: gamesList,
        total: totalCount,
      };
    } catch (error) {
      throw new Error(`Failed to get game list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取所有游戏（支持状态筛选）
  static async getAll(status?: 'pending' | 'approved' | 'rejected'): Promise<Game[]> {
    try {
      const query = db.select().from(games);
      
      if (status) {
        return await query.where(eq(games.status, status)).orderBy(desc(games.createdAt));
      }
      
      return await query.orderBy(desc(games.createdAt));
    } catch (error) {
      throw new Error(`Failed to get all games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取已发布的游戏（分页）
  static async getPublished(limit: number = 10, offset: number = 0): Promise<Game[]> {
    try {
      return await db
        .select()
        .from(games)
        .where(eq(games.status, 'approved'))
        .orderBy(desc(games.approvedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new Error(`Failed to get published games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取待审核的游戏
  static async getPending(): Promise<Game[]> {
    try {
      return await db
        .select()
        .from(games)
        .where(eq(games.status, 'pending'))
        .orderBy(desc(games.createdAt));
    } catch (error) {
      throw new Error(`Failed to get pending games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 更新游戏
  static async update(id: string, updateData: Partial<NewGame>): Promise<Game | null> {
    try {
      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
      };

      await db.update(games).set(updatedData).where(eq(games.id, id));
      return await this.getById(id);
    } catch (error) {
      throw new Error(`Failed to update game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 更新游戏状态
  static async updateStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    approvedBy?: string,
    rejectionReason?: string
  ): Promise<Game | null> {
    try {
      const updateData: Partial<Game> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = approvedBy;
        updateData.rejectionReason = null; // Clear rejection reason if approved
      } else if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
        updateData.approvedAt = null; // Clear approval data if rejected
        updateData.approvedBy = null;
      }

      await db.update(games).set(updateData).where(eq(games.id, id));
      return await this.getById(id);
    } catch (error) {
      throw new Error(`Failed to update game status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 删除游戏
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(games).where(eq(games.id, id));
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 统计游戏数量
  static async count(status?: 'pending' | 'approved' | 'rejected', search?: string): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(games);
      
      const conditions = [];
      
      if (status) {
        conditions.push(eq(games.status, status));
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push(
          sql`(${games.title} LIKE ${searchTerm} OR ${games.authorName} LIKE ${searchTerm})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const [result] = await query;
      return Number(result.count);
    } catch (error) {
      throw new Error(`Failed to count games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 检查游戏是否存在
  static async exists(id: string): Promise<boolean> {
    try {
      const game = await this.getById(id);
      return game !== null;
    } catch (error) {
      return false;
    }
  }

  // 批量更新游戏状态（用于管理员批量操作）
  static async batchUpdateStatus(
    ids: string[],
    status: 'approved' | 'rejected',
    approvedBy?: string,
    rejectionReason?: string
  ): Promise<number> {
    try {
      const updateData: Partial<Game> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = approvedBy;
        updateData.rejectionReason = null;
      } else if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
        updateData.approvedAt = null;
        updateData.approvedBy = null;
      }

      const results = await Promise.all(
        ids.map(id => db.update(games).set(updateData).where(eq(games.id, id)))
      );

      return results.reduce((total, result) => total + result.affectedRows, 0);
    } catch (error) {
      throw new Error(`Failed to batch update games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 审核日志相关的数据访问函数
export class ReviewLogDAL {
  // 创建审核日志
  static async create(logData: NewReviewLog): Promise<ReviewLog> {
    try {
      const [result] = await db.insert(reviewLogs).values(logData);
      const [log] = await db.select().from(reviewLogs).where(eq(reviewLogs.id, result.insertId));
      if (!log) {
        throw new Error('Failed to create review log');
      }
      return log;
    } catch (error) {
      throw new Error(`Failed to create review log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取游戏的审核日志
  static async getByGameId(gameId: string): Promise<ReviewLog[]> {
    try {
      return await db
        .select()
        .from(reviewLogs)
        .where(eq(reviewLogs.gameId, gameId))
        .orderBy(desc(reviewLogs.createdAt));
    } catch (error) {
      throw new Error(`Failed to get review logs by game ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取审核日志（带游戏信息）
  static async getByGameIdWithGame(gameId: string): Promise<ReviewLogWithGame[]> {
    try {
      const logs = await db
        .select({
          id: reviewLogs.id,
          gameId: reviewLogs.gameId,
          action: reviewLogs.action,
          reason: reviewLogs.reason,
          reviewer: reviewLogs.reviewer,
          createdAt: reviewLogs.createdAt,
          game: {
            id: games.id,
            title: games.title,
            description: games.description,
            authorName: games.authorName,
            status: games.status,
            createdAt: games.createdAt,
            approvedAt: games.approvedAt,
          },
        })
        .from(reviewLogs)
        .innerJoin(games, eq(reviewLogs.gameId, games.id))
        .where(eq(reviewLogs.gameId, gameId))
        .orderBy(desc(reviewLogs.createdAt));

      return logs;
    } catch (error) {
      throw new Error(`Failed to get review logs with game info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取所有审核日志
  static async getAll(limit: number = 50, offset: number = 0): Promise<ReviewLog[]> {
    try {
      return await db
        .select()
        .from(reviewLogs)
        .orderBy(desc(reviewLogs.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new Error(`Failed to get all review logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取所有审核日志（带游戏信息）
  static async getAllWithGame(limit: number = 50, offset: number = 0): Promise<ReviewLogWithGame[]> {
    try {
      const logs = await db
        .select({
          id: reviewLogs.id,
          gameId: reviewLogs.gameId,
          action: reviewLogs.action,
          reason: reviewLogs.reason,
          reviewer: reviewLogs.reviewer,
          createdAt: reviewLogs.createdAt,
          game: {
            id: games.id,
            title: games.title,
            description: games.description,
            authorName: games.authorName,
            status: games.status,
            createdAt: games.createdAt,
            approvedAt: games.approvedAt,
          },
        })
        .from(reviewLogs)
        .innerJoin(games, eq(reviewLogs.gameId, games.id))
        .orderBy(desc(reviewLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return logs;
    } catch (error) {
      throw new Error(`Failed to get all review logs with game info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取审核员的操作日志
  static async getByReviewer(reviewer: string): Promise<ReviewLog[]> {
    try {
      return await db
        .select()
        .from(reviewLogs)
        .where(eq(reviewLogs.reviewer, reviewer))
        .orderBy(desc(reviewLogs.createdAt));
    } catch (error) {
      throw new Error(`Failed to get review logs by reviewer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取审核统计信息
  static async getReviewStats(reviewer?: string): Promise<{
    totalReviews: number;
    approvals: number;
    rejections: number;
  }> {
    try {
      let query = db
        .select({
          action: reviewLogs.action,
          count: count(),
        })
        .from(reviewLogs);

      if (reviewer) {
        query = query.where(eq(reviewLogs.reviewer, reviewer));
      }

      const results = await query.groupBy(reviewLogs.action);

      const stats = {
        totalReviews: 0,
        approvals: 0,
        rejections: 0,
      };

      results.forEach((result) => {
        const reviewCount = Number(result.count);
        stats.totalReviews += reviewCount;
        
        if (result.action === 'approve') {
          stats.approvals = reviewCount;
        } else if (result.action === 'reject') {
          stats.rejections = reviewCount;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get review stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 删除审核日志（通常不需要，但提供接口）
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db.delete(reviewLogs).where(eq(reviewLogs.id, id));
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete review log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 统计审核日志数量
  static async count(gameId?: string, reviewer?: string): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(reviewLogs);

      if (gameId && reviewer) {
        query = query.where(and(eq(reviewLogs.gameId, gameId), eq(reviewLogs.reviewer, reviewer)));
      } else if (gameId) {
        query = query.where(eq(reviewLogs.gameId, gameId));
      } else if (reviewer) {
        query = query.where(eq(reviewLogs.reviewer, reviewer));
      }

      const [result] = await query;
      return Number(result.count);
    } catch (error) {
      throw new Error(`Failed to count review logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}