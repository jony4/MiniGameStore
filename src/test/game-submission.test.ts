import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/games/route';
import { GameDAL } from '@/lib/dal';
import { validateHtmlContent, validateStringContent } from '@/lib/security';

// Mock the dependencies
vi.mock('@/lib/dal');
vi.mock('@/lib/security');

describe('游戏提交API测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功提交有效的游戏', async () => {
    // Mock the validation functions
    vi.mocked(validateStringContent).mockReturnValue({
      isValid: true,
      errors: [],
      size: 1024,
      type: 'text/html',
    });

    vi.mocked(validateHtmlContent).mockReturnValue({
      isValid: true,
      violations: [],
      warnings: [],
      sanitizedContent: '<div>Test Game</div>',
    });

    // Mock the DAL create method
    const mockGame = {
      id: 'test-id',
      title: '测试游戏',
      description: '这是一个测试游戏',
      htmlContent: '<div>Test Game</div>',
      authorName: '测试作者',
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      rejectionReason: null,
      approvedAt: null,
      approvedBy: null,
    };

    vi.mocked(GameDAL.create).mockResolvedValue(mockGame);

    // Create a mock request
    const request = new Request('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '测试游戏',
        description: '这是一个测试游戏',
        htmlContent: '<div>Test Game</div>',
        authorName: '测试作者',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('游戏提交成功，等待审核');
    expect(data.game.id).toBe('test-id');
    expect(data.game.title).toBe('测试游戏');
    expect(data.game.status).toBe('pending');
  });

  it('应该拒绝无效的游戏数据', async () => {
    const request = new Request('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '', // 空标题应该被拒绝
        htmlContent: '<div>Test Game</div>',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('游戏数据验证失败');
  });

  it('应该拒绝包含恶意内容的游戏', async () => {
    // Mock the validation functions
    vi.mocked(validateStringContent).mockReturnValue({
      isValid: true,
      errors: [],
      size: 1024,
      type: 'text/html',
    });

    vi.mocked(validateHtmlContent).mockReturnValue({
      isValid: false,
      violations: ['FORBIDDEN_PATTERN: 检测到禁用模式'],
      warnings: [],
    });

    const request = new Request('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '恶意游戏',
        htmlContent: '<script>fetch("/api/admin")</script>',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('MALICIOUS_CONTENT');
    expect(data.message).toBe('HTML内容包含不安全的元素');
  });

  it('应该拒绝过大的文件', async () => {
    // Mock the validation functions
    vi.mocked(validateStringContent).mockReturnValue({
      isValid: false,
      errors: ['内容大小超过限制'],
      size: 6 * 1024 * 1024, // 6MB
      type: 'text/html',
    });

    const request = new Request('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '大文件游戏',
        htmlContent: 'x'.repeat(6 * 1024 * 1024), // 6MB of content
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('FILE_TOO_LARGE');
    expect(data.message).toBe('内容验证失败');
  });

  it('应该处理数据库错误', async () => {
    // Mock the validation functions to pass
    vi.mocked(validateStringContent).mockReturnValue({
      isValid: true,
      errors: [],
      size: 1024,
      type: 'text/html',
    });

    vi.mocked(validateHtmlContent).mockReturnValue({
      isValid: true,
      violations: [],
      warnings: [],
      sanitizedContent: '<div>Test Game</div>',
    });

    // Mock the DAL to throw an error
    vi.mocked(GameDAL.create).mockRejectedValue(new Error('Failed to create game: Database connection failed'));

    const request = new Request('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '测试游戏',
        htmlContent: '<div>Test Game</div>',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('DATABASE_ERROR');
    expect(data.message).toBe('游戏保存失败，请稍后重试');
  });
});