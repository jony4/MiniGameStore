#!/usr/bin/env tsx

import { createTables, dropTables } from '../src/lib/migrations';
import { testConnection, checkTables, getDatabaseInfo } from '../src/lib/db-test';

async function main() {
  const command = process.argv[2];

  console.log('🚀 数据库迁移工具');
  console.log('==================');

  // 测试数据库连接
  const isConnected = await testConnection();
  if (!isConnected) {
    process.exit(1);
  }

  // 显示数据库信息
  const dbInfo = await getDatabaseInfo();
  if (dbInfo) {
    console.log(`📊 数据库版本: ${dbInfo.version}`);
    console.log(`📁 数据库名称: ${dbInfo.database}`);
  }

  switch (command) {
    case 'up':
      console.log('\n📈 执行数据库迁移...');
      await createTables();
      break;

    case 'down':
      console.log('\n📉 回滚数据库迁移...');
      await dropTables();
      break;

    case 'reset':
      console.log('\n🔄 重置数据库...');
      await dropTables();
      await createTables();
      break;

    case 'status':
      console.log('\n📋 检查表状态...');
      const tables = await checkTables();
      console.log(`Games表: ${tables.games ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`ReviewLogs表: ${tables.reviewLogs ? '✅ 存在' : '❌ 不存在'}`);
      break;

    default:
      console.log('\n使用方法:');
      console.log('  npm run db:migrate up     - 创建表');
      console.log('  npm run db:migrate down   - 删除表');
      console.log('  npm run db:migrate reset  - 重置表');
      console.log('  npm run db:migrate status - 检查表状态');
      break;
  }

  console.log('\n✨ 完成!');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});