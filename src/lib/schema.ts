import { mysqlTable, varchar, text, longtext, timestamp, int, mysqlEnum } from 'drizzle-orm/mysql-core';

// 游戏表
export const games = mysqlTable('games', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  htmlContent: longtext('html_content').notNull(),
  authorName: varchar('author_name', { length: 100 }),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  approvedAt: timestamp('approved_at'),
  approvedBy: varchar('approved_by', { length: 100 }),
});

// 审核日志表
export const reviewLogs = mysqlTable('review_logs', {
  id: int('id').primaryKey().autoincrement(),
  gameId: varchar('game_id', { length: 36 }).notNull(),
  action: mysqlEnum('action', ['approve', 'reject']).notNull(),
  reason: text('reason'),
  reviewer: varchar('reviewer', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// TypeScript类型定义
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type ReviewLog = typeof reviewLogs.$inferSelect;
export type NewReviewLog = typeof reviewLogs.$inferInsert;

// 扩展的接口定义，包含业务逻辑相关的类型
export interface GameWithMetadata extends Game {
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  canBeShared: boolean;
}

export interface GameListItem {
  id: string;
  title: string;
  description: string | null;
  authorName: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt: Date | null;
}

export interface GameSubmission {
  title: string;
  description: string;
  htmlContent: string;
  authorName?: string;
}

export interface ReviewLogWithGame extends ReviewLog {
  game: GameListItem;
}