import { describe, it, expect } from 'vitest';
import {
  gameSubmissionSchema,
  gameUpdateSchema,
  reviewGameSchema,
  gameIdSchema,
  paginationSchema,
  gameStatusFilterSchema,
  gameListQuerySchema,
  htmlContentSecuritySchema,
} from '../lib/validation';

describe('Validation Schemas', () => {
  describe('gameSubmissionSchema', () => {
    it('should validate valid game submission', () => {
      const validData = {
        title: '测试游戏',
        description: '这是一个测试游戏',
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
        authorName: '测试作者',
      };

      const result = gameSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate game submission without optional fields', () => {
      const validData = {
        title: '测试游戏',
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
      };

      const result = gameSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('游戏标题不能为空');
      }
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256),
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('游戏标题不能超过255个字符');
      }
    });

    it('should reject empty HTML content', () => {
      const invalidData = {
        title: '测试游戏',
        htmlContent: '',
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('HTML内容不能为空');
      }
    });

    it('should reject HTML content that is too large', () => {
      const invalidData = {
        title: '测试游戏',
        htmlContent: 'a'.repeat(5 * 1024 * 1024 + 1), // 5MB + 1 byte
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('HTML内容不能超过5MB');
      }
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        title: '测试游戏',
        description: 'a'.repeat(1001),
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('游戏描述不能超过1000个字符');
      }
    });

    it('should reject author name that is too long', () => {
      const invalidData = {
        title: '测试游戏',
        htmlContent: '<html><body><h1>Hello Game</h1></body></html>',
        authorName: 'a'.repeat(101),
      };

      const result = gameSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('作者名称不能超过100个字符');
      }
    });
  });

  describe('gameUpdateSchema', () => {
    it('should validate partial game update', () => {
      const validData = {
        title: '更新的游戏标题',
      };

      const result = gameUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty update object', () => {
      const validData = {};

      const result = gameUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('reviewGameSchema', () => {
    it('should validate approve action', () => {
      const validData = {
        action: 'approve' as const,
        reviewer: '管理员',
      };

      const result = reviewGameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate reject action with reason', () => {
      const validData = {
        action: 'reject' as const,
        reason: '内容不符合规范',
        reviewer: '管理员',
      };

      const result = reviewGameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const invalidData = {
        action: 'invalid',
        reviewer: '管理员',
      };

      const result = reviewGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty reviewer', () => {
      const invalidData = {
        action: 'approve' as const,
        reviewer: '',
      };

      const result = reviewGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('审核员名称不能为空');
      }
    });

    it('should reject reason that is too long', () => {
      const invalidData = {
        action: 'reject' as const,
        reason: 'a'.repeat(501),
        reviewer: '管理员',
      };

      const result = reviewGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('审核原因不能超过500个字符');
      }
    });
  });

  describe('gameIdSchema', () => {
    it('should validate valid UUID', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = gameIdSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        id: 'invalid-uuid',
      };

      const result = gameIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('游戏ID格式不正确');
      }
    });

    it('should reject empty ID', () => {
      const invalidData = {
        id: '',
      };

      const result = gameIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('游戏ID不能为空');
      }
    });
  });

  describe('paginationSchema', () => {
    it('should validate valid pagination', () => {
      const validData = {
        page: 1,
        limit: 10,
      };

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const validData = {};

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject negative page', () => {
      const invalidData = {
        page: 0,
        limit: 10,
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('页码必须大于0');
      }
    });

    it('should reject limit that is too large', () => {
      const invalidData = {
        page: 1,
        limit: 101,
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('每页数量不能超过100');
      }
    });

    it('should reject non-integer values', () => {
      const invalidData = {
        page: 1.5,
        limit: 10.5,
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('gameStatusFilterSchema', () => {
    it('should validate valid status', () => {
      const validData = {
        status: 'approved' as const,
      };

      const result = gameStatusFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without status', () => {
      const validData = {};

      const result = gameStatusFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid',
      };

      const result = gameStatusFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('gameListQuerySchema', () => {
    it('should validate combined query parameters', () => {
      const validData = {
        page: 2,
        limit: 20,
        status: 'pending' as const,
      };

      const result = gameListQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use defaults for missing values', () => {
      const validData = {
        status: 'approved' as const,
      };

      const result = gameListQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.status).toBe('approved');
      }
    });
  });

  describe('htmlContentSecuritySchema', () => {
    it('should validate non-empty HTML content', () => {
      const validData = {
        content: '<html><body>Hello</body></html>',
      };

      const result = htmlContentSecuritySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidData = {
        content: '',
      };

      const result = htmlContentSecuritySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('HTML内容不能为空');
      }
    });
  });
});