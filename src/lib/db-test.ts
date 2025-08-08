import { db } from './db';
import { sql } from 'drizzle-orm';

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    // 执行简单的查询来测试连接
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 检查表是否存在
export async function checkTables(): Promise<{ games: boolean; reviewLogs: boolean }> {
  try {
    const [gamesResult] = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'games'
    `);
    
    const [reviewLogsResult] = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'review_logs'
    `);

    return {
      games: Number(gamesResult.count) > 0,
      reviewLogs: Number(reviewLogsResult.count) > 0,
    };
  } catch (error) {
    console.error('检查表结构失败:', error);
    return { games: false, reviewLogs: false };
  }
}

// 获取数据库信息
export async function getDatabaseInfo() {
  try {
    const [versionResult] = await db.execute(sql`SELECT VERSION() as version`);
    const [databaseResult] = await db.execute(sql`SELECT DATABASE() as database_name`);
    
    return {
      version: versionResult.version,
      database: databaseResult.database_name,
    };
  } catch (error) {
    console.error('获取数据库信息失败:', error);
    return null;
  }
}