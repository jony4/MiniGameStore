import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameDAL, ReviewLogDAL } from '../lib/dal';
import { db } from '../lib/db';
import type { Game, NewGame, ReviewLog, NewReviewLog } from '../lib/schema';

// Mock the database
vi.mock('../lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

const mockDb = vi.mocked(db);

describe('GameDAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new game successfully', async () => {
      const newGame: NewGame = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'pending',
      };

      const createdGame: Game = {
        ...newGame,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
      };

      // Mock the insert operation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      } as any);

      // Mock the select operation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([createdGame]),
        }),
      } as any);

      const result = await GameDAL.create(newGame);

      expect(result).toEqual(createdGame);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error when game creation fails', async () => {
      const newGame: NewGame = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '测试游戏',
        htmlContent: '<html><body>Test</body></html>',
        status: 'pending',
      };

      // Mock database error
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(GameDAL.create(newGame)).rejects.toThrow('Failed to create game: Database error');
    });
  });

  describe('getById', () => {
    it('should return game when found', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const game: Game = {
        id: gameId,
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'approved',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: '管理员',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([game]),
        }),
      } as any);

      const result = await GameDAL.getById(gameId);

      expect(result).toEqual(game);
    });

    it('should return null when game not found', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await GameDAL.getById(gameId);

      expect(result).toBeNull();
    });

    it('should throw error when database operation fails', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      } as any);

      await expect(GameDAL.getById(gameId)).rejects.toThrow('Failed to get game by ID: Database error');
    });
  });

  describe('getByIdWithMetadata', () => {
    it('should return game with metadata when found', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const game: Game = {
        id: gameId,
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'approved',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: '管理员',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([game]),
        }),
      } as any);

      const result = await GameDAL.getByIdWithMetadata(gameId);

      expect(result).toEqual({
        ...game,
        isApproved: true,
        isPending: false,
        isRejected: false,
        canBeShared: true,
      });
    });

    it('should return null when game not found', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await GameDAL.getByIdWithMetadata(gameId);

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update game status to approved', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const approvedBy = '管理员';

      const updatedGame: Game = {
        id: gameId,
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'approved',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy,
      };

      // Mock update operation
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
        }),
      } as any);

      // Mock select operation for getById
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([updatedGame]),
        }),
      } as any);

      const result = await GameDAL.updateStatus(gameId, 'approved', approvedBy);

      expect(result).toEqual(updatedGame);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should update game status to rejected with reason', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const rejectionReason = '内容不符合规范';

      const updatedGame: Game = {
        id: gameId,
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'rejected',
        rejectionReason,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
      };

      // Mock update operation
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
        }),
      } as any);

      // Mock select operation for getById
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([updatedGame]),
        }),
      } as any);

      const result = await GameDAL.updateStatus(gameId, 'rejected', undefined, rejectionReason);

      expect(result).toEqual(updatedGame);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete game successfully', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
      } as any);

      const result = await GameDAL.delete(gameId);

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return false when game not found', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ affectedRows: 0 }),
      } as any);

      const result = await GameDAL.delete(gameId);

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all games', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 5 }]),
      } as any);

      const result = await GameDAL.count();

      expect(result).toBe(5);
    });

    it('should count games by status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      } as any);

      const result = await GameDAL.count('approved');

      expect(result).toBe(3);
    });
  });

  describe('exists', () => {
    it('should return true when game exists', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: gameId }]),
        }),
      } as any);

      const result = await GameDAL.exists(gameId);

      expect(result).toBe(true);
    });

    it('should return false when game does not exist', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await GameDAL.exists(gameId);

      expect(result).toBe(false);
    });

    it('should return false when database error occurs', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      } as any);

      const result = await GameDAL.exists(gameId);

      expect(result).toBe(false);
    });
  });
});

describe('ReviewLogDAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new review log successfully', async () => {
      const newReviewLog: NewReviewLog = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reviewer: '管理员',
      };

      const createdReviewLog: ReviewLog = {
        id: 1,
        ...newReviewLog,
        reason: null,
        createdAt: new Date(),
      };

      // Mock the insert operation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      } as any);

      // Mock the select operation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([createdReviewLog]),
        }),
      } as any);

      const result = await ReviewLogDAL.create(newReviewLog);

      expect(result).toEqual(createdReviewLog);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error when review log creation fails', async () => {
      const newReviewLog: NewReviewLog = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reviewer: '管理员',
      };

      // Mock database error
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(ReviewLogDAL.create(newReviewLog)).rejects.toThrow('Failed to create review log: Database error');
    });
  });

  describe('getByGameId', () => {
    it('should return review logs for a game', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const reviewLogs: ReviewLog[] = [
        {
          id: 1,
          gameId,
          action: 'approve',
          reason: null,
          reviewer: '管理员',
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(reviewLogs),
          }),
        }),
      } as any);

      const result = await ReviewLogDAL.getByGameId(gameId);

      expect(result).toEqual(reviewLogs);
    });

    it('should throw error when database operation fails', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      } as any);

      await expect(ReviewLogDAL.getByGameId(gameId)).rejects.toThrow('Failed to get review logs by game ID: Database error');
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics', async () => {
      const mockResults = [
        { action: 'approve', count: 10 },
        { action: 'reject', count: 5 },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue(mockResults),
        }),
      } as any);

      const result = await ReviewLogDAL.getReviewStats();

      expect(result).toEqual({
        totalReviews: 15,
        approvals: 10,
        rejections: 5,
      });
    });

    it('should return review statistics for specific reviewer', async () => {
      const reviewer = '管理员';
      const mockResults = [
        { action: 'approve', count: 8 },
        { action: 'reject', count: 2 },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockResults),
          }),
        }),
      } as any);

      const result = await ReviewLogDAL.getReviewStats(reviewer);

      expect(result).toEqual({
        totalReviews: 10,
        approvals: 8,
        rejections: 2,
      });
    });

    it('should handle empty results', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await ReviewLogDAL.getReviewStats();

      expect(result).toEqual({
        totalReviews: 0,
        approvals: 0,
        rejections: 0,
      });
    });
  });

  describe('count', () => {
    it('should count all review logs', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 15 }]),
      } as any);

      const result = await ReviewLogDAL.count();

      expect(result).toBe(15);
    });

    it('should count review logs by game ID', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      } as any);

      const result = await ReviewLogDAL.count(gameId);

      expect(result).toBe(3);
    });

    it('should count review logs by reviewer', async () => {
      const reviewer = '管理员';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 10 }]),
        }),
      } as any);

      const result = await ReviewLogDAL.count(undefined, reviewer);

      expect(result).toBe(10);
    });

    it('should count review logs by both game ID and reviewer', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const reviewer = '管理员';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      } as any);

      const result = await ReviewLogDAL.count(gameId, reviewer);

      expect(result).toBe(1);
    });
  });
});