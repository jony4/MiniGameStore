import { sql } from 'drizzle-orm';
import { db } from './db';

// 数据库迁移脚本
export async function createTables() {
  try {
    // 创建games表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        html_content LONGTEXT NOT NULL,
        author_name VARCHAR(100),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        approved_by VARCHAR(100),
        
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_approved_at (approved_at)
      )
    `);

    // 创建review_logs表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS review_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        action ENUM('approve', 'reject') NOT NULL,
        reason TEXT,
        reviewer VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        INDEX idx_game_id (game_id),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log('数据库表创建成功');
  } catch (error) {
    console.error('数据库表创建失败:', error);
    throw error;
  }
}

// 删除所有表（用于开发环境重置）
export async function dropTables() {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS review_logs`);
    await db.execute(sql`DROP TABLE IF EXISTS games`);
    console.log('数据库表删除成功');
  } catch (error) {
    console.error('数据库表删除失败:', error);
    throw error;
  }
}