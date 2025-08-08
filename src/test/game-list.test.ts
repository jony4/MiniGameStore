import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameDAL } from '@/lib/dal';
import { v4 as uuidv4 } from 'uuid';

describe('GameDAL - List and Search', () => {
  const testGames = [
    {
      id: uuidv4(),
      title: '测试游戏1',
      description: '这是一个测试游戏',
      htmlContent: '<div>Test Game 1</div>',
      authorName: '测试作者1',
      status: 'approved' as const,
    },
    {
      id: uuidv4(),
      title: '另一个游戏',
      description: '另一个测试游戏',
      htmlContent: '<div>Test Game 2</div>',
      authorName: '测试作者2',
      status: 'approved' as const,
    },
    {
      id: uuidv4(),
      title: '待审核游戏',
      description: '等待审核的游戏',
      htmlContent: '<div>Pending Game</div>',
      authorName: '待审核作者',
      status: 'pending' as const,
    },
  ];

  beforeEach(async () => {
    // 创建测试游戏
    for (const game of testGames) {
      await GameDAL.create(game);
    }
  });

  afterEach(async () => {
    // 清理测试数据
    for (const game of testGames) {
      await GameDAL.delete(game.id);
    }
  });

  it('应该能够获取游戏列表', async () => {
    const result = await GameDAL.getListItems({ page: 1, limit: 10 });
    
    expect(result.games).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.games.length).toBeGreaterThanOrEqual(3);
  });

  it('应该能够按状态筛选游戏', async () => {
    const result = await GameDAL.getListItems(
      { page: 1, limit: 10 },
      { status: 'approved' }
    );
    
    expect(result.games).toBeDefined();
    expect(result.games.every(game => game.status === 'approved')).toBe(true);
    expect(result.games.length).toBeGreaterThanOrEqual(2);
  });

  it('应该能够搜索游戏标题', async () => {
    const result = await GameDAL.getListItems(
      { page: 1, limit: 10 },
      { search: '测试游戏1' }
    );
    
    expect(result.games).toBeDefined();
    expect(result.games.length).toBeGreaterThanOrEqual(1);
    expect(result.games.some(game => game.title.includes('测试游戏1'))).toBe(true);
  });

  it('应该能够搜索作者名称', async () => {
    const result = await GameDAL.getListItems(
      { page: 1, limit: 10 },
      { search: '测试作者1' }
    );
    
    expect(result.games).toBeDefined();
    expect(result.games.length).toBeGreaterThanOrEqual(1);
    expect(result.games.some(game => game.authorName?.includes('测试作者1'))).toBe(true);
  });

  it('应该能够组合筛选条件', async () => {
    const result = await GameDAL.getListItems(
      { page: 1, limit: 10 },
      { status: 'approved', search: '测试' }
    );
    
    expect(result.games).toBeDefined();
    expect(result.games.every(game => game.status === 'approved')).toBe(true);
    expect(result.games.every(game => 
      game.title.includes('测试') || game.authorName?.includes('测试')
    )).toBe(true);
  });

  it('应该支持分页', async () => {
    const page1 = await GameDAL.getListItems({ page: 1, limit: 2 });
    const page2 = await GameDAL.getListItems({ page: 2, limit: 2 });
    
    expect(page1.games).toBeDefined();
    expect(page2.games).toBeDefined();
    expect(page1.games.length).toBeLessThanOrEqual(2);
    expect(page2.games.length).toBeLessThanOrEqual(2);
    
    // 确保分页结果不重复
    const page1Ids = page1.games.map(game => game.id);
    const page2Ids = page2.games.map(game => game.id);
    const intersection = page1Ids.filter(id => page2Ids.includes(id));
    expect(intersection.length).toBe(0);
  });

  it('应该正确统计游戏数量', async () => {
    const totalCount = await GameDAL.count();
    const approvedCount = await GameDAL.count('approved');
    const pendingCount = await GameDAL.count('pending');
    const searchCount = await GameDAL.count(undefined, '测试');
    
    expect(totalCount).toBeGreaterThanOrEqual(3);
    expect(approvedCount).toBeGreaterThanOrEqual(2);
    expect(pendingCount).toBeGreaterThanOrEqual(1);
    expect(searchCount).toBeGreaterThanOrEqual(2);
  });
});