import { z } from 'zod';

// 游戏提交验证schema
export const gameSubmissionSchema = z.object({
  title: z
    .string()
    .min(1, '游戏标题不能为空')
    .max(255, '游戏标题不能超过255个字符')
    .trim(),
  description: z
    .string()
    .max(1000, '游戏描述不能超过1000个字符')
    .trim()
    .optional()
    .or(z.literal('')),
  htmlContent: z
    .string()
    .min(1, 'HTML内容不能为空')
    .max(5 * 1024 * 1024, 'HTML内容不能超过5MB'), // 5MB limit
  authorName: z
    .string()
    .max(100, '作者名称不能超过100个字符')
    .trim()
    .optional()
    .or(z.literal('')),
});

// 游戏更新验证schema
export const gameUpdateSchema = z.object({
  title: z
    .string()
    .min(1, '游戏标题不能为空')
    .max(255, '游戏标题不能超过255个字符')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, '游戏描述不能超过1000个字符')
    .trim()
    .optional(),
  htmlContent: z
    .string()
    .min(1, 'HTML内容不能为空')
    .max(5 * 1024 * 1024, 'HTML内容不能超过5MB')
    .optional(),
  authorName: z
    .string()
    .max(100, '作者名称不能超过100个字符')
    .trim()
    .optional(),
});

// 游戏审核验证schema
export const reviewGameSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    required_error: '必须选择审核操作',
    invalid_type_error: '审核操作必须是approve或reject',
  }),
  reason: z
    .string()
    .max(500, '审核原因不能超过500个字符')
    .trim()
    .optional()
    .or(z.literal('')),
  reviewer: z
    .string()
    .min(1, '审核员名称不能为空')
    .max(100, '审核员名称不能超过100个字符')
    .trim(),
});

// 游戏ID验证schema
export const gameIdSchema = z.object({
  id: z
    .string()
    .min(1, '游戏ID不能为空')
    .uuid('游戏ID格式不正确'),
});

// 分页参数验证schema
export const paginationSchema = z.object({
  page: z
    .number()
    .int('页码必须是整数')
    .min(1, '页码必须大于0')
    .default(1),
  limit: z
    .number()
    .int('每页数量必须是整数')
    .min(1, '每页数量必须大于0')
    .max(100, '每页数量不能超过100')
    .default(10),
});

// 游戏状态过滤验证schema
export const gameStatusFilterSchema = z.object({
  status: z
    .enum(['pending', 'approved', 'rejected'])
    .optional(),
});

// 搜索参数验证schema
export const searchSchema = z.object({
  search: z
    .string()
    .max(100, '搜索关键词不能超过100个字符')
    .trim()
    .optional(),
});

// 游戏列表查询参数验证schema
export const gameListQuerySchema = paginationSchema.merge(gameStatusFilterSchema).merge(searchSchema);

// HTML内容安全验证schema
export const htmlContentSecuritySchema = z.object({
  content: z.string().min(1, 'HTML内容不能为空'),
});

// 类型导出
export type GameSubmissionInput = z.infer<typeof gameSubmissionSchema>;
export type GameUpdateInput = z.infer<typeof gameUpdateSchema>;
export type ReviewGameInput = z.infer<typeof reviewGameSchema>;
export type GameIdInput = z.infer<typeof gameIdSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type GameStatusFilterInput = z.infer<typeof gameStatusFilterSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type GameListQueryInput = z.infer<typeof gameListQuerySchema>;
export type HtmlContentSecurityInput = z.infer<typeof htmlContentSecuritySchema>;
