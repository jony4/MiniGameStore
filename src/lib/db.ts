import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from '@planetscale/database';
import * as schema from './schema';

// 创建PlanetScale连接
const connection = connect({
  url: process.env.DATABASE_URL,
});

// 创建Drizzle数据库实例
export const db = drizzle(connection, { schema });

// 数据库连接类型
export type Database = typeof db;
