// 数据库相关的类型定义
export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 游戏状态枚举
export enum GameStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// 审核操作枚举
export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

// 错误代码枚举
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  INVALID_HTML = 'INVALID_HTML',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  MALICIOUS_CONTENT = 'MALICIOUS_CONTENT',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// API错误类型
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
}