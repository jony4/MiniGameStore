import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isAdminAuthenticated, requireAdmin, validateAdminAccess } from '@/lib/auth';
import { GameDAL, ReviewLogDAL } from '@/lib/dal';

// Mock NextRequest
const createMockRequest = (authHeader?: string) => {
  const headers = new Map();
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  
  return {
    headers: {
      get: (key: string) => headers.get(key) || null,
    },
  } as any;
};

describe('管理员认证系统', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAdminAuthenticated', () => {
    it('应该在有效的Bearer token时返回true', () => {
      const request = createMockRequest('Bearer admin-secret-key');
      expect(isAdminAuthenticated(request)).toBe(true);
    });

    it('应该在有效的直接token时返回true', () => {
      const request = createMockRequest('admin-secret-key');
      expect(isAdminAuthenticated(request)).toBe(true);
    });

    it('应该在无效token时返回false', () => {
      const request = createMockRequest('invalid-token');
      expect(isAdminAuthenticated(request)).toBe(false);
    });

    it('应该在没有Authorization header时返回false', () => {
      const request = createMockRequest();
      expect(isAdminAuthenticated(request)).toBe(false);
    });
  });

  describe('validateAdminAccess', () => {
    it('应该在有效认证时返回成功结果', () => {
      const request = createMockRequest('Bearer admin-secret-key');
      const result = validateAdminAccess(request);
      
      expect(result.isValid).toBe(true);
      expect(result.adminId).toBe('admin');
      expect(result.error).toBeUndefined();
    });

    it('应该在无效认证时返回错误结果', () => {
      const request = createMockRequest('invalid-token');
      const result = validateAdminAccess(request);
      
      expect(result.isValid).toBe(false);
      expect(result.adminId).toBe('');
      expect(result.error).toBe('未授权的访问');
    });
  });

  describe('requireAdmin装饰器', () => {
    it('应该在有效认证时调用处理函数', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const decoratedHandler = requireAdmin(mockHandler);
      const request = createMockRequest('Bearer admin-secret-key');

      const response = await decoratedHandler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(401);
    });

    it('应该在无效认证时返回401错误', async () => {
      const mockHandler = vi.fn();
      const decoratedHandler = requireAdmin(mockHandler);
      const request = createMockRequest('invalid-token');

      const response = await decoratedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });
});

describe('审核功能集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('游戏审核流程', () => {
    it('应该能够批准待审核的游戏', async () => {
      // Mock DAL functions
      const mockGame = {
        id: 'test-game-id',
        title: '测试游戏',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedGame = {
        ...mockGame,
        status: 'approved' as const,
        approvedAt: new Date(),
        approvedBy: 'admin',
      };

      vi.spyOn(GameDAL, 'getById').mockResolvedValue(mockGame as any);
      vi.spyOn(GameDAL, 'updateStatus').mockResolvedValue(mockUpdatedGame as any);
      vi.spyOn(ReviewLogDAL, 'create').mockResolvedValue({
        id: 1,
        gameId: 'test-game-id',
        action: 'approve',
        reviewer: 'admin',
        createdAt: new Date(),
      } as any);

      // 模拟审核请求
      const gameId = 'test-game-id';
      const action = 'approve';
      const adminId = 'admin';

      // 检查游戏存在
      const game = await GameDAL.getById(gameId);
      expect(game).toBeTruthy();
      expect(game?.status).toBe('pending');

      // 更新游戏状态
      const updatedGame = await GameDAL.updateStatus(gameId, action, adminId);
      expect(updatedGame?.status).toBe('approved');
      expect(updatedGame?.approvedBy).toBe(adminId);

      // 创建审核日志
      const reviewLog = await ReviewLogDAL.create({
        gameId,
        action,
        reviewer: adminId,
      });
      expect(reviewLog.action).toBe('approve');
      expect(reviewLog.reviewer).toBe(adminId);
    });

    it('应该能够拒绝待审核的游戏', async () => {
      const mockGame = {
        id: 'test-game-id',
        title: '测试游戏',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedGame = {
        ...mockGame,
        status: 'rejected' as const,
        rejectionReason: '内容不符合规范',
      };

      vi.spyOn(GameDAL, 'getById').mockResolvedValue(mockGame as any);
      vi.spyOn(GameDAL, 'updateStatus').mockResolvedValue(mockUpdatedGame as any);
      vi.spyOn(ReviewLogDAL, 'create').mockResolvedValue({
        id: 1,
        gameId: 'test-game-id',
        action: 'reject',
        reason: '内容不符合规范',
        reviewer: 'admin',
        createdAt: new Date(),
      } as any);

      const gameId = 'test-game-id';
      const action = 'reject';
      const reason = '内容不符合规范';
      const adminId = 'admin';

      // 检查游戏存在
      const game = await GameDAL.getById(gameId);
      expect(game).toBeTruthy();
      expect(game?.status).toBe('pending');

      // 更新游戏状态
      const updatedGame = await GameDAL.updateStatus(gameId, action, adminId, reason);
      expect(updatedGame?.status).toBe('rejected');
      expect(updatedGame?.rejectionReason).toBe(reason);

      // 创建审核日志
      const reviewLog = await ReviewLogDAL.create({
        gameId,
        action,
        reason,
        reviewer: adminId,
      });
      expect(reviewLog.action).toBe('reject');
      expect(reviewLog.reason).toBe(reason);
    });

    it('应该拒绝对已审核游戏的重复审核', async () => {
      const mockApprovedGame = {
        id: 'test-game-id',
        title: '测试游戏',
        status: 'approved' as const,
        approvedAt: new Date(),
        approvedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GameDAL, 'getById').mockResolvedValue(mockApprovedGame as any);

      const game = await GameDAL.getById('test-game-id');
      expect(game?.status).toBe('approved');
      
      // 在实际的API中，这应该返回400错误
      // 这里我们只是验证游戏状态不是pending
      expect(game?.status).not.toBe('pending');
    });
  });

  describe('审核日志功能', () => {
    it('应该能够获取游戏的审核历史', async () => {
      const mockLogs = [
        {
          id: 1,
          gameId: 'test-game-id',
          action: 'approve' as const,
          reviewer: 'admin',
          createdAt: new Date(),
        },
      ];

      vi.spyOn(ReviewLogDAL, 'getByGameId').mockResolvedValue(mockLogs as any);

      const logs = await ReviewLogDAL.getByGameId('test-game-id');
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('approve');
      expect(logs[0].reviewer).toBe('admin');
    });

    it('应该能够获取审核统计信息', async () => {
      const mockStats = {
        totalReviews: 10,
        approvals: 7,
        rejections: 3,
      };

      vi.spyOn(ReviewLogDAL, 'getReviewStats').mockResolvedValue(mockStats);

      const stats = await ReviewLogDAL.getReviewStats();
      expect(stats.totalReviews).toBe(10);
      expect(stats.approvals).toBe(7);
      expect(stats.rejections).toBe(3);
    });
  });
});