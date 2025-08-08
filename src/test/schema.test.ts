import { describe, it, expect } from 'vitest';
import type { 
  Game, 
  NewGame, 
  ReviewLog, 
  NewReviewLog, 
  GameWithMetadata,
  GameListItem,
  GameSubmission,
  ReviewLogWithGame
} from '../lib/schema';

describe('Schema Types', () => {
  describe('Game type', () => {
    it('should have all required properties', () => {
      const game: Game = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '测试游戏',
        description: '测试描述',
        htmlContent: '<html><body>Test</body></html>',
        authorName: '测试作者',
        status: 'pending',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
      };

      expect(game.id).toBeDefined();
      expect(game.title).toBeDefined();
      expect(game.htmlContent).toBeDefined();
      expect(game.status).toBeDefined();
      expect(game.createdAt).toBeDefined();
      expect(game.updatedAt).toBeDefined();
    });

    it('should allow null values for optional fields', () => {
      const game: Game = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '测试游戏',
        description: null,
        htmlContent: '<html><body>Test</body></html>',
        authorName: null,
        status: 'approved',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: '管理员',
      };

      expect(game.description).toBeNull();
      expect(game.authorName).toBeNull();
      expect(game.rejectionReason).toBeNull();
    });

    it('should support all valid status values', () => {
      const statuses: Array<Game['status']> = ['pending', 'approved', 'rejected'];
      
      statuses.forEach(status => {
        const game: Game = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '测试游戏',
          description: null,
          htmlContent: '<html><body>Test</body></html>',
          authorName: null,
          status,
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedAt: null,
          approvedBy: null,
        };

        expect(game.status).toBe(status);
      });
    });
  });

  describe('NewGame type', () => {
    it('should allow creating game without timestamps', () => {
      const newGame: NewGame = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '新游戏',
        description: '新游戏描述',
        htmlContent: '<html><body>New Game</body></html>',
        authorName: '作者',
        status: 'pending',
      };

      expect(newGame.id).toBeDefined();
      expect(newGame.title).toBeDefined();
      expect(newGame.htmlContent).toBeDefined();
      expect(newGame.status).toBeDefined();
    });

    it('should allow minimal game creation', () => {
      const newGame: NewGame = {
        title: '最小游戏',
        htmlContent: '<html><body>Minimal</body></html>',
      };

      expect(newGame.title).toBeDefined();
      expect(newGame.htmlContent).toBeDefined();
    });
  });

  describe('ReviewLog type', () => {
    it('should have all required properties', () => {
      const reviewLog: ReviewLog = {
        id: 1,
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reason: null,
        reviewer: '管理员',
        createdAt: new Date(),
      };

      expect(reviewLog.id).toBeDefined();
      expect(reviewLog.gameId).toBeDefined();
      expect(reviewLog.action).toBeDefined();
      expect(reviewLog.reviewer).toBeDefined();
      expect(reviewLog.createdAt).toBeDefined();
    });

    it('should support both approve and reject actions', () => {
      const approveLog: ReviewLog = {
        id: 1,
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reason: null,
        reviewer: '管理员',
        createdAt: new Date(),
      };

      const rejectLog: ReviewLog = {
        id: 2,
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'reject',
        reason: '内容不符合规范',
        reviewer: '管理员',
        createdAt: new Date(),
      };

      expect(approveLog.action).toBe('approve');
      expect(rejectLog.action).toBe('reject');
      expect(rejectLog.reason).toBeDefined();
    });
  });

  describe('NewReviewLog type', () => {
    it('should allow creating review log without id and timestamp', () => {
      const newReviewLog: NewReviewLog = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reviewer: '管理员',
      };

      expect(newReviewLog.gameId).toBeDefined();
      expect(newReviewLog.action).toBeDefined();
      expect(newReviewLog.reviewer).toBeDefined();
    });

    it('should allow optional reason field', () => {
      const newReviewLog: NewReviewLog = {
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'reject',
        reason: '内容违规',
        reviewer: '管理员',
      };

      expect(newReviewLog.reason).toBe('内容违规');
    });
  });

  describe('GameWithMetadata type', () => {
    it('should extend Game with metadata properties', () => {
      const gameWithMetadata: GameWithMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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
        isApproved: true,
        isPending: false,
        isRejected: false,
        canBeShared: true,
      };

      expect(gameWithMetadata.isApproved).toBe(true);
      expect(gameWithMetadata.isPending).toBe(false);
      expect(gameWithMetadata.isRejected).toBe(false);
      expect(gameWithMetadata.canBeShared).toBe(true);
    });

    it('should have correct metadata for pending game', () => {
      const gameWithMetadata: GameWithMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '待审核游戏',
        description: null,
        htmlContent: '<html><body>Pending</body></html>',
        authorName: null,
        status: 'pending',
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
        isApproved: false,
        isPending: true,
        isRejected: false,
        canBeShared: false,
      };

      expect(gameWithMetadata.isApproved).toBe(false);
      expect(gameWithMetadata.isPending).toBe(true);
      expect(gameWithMetadata.isRejected).toBe(false);
      expect(gameWithMetadata.canBeShared).toBe(false);
    });

    it('should have correct metadata for rejected game', () => {
      const gameWithMetadata: GameWithMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '被拒绝游戏',
        description: null,
        htmlContent: '<html><body>Rejected</body></html>',
        authorName: null,
        status: 'rejected',
        rejectionReason: '内容不符合规范',
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
        isApproved: false,
        isPending: false,
        isRejected: true,
        canBeShared: false,
      };

      expect(gameWithMetadata.isApproved).toBe(false);
      expect(gameWithMetadata.isPending).toBe(false);
      expect(gameWithMetadata.isRejected).toBe(true);
      expect(gameWithMetadata.canBeShared).toBe(false);
    });
  });

  describe('GameListItem type', () => {
    it('should contain essential game information without HTML content', () => {
      const gameListItem: GameListItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '游戏列表项',
        description: '游戏描述',
        authorName: '作者',
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
      };

      expect(gameListItem.id).toBeDefined();
      expect(gameListItem.title).toBeDefined();
      expect(gameListItem.status).toBeDefined();
      expect(gameListItem.createdAt).toBeDefined();
      // Should not have htmlContent property
      expect('htmlContent' in gameListItem).toBe(false);
    });

    it('should allow null values for optional fields', () => {
      const gameListItem: GameListItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '简单游戏',
        description: null,
        authorName: null,
        status: 'pending',
        createdAt: new Date(),
        approvedAt: null,
      };

      expect(gameListItem.description).toBeNull();
      expect(gameListItem.authorName).toBeNull();
      expect(gameListItem.approvedAt).toBeNull();
    });
  });

  describe('GameSubmission type', () => {
    it('should contain fields for game submission', () => {
      const gameSubmission: GameSubmission = {
        title: '提交的游戏',
        description: '游戏描述',
        htmlContent: '<html><body>Submitted Game</body></html>',
        authorName: '提交者',
      };

      expect(gameSubmission.title).toBeDefined();
      expect(gameSubmission.description).toBeDefined();
      expect(gameSubmission.htmlContent).toBeDefined();
      expect(gameSubmission.authorName).toBeDefined();
    });

    it('should allow optional author name', () => {
      const gameSubmission: GameSubmission = {
        title: '匿名游戏',
        description: '匿名提交的游戏',
        htmlContent: '<html><body>Anonymous Game</body></html>',
      };

      expect(gameSubmission.title).toBeDefined();
      expect(gameSubmission.description).toBeDefined();
      expect(gameSubmission.htmlContent).toBeDefined();
      expect(gameSubmission.authorName).toBeUndefined();
    });
  });

  describe('ReviewLogWithGame type', () => {
    it('should combine review log with game information', () => {
      const reviewLogWithGame: ReviewLogWithGame = {
        id: 1,
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        reason: null,
        reviewer: '管理员',
        createdAt: new Date(),
        game: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '关联的游戏',
          description: '游戏描述',
          authorName: '作者',
          status: 'approved',
          createdAt: new Date(),
          approvedAt: new Date(),
        },
      };

      expect(reviewLogWithGame.id).toBeDefined();
      expect(reviewLogWithGame.gameId).toBeDefined();
      expect(reviewLogWithGame.action).toBeDefined();
      expect(reviewLogWithGame.reviewer).toBeDefined();
      expect(reviewLogWithGame.game).toBeDefined();
      expect(reviewLogWithGame.game.id).toBe(reviewLogWithGame.gameId);
    });

    it('should support reject action with reason', () => {
      const reviewLogWithGame: ReviewLogWithGame = {
        id: 2,
        gameId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'reject',
        reason: '内容不合适',
        reviewer: '管理员',
        createdAt: new Date(),
        game: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '被拒绝的游戏',
          description: null,
          authorName: null,
          status: 'rejected',
          createdAt: new Date(),
          approvedAt: null,
        },
      };

      expect(reviewLogWithGame.action).toBe('reject');
      expect(reviewLogWithGame.reason).toBe('内容不合适');
      expect(reviewLogWithGame.game.status).toBe('rejected');
    });
  });
});